import * as util from '../src/utils.js';
import {show,showInElement} from "./display.js";
import {SimpleQuery} from "./query.js";
import {ProfileSession} from "./profile-extractor.js";
import {initLogin} from "./login.js";
import {processAction} from "./actions.js";
import {processPlugin,processStandAlonePlugin} from "./plugins.js";

import {initTemplates} from './templates/template.js';

window.inDataKitchen = false;

export class UIX {

  constructor(){
    this.proxy = "https://solidcommunity.net/proxy?uri=";
    this.profileSession = new ProfileSession();
    this.query = new SimpleQuery(this);
    this.initLogin = initLogin.bind(this);
    this.initTemplates = initTemplates.bind(this);
    this.show = show.bind(this);
//    this.showForm = showForm.bind(this);
    this.processAction = processAction.bind(this);
    this.showInElement = showInElement.bind(this);
    this.processPlugin = processPlugin.bind(this);
    this.processStandAlonePlugin = processStandAlonePlugin.bind(this);
  }
  async init(){
    this.template = await this.initTemplates();
    await this.initLogin();
    await this.initVariables();
  }
  async initVariables(elementToInit){
    elementToInit ||= document.body;
    let actionElements = elementToInit.querySelectorAll('[data-uix]') || [];
    for(let actionElement of actionElements){
      await this.process(actionElement,elementToInit);
    }
  }
  async process(element,elementToInit){
    /*
      this can be called when processing an HTML element 
      or from a dataset string in another element
      so we have to handle both HTML elements and string ids for elements
    */
    if(typeof element==="string"){
      element = elementToInit ? elementToInit.querySelector(element) :document.getElementById(element.replace(/^#/,''));
    }
    if(!element || !element.dataset) return;
    let actionVerb = (element.dataset.uix).toLowerCase();
    let actionType = util.uixType[actionVerb] || "";
    let results;
    if(actionType==="query") results = await this.query.processQuery(element,elementToInit);

    else if(actionType==="action") return this.processAction(element,elementToInit);
    else if(actionVerb==="standAlonePlugin") return this.processStandAlonePlugin(element,elementToInit);

    else results = await this.processVariable(element,elementToInit);
    if(results) await this.showInElement(element,results)
        for(let a of elementToInit.querySelectorAll('ANCHOR')){
          a.addEventListener('click',(event)=>{
alert(9)
              event.preventDefault();
window.open(event.target.href,"","width=640,height=320,top=200,left=200")
//              myWindow.document.location.href=event.target.href;
          });
        }
    
    

  }  
  async processVariable(element,elementToInit){
    let actionVerb = (element.dataset.uix).toLowerCase();
    let loggedInUser = typeof UI !="undefined" ?UI.authn.currentUser() :null;
    if(actionVerb==="standaloneplugin") return this.processStandAlonePlugin(element);
    let actor,output;
    const specifiedOwner = (util.getSource(element)||{}).value
    let v = actionVerb.toLowerCase();
    if(v.match(/^(edit|add)/)) v = 'user'+v;
    if(v.match(/^solid/)){
      v = v.replace(/^solid/,'');
      output = util.solidVar[v]() || "";
    }
/*
    else if(v==="properties"){
       await showProperties(element);
   }
*/
    else if(v==="ifloggedin"){
       element.style.display = loggedInUser ?"block" :"none";      
    }
    else if(v==="ifnotloggedin"){
       element.style.display = loggedInUser ?"none" :"block";      
    }
    else if(v==="triggertarget"){
            let  el = element.dataset.target.replace(/^#/,'');
            el = elementToInit.querySelector('#'+el);
            element.addEventListener('change',()=>{
              let  el = element.dataset.target.replace(/^#/,'');
              el = document.getElementById(el);
              let i = element.selectedIndex;
              if(!i || i<0) element.selectedIndex=0;
              el.innerHTML="";              
              this.process( el );
            });
            this.process( el,elementToInit );
    }
    else if(v==="containercontents"){
      let source = util.getSource(element);
      await util.load(source);
      output = [];
      for(let resource of util.each(source,UI.ns.ldp('contains'))){
        output.push({label:util.bestLabel(resource),link:resource.value});
      }
    }
    else {
      if(v.match(/^profileowner/)){
        v = v.replace(/^profileowner/,'');
        actor = specifiedOwner || this.profileOwner;
      }
      else if(v.match(/^user/)){
        v = v.replace(/^user/,'');
        actor = loggedInUser
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
    return output;
  }

}
