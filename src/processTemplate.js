/* TEMPLATING 

  processTemplate( template:STRING, data:ARRAY, displayArea:HTMLELEMENT?);

    * loops through the data, interpolating it into the template
    * if displayArea is provided, it is filled with the interpolated template
    * returns a promise of an HTMLElement containing the interpolated template

*/
import {Table} from './table.js';
import {makeSimpleForm} from './simpleForm.js';

export const templateType = {
 Table:1,
 SimpleForm:1,
 JSON:1,
 SimpleSelector:1,
 RecordsList:1,
 CustomTemplate:1,
}

export async function processTemplate(options){

const templates = {

Table: async(options)=>{ return await (new Table()).render(options) },

SimpleForm: async(options)=>{ return await makeSimpleForm(options) },


JSON: (options)=>{ return(JSON.stringify(options.parts,4)); },


SimpleSelector: (options)=>{
  let select = document.createElement('SELECT');
  let widgetColor = options.color || this.widgetColor || "#000000";
  let widgetBackground = options.background || this.widgetBackground || "#dddddd";
  let widgetHighlight = options.background || this.widgetBackground || "#ffffff";
  select.style=`width:240px;height:2.5rem;font-size: 100%;border-radius: 0.5rem;padding:0.5rem;background:${widgetBackground};font-size:100%;color:${widgetColor};outlin
e:none;display:inline-block`;
  for(let o of options.parts){
    let option = document.createElement('OPTION');
    option.value = o.link;
    option.innerHTML = o.label;
    option.style=`background:${widgetHighlight};font-size:110%;color:black;`
    select.appendChild(option);
  }
  if(options.dataset.target) {
     select.addEventListener('change',async()=>{
       return await options.uix.action('refresh',options);      
     });
  }
  return select;
},       

RecordsList: async(options)=>{
    const templateString = this.suicTemplate.RecordsList;
    let parts = templateString.split(/\[~LOOP~\]/);
    let got = parts.length;
    let mid=got===3 ?parts[1].replace(/\[~/g,'${').replace(/~]/g,'}') :parts[0];
    let all=got===3 ?parts[0] : "";
    let bottom=got===3 ?parts[2] : "";
    for(let row of options.parts){
      let rowStr="";
      for(let col of Object.keys(row)){
        rowStr += mid.interpolate({key:col,val:row[col]});
      }
      all += rowStr+'<hr>';
    }
    all += bottom;
    return(all);
  },

CustomTemplate: async(options)=>{
  let blocks = options.content.split(/\[~LOOP~\]/);
  let got = blocks.length;
  let mid=got===3 ?blocks[1].replace(/\[~/g,'${').replace(/~]/g,'}') :blocks[0];
  let all=got===3 ?blocks[0] :"";
  let bottom=got===3 ?blocks[2] : "";
  for(let row of options.parts){
    all += mid.interpolate(row); 
  }
  all += bottom;
  return(all);
}

}; // end of templates hash


  if(typeof options==="string"){
    return templates[options.replace(/.*uix#/,'')];
  }
  options.dataset ||= options.displayArea ?options.displayArea.dataset :{};
  options.uix=this;
  const template = options.template || options.type;
  const results  = options.parts;
  let containingElement ;//= options.contentArea;
  let body;
  if(typeof template==='string'){
     if(template.match('ui#')){
       body = await builtIn(options);
     }
     else {
       body = await this.CustomTemplate({template,parts:results});
     }
  }
  else if(template) {
    if(template.groupOn) {
      results = sparql.flatten(results,template.groupOn)
    }   
    let recurring = template.recurring;
    let before = template.before;
    let after = template.after;
    if(recurring) body = recurring.interpolate(results);
    body = (before||"") + (body||"") + (after||"");
  }    
  containingElement ||= document.createElement('SPAN');
  if(typeof body != "string") {
    containingElement.innerHTML = "";
    containingElement.appendChild(body);
  }
  else containingElement.innerHTML = body;
  return containingElement;

  async function builtIn(options,self){
    options.template ||= options.type;
    options.template = options.template.replace(/^.*\#/,'');
    const handler = templates[options.template];
    if(handler) {
      return await handler(options);
    }
    else {
     alert(`Bad template name '${options.template}'!`);
      return "";
    }
  }

}
