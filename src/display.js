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
/*
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
*/
export async function show(uri,element){
  let linktype = element.dataset.linktype
  let needsproxy = element.dataset.needsproxy || linktype==='rss';
  if(needsproxy) uri = this.proxy+uri;
  if(!linktype  && element.datset && element.dataset.uix){
    if(element.dataset.uix.toLowerCase().match(/^(user|profileowner|edit)/)) linktype='SolidOS'
  }
  if(linktype==="SolidOS") return this.showSolidOSLink(uri,element,this);
  else if( uri.match(/\.(md|marked)$/) ){                    // parse markdown then insert into element
    await import('/public/s/solid-uix/node_modules/marked/marked.min.js');
    let content =  await myload(uri) ; 
    if(content) element.innerHTML= marked.parse( content ); 
    return;
  }
  else if( uri.match(/\.(txt)$/) ){                       // show text/plain inside pre tags
    let content =  await myload(uri) ; 
    if(content) element.innerHTML = `<pre>${content.replace(/</g,'&lt;')}</pre>`; 
    return;
  }
  else {                                                     // include document in element, process it's uix-vars
    element.innerHTML=""; 
    element.dataset.uix="include";
    this.processAction(element,element,uri);
  }
  // self.query.properties2table(div,subject)                // display properties 
  const el = document.createElement('IFRAME');
  el.style="width:100%;height:100%;border:none;overflow:auto;";
//  element.appendChild(el);
alert(3)
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
    el.srcdoc = `<body>${b}${content}</body>`;
    el.scrollTo({ top: 0, behavior: "smooth" });
  }
  catch(e){ alert(uri+e); return; }
}
async function _gitApiFetch(uri){
  uri = uri.replace(/https:\/\/github.com/,'https://api.github.com/repos');
  uri = uri.replace(/blob\/main\//,'contents');
  const options = {Accept: "application/vnd.github.v3+html"};
  let response = await fetch(uri,options);
  return await response.text() ;
  //  let json = await response.json();
  //  return atob(json.content);
}     
async function myload(url){
  if(url.match(/github/)) {
    return await _gitApiFetch(url);
  }
  try{
        let r = await UI.store.fetcher.webOperation('GET',url);
        if(r.ok){
          let content = r.responseText;
          return content;
        }
        else console.warn(r.message);
      }
      catch(e){ console.warn(e) }
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
  "rolodex":1,
}
//import {tabset} from './templates/tabset.js';
function showBuiltInTemplate(template,element,results,self){
  template=template.toLowerCase();
  switch(template){
    case "tabset" :
      self.template.tabset(element,results);
      break;  
    case "rolodex" :
      self.template.rolodex(element,results);
      break;  
  }
}

function showTemplate(element,results,self){
  let template = element.dataset.template;
  if(!template) return results;
  if(self.template[template.toLowerCase()]){
    (self.template[template.toLowerCase()])(element,results)
    return;
  }
/*
  if(isBuiltInTemplate[
     showBuiltInTemplate(template,element,results,self);
     return;
  }
*/
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




