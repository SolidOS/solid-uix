import * as util from './utils.js';

export class SimpleQuery {

  /** properties2table(subjectNode)
  *  -----------------------------
  *  return an HTML table contianing predicate/object pairs for the subject
  */
  async properties2table(element,subjectNode){
    subjectNode ||= util.getSource(element);
    await util.load( subjectNode.doc() );
    let wanted = element.dataset.select ?element.dataset.select.toLowerCase() :"";
    let isWanted = {};
    for(let w of wanted.split(/ /)){ isWanted[w]=true;}
    let table = document.createElement('DIV');
    table.style.display="table";
    let counter = 0;
    let lastFound = "";
    for(let property of util.match(subjectNode)){
      let unmungedPredicate = property.predicate.value.replace(/.*\//,'').replace(/.*\#/,'').toLowerCase();
      if(wanted && !isWanted[unmungedPredicate]) continue;
      let row = document.createElement('DIV');
      row.style.display="table-row";
      let th = document.createElement('B');
      th.style.display="table-cell";
      let td = document.createElement('DIV');
      td.style.display="table-cell";
      th.style["padding-right"]="1rem";
      th.style['text-align']="right";
      th.innerText = util.bestLabel(property.predicate);
      td.innerText = lastFound = util.bestLabel(property.object);
      row.appendChild(th);         
      row.appendChild(td);         
      table.appendChild(row);       
      counter++
    }
    if(counter>1) element.appendChild(table);
    else element.innerText = lastFound;
  }
}
