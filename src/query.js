import * as util from './utils.js';

export class SimpleQuery {

  constructor(self){
    this.self = self;
  }

  async processQuery(element){
/*
    data-select="name age"
    data-from="saved-queries/queries.ttl"
    data-where="type Concept"


    data-select="name age"
    data-from="test-data.ttl"
    data-where="type Person"
*/
    let uniqueKey = element.dataset.unique || "";
    let from = util.getIRInode(element.dataset.from);

    /* if from-source is a subject, show properties
       else if is document, show table
    */
    if(from.value != from.doc().value) return await this.properties2table(element);

    await util.load( from.doc() );
    let select = element.dataset.select;
    let selectedField = {}
    if(select) {
      for(let w of select.split(/ /)){ selectedField[w.toLowerCase()]=true;}
    }
    let whereField,whereVal,wantedField,wantedValue;
    let wantedStatements=[];
    const isSingleField = Object.keys(selectedField).length===1 ?true :false;
    if(element.dataset.where){
      [whereField,whereVal] = element.dataset.where.toLowerCase().split(/ /);
      let paramField = element.dataset.paramfrom;
      let param = (util.getNodeFromFieldValue(paramField)||{}).value;
      if(param) whereVal= util.bestLabel(whereVal.replace(/\?/,param)).replace(/ /g,'').toLowerCase();
      let predicates = util.match(null,null,null,from.doc()).map((s)=>{return s.predicate});
      for(let predicate of predicates){
        let p = UI.utils.label(predicate).replace(/\s+/g,'').toLowerCase();
        if(p===whereField){
          wantedField = predicate;
          let tmpStms = util.match(null,wantedField,null,from.doc());
          for(let ts of tmpStms){
            let o = UI.utils.label(ts.object).replace(/\s+/g,'').toLowerCase();
            if(whereVal===o) wantedStatements.push(ts);
          }
          break;
        } 
      } 
    }
    else {
      wantedStatements = util.match(null,null,null,from.doc());
    }
    let output=[];
    let found={};
    let fields={};
    for(let stm of wantedStatements){
      let row = {};
      row["_subject"] = stm.subject.value;
      for(let s of util.match(stm.subject)){
        let p = UI.utils.label(s.predicate).replace(/\s+/g,'').toLowerCase();
        if(select && !selectedField[p]) continue;
        let key = util.bestLabel(s.predicate);
        fields[key]=true;
        if(!row[key]) row[key] = s.object.value;
        else {
           if(typeof row[key]==="string") row[key] = [row[key]];
           row[key].push( s.object.value );
        }
      }
      const isDuplicate = uniqueKey && found[row[uniqueKey]];
      found[row[uniqueKey]]=true;
      for(let k of Object.keys(row)){
        if(typeof row[k]==="string"){
          if(isSingleField || element.tagName.match(/(select|ul)/i)){
             row.link = row['_subject'];
             if(k==="label") row.label = row[k];
          }
        }
        else row[k] = row[k].join(', ');
      }
      delete row["_subject"];
      if(isSingleField || element.tagName.match(/(select|ul)/i) && !row.label){
        row.label = util.bestLabel(stm.subject);
      }
      for(let f of Object.keys(fields)){row[f] ||= "";}
      if(!isDuplicate) output.push(row);      
    }
    let groupon = element.dataset.groupon || element.dataset.distinct;
    if(!groupon && select){
        groupon = select.split(/ /)[0];
    }
    if(groupon) output = _flatten(output,groupon);
    return output;
//    if(output) await this.self.showInElement(element,output)
  }

  /** properties2table(element,?subjectNode)
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

  function _flatten(results,groupOn){
  groupOn ||= (Object.keys(results[0]))[0];
  const newResults = {};
  for(let row of results) {
    let key = row[groupOn];
    if(!newResults[key]) newResults[key]={};
    for(let k of Object.keys(row)){
      if(!newResults[key][k]) {
        newResults[key][k]=row[k];
        continue;
      }  
      if(newResults[key][k].includes(row[k])) continue;
      if(typeof newResults[key][k]!="object") newResults[key][k]=[newResults[key][k]]
      newResults[key][k].push(row[k])
    }
  }
  results = [];
  for(let n of Object.keys(newResults)){
    results.push(newResults[n])
  }
  return results;
} 
