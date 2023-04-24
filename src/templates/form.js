import * as util from '../utils.js';

export async function form(element,self){
alert(element);
  let form = util.getIRInode(element.dataset.form);
  let subjectString = element.dataset.subject;
  let subjectVal = (util.getNodeFromFieldValue(subjectString)||{}).value ;  
  let subject = util.getIRInode( subjectString );  
  if(!form || !subject) return;
  const formElement = await _showForm({form,subject});
  if(formElement) element.appendChild(formElement);
}
/**
    @param {IRI} form - required: form location
    @param {IRI} subject - required: data location
    @param {String?} formString - optional in-memory form
    @param {IRI?} formResultsDocument - optional location for form data (defaults to formSubject)
    @param {HTMLElement?} container - optional HTML element, defaults to new DIV;
    @param {HTMLDOM?} dom - optional dom, defaults to document;
    @return {HTMLElement}
 */
export async function _showForm(o){
    const dom = o.dom || document;
    const container = o.container || document.createElement("DIV");
    let form = UI.rdf.sym(o.form);
    let doc = o.formResultDocument;
    let formFromString = o.formString;
    let subject = o.subject;
    let script = o.script || function(){};
    try {
      subject = UI.rdf.sym(subject) ;
      if(o.formString){
        UI.rdf.parse(o.formString,UI.store,o.form,'text/turtle');
      }
      else await UI.store.fetcher.load(form);
      await UI.store.fetcher.load(subject.doc());
      await UI.widgets.appendForm(dom, container, {}, subject, form, doc, script);
    }
    catch(e){
       console.log(e);
       container.innerHTML = "FORM ERROR:"+e;
    }  
    return container;
  }

