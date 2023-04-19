import * as util from './utils.js';

/*
  show linktypes
    HTML     (interpolates uix-values, then shows it)
    SolidOS  (shows using SolidOS databrowser)
    Text     (shows inside <code> tags)
    Markdown (shows as HTML)
  showForm
  showProperties
  showInElement
*/

export async function showProperties(element){
  element.innerHTML="";
  let subjectNode = util.getSource(element);
  let wanted = element.dataset.select ?element.dataset.select.toLowerCase() :"";
  let isWanted = {};
  for(let w of wanted.split(/ /)){ isWanted[w]=true;}
  await util.load( subjectNode.doc() );
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

export async function show(uri,element){
  let linktype = element.dataset.linktype
  let needsproxy = element.dataset.needsproxy || linktype==='rss';
  if(needsproxy) uri = this.proxy+uri;
  if(!linktype){
    if(element.dataset.uix.toLowerCase().match(/^(user|profileowner|edit)/)) linktype='SolidOS'
  }
  if(linktype==="SolidOS") return this.showSolidOSLink(uri,element,this);
  let content;
  try {
    if(uri.match(/https:\/\/github.com/)) {
      content = await _gitApiFetch(uri);
    }
    else {
      let response = await window.fetch(uri);
      content = await response.text();
    }
    content = content.replace(/X-Frame-Options/g,'');
    if(linktype==="text/plain") content = `<pre>${content}</pre>`;
    if(needsproxy) uri = uri.replace(/^.*proxy\?uri=/,'');
    uri = new URL(uri);
    const b = uri ?`<base href="${uri.origin}${uri.pathname}">` :"";
    element.srcdoc = `<body>${b}${content}</body>`;
    element.scrollTo({ top: 0, behavior: "smooth" });
  }
  catch(e){ alert(uri+e); return; }
}
async function _gitApiFetch(uri){
  uri = uri.replace(/https:\/\/github.com/,'https://api.github.com/repos');
  uri = uri.replace(/blob\/main\//,'contents');
  const options = {Accept: "application/vnd.github.v3+html"};
  let response = await fetch(uri,options);
  console.log(await response.text() );
  return await response.text() ;
  //  let json = await response.json();
  //  return atob(json.content);
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
export async function showForm(o){
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

function aoh2table(table,aoh){
  let fields = Object.keys(aoh[0]);
  let counter = 0;
  let lastFound = "";
  let toprow = document.createElement('TR');
  for(let field of fields){
    let th = document.createElement('TH');
    th.style.display="table-cell";
    th.innerText = field;
    th.style.background="#c0c0c0";
    th.style.border="1px solid black";
    toprow.appendChild(th);    
  }
  table.appendChild(toprow);
  for(let r of aoh){
    let row = document.createElement('TR');
    row.style.display="table-row";
    for(let field of fields){
      let td = document.createElement('TD');
      td.style.display="table-cell";
      td.style.border="1px solid black";
      td.innerText = lastFound = row[field] = r[field];
      row.appendChild(td);         
    }
    table.appendChild(row);       
    counter++
  }
  table.style["border-collapse"]="collapse";
  if(counter>1) return table;
  else return lastFound;
}
const isBuiltInTemplate = {
  "tabset":1,
}
//import {tabset} from './templates/tabset.js';
function showBuiltInTemplate(template,element,results,self){
  template=template.toLowerCase();
  switch(template){
    case "tabset" :
      self.tabset(element,results);
      break;  
  }
}

function showTemplate(element,results,self){
  let template = element.dataset.template;
  if(!template) return results;
  if(isBuiltInTemplate[template.toLowerCase()]){
     showBuiltInTemplate(template,element,results,self);
     return;
  }
  for(let row of results){
     element.innerHTML += element.dataset.template.interpolate(row);
  }
}

const multiValueTag = { ul:1, dl:1, select:1, table:1 }

// WE HAVE THE DATA, SHOW IT
//
export async function showInElement(element,output){
    const self = this;
//    element.innerHTML="";
    if(element.dataset.template) return showTemplate(element,output,self);
    let actionVerb=((element.dataset.uix)||"").toLowerCase();
    if(actionVerb.match(/home/)) element.dataset.pane="folder";
    if(!multiValueTag[element.tagName.toLowerCase()] && typeof output != "string"){
      if(output.length) output = output[0];
      if(!output.length){
        let label="";
        for(let k of Object.keys(output)){
          if(!k.match(/(link|label)/)) output.label = util.bestLabel(output[k]);
        }
      }
    }
    switch(element.tagName) {
      case 'TABLE':
          aoh2table(element,output);
          break;
      case 'IMG':
          element.src = output;
          break;
      case 'INPUT' :
          element.appendChild(output);
          break;
      case 'BUTTON' :
          if(output && typeof output !="string"){
            output = output[0] ? output[0].link :output.link || output;
          }
          element.href = output;
          element.addEventListener('click',async(e)=> {
            e.preventDefault();
            let subject = e.target.href;
            element.dataset.linktype="SolidOS";
            this.show(subject,element);
          });
          // setStyle(element,'buttonStyle');  // for example
          break;
      case 'A' :
          if(output && typeof output !="string"){
            output = output[0] ? output[0].link :output.link || output;
          }
          // Don't show links to non-existant resources
          if(!output || !output.length) { 
            element.style.display="none";
          }
          else {
            element.style.display="inline-block";
            element.href = output;
            element.addEventListener('click',async(e)=> {
              e.preventDefault();
              element.dataset.linktype="SolidOS";
              this.show(e.target.href,element);
            });
          }
          break;
      case 'DL' :
            let loop = element.dataset.loop;
            for(let row of output){
              let dt = document.createElement('DT');
              dt.innerHTML = row.label || row;
              dt.dataset.uix=loop;
              element.appendChild(dt);
            }
            console.log(output); //outer = await <dl data-uix="userCommunities"
          break;
      case 'SELECT' :
          if(element.options){
            while( element.options.length > 0) {
              element.remove(0);
            }
          }
          if(element.dataset.prompt){
            let prompt = document.createElement('OPTION');
            prompt.selected = true;
            prompt.disabled = true;
            prompt.value="";
            prompt.innerHTML=element.dataset.prompt;
            element.appendChild(prompt);
          }
          for(let row of output){
            let opt = document.createElement('OPTION');
            if(typeof row !="string") {
               opt.value = opt.title = row.link;
               opt.innerHTML = row.label;
            }
            else {
              opt.value = row;
              opt.innerHTML = _bestLabel(row);
            }
            element.appendChild(opt);
          }
          if(element.dataset.target){
            element.addEventListener('change',()=>{
              let  el = element.dataset.target.replace(/^#/,'');
              let i = element.selectedIndex;
              if(!i || i<0) element.selectedIndex=0;
              el = document.getElementById(el);
              el.innerHTML="";              
              self.process( el );
            });
          }

          break;
      case 'UL' :
          element.innerHTML="";
          for(let row of output){
            let li = document.createElement('LI');
            let anchor = document.createElement('A');
            if(typeof row === 'string'){
               anchor.href = anchor.innerHTML = row;
            }              
            else {
               anchor.href = row.link;
               anchor.innerHTML = row.label;
            }
            if(!element.dataset.uix.match(/rss/i)){
              anchor.addEventListener('click',(e)=>{
                e.preventDefault();
                this.show(e.target.href,element);
              });
            }
            li.appendChild(anchor);
            element.appendChild(li);
          }
          break;
      default : {
          if(typeof output !="string") output = output.label || output.link || ""
          element.innerHTML = output;
      }

    } // end of tag-type swich statement

} // end of function showInElement




