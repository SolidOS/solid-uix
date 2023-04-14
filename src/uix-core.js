import * as util from '../src/utils.js';
import {show,showForm,showInElement} from "./display.js";
import {ProfileSession} from "./profile-extractor.js";
import {initLogin} from "./login.js";
import {processAction} from "./actions.js";
import {processPlugin,processStandAlonePlugin} from "./plugins.js";

window.inDataKitchen = false;

export class UIX {

  constructor(){
    this.proxy = "https://solidcommunity.net/proxy?uri=";
    this.profileSession = new ProfileSession();
    this.initLogin = initLogin.bind(this);
    this.show = show.bind(this);
    this.showForm = showForm.bind(this);
    this.processAction = processAction.bind(this);
    this.showInElement = showInElement.bind(this);
    this.processPlugin = processPlugin.bind(this);
    this.processStandAlonePlugin = processStandAlonePlugin.bind(this);
  }
  async init(){
    await this.initLogin();
    await this.initVariables();
  }
  async initVariables(elementToInit){
    elementToInit ||= document.body;
    let actionElements = elementToInit.querySelectorAll('[data-uix]') || [];
    for(let actionElement of actionElements){
      await this.process(actionElement);
    }
  }
  async process(element){
    /*
      this can be called when processing an HTML element 
      or from a dataset string in another element
      so we have to handle both HTML elements and string ids for elements
    */
    if(typeof element==="string"){
      element = document.getElementById(element.replace(/^#/,''));
    }
    if(!element.dataset) return;
    let actionVerb = (element.dataset.uix).toLowerCase();
    let actionType = util.uixType[actionVerb] || "";
    if(actionType==="query") return this.processQuery(element);
    else if(actionType==="action") return this.processAction(element);
    else if(actionVerb==="standAlonePlugin") return this.processStandAlonePlugin(element);
    else return this.processVariable(element);
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
      output = util.solidVar[v]() || "";
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
}
