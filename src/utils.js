// import {setStyle} from '../style.js'; // maybe add later

export function bestLabel(node){
  try{
    if(typeof node==="string")  node = UI.rdf.sym(node) ;
    const best = UI.store.any(node,UI.ns.ui('label'))   
        || UI.store.any(node,UI.ns.dct('title'))   
        || UI.store.any(node,UI.ns.rdfs('label'))   
        || UI.utils.label(node);
    return best;
  }
  catch(e) { alert(e); return node }
}

export function parsePredicatePhrase(string,baseUrl,element){
  let [predicate,object] = string.split(/\s+/,2);
  return([ string2node(predicate), string2node(object) ]);
}
export  function string2node(string,param){
    if(!string) return "";
    try {
      if(string===('*')){
         return null;
      } 
      else if(string.startsWith('<')){
         return UI.rdf.sym( string.replace(/^</,'').replace(/>$/,'') );
      } 
      else if(string==="a") {
        return UI.ns.rdf('type');
      }
      else if(string.startsWith(':')) {
        return UI.rdf.sym(baseUrl + string.replace(/^:/,'#') );
      }
      else if(string.match(/^bk:/)) {
        let href = 'http://www.w3.org/2002/01/bookmark#'+string.replace(/^bk:/,'');
        return UI.rdf.sym(href);
      }
      else if(string.match(/:/)) {
        let [vocab,term] = string.split(/:/);
        if( UI.ns[vocab] && term ) return UI.ns[vocab](term);
      }
      else if(string==='?') {
        if(param) return UI.rdf.sym(param);
        return getNodeFromFieldValue(element.dataset.paramelement);
      }
      else return UI.rdf.literal(string);
    }
    catch(e){ console.log(e); }
  }

// expects queryString like "* a skos:Concept"
export async function string2statement(querystring,source,param){
   let stmt = []
   for(let i of querystring.split(/\s+/,3)){
      stmt.push(string2node(i,param))     
   }
   source = source.startsWith('http') ?source :window.origin+source;
   source = UI.rdf.sym(source);
   await UI.store.fetcher.load(source);
   let matches = UI.store.match(stmt[0],stmt[1],stmt[2],source);
   return matches;
}

export function getNodeFromFieldValue(fieldSelector,key){
   let paramField = document.getElementById( fieldSelector.replace(/^#/,'') );
   if(!paramField ) return;
   let param = paramField[paramField.selectedIndex]; // SELECT
   try { return UI.rdf.sym(param); }
   catch(e){ console.log(e) }
}








