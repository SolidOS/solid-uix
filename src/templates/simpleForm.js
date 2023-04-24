import * as util from '../utils.js';

export async function simpleForm(element,self){
  let node = util.getSource(element);
  let subject = node ?node.value :null;
  if(!subject) return;
  await util.load(node.doc());
  for(let field of element.querySelectorAll('INPUT')){
    if(field.type.match(/text/i)){
      let predicate = util.curie(field.dataset.fieldname);
      field.value = (util.any(node,predicate)||{}).value || "";
      field.dataset.originalvalue = field.value;
    }
    else if(field.type.match(/radio/i)){
      let predicate = util.curie(field.name);
      let wanted = util.any(node,predicate);
      for(let i of document.querySelectorAll(`*[name="${field.name}"]`)){
        if(util.curie(i.value).value===wanted.value) i.checked=true;
      }
    }
  }
  for(let field of element.querySelectorAll('TEXTAREA')){
    let predicate = util.curie(field.dataset.fieldname);
    field.innerHTML = (util.any(node,predicate)||{}).value || "";
  }
}
