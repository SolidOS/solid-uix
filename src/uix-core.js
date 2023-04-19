import * as util from '../src/utils.js';
import {show,showForm,showInElement,showProperties} from "./display.js";
import {tabset} from "./templates/tabset.js";
import {SimpleQuery} from "./query.js";
import {ProfileSession} from "./profile-extractor.js";
import {initLogin} from "./login.js";
import {processAction} from "./actions.js";
import {processPlugin,processStandAlonePlugin} from "./plugins.js";

window.inDataKitchen = false;

export class UIX {

  constructor(){
    this.proxy = "https://solidcommunity.net/proxy?uri=";
    this.profileSession = new ProfileSession();
    this.query = new SimpleQuery();
    this.initLogin = initLogin.bind(this);
    this.show = show.bind(this);
    this.tabset = tabset.bind(this);
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
    const isConditional = element.dataset.uix.startsWith('if');
//    if(!isConditional) element.innerHTML = "loading ...";
    let actionVerb = (element.dataset.uix).toLowerCase();
    let actionType = util.uixType[actionVerb] || "";
    if(actionType==="query") return this.processQuery(element);
    else if(actionType==="action") return this.processAction(element);
    else if(actionVerb==="standAlonePlugin") return this.processStandAlonePlugin(element);
    else return this.processVariable(element);
  }  
  async processVariable(element){
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
    if(output) await this.showInElement(element,output)
  }
  async processQuery(element){
/*
    data-select="name age"
    data-from="saved-queries/queries.ttl"
    data-where="type Concept"


    data-select="name age"
    data-from="test-data.ttl"
    data-where="type Person"
*/
    let uniqueKey = element.dataset.unique || "";
    let from = util.getIRInode(element.dataset.from);

    /* if from-source is a subject, show properties
       else if is document, show table
    */
    if(from.value != from.doc().value) return await showProperties(element);

    await util.load( from.doc() );
    let select = element.dataset.select;
    let selectedField = {}
    if(select) {
      for(let w of select.split(/ /)){ selectedField[w.toLowerCase()]=true;}
    }
    let whereField,whereVal,wantedField,wantedValue;
    let wantedStatements=[];
    const isSingleField = Object.keys(selectedField).length===1 ?true :false;
    if(element.dataset.where){
      [whereField,whereVal] = element.dataset.where.toLowerCase().split(/ /);
      let paramField = element.dataset.paramfrom;
      let param = (util.getNodeFromFieldValue(paramField)||{}).value;
      if(param) whereVal= util.bestLabel(whereVal.replace(/\?/,param)).replace(/ /g,'').toLowerCase();
      let predicates = util.match(null,null,null,from.doc()).map((s)=>{return s.predicate});
      for(let predicate of predicates){
        let p = UI.utils.label(predicate).replace(/\s+/g,'').toLowerCase();
        if(p===whereField){
          wantedField = predicate;
          let tmpStms = util.match(null,wantedField,null,from.doc());
          for(let ts of tmpStms){
            let o = UI.utils.label(ts.object).replace(/\s+/g,'').toLowerCase();
            if(whereVal===o) wantedStatements.push(ts);
          }
          break;
        } 
      } 
    }
    else {
      wantedStatements = util.match(null,null,null,from.doc());
    }
    let output=[];
    let found={};
    let fields={};
    for(let stm of wantedStatements){
      let row = {};
      row["_subject"] = stm.subject.value;
      for(let s of util.match(stm.subject)){
        let p = UI.utils.label(s.predicate).replace(/\s+/g,'').toLowerCase();
        if(select && !selectedField[p]) continue;
        let key = util.bestLabel(s.predicate);
        fields[key]=true;
        if(!row[key]) row[key] = s.object.value;
        else {
           if(typeof row[key]==="string") row[key] = [row[key]];
           row[key].push( s.object.value );
        }
      }
      const isDuplicate = uniqueKey && found[row[uniqueKey]];
      found[row[uniqueKey]]=true;
      for(let k of Object.keys(row)){
        if(typeof row[k]==="string"){
          if(isSingleField || element.tagName.match(/(select|ul)/i)){
             row.link = row['_subject'];
             if(k==="label") row.label = row[k];
          }
        }
        else row[k] = row[k].join(', ');
      }
      delete row["_subject"];
      if(isSingleField || element.tagName.match(/(select|ul)/i) && !row.label){
        row.label = util.bestLabel(stm.subject);
      }
      for(let f of Object.keys(fields)){row[f] ||= "";}
      if(!isDuplicate) output.push(row);      
    }
    let groupon = element.dataset.groupon || element.dataset.distinct;
    if(!groupon && select){
        groupon = select.split(/ /)[0];
    }
    if(groupon) output = flatten(output,groupon);
    if(output) await this.showInElement(element,output)
  }
}

function flatten(results,groupOn){
  groupOn ||= (Object.keys(results[0]))[0];
  const newResults = {};
  for(let row of results) {
    let key = row[groupOn];
    if(!newResults[key]) newResults[key]={};
    for(let k of Object.keys(row)){
      if(!newResults[key][k]) {
        newResults[key][k]=row[k];
        continue;
      }  
      if(newResults[key][k].includes(row[k])) continue;
      if(typeof newResults[key][k]!="object") newResults[key][k]=[newResults[key][k]]
      newResults[key][k].push(row[k])
    }
  }
  results = [];
  for(let n of Object.keys(newResults)){
    results.push(newResults[n])
  }
  return results;
} 
