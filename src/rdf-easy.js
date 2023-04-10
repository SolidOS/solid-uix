import * as util from './utils.js';
await util.initLibraries();

export class RdfEasy {

  inMemoryStorage(){
    const documentUri = 'chrome:theSession';
    this.documentUri = documentUri;
    this.documentNode = util.sym(documentUri);
    return this;
  }
  async load(documentUri){
    try {
      await util.initLibraries();
      if(documentUri){
        await util.load(documentUri)
      }
      else {
        documentUri = 'chrome:theSession';
      }
      this.documentUri = documentUri;
      this.documentNode = util.sym(documentUri);
      return this;
    }
    catch(e){ console.log("load error: "+e) }
  }
  any(queryString){
    let s = util.str2stm(queryString,this.documentUri) ;
    let found = util.any( s.subject,s.predicate,s.object,s.graph );
    return found ?found.value :"";
  }
  each(queryString,sourceIri){
    let s = util.str2stm(queryString,this.documentUri) ;
    let found = util.each( s.subject,s.predicate,s.object,s.graph );
    for(let i in found){
      found[i] = found[i].value;
    }
    return found;
  }
  add(things){
    if(typeof things === "string") things = [things];
    for(let thing of things){
      let s = util.str2stm(thing,this.documentUri) ;
      util.add( s.subject,s.predicate,s.object,s.graph );
    }
  }
  remove(queryString){
    let s = util.str2stm(queryString,this.documentUri) ;
    let found = util.add( s.subject,s.predicate,s.object,s.graph );
    return found;
  }
}

export const rdfEasy = new RdfEasy();
