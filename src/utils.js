var $rdf,ns,store;
export async function initLibraries(){
  let libraries = await ensureLibraries();
  $rdf = libraries.rdf;
  ns = libraries.ns;
  store = libraries.store;
};
initLibraries();
/*
str2stm
str2node
getNodeFromFieldValue
bestLabel
load, each, any, match, sym, literal, curie
localWebid
showIframesSrcDoc
*/
export function currentContainer(){
  let c = window.location.href;
  if(c.endsWith('/')) return c;
  else return c.replace(/\/[^\/]*$/,'/')
}
export async function localWebid(){
  if(window.SolidAppContext.webId) return window.SolidAppContext.webId;
  let local = window.origin + "/profile/card#me";
  let r = await window.fetch(local);
  if(r.status>199 && r.status<300) return local;
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
      else if(string.match(/:/) && !string.match(/^(chrome:|http:)/i)) {
        let [vocab,term] = string.split(/:/);
        if( ns[vocab] && term ) return ns[vocab](term);
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
export async function load(uri){ 
  uri = uri.value || uri;
  if(!uri.match(/^(http|chrome)/)) uri = window.origin + uri;
  return await store.fetcher.load(uri);
}
export function add(...args){ return store.add(...args);}
export function remove(...args){ return store.remove(...args);}
export function each(...args){ return store.each(...args);}
export function any(...args){ return store.any(...args);}
export function match(...args){ return store.match(...args);}
export function sym(string){ return $rdf.sym(string); }
export function literal(string){ return $rdf.sym(string); }
export function curie(string) { 
  let [vocab,term] = string.split(/:/);
  return ns[vocab](term); 
}
export function bestLabel(node){
 let skosLabel = sym( "http://www.w3.org/2004/02/skos/core#prefLabel");
  try{
    if(typeof node==="string")  node = UI.rdf.sym(node) ;
    const best = store.any(node,ns.ui('label'))   
        || store.any(node,skosLabel)   
        || store.any(node,ns.rdfs('label'))   
        || store.any(node,ns.dct('title'))   
        || store.any(node,ns.foaf('name'))   
        || store.any(node,ns.vcard('fn'))
        // || UI.utils.label(node);
    return best;
  }
  catch(e) { console.log(e); return node }
}

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

/*
  if we already loaded solid-ui or mashlib, use the UI object
  else, dynamically load rdflib, and solid-namespace
*/
export async function ensureLibraries($rdf){
  if(typeof UI != "undefined"){
    return({
      rdf: UI.rdf,
      ns: UI.ns, 
      store: UI.store,
    });
  }
  else {
    $rdf = await import('../node_modules/rdflib/lib/index.js');
    const pkg = await import('../node_modules/solid-namespace/index.js');
    const ns = pkg.default($rdf);
    const store = $rdf.graph();
    store.fetcher = $rdf.fetcher(store);
    return({ rdf:$rdf, ns, store });
  }
}
