import * as util from '../src/utils.js';
import {rdfEasy} from "./rdf-easy.js";
import {show} from "./display.js";
import {ProfileSession} from "./profile.js";
import {initLogin} from "./login.js";
import {fetchAndParse} from "./rss.js";
import {processPlugin,processStandAlonePlugin} from "./plugins.js";

window.inDataKitchen = false;

/*
methods
  init
  initVariables
  process
  processVariable
  processQuery
  processAction
  showForm
  showSolidOSlink
  showInElement
  toggleUserPanel
  refreshPodOwner
properties
  uixType
  solidVar
*/
export class UIX {

  constructor(){
    this.proxy = "https://solidcommunity.net/proxy?uri=";
    this.profileSession = new ProfileSession();
    this.initLogin = initLogin.bind(this);
    this.show = show.bind(this);
    this.processPlugin = processPlugin.bind(this);
    this.processStandAlonePlugin = processStandAlonePlugin.bind(this);
  }
  async init(){
    if(typeof UI !="undefined") await this.initLogin();
    await this.initVariables();
    this.toggleUserPanel(this.podOwner);
  }
  async initVariables(elementToInit){
    elementToInit ||= document.body;
    let actionElements = elementToInit.querySelectorAll('[data-uix]') || [];
    for(let actionElement of actionElements){
      await this.process(actionElement);
    }
  }
  async process(element){
    if(typeof element==="string"){
      element = document.getElementById(element.replace(/^#/,''));
    }
    if(!element.dataset) return;
    let actionVerb = (element.dataset.uix).toLowerCase();
    let actionType = uixType[actionVerb] || "";
    if(actionType==="query") return this.processQuery(element);
    else if(actionType==="action") return this.processAction(element);
    else if(actionVerb==="standAlonePlugin") return this.processStandAlonePlugin(element);
    else return this.processVariable(element);
  }  

// CREATE/REFRESH USER & PODOWNER MENUS
//
  async toggleUserPanel(podOwner){
    const userPanel = document.getElementById('userPanel');
    const menuToggle = document.getElementById('userMenuToggle');
    const ownerMenu = document.querySelector('.podOwnerMenu');
    if(ownerMenu) ownerMenu.style.display = podOwner ?"block" :"none";   
    if(!userPanel) return;
    let user = (typeof UI !="undefined") ?UI.authn.currentUser() :null;
    user ||= await util.localWebid();
    this.podOwner ||= await util.localWebid();
    function toggleVis(e){
      let target = document.getElementById('userPanel');
      if(target) target.classList.toggle('hidden')
    }
    if(user) {
      menuToggle.style.opacity="100%";
      menuToggle.style.cursor="pointer";
      if(this.podOwner){
        let owner = await this.profileSession.add(this.podOwner);
        let home = owner.get('storages')[0];
        menuToggle.addEventListener('click',toggleVis)
        await this.show(home,{dataset:{linktype:"SolidOS",uix:'podOwnerHome',pane:"folder"}});
//        await this.showSolidOSlink(home,{dataset:{uix:'podOwnerHome',pane:"folder"}});
      }
    }
    else {
      menuToggle.style.opacity="50%";
      menuToggle.style.cursor="default";
      menuToggle.removeEventListener('click',toggleVis)
    }
  }
  async refreshPodOwner(webid,element){
    /** 
         Refresh the podOwner areas: name,role,pronouns,photo,podOwnerMenu
         But only when needed
    **/
    const action = element && element.dataset ?element.dataset.uix :"";
    const isPodAction = action.match(/^podOwner/i);
    const isUserAction = action.match(/^user/i) && !action.match(/(communities|friends)/i);
    const user = typeof UI != "undefined" ?(UI.authn.currentUser()||"").value :null;
    this.podOwner ||= user;
    this.podOwner ||= await util.localWebid();
    if(!webid) return;                // no new owner, so no refresh
    if(isPodAction) return;           // action is by existing podOwner, so no refresh
    if(isUserAction) webid=user;
    if(webid===this.podOwner) return; // new owner is already pod owner, so no refresh
    /**
       Okay, let's refresh
    **/
    this.podOwner = webid;
    let actionElements = document.body.querySelectorAll('[data-uix]') || [];
    for(let actionElement of actionElements){
      let act = actionElement.dataset.uix;
      if(act.match(/^podOwner/i)){
        if(act.match(/(name|pronouns|role)/i)) actionElement.innerHTML="";
        if(act.match(/photo/i)) actionElement.src="";
        await this.process(actionElement);
      }
    }
  }

// WE HAVE THE DATA, SHOW IT
//
  async showInElement(actionElement,output){
    const self = this;
    let actionVerb=((actionElement.dataset.uix)||"").toLowerCase();
    if(actionVerb.match(/home/)) actionElement.dataset.pane="folder";
    switch(actionElement.tagName) {
      case 'IMG':
          actionElement.src = output;
          break;
      case 'INPUT' :
          actionElement.appendChild(output);
          break;
      case 'BUTTON' :
          if(output && typeof output !="string"){
            output = output[0] ? output[0].link :output.link || output;
          }
          actionElement.href = output;
          actionElement.addEventListener('click',async(e)=> {
            e.preventDefault();
            let subject = e.target.href;
            actionElement.dataset.linktype="SolidOS";
            this.show(subject,actionElement);
            //this.showSolidOSlink(subject,actionElement);
          });
          // setStyle(actionElement,'buttonStyle');  // for example
          break;
      case 'A' :
          if(output && typeof output !="string"){
            output = output[0] ? output[0].link :output.link || output;
          }
          // Don't show links to non-existant resources
          if(!output || !output.length) { 
            actionElement.style.display="none";
          }
          else {
            actionElement.style.display="inline-block";
            actionElement.href = output;
            actionElement.addEventListener('click',async(e)=> {
              e.preventDefault();
              actionElement.dataset.linktype="SolidOS";
              this.show(e.target.href,actionElement);
            });
          }
          break;
      case 'DL' :
            let loop = actionElement.dataset.loop;
            for(let row of output){
              let dt = document.createElement('DT');
              dt.innerHTML = row.label || row;
              dt.dataset.uix=loop;
              actionElement.appendChild(dt);
            }
            console.log(output); //outer = await <dl data-uix="userCommunities"
          break;
      case 'SELECT' :
          if(actionElement.options){
            while( actionElement.options.length > 0) {
              actionElement.remove(0);
            }
          }
          for(let row of output){
            let opt = document.createElement('OPTION');
            if(typeof row !="string") {
               opt.value = opt.title = row.link;
               opt.innerHTML = row.label;
            }
            else {
              opt.value = row;
              opt.innerHTML = _bestLabel(row);
            }
            actionElement.appendChild(opt);
          }
          if(actionElement.dataset.target){
            actionElement.addEventListener('change',()=>{
              let  el = actionElement.dataset.target.replace(/^#/,'');
              self.process( document.getElementById(el) );
            });
          }
          break;
      case 'UL' :
          actionElement.innerHTML="";
          for(let row of output){
            let li = document.createElement('LI');
            let anchor = document.createElement('A');
            if(typeof row === 'string'){
               anchor.href = anchor.innerHTML = row;
            }              
            else {
               anchor.href = row.link;
               anchor.innerHTML = row.label;
            }
            anchor.addEventListener('click',(e)=>{
              e.preventDefault();
              actionElement.dataset.linktype="SolidOS";
              this.show(e.target.href,actionElement);
            });
            li.appendChild(anchor);
            actionElement.appendChild(li);
          }
          break;
      default : actionElement.innerHTML = output;

    } // end of tag-type swich statement

}

  async processVariable(element){
    let actionVerb = (element.dataset.uix).toLowerCase();
    if(actionVerb==="standaloneplugin") return this.processStandAlonePlugin(element);
    let actor,output;
    const specifiedOwner = element.dataset.source || element.parentNode.dataset.source;
    let v = actionVerb.toLowerCase();
    if(v.match(/^(edit|add)/)) v = 'user'+v;
    if(v.match(/^solid/)){
      v = v.replace(/^solid/,'');
      output = solidVar[v]() || "";
    }
    else {
      if(v.match(/^podowner/)){
        v = v.replace(/^podowner/,'');
        actor = specifiedOwner || this.podOwner;
      }
      else if(v.match(/^user/)){
        v = v.replace(/^user/,'');
        actor = typeof UI !="undefined" ?UI.authn.currentUser() :null;
        actor ||= await util.localWebid();
      }
      if(!actor) return;
      actor = await this.profileSession.add(actor);
      if(v.match(/(friends|communities|instances)/)){
        output = await actor.getWithNames(v,element);
      }
      else {
        output = actor.get(v,element);
      }
    }
    if(output) await this.showInElement(element,output)
  }
  async processQuery(element){
    let queryString = element.dataset.query;
    let source =  element.dataset.endpoint;
    try {
      await util.load(source)
    }
    catch(e){console.log(e)}
    let param = element.dataset.paramfrom;
    let wanted = element.dataset.wantedproperty;
    param = param ?util.getNodeFromFieldValue(param) :null;
    if(param) queryString = queryString.replace(/\?/,param);
    const s = util.str2stm(queryString,source);
    let matches = util.each( s.subject,s.predicate,s.object,s.graph );
    for(let i in matches){
      if(wanted){
        const s1 = util.str2stm(`${matches[i].value} ${wanted} *`,source);
        const label = util.bestLabel(matches[i]);
        matches[i] = util.any( s1.subject,s1.predicate,s1.object,s1.graph );
        matches[i]={
          link: matches[i].value,
          label,
        }
      }      
      else {
        matches[i]={
          link: matches[i].value,
          label: util.bestLabel(matches[i]),
        }
      }
    }
    if(matches) await this.showInElement(element,matches)
  }

/**
    @param {IRI} form - required: form location
    @param {IRI} subject - required: data location
    @param {String?} formString - optional in-memory form
    @param {IRI?} formResultsDocument - optional location for form data (defaults to formSubject)
    @param {HTMLElement?} container - optional HTML element, defaults to new DIV;
    @param {HTMLDOM?} dom - optional dom, defaults to document;
    @return {HTMLElement}
 */
  async showForm(o){
    const dom = o.dom || document;
    const container = o.container || document.createElement("DIV");
    let form = UI.rdf.sym(o.form);
    let doc = o.formResultDocument;
    let formFromString = o.formString;
    let subject = o.formSubject;
    let script = o.script || function(){};
    try {
      subject = UI.rdf.sym(subject) ;
      if(o.formString){
        UI.rdf.parse(o.formString,UI.store,o.form,'text/turtle');
      }
      else await UI.store.fetcher.load(o.form);
      await UI.store.fetcher.load(subject.doc());
      await UI.widgets.appendForm(dom, container, {}, subject, form, doc, script);
    }
    catch(e){
       console.log(e);
       container.innerHTML = "FORM ERROR:"+e;
    }  
    return container;
  }

  async processAction(element){
    let action = element.dataset.uix;
    let user = typeof UI != "undefined" ?UI.authn.currentUser() :null;
    let eventType = element.tagName==='SELECT' ?'change' :'click';
    if(action==='rss'){
      let so = (util.getSource(element)||{}).value ;
      if(!so) return;
      let output = await fetchAndParse( so );
      if(output) await this.showInElement(element,output)
      return;
    }
    if(action==='include'){
      try{
        let r = await UI.store.fetcher.webOperation('GET',element.dataset.source);
        if(r.ok){
          element.innerHTML = r.responseText;
          this.initVariables(element);
        }
        else console.warn(r.message);
      }
      catch(e){ console.warn(e) }
    }
    if(action==='quicknotes'){
//      element.addEventListener('click',async (e)=>{
         await this.processPlugin('quicknotes',element);
//      });
    }
    if(action==='accordion'){
      for(let kid of element.childNodes){
        if(kid.tagName==="UL"){
          kid.style="list-style:none;margin-left:0;padding-left:0;";        
          kid.classList.add('hidden');
        }
        else {
         kid.style="padding:1rem;margin:0;border-bottom:1px solid #909090; background:#dddddd; cursor:pointer;display:grid;grid-template-columns=auto auto";
         let html = kid.innerHTML;
         kid.innerHTML = `<span>${html}</span><span style="display:inline-block;text-align:right;margin-top:-1.25rem;">&or;</span>`;
          kid.addEventListener('click',async ()=>{
          const selectedDropdown = kid.nextSibling.nextSibling;
            let displays = element.querySelectorAll('UL');             
            let kidHiddenNow = selectedDropdown.classList.contains('hidden');
            for(let d of displays){
              d.classList.add('hidden')
            }
            if(kidHiddenNow) selectedDropdown.classList.remove('hidden');
            else selectedDropdown.classList.add('hidden');
            let toDefer = selectedDropdown.dataset.defer;
            let hasContent = selectedDropdown.innerHTML.length;
            if(toDefer && !hasContent){
              selectedDropdown.dataset.uix=toDefer;
              let loading = document.createElement('P');
              loading.innerHTML = "loading ...";
              loading.style["margin-right"]="0.5rem";
              selectedDropdown.appendChild(loading);
              await this.process(selectedDropdown);
              loading.style.display="none";
            }
          });
        }
      }
    }
    if(action==='go'){
      element.addEventListener('click',async(e)=> {
        e.preventDefault();
        let subject = element.href || element.dataset ?element.dataset.target :null;
        if(!subject){
           let p = e.target.parentNode;
           let i = p.querySelector('SELECT') || p.querySelector('INPUT');
           subject = i.value;                             
        }
        element.dataset.linktype = "SolidOS";
        this.show(subject,element);
        // this.showSolidOSlink(subject,element);
      });
    }
    if(action==='toggleVisibility'){
      element.addEventListener('click',async(e)=> {
        e.preventDefault();
        let button = e.target;
        let target = button.dataset.target || button.nextSibling.nextSibling;
        target = typeof target === "string" ?document.getElementById(target.replace(/^#/,'')) :target;
        target.classList.toggle('hidden');
      });
    }
    if(action==='dropdown'){
      element.addEventListener('mouseover',async(e)=> {
        e.preventDefault();
        let button = e.target;
        let target = button.nextSibling.nextSibling;
        target.style.display="block";
        target.addEventListener('mouseover',async(e)=> {
          target.style.display="block";
        });
        target.addEventListener('mouseout',async(e)=> {
          target.style.display="none";
        });
        document.body.addEventListener('click',async(e)=> {
          target.style.display="none";
        });
      });
    }
    if(action.startsWith('edit')){
      if(!user) return;
      user = await this.profileSession.add(user);
      let subject,pane;
      if(action==='editProfile'){
        subject = user.context.webid.value;
        pane = 'editProfile';
      }
      else if(action==='editPreferences'){
        subject = user.context.preferencesFile.value;
        pane = 'basicPreferences';
      }
      element.addEventListener(eventType,()=> {
        this.show(subject,{dataset:{linktype:"SolidOS",uix:'userEditProfile',pane}});
        //this.showSolidOSlink(subject,{dataset:{linktype:"SolidOS",uix:'userEditProfile',pane}});
      });
    }
  }
}

  const uixType = {
    rss: "action",
    include: "action",
    togglevisibility: "action",
    dropdown: "action",
    editprofile: "action",
    editpreferences: "action",
    quicknotes: "action",
    go: "action",
    accordion: "action",
    query : "query",
  }


    const solidVar = {
      logo: ()=>{
        return "https://solidproject.org/assets/img/solid-emblem.svg";
      },
      login: ()=>{
       return "";
      },
      osbrowser: ()=>{
        return `
          <header id="PageHeader"></header>
          <div id="right-column-tabulator">
            <div class="TabulatorOutline" role="main" id="suicTabulator">
              <table id="outline"></table>
              <div id="GlobalDashboard"></div>
            </div>
          </div>
          <footer id="PageFooter"></footer>
        `;
      },
    }
