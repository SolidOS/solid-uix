import * as util from '../src/utils.js';

export class ProfileSession {

  constructor(options){
    options ||= {};
    if(options.nowarnings) {
      console.warn = (err)=> {
        if(err.match(/unauthenticated/i)) return;
        console.error((err && err.stack) ? err.stack : err);
      }
    }
    this.profile = {};
    this.visited = {};
    this.user = "";
    this.owner = "";
  }
  async loggedInUser(){
    let u = UI.authn.currentUser();
    if(!u) return;
    u = await this.add(u.value);
    return u
  }
  async add(webid,options) {
    if(!this.visited[webid]) {
      if(!webid) return;
      this.profile[webid] = await (new Profile()).init(webid,options) ;
      this.visited[webid]=true;
    }
    return this.profile[webid];
  }
  load = this.add;
}

export class Profile {

  async init(webid,options){
    if(!webid) return null;
    const originalWebid = webid;
    await util.initLibraries();
    if(options && options.includeSeeAlsos) this.includeSeeAlsos=true;
console.log(this.includeSeeAlsos)
    try { this.webid = util.sym(webid); }
    catch(e){
      try { 
        await util.load(webid);
        this.webid = util.literal(webid);
        this.context = {webid:this.webid}
        return this;
      }
      catch(e){
        console.warn("Could not load "+webid);
      }
    }
    this.context = await harvestProfile(webid,this);
    return this;
  }

  // these return strings
  //
  get(predicateString){
    if( shortcut[predicateString] ) return getShortcut(this,predicateString);
    let result = this.nget(this.webid,predicateString)
    return result ?result.value :null;
  }
  getall(requestString){
     if( shortcut[requestString] ) return getShortcut(this,requestString,element);
     let results = this.ngetAll(this.webid,requestString);
     for(let r in results){results[r]=results[r].value;}
     return results;
  }
  nget(subjectNode,predicateString){
    let predicateNode = util.str2node(predicateString,subjectNode.value)
    if(!predicateNode) return;
    return util.any(subjectNode,predicateNode);
  }
  ngetAll(subjectNode,predicateString){
    let predicateNode = util.str2node(predicateString,subjectNode.value)
    if(!predicateNode) return;
    return util.each(subjectNode,predicateNode);
  }

getName(c){
      c = util.sym(c);
      return  (util.any(c, util.curie('vcard:fn'))||"").value  
              || (util.any(c, util.curie('foaf:name'))||"").value 
              || (util.any(c, util.curie('dct:title'))||"").value 
              || (util.any(c, util.curie('rdfs:label'))||"").value 
              || (util.any(c, util.curie('ui:label'))||"").value 
              || c.value 
}
async getWithNames(requestString,element){
  let results = [];
  let predicate;
  if(requestString==='instances') {
    for(let instance of getShortcut(this,requestString,element)){
      let link = instance.link;
      let label = this.getName(instance.link);
      let row = {link};
      if(label) row.label = label;
      results.push(row);
    }
  }
  else if(requestString==='friends') predicate = predicate = 'foaf:knows';
  else if(requestString==='communities') predicate = 'solid:community';
  if(predicate){
    for(let c of this.getall(predicate)){
      await util.load(c);
      let link = c;
      let label = this.getName(c);
      results.push({label,link});
    }
  }
  return results;
}
  
}

const shortcut = {
  webid:1,              // WebID
  name:1,               // either vcard:fn, foaf:name, foaf:nick, or WebID
  pronouns:1,           // pronouns string concatenated from parts if any
  photo:1,              // vcard:Photo
  inbox:1,              // ldp:inbox
  home:1,               // first storage
  role:1,              // array of roles
  storages:1,           // space:storage
  communities:1,        // solid:community
  friends:1,            // foaf:knows
  issuers:1,            // solid:oidcIssuer
  instances:1,          // public + private + community instances
  label:1,              // ui:label rdfs:label dct:title
}

function getShortcut(self,req,element){
  if(req.match(/^label/)) return self.get('ui:label')||self.get('dct:title');
  if(req.match(/^webid/)) { return self.webid.value || self.webid;}
  if(req.match(/^photo/)) return self.get('vcard:hasPhoto');
  if(req.match(/^role/)) return self.getall('vcard:role');
  if(req.match(/^inbox/)) return self.get('ldp:inbox');
  if(req.match(/^home/)) { return self.getall('space:storage')[0]; }
  if(req.match(/^friends/)) return self.getall('foaf:knows');
  if(req.match(/^storages/)) return self.getall('space:storage');
  if(req.match(/^issuers/)) return self.getall('solid:oidcIssuer');
  if(req.match(/^communities/)) return self.getall('solid:community');
  if(req.match(/^name/))
     return self.get('vcard:fn') || self.get('foaf:name') || self.webid.value;
  if(req.match(/^pronouns/)){
     let sub = self.get('solid:preferredSubjectPronoun');
     let obj = self.get('solid:preferredObjectPronoun');
     let rel = self.get('solid:preferredRelativePronoun');
     let ary = [];
     for(let x of [sub,obj,rel]) if(x) ary.push(x);
     let pronouns =  ary.join('/');
     return pronouns;
  }
  if(req.match(/^instances/)){
    let instanceArray = [];
    let pti = self.context.publicTypeIndex;
    let instances = util.match(null,util.curie('solid:forClass'),null,pti);
    for(let i of instances){
      let classObj = i.object;
      let where = (element && element.dataset) ?(util.str2node(element.dataset.where)||{}).value :null;
      if(!where ||(where && where===classObj.value)){
        let instance = util.any(i.subject,util.curie('solid:instance'),null,pti);
        if(!instance) continue;
        const row ={link:instance.value,forClass:classObj.value};
//        const label = util.bestLabel(classObj,store,ns);
let label;
        if(label) row.label = label;
        instanceArray.push(row);
      }
    }
    return instanceArray;
  }
}

export async function harvestProfile(webid,self) {
  let wantedUser = await constructContext(webid,self);
  if(wantedUser.error) { 
    wantedUser = util.literal(webid);
    return wantedUser;
  }
  if(wantedUser.publicTypeIndex) await _tryLoad(wantedUser.publicTypeIndex);
  if(wantedUser.privateTypeIndex) await _tryLoad(wantedUser.privateTypeIndex);
  if(wantedUser.preferencesFile) await _tryLoad(wantedUser.preferencesFile);
  if(self.includeSeeAlsos){
    let sas = self.ngetAll(self.webid,'rdfs:seeAlso');
    if(sas && sas.length){
      self.seeAlsos = [];
      for(let s of sas){
        self.seeAlsos.push(s);
        await util.load(s);
      }
    }
  }
  return wantedUser;
}

async function constructContext(webidString,self){
  let webid = await _findWebid(webidString);
  let context = {};
  let user = webid // || self.loggedInUser();
  user = user.value ?user :util.sym(user);
  context = {
    webid: user,
    publicProfile: user.doc ?user.doc() :null,
  }
  if(!await _tryLoad(context.publicProfile) ){
    context.error = `Could not load ${context.publicProfile}`;
  }
  context.publicTypeIndex = self.nget(context.webid,'solid:publicTypeIndex');
  context.preferencesFile =  self.nget(context.webid,'space:preferencesFile');
  context.privateTypeIndex = self.nget(context.webid,'solid:privateTypeIndex');
  return context;
}

/**
 * attempt to load a resource; complain, but don't error on failure
 * @param {string|NamedNode} url - address of the resource to load
 * @return {NamedNode|undefined} - the namedNode for the resource
 */
  async function _tryLoad(url){
    if(!url) return console.warn("No URL supplied to tryLoad().");
    const namedNode = url.value;
    try { namedNode ||= util.sym(url); }
    catch(e){ return console.warn(`sym failed for '${url}' : ${e}`); }
    try {
      await util.load(namedNode);
      return namedNode;
    }
    catch(e){ return console.warn(`load failed for '${url}': ${e}.`); }
  }
async function _findWebid(webid){
    webid = webid || await localWebId();
    try {  return util.sym(webid);  }
    catch(e){ return webid; }
    // TBD - traverse folders
}
