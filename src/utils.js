/* Library imports
   ---------------
   if we are in solid-ui or mashlib, use the UI object
   otherwise, dynamically import rdflib and solid-namespace
*/
var $rdf,ns,store;
export async function initLibraries(){
  if(typeof UI != "undefined"){
      $rdf = UI.rdf;
      ns = UI.ns;
      store = UI.store;
  }
  else {
    $rdf = await import('../node_modules/rdflib/lib/index.js');
    const pkg = await import('../node_modules/solid-namespace/index.js');
    ns = pkg.default($rdf);
    store = $rdf.graph();
    store.fetcher = $rdf.fetcher(store);
  }
}
initLibraries();

/* Turtle-munging methods
   ----------------------
   curie(string)             // if vocab is in solid-namespace, get the term's node
   str2stm(string,document)  // returns nodes for s/p/o/g from a string
   str2node(string,document) // returns a node from a string
*/
export function curie(string) { 
  let [vocab,term] = string.split(/:/);
  return ns[vocab](term); 
}
export function str2stm(querystring,source){
  if(!source.match(/^(http|chrome)/)) source = window.origin + source;
  let s = []
  querystring = querystring.trim();
  const stmts = querystring.split(/\s+/);
  const subject = stmts.shift();
  const predicate = stmts.shift();
  const object = stmts.join(" ");
  for(let i of [subject,predicate,object]){
    s.push(str2node(i,source))     
  }
  return {subject:s[0],predicate:s[1],object:s[2],graph:$rdf.sym(source)};
}
export  function str2node(string,baseUrl){
    if(!string) return "";
    try {
      if(string===('*')){
         return null;
      } 
      else if(string.startsWith('<')){
         return $rdf.sym( string.replace(/^</,'').replace(/>$/,'') );
      } 
      else if(string==="a") {
        return ns.rdf('type');
      }
      else if(string.startsWith(':')) {
        return $rdf.sym(baseUrl + string.replace(/^:/,'#') );
      }
      else if(string.match(/^skos:/)) {
         let href = "http://www.w3.org/2004/02/skos/core#"+string.replace(/^skos:/,'');
         return sym(href);
      }
      else if(string.match(/^bk:/)) {
        let href = 'http://www.w3.org/2002/01/bookmark#'+string.replace(/^bk:/,'');
        return $rdf.sym(href);
      }
      else if(string.match(/:/) && !string.match(/^\//)) {  // ignore e.e. http://
        return curie(string);
      }
      else {
        try {
          let node = $rdf.sym(string);
          return node;
        }
        catch(e) {
          return $rdf.literal(string);
        }
      }
    }
    catch(e){ console.log(e); }
  }

/* Store access methods
   --------------------
   load,add,remove,each,any,.match,sym,bestLabel
*/
export async function load(uri){ 
  uri = getIRInode(uri.value || uri);   // accepts absolute & relative URLs
  return await store.fetcher.load(uri);
}
export function add(...args){ return store.add(...args);}
export function remove(...args){ return store.remove(...args);}
export function each(...args){ return store.each(...args);}
export function any(...args){ return store.any(...args);}
export function match(...args){ return store.match(...args);}
export function sym(string){ return $rdf.sym(string); }
export function literal(string){ return $rdf.sym(string); }

export function bestLabel(node){
 let skosLabel = sym( "http://www.w3.org/2004/02/skos/core#prefLabel");
  try{
    if(typeof node==="string")  node = sym(node) ;
    const best = store.any(node,ns.ui('label'))   
        || store.any(node,skosLabel)   
        || store.any(node,ns.rdfs('label'))   
        || store.any(node,ns.dct('title'))   
        || store.any(node,ns.foaf('name'))   
        || store.any(node,ns.vcard('fn'))
        || typeof UI !="undeined" ?UI.utils.label(node) :node;
    return best;
  }
  catch(e) { console.log(e); return node }
}

/* URL-munging methods
   -------------------
   localWebid()          // local pod's webid if any
   currentContainer()    // location of relative URLs
   getIRInode(url)       // returns a node for relative & absolute URLs
*/
export async function localWebid(){
  if(window.SolidAppContext.webId) return window.SolidAppContext.webId;
  let local = window.origin + "/profile/card#me";
  let r = await window.fetch(local);
  if(r.status>199 && r.status<300) return local;
}
export function currentContainer(){
  let c = window.location.href;
  if(c.endsWith('/')) return c;
  else return c.replace(/\/[^\/]*$/,'/')
}
export function getIRInode(url){
  if(!url) return;
  if(url.match(/^(http|chrome|file|app|data)/)) return sym(url);
  else if(url.match(/^\//)) return sym(window.origin+url);
  else return sym(currentContainer()+url);
}

/* DOM-walking methods
   -------------------
   getSource(element)              // returns data-source URL as string from element or its parent
   getNodeFromFielValue(elementID) // returns node of the value of a named input/select element
   getSiblingInput(element)        // returns string value of a sibling input/select element
*/
export function getSource(element){
  return getNodeFromFieldValue(element.dataset.source) || getNodeFromFieldValue(element.dataset.sourcefrom);
}
export function getNodeFromFieldValue(fieldSelector,key){
   if(!fieldSelector) return;
   let paramField = document.getElementById( fieldSelector.replace(/^#/,'') );
   if(!paramField ) return;
   let param = paramField[paramField.selectedIndex]; // SELECT
   if(!param ) return;
   try { return sym(param.value); }
   catch(e){ console.log(e) }
}

export function getSiblingInput(element){
    let p = element.parentNode;
    let i = p.querySelector('SELECT') || p.querySelector('INPUT');
    subject = i.value;                             
    return subject;
  }

/* Constants
   ---------
   uixType   // defines action keywords like accordion
   solidVar  // defines solid variables like solidLogo
*/
export  const uixType = {
    form: "action",
    createResource: "action",
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

export const solidVar = {
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
