import * as util from "./utils.js";
import {fetchAndParse} from "./rss.js";

export  async function processAction(element,elementToInit,specifiedSource){
    let action = element.dataset.uix.toLowerCase();
    let user = typeof UI != "undefined" ?UI.authn.currentUser() :null;
    let eventType = element.tagName==='SELECT' ?'change' :'click';
    if(action.match(/^rss/)){
      let isVideoFeed = action.match(/video/i)
      let so = (util.getSource(element,elementToInit)||{}).value ;
      if(!so) return;
      let output = await fetchAndParse( so, isVideoFeed );
      if(isVideoFeed){
        let link = output[0].link;
        let vid = document.createElement('VIDEO');
        vid.style.width="100%";
        vid.setAttribute('controls',true);
        vid.autoplay=1;
        let source = document.createElement('SOURCE');
        source.src = link;
        source.type="video/mp4";   
        vid.appendChild(source);
        let button = document.createElement('BUTTON');
        button.innerHTML =  `${output[0].label}<br>click to play`;
        button.style.padding = "0.5rem";
        button.style.opacity="60%";
        button.addEventListener('click',()=>{
          element.innerHTML="";
          element.appendChild(vid)
        });       
        element.appendChild(button);
      }
      else { if(output) await this.showInElement(element,output) }
      return;
    }
    if(action==='include'){
      return include(element,specifiedSource,this)
      try{
        let r = await UI.store.fetcher.webOperation('GET',util.getSource(element));
        if(r.ok){
          let tmp = document.createElement('SPAN');
          tmp.innerHTML = r.responseText;
          await this.initVariables(tmp);
          element.appendChild(tmp);
        }
        else console.warn(r.message);
      }
      catch(e){ console.warn(e) }
    }
    if(action==='tabset'){
      await this.template.tabset(element);
    }
    if(action==='quicknotes'){
//      element.addEventListener('click',async (e)=>{
         await this.processPlugin('quicknotes',element);
//      });
    }
    if(action==='accordion'){
       this.template.accordion(element);
    }
/* 
theses actions add eventListeners & do not return any output
    go
    toggleVisibility 
    dropdown         (
    editProfile      (solidOS link)
    editPreferences  (solidOS link
these return output
   processComponent
   rss
   include
move to templates
    form
    simpleForm
    accordion
move to plugins
  quicknotes
*/
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
      });
    }
    if(action==='togglevisibility'){
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
      if(action==='editprofile'){
        subject = user.context.webid.value;
        pane = 'editProfile';
      }
      else if(action==='editpreferences'){
        subject = user.context.preferencesFile.value;
        pane = 'basicPreferences';
      }
      element.addEventListener(eventType,()=> {
        this.show(subject,{dataset:{linktype:"SolidOS",uix:'editProfile',pane}});
      });
    }
    if(action==="processcomponent"){
     let self = this;
      element.addEventListener('click',async(event)=>{
        return await processComponent(element,self);
      });
    }
    if(action==="form"){
      return await this.template.form(element,this);
    }
    if(action==="simpleform"){
      return await this.template.simpleForm(element,this);
    }
    if(action==="tabdeck"){
      return await this.template.tabdeck(element,this);
    }
    if(action==="createResource"){
      let fn = util.getSiblingInput(element)
//      let success = util
    }
  }
async function include(element,source,self){
      source ||= util.getSource(element);
      try{
        let r = await UI.store.fetcher.webOperation('GET',source);
        if(r.ok){
          let tmp = document.createElement('SPAN');
          let content = r.responseText;
          tmp.innerHTML = content;
          await self.initVariables(tmp);
          element.appendChild(tmp);
        }
        else console.warn(r.message);
      }
      catch(e){ console.warn(e) }
}

async function processComponent(element){
  let harvested = [];
  let source = document.getElementById(element.dataset.source.replace(/^#/,''));
  let target = document.getElementById(element.dataset.target.replace(/^#/,''));
  for(let field of source.querySelectorAll('INPUT')){
    if(field.type.match(/text/i)){
      console.log(33,field)
      if(field.value===field.dataset.originalvalue) continue;
    }
    else if(field.type.match(/radio/i)){
      for(let i of document.querySelectorAll(`*[name="${field.name}"]`)){
        if(i.checked) console.log(i.value);
      }
    }
  }
  for(let field of source.querySelectorAll('TEXTAREA')){
//    let predicate = util.curie(field.dataset.fieldname);
//    tarfield.innerHTML = (util.any(node,predicate)||{}).value || "";
  }
/*
  for(let i of inputs){
    let row = {};
    let type = i.dataset.type;
    row.subject =  url;
    row.predicate = i.dataset.predicate;
    row.object = i.value;
    if(i.type==="textarea") row.object = i.innerHTML;
    else if(i.type==="radio" && i.checked) {console.log(i);row.object = i.value;}
    else if(i.type==="radio") continue;
    harvested.push(row);
  }
  console.log(44,harvested)
*/
}
