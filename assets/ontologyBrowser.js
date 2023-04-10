async function runPlugin (UI,uix){
  var data = 'http://localhost:3101/public/s/solid-uix/assets/ontologyBrowser.ttl';
  let page = document.createElement('DIV');
  let menu = document.createElement('UL');
  let display = document.createElement('DIV');
  let iframe = document.createElement('IFRAME');
  iframe.target="#ontologyBrowserIframe";
  try {
    await UI.store.fetcher.load(data);
    data =  UI.rdf.sym(data);
  }
  catch(e){console.log(e)}
  const vann = UI.rdf.Namespace('http://purl.org/vocab/vann/');
  let ontologies = UI.store.each(null,UI.ns.rdf('type'),UI.ns.owl('Ontology'),data);
  for( let ont of ontologies ){
    const li = document.createElement('LI');
    const anchor = document.createElement('A');
    const label =  UI.store.any(ont,UI.ns.rdfs('label'),null,data);
    const nsUri = UI.store.any(ont,vann('preferredNamespaceURI'));
    const nsPrefix = UI.store.any(ont,vann('preferredNamespacePrefix'));
    const format = UI.store.any(ont,UI.ns.ui('linktype'));
    if(!label) continue;
    anchor.href = ont.value;
    anchor.innerHTML = label ?label.value :"";
    li.style="border-bottom:1px solid black;padding:0.5rem;width:100%;margin-left:none;";
    anchor.style="text-decoration:none;font-size:100% !important;";
    anchor.addEventListener('click',async(e)=>{
      e.preventDefault();
       anchor.dataset.linktype=format;
       uix.show(anchor.href,iframe);
/*
if(format&&format==="SolidOSLink"){
      let r = await window.fetch(anchor.href);
      iframe.srcdoc = "<pre>"+await r.text()+"</pre>";
}
else      iframe.src = e.target.href;
*/
    });
    const txt = document.createElement('DIV');
    txt.innerHTML = `${nsPrefix} ${nsUri}`;
    li.appendChild(anchor);
    li.appendChild(txt);
    menu.appendChild(li);
  }
  page.style="width:100%;display:flex;flex-direction:columns;";
  menu.style="border:1px solid black;border-bottom:none;width:22rem;list-style:none;padding-left:0;margin-top:0;menu-bottom:0";
  display.style="border:1px solid black;border-left:none;flex-grow:1";
  iframe.style="height:100%;width:100%;border:none;";
//  iframe.src = anchors[0].href;
  page.appendChild(menu)
  display.appendChild(iframe);
  page.appendChild(display);
  return page;
}
export const plugin = {
  runPlugin,
  slug:"ontologyBrowser",
  title:"Ontology Browser",
}

