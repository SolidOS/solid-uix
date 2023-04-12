async function runPlugin (){
  var url = 'https://solidproject.org/TR/';
  var ctype = "text/html";
  var response = await window.fetch( url,{accept:ctype} );
  var dom =(new DOMParser()).parseFromString( await response.text(),ctype);
  let reports = dom.querySelector('#work-item-technical-reports');
  let anchors =  reports.querySelectorAll('[rel="cito:citesForInformation"]');
  let page = document.createElement('DIV');
  let menu = document.createElement('DIV');
  let display = document.createElement('DIV');
  let iframe = document.createElement('IFRAME');
  iframe.id = "specsDisplay";
  for(let anchor of anchors){
    anchor.target="#specsDisplay";
    anchor.style="border-bottom:1px solid black;display:block;padding:0.5rem;width:100%;text-decoration:none;";
    anchor.addEventListener('click',(e)=>{
      e.preventDefault();
      const displayFrame = e.target.target.replace(/^#/,'');
      document.getElementById(displayFrame).src = e.target.href;
    });
    menu.appendChild(anchor);
  }
  page.style="width:100%;display:flex;flex-direction:columns;";
  menu.style="border:1px solid black;border-bottom:none;width:22rem;";
  display.style="border:1px solid black;border-left:none;flex-grow:1";
  iframe.style="height:100%;width:100%;border:none;";
  iframe.src = anchors[0].href;
  page.appendChild(menu)
  display.appendChild(iframe);
  page.appendChild(display);
  return page;
}
export const plugin = {
  runPlugin,
  slug:"solidSpecs",
  title:"The Solid Specifications",
}
