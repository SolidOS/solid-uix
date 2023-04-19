import * as util from "./utils.js";
import {fetchAndParse} from "./rss.js";

export  async function processAction(element){
    let action = element.dataset.uix.toLowerCase();
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
      return await processForm(element,this);
    }
    if(action==="simpleform"){
      return await fillSimpleForm(element,this);
    }
    if(action==="createResource"){
      let fn = util.getSiblingInput(element)
//      let success = util
    }
  }

async function processForm(element,self){
  let form = util.getIRInode(element.dataset.form);
  let subjectString = element.dataset.subject;
  let subjectVal = (util.getNodeFromFieldValue(subjectString)||{}).value ;  
  let subject = util.getIRInode( subjectString );  
  if(!form || !subject) return;
  const formElement = await self.showForm({form,subject});
  if(formElement) element.appendChild(formElement);
}

async function fillSimpleForm(element,self){
  let node = util.getSource(element);
  let subject = node ?node.value :null;
  if(!subject) return;
  await util.load(node.doc());
  for(let field of element.querySelectorAll('INPUT')){
    if(field.type.match(/text/i)){
      let predicate = util.curie(field.dataset.fieldname);
      field.value = (util.any(node,predicate)||{}).value || "";
      field.dataset.originalvalue = field.value;
    }
    else if(field.type.match(/radio/i)){
      let predicate = util.curie(field.name);
      let wanted = util.any(node,predicate);
      for(let i of document.querySelectorAll(`*[name="${field.name}"]`)){
        if(util.curie(i.value).value===wanted.value) i.checked=true;
      }
    }
  }
  for(let field of element.querySelectorAll('TEXTAREA')){
    let predicate = util.curie(field.dataset.fieldname);
    field.innerHTML = (util.any(node,predicate)||{}).value || "";
  }
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
