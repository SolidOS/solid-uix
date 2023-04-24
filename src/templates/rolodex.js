/*
<div data-uix="query"
     data-from="test-data.ttl"
     data-unique="name"
     data-template="Rolodex"
></div>
*/

import * as util from '../utils.js';

export async function rolodex(element,results){
   let source = util.getSource(element);
   let unique = element.dataset.unique;
   if(!source || !unique){
     alert("Rolodex requires dataset-from and dataset-unique")
     return;
   }
   let menu = document.createElement('NAV');   
   let prev = document.createElement('BUTTON');   
   let next = document.createElement('BUTTON');   
   let display = document.createElement('DIV');   
   menu.appendChild(prev);   
   menu.appendChild(next);   
   element.appendChild(menu);
   element.appendChild(display);
   prev.innerHTML = "&lt;";
   next.innerHTML = "&gt;";
   prev.style = next.style = "font-weight:bold";
   element.style = "display:grid;grid-template-rows:4em auto;width:100%;height:100%;overflow:auto";
   menu.style["text-align"] = "center";
   let max = results.length -1;
   alert(max)
}
