import * as util from './utils.js';

export class ProfileSession {

  constructor(){
    this.profile = {};
    this.visited = {};
    this.user = "";
    this.owner = "";
  }

  async init(webid) {
    if(!this.visited[webid]) {
      if(!webid) return;
      this.profile[webid] = await (new Profile()).init(webid) ;
      this.visited[webid]=true;
    }
    return this.profile[webid];
  }

  async initActors(){
    let podOwner = (document.getElementById('uriField')||{}).value;
    let loggedInUser = (UI.authn.currentUser()||{}).uri;
    this.owner = await this.init(podOwner);
    this.user = await this.init(loggedInUser);
  }

}

export class Profile {

  async init(webid){
    if(!webid) return null;
    this.webid = UI.rdf.sym(webid);
    this.context = await harvestProfile(webid);
    return this;
  }

  // these return strings
  //
  prop(requestString,element){
    if( shortcut[requestString] ) return getShortcut(this,requestString,element);
    let result = _getProperty(this.webid,requestString);
    return result ?result.value :"";
  }
  props(requestString){
     let results = _getProperties(this.webid,requestString);
     for(let r in results){results[r]=results[r].value;}
     return results;
  }

  // these return nodes
  //
  nprop(requestString){
    return _getProperty(this.webid,requestString);
  }
  nprops(requestString){
    return _getProperties(this.webid,requestString);
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
}

function getShortcut(self,req,element){
  if(req.match(/^webid/)) return self.webid.value;
  if(req.match(/^photo/)) return self.prop('vcard:hasPhoto');
  if(req.match(/^role/)) return self.props('vcard:role');
  if(req.match(/^inbox/)) return self.prop('ldp:inbox');
  if(req.match(/^home/)) { return self.props('space:storage')[0]; }
  if(req.match(/^friends/)) return self.props('foaf:knows');
  if(req.match(/^storages/)) return self.props('space:storage');
  if(req.match(/^issuers/)) return self.props('solid:oidcIssuer');
  if(req.match(/^communities/))return self.props('solid:community');
  if(req.match(/^name/))
     return self.prop('vcard:fn') || self.prop('foaf:name') || self.webid.value;
  if(req.match(/^pronouns/)){
     let sub = self.prop('solid:preferredSubjectPronoun');
     let obj = self.prop('solid:preferredObjectPronoun');
     let rel = self.prop('solid:preferredRelativePronoun');
     let ary = [];
     for(let x of [sub,obj,rel]) if(x) ary.push(x);
     let pronouns =  ary.join('/');
     return pronouns;
  }
  if(req.match(/^instances/)){
    let instanceArray = [];
    let pti = self.context.publicTypeIndex;
    let instances = UI.store.match(null,UI.ns.solid('forClass'),null,pti);
    for(let i of instances){
      let classObj = i.object;
      const where = (util.string2node(element.dataset.where)||{}).value;
      if(!where ||(where && where===classObj.value)){
        let instance = UI.store.any(i.subject,UI.ns.solid('instance'),null,pti);
        if(instance) instanceArray.push({label:util.bestLabel(classObj),link:instance.value,forClass:classObj.value});
      }
    }
    return instanceArray;
  }
}

export async function harvestProfile(webid) {
  let wantedUser = await constructContext(webid);
  if(wantedUser.error) { alert(wantedUser.error); return; }
  if(wantedUser.publicTypeIndex) await _tryLoad(wantedUser.publicTypeIndex);
  if(wantedUser.privateTypeIndex) await _tryLoad(wantedUser.privateTypeIndex);
  if(wantedUser.preferencesFile) await _tryLoad(wantedUser.preferencesFile);
  return wantedUser;
}

async function constructContext(webidString){
  let loggedInUser = (UI.authn.currentUser()||{}).value;
  let webid = await _findWebid(webidString);
  let context = {};
  if(!loggedInUser && ! webid){
     context.error = "Can't load profile : No WebId supplied and not logged In!"; 
  }
  else{
    const user = webid || loggedInUser;
    context = {
      webid: user,
      loggedIn: loggedInUser ?true :false,
      isOwner: (loggedInUser||{}).value === (webid||{}).value,
      publicProfile: user.doc ?user.doc() :null,
    }
    if(!await _tryLoad(context.publicProfile) ){
      context.error = `Could not load ${context.publicProfile}`;
    }
    context.publicTypeIndex = _getProperty(context.webid,'solid:publicTypeIndex');
//    if(context.isOwner){
      context.preferencesFile =  _getProperty(context.webid,'space:preferencesFile');
      context.privateTypeIndex = _getProperty(context.webid,'solid:privateTypeIndex');

//    }
    return context;
  }
}

/**
 * attempt to load a resource; complain, but don't error on failure
 * @param {string|NamedNode} url - address of the resource to load
 * @return {NamedNode|undefined} - the namedNode for the resource
 */
  async function _tryLoad(url){
    if(!url) return console.log("No URL supplied to tryLoad().");
    const namedNode = url.value;
    try { namedNode ||= UI.rdf.sym(url); }
    catch(e){ return console.log(`sym failed for '${url}' : ${e}`); }
    try {
      await UI.store.fetcher.load(namedNode);
      return namedNode;
    }
    catch(e){ return console.log(`load failed for '${url}': ${e}.`); }
  }

function _getProperties(subject,curie){
    let [vocab,predicate] = curie.split(/:/);
    if(!predicate) return;
    predicate = UI.ns[vocab] ?UI.ns[vocab](predicate) :UI.rdf.sym(predicate);
    let results = UI.store.each(subject,predicate);
    return results
}
function _getProperty(subject,curie){
    let [vocab,predicate] = curie.split(/:/);
    if(!predicate) return;
    predicate = UI.ns[vocab] ?UI.ns[vocab](predicate) :UI.rdf.sym(predicate);
    return UI.store.any(subject,predicate);
}
function _getValue(subect,predicate){
    let node = _getProperty(subject,predicate);
    return node ?node.value :"";
}
async function _findWebid(webid){
    webid = webid || window.origin+'/profile/card#me';
    return UI.rdf.sym(webid);
    // TBD - traverse folders, try "/profile/card"
    let cwd = new URL(window.location.href);
}


