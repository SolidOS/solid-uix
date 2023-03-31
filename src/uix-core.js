import {ProfileSession} from "./profile.js";
import {initLogin} from "./login.js";
import {interpolateVariable} from "./variables.js";
import * as util from './utils.js';

export class UIX {

  constructor(){
    this.profileSession = new ProfileSession();
    this.initLogin = initLogin.bind(this);
  }
  async init(){
    let loading = document.getElementById('loading');
    if(loading) loading.style.display="none";
    await this.profileSession.initActors();
    await this.initLogin();
    await this.initVariables();
    await this.initActions();
    await this.initQueries();
    util.toggleUserPanel(this.podOwner);
    document.body.style.display="block";
  }
  async showInElement(actionElement,output){
    const self = this;
    let opt = actionElement.dataset;
    let actionVerb=((opt.uiv)||"").toLowerCase()||((opt.uiq)||"").toLowerCase();
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
            if(actionVerb==='submit'){
               let p = e.target.parentNode;
               let i = p.querySelector('SELECT') || p.querySelector('INPUT');
               subject = i.value;                             
            }
            this.showSolidOSlink(subject,actionElement);
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
            actionElement.href = output;
            actionElement.addEventListener('click',async(e)=> {
              e.preventDefault();
              this.showSolidOSlink(e.target.href,actionElement);
            });
          }
          break;
      case 'DL' :
            let outer = opt.uiv;
            let inner = opt.loop;
            for(let row of output){
              let dt = document.createElement('DT');
              dt.innerHTML = row.label || row;
              actionElement.appendChild(dt);
            }
            console.log(output); //outer = await <dl data-uiv="userCommunities"
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
              opt.innerHTML = util.bestLabel(row);
            }
            actionElement.appendChild(opt);
          }
          if(actionElement.dataset.target){
            actionElement.addEventListener('change',()=>{
              self.activate(actionElement.dataset.target);
            });
          }
          break;
      case 'UL' :
          for(let row of output){
            let opt = document.createElement('LI');
            opt.innerHTML = row;
            actionElement.appendChild(opt);
          }
          break;
      default : actionElement.innerHTML = output;

    } // end of tag-type swich statement

}

/** @param {string||NamedNode} subject   - address/node of the resource to load
  @param {object}            opt         - optional hash containing 
  @param {string?}         pane          - name of SolidOS pane for display
  @param {string?}         outlineElement- id of outline element
  @param {HTMLElement?}    dom           - document context of outline element
 */
async showSolidOSlink(subject,element){
  const opt = element.dataset || {};
  const isPodAction = opt.uiv && opt.uiv.match(/^podOwner/i);
  if(!subject) return console.log("No subject supplied for SolidOSLink!");
  subject = subject.uri ?subject :UI.rdf.sym(subject);
  const o = panes.getOutliner(opt.dom || document);
  let podOwner = await this.profileSession.init(subject.uri);
  if(podOwner && !isPodAction){
    this.refreshPodOwner(podOwner);
  }
  let pane = opt.pane ?panes.byName(opt.pane) :null;
  await o.GotoSubject(subject,true,pane,true,null,opt.outlineElement);
}  
  async refreshPodOwner(podOwner){
    if(this.podOwner===podOwner.webid) return;
    this.podOwner = podOwner.webid;
    let actionElements = document.body.querySelectorAll('[data-uiv]') || [];
    for(let actionElement of actionElements){
      if(actionElement.dataset.uiv.match(/^podOwner/i)){
         await this.processVariable(actionElement);
      }
    }
  }
  async initActions(elementToInit){
    elementToInit ||= document.body;
    let actionElements = elementToInit.querySelectorAll('[data-uia]') || [];
    for(let actionElement of actionElements){
         await this.processAction(actionElement);
    }
  }
  async initVariables(elementToInit){
    elementToInit ||= document.body;
    let actionElements = elementToInit.querySelectorAll('[data-uiv]') || [];
    for(let actionElement of actionElements){
         await this.processVariable(actionElement);
    }
  }
  async initQueries(elementToInit){
    elementToInit ||= document.body;
    let actionElements = elementToInit.querySelectorAll('[data-uiq]') || [];
    for(let actionElement of actionElements){
         await this.processQuery(actionElement);
    }
  }
  async activate(element){
    if(typeof element==="string") element = document.getElementById(element.replace(/^#/,''));
    if(!element.dataset) return;
    if(element.dataset.uiv) return this.processVariable(element);
    else if(element.dataset.uiq) return this.processQuery(element,7);
    else console.log("Non-actionable-element - " + element.id || element.tagName);
  }
  async processVariable(element){
    let actionVerb = (element.dataset['uiv']).toLowerCase();
    let output;
    const specifiedOwner = element.dataset.owner;
    let actors = {
      user: UI.authn.currentUser(),
      owner: specifiedOwner || this.podOwner,
    };
    if(actors.owner) actors.owner = await this.profileSession.init(actors.owner);
    if(actors.user) actors.user = await this.profileSession.init(actors.user);
    let v = actionVerb.toLowerCase();
    if(v.match(/^(edit|add)/)) v = 'user'+v;
    if(v.match(/^podowner/))output = interpolateVariable.owner(v,element,actors);
    if(v.match(/^user/)) output = interpolateVariable.user(v,element,actors);
    if(v.match(/^solid/))output = interpolateVariable.solid(v,element,actors);
    if(output || v==="submit") await this.showInElement(element,output)
  }
  async processQuery(element,x){
    let queryString = element.dataset.uiq;
    let source =  element.dataset.source;
    let param = element.dataset.paramelement;
    param = param ?util.getNodeFromFieldValue(param) :null;
    const matches = await util.string2statement(queryString,source,param);
    for(let mi in matches){
      matches[mi]={
        link: matches[mi].subject.value,
        label: util.bestLabel(matches[mi].subject),
      }
    }
    if(matches) await this.showInElement(element,matches)
  }
  async processAction(element){
    let action = element.dataset.uia;
    let user = UI.authn.currentUser();
    let eventType = element.tagName==='SELECT' ?'change' :'click';
    if(action.startsWith('edit')){
      if(!user) return;
      user = await this.profileSession.init(user);
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
        this.showSolidOSlink(subject,{dataset:{pane}});
      });
    }
  }
}


