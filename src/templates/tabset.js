import * as util from '../utils.js';

export async function tabset(element,results) {
    const options = element.dataset;
    const items = [];
console.log(results);
    for(let row of results){
      items.push(UI.rdf.sym(row.link));
    }
    const self=this;
    const renderTab = options.rendertab || async function(div,subject){
      div.innerHTML = util.bestLabel(subject);
    }
    const renderMain = options.rendermain || async function (div,subject){
      div.innerHTML="";
      self.query.properties2table(div,subject)      
    }
    const tabOptions = {
      items,
      backgroundColor : options.backgroundcolor,
      orientation : options.orientation,
      dom : options.dom,
      onClose : options.onclose,
      ordered : options.ordered,
      selectedTab: options.selectedtab,
      startEmpty : options.startempty,
      renderTab,
      renderMain,
      renderTabSettings : options.rendertabsettings,
    }
    element.appendChild( UI.tabs.tabWidget(tabOptions) );
}
