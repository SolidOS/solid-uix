import * as util from './utils.js';
var store,$rdf,ns;
var store = typeof UI != "undefined" ?UI.store :null;
var $rdf = typeof UI != "undefined" ?UI.rdf :null;
var ns = typeof UI != "undefined" ?UI.ns :null;

export class ProfileSession {

  constructor(suppliedStore,suppliedNS){
    if(suppliedStore){
      if(suppliedNS){  // command-line : use supplied $rdf and ns objects
        ns = suppliedNS;
        $rdf = suppliedStore;
        store = $rdf.graph();
        store.fetcher = $rdf.fetcher(store)
      }
    }
    this.profile = {};
    this.visited = {};
    this.user = "";
    this.owner = "";
  }

  async add(webid) {
    if(!this.visited[webid]) {
      if(!webid) return;
      this.profile[webid] = await (new Profile()).init(webid) ;
      this.visited[webid]=true;
    }
    return this.profile[webid];
  }

  async initActors(){
    let podOwner = (document.getElementById('uriField')||{}).value;
    // let loggedInUser = (UI.authn.currentUser()||{}).uri;
    this.owner = await this.add(podOwner);
    //this.user = await this.init(loggedInUser);
  }

}

export class Profile {

  async init(webid){
    if(!webid) return null;
    const originalWebid = webid;
    try { this.webid = $rdf.sym(webid); }
    catch(e){
      try { 
        await UI.store.fetcher.load(webid);
        this.webid = $rdf.literal(webid);
        this.context = {webid:this.webid}
        return this;
      }
      catch(e){
      }
    }
    this.context = await harvestProfile(webid);
    return this;
  }

  // these return strings
  //
  get(requestString,element){
    if( shortcut[requestString] ) return getShortcut(this,requestString,element);
    let result = _getProperty(this.webid,requestString);
    return result ?result.value :null;
  }
  getall(requestString,element){
    if( shortcut[requestString] ) return getShortcut(this,requestString,element);
     let results = _getProperties(this.webid,requestString);
     for(let r in results){results[r]=results[r].value;}
     return results;
  }

  // these return nodes
  //
  nget(requestString){
    if( shortcut[requestString] ) return getShortcut(this,requestString,element);
    return _getProperty(this.webid,requestString);
  }
  ngetall(requestString){
    if( shortcut[requestString] ) return getShortcut(this,requestString,element);
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
  label:1,              // ui:label rdfs:label dct:title
}

function getShortcut(self,req,element){
  if(req.match(/^label/)) return self.get('ui:label')||self.get('dct:title');
  if(req.match(/^webid/)) return self.webid.value;
  if(req.match(/^photo/)) return self.get('vcard:hasPhoto');
  if(req.match(/^role/)) return self.getall('vcard:role');
  if(req.match(/^inbox/)) return self.get('ldp:inbox');
  if(req.match(/^home/)) { return self.getall('space:storage')[0]; }
  if(req.match(/^friends/)) return self.getall('foaf:knows');
  if(req.match(/^storages/)) return self.getall('space:storage');
  if(req.match(/^issuers/)) return self.getall('solid:oidcIssuer');
  if(req.match(/^communities/))return self.getall('solid:community');
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
    let instances = store.match(null,ns.solid('forClass'),null,pti);
    for(let i of instances){
      let classObj = i.object;
      const where = element ?(util.string2node(element.dataset.where)||{}).value :null;
      if(!where ||(where && where===classObj.value)){
        let instance = store.any(i.subject,ns.solid('instance'),null,pti);
        if(instance) instanceArray.push({label:util.bestLabel(classObj),link:instance.value,forClass:classObj.value});
      }
    }
    return instanceArray;
  }
}

export async function harvestProfile(webid) {
  let wantedUser = await constructContext(webid);
  if(wantedUser.error) { 
    wantedUser = $rdf.literal(webid);
    return wantedUser;
  }
  if(wantedUser.publicTypeIndex) await _tryLoad(wantedUser.publicTypeIndex);
  if(wantedUser.privateTypeIndex) await _tryLoad(wantedUser.privateTypeIndex);
  if(wantedUser.preferencesFile) await _tryLoad(wantedUser.preferencesFile);
  return wantedUser;
}

async function constructContext(webidString){
  let webid = await _findWebid(webidString);
  let context = {};
  const user = webid || loggedInUser;
  context = {
    webid: user,
    publicProfile: user.doc ?user.doc() :null,
  }
  if(!await _tryLoad(context.publicProfile) ){
    context.error = `Could not load ${context.publicProfile}`;
  }
  context.publicTypeIndex = _getProperty(context.webid,'solid:publicTypeIndex');
  context.preferencesFile =  _getProperty(context.webid,'space:preferencesFile');
  context.privateTypeIndex = _getProperty(context.webid,'solid:privateTypeIndex');
  return context;
}

/**
 * attempt to load a resource; complain, but don't error on failure
 * @param {string|NamedNode} url - address of the resource to load
 * @return {NamedNode|undefined} - the namedNode for the resource
 */
  async function _tryLoad(url){
    if(!url) return console.log("No URL supplied to tryLoad().");
    const namedNode = url.value;
    try { namedNode ||= $rdf.sym(url); }
    catch(e){ return console.log(`sym failed for '${url}' : ${e}`); }
    try {
      await store.fetcher.load(namedNode);
      return namedNode;
    }
    catch(e){}
//    catch(e){ return console.log(`load failed for '${url}': ${e}.`); }
  }

function _getProperties(subject,curie){
    let [vocab,predicate] = curie.split(/:/);
    if(!predicate) return;
    predicate = ns[vocab] ?ns[vocab](predicate) :$rdf.sym(predicate);
    let results = store.each(subject,predicate);
    return results
}
function _getProperty(subject,curie){
    let [vocab,predicate] = curie.split(/:/);
    if(!predicate) return;
    predicate = ns[vocab] ?ns[vocab](predicate) :$rdf.sym(predicate);
    return store.any(subject,predicate);
}
function _getValue(subect,predicate){
    let node = _getProperty(subject,predicate);
    return node ?node.value :"";
}
async function _findWebid(webid){
    webid = webid || window.origin+'/profile/card#me';
    try {  return $rdf.sym(webid);  }
    catch(e){ return webid; }
    // TBD - traverse folders
}


