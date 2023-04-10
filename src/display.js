import * as util from './utils.js';

export async function show(uri,element){
  let linktype = element.dataset.linktype
  let needsproxy = element.dataset.needsproxy;
  if(needsproxy) uri = this.proxy || "https://solidcommunity.net/proxy?uri="+uri;
  if(linktype==="SolidOS") return _showSolidOSLink(uri,element,this);
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
    if(needsproxy) uri = uri.replace(/^.*proxy\?uri=/,'');
    uri = new URL(uri);
    const b = uri ?`<base href="${uri.origin}${uri.pathname}">` :"";
    element.srcdoc = `<body>${b}${content}</body>`
    element.scrollTo({ top: 0, behavior: "smooth" });
  }
  catch(e){ alert(uri+e); return; }
}
async function _showSolidOSLink(subject,element,self){
  /* hide other plugins, show solidOS */
  let pluginsArea = document.getElementById('pluginArea');  
  let plugins = pluginsArea.querySelectorAll('#pluginArea > DIV');  
  let solidArea = pluginsArea.querySelector('[data-uix=solidOSbrowser]');  
  for(let pArea of plugins){
    pArea.classList.add('hidden')
  }
  solidArea.classList.remove('hidden')
  const opt = element.dataset || {};
  if(!subject) return console.log("No subject supplied for SolidOSLink!");
  subject = subject.uri ?subject :util.sym(subject);
  const params = new URLSearchParams(location.search)        
  params.set('uri', subject.uri);                                    
  let base = "http://localhost:3101/public/s/solid-uix/"
  const o = panes.getOutliner(opt.dom || document);
  await self.refreshPodOwner(subject.uri,element);
  let currentPage = document.body.querySelector("[data-uix=currentPage]");
  if(currentPage) currentPage.innerHTML = subject.uri;
  let pane = opt.pane ?panes.byName(opt.pane) :null;
  await o.GotoSubject(subject,true,pane,true,null,opt.outlineElement);
  window.history.replaceState({}, '', `${base}?${params}`);  
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

