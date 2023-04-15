import * as util from './utils.js';

/*
  linktypes
    HTML     (interpolates uix-values, then shows it)
    SolidOS  (shows using SolidOS databrowser)
    Text     (shows inside <code> tags)
    Markdown (shows as HTML)
*/
export async function show(uri,element){
  let linktype = element.dataset.linktype
  let needsproxy = element.dataset.needsproxy;
  if(needsproxy) uri = this.proxy+uri;
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
    let subject = o.formSubject;
    let script = o.script || function(){};
    try {
      subject = UI.rdf.sym(subject) ;
      if(o.formString){
        UI.rdf.parse(o.formString,UI.store,o.form,'text/turtle');
      }
      else await UI.store.fetcher.load(o.form);
      await UI.store.fetcher.load(subject.doc());
      await UI.widgets.appendForm(dom, container, {}, subject, form, doc, script);
    }
    catch(e){
       console.log(e);
       container.innerHTML = "FORM ERROR:"+e;
    }  
    return container;
  }


// WE HAVE THE DATA, SHOW IT
//
export async function showInElement(actionElement,output){
    const self = this;
    let actionVerb=((actionElement.dataset.uix)||"").toLowerCase();
    if(actionVerb.match(/home/)) actionElement.dataset.pane="folder";
    switch(actionElement.tagName) {
      case 'IMG':
          actionElement.src = output;
          break;
      case 'INPUT' :
          actionElement.appendChild(output);
          break;
      case 'BUTTON' :
          if(output && typeof output !="string"){
            output = output[0] ? output[0].link :output.link || output;
          }
          actionElement.href = output;
          actionElement.addEventListener('click',async(e)=> {
            e.preventDefault();
            let subject = e.target.href;
            actionElement.dataset.linktype="SolidOS";
            this.show(subject,actionElement);
          });
          // setStyle(actionElement,'buttonStyle');  // for example
          break;
      case 'A' :
          if(output && typeof output !="string"){
            output = output[0] ? output[0].link :output.link || output;
          }
          // Don't show links to non-existant resources
          if(!output || !output.length) { 
            actionElement.style.display="none";
          }
          else {
            actionElement.style.display="inline-block";
            actionElement.href = output;
            actionElement.addEventListener('click',async(e)=> {
              e.preventDefault();
              actionElement.dataset.linktype="SolidOS";
              this.show(e.target.href,actionElement);
            });
          }
          break;
      case 'DL' :
            let loop = actionElement.dataset.loop;
            for(let row of output){
              let dt = document.createElement('DT');
              dt.innerHTML = row.label || row;
              dt.dataset.uix=loop;
              actionElement.appendChild(dt);
            }
            console.log(output); //outer = await <dl data-uix="userCommunities"
          break;
      case 'SELECT' :
          if(actionElement.options){
            while( actionElement.options.length > 0) {
              actionElement.remove(0);
            }
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
            actionElement.appendChild(opt);
          }
          if(actionElement.dataset.target){
            actionElement.addEventListener('change',()=>{
              let  el = actionElement.dataset.target.replace(/^#/,'');
              self.process( document.getElementById(el) );
            });
          }
          break;
      case 'UL' :
          actionElement.innerHTML="";
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
            anchor.addEventListener('click',(e)=>{
              e.preventDefault();
              actionElement.dataset.linktype="SolidOS";
              this.show(e.target.href,actionElement);
            });
            li.appendChild(anchor);
            actionElement.appendChild(li);
          }
          break;
      default : actionElement.innerHTML = output;

    } // end of tag-type swich statement

} // end of function showInElement




