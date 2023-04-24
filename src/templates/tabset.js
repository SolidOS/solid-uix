import * as util from '../utils.js';

/*
<ul data-uix="tabdeck" data-orientation="1">
    <li><b>Verticl Tab Label 1</b>
        <a href="foo.md">Foo</a>
        <a href="bar.md">Bar</a>
    </li>
    <li><b>Vertical Tabl Label 2</b>
        <a href="foo.md">Foo</a>
        <a href="bar.md">Bar</a>
    </li>
</ul>
*[data-uix="tabdeck"] > div > main > div > main > *[data-uix="tabset"] > div > main {
*/
export async function tabdeck(element) {
  element.style="padding:0 !important;margin:0 !important; margin-top:3rem !important;";
  let tabs = element.querySelectorAll('LI');
  let results=[];  
  for(let tab of tabs){
     let label = tab.firstChild.innerHTML;
     let links = tab.querySelectorAll('A');
     let link = 'http://example.com/' + label.replace(/ /g,'');
     results.push({link,label,links});
  }
  element.innerHTML="";
  await _tabset(element,results,this,"isTabdeck");
}

export async function tabset(element,results) {
      let tabs = [];
      let source  = util.getSource(element);
      if(source){
        source = source.value;
        let r = await fetch(source);
        element.innerHTML=await r.text();
        element.dataset.from = "";
        await this.process(element);
      }
      else {
        for(let a of element.querySelectorAll('A')){
          let link = util.getIRInode(a.href);
          link = link ?link.value :a.href;
          let label = a.innerHTML.trim();
          tabs.push({link,label});
        }
        element.innerHTML="";
        await _tabset(element,tabs,this);
      }
}

async function _tabset(element,results,self,isTabdeck) {
    const options = element.dataset;
    const items = [];
    let labels = {}; 
    let subTabs = {};
   for(let row of results){
      items.push( ( UI.rdf.sym(row.link)).value);
      labels[row.link]=row.label;
      subTabs[row.link]=row;
    }
    const renderTab = options.rendertab || async function(div,subject){
      div.innerHTML = labels[subject] || util.bestLabel(subject);
    }
    const renderMain = options.rendermain || async function (div,subject){
      div.classList.add('uixTabContent');
      if(subject.match(/^http:\/\/example.com\//)) {           // process in-memory tabset from a tabdeck
        let tset = document.createElement('DIV');
        tset.dataset.uix="tabset"
        for(let item of subTabs[subject].links){
           tset.appendChild(item);
        }
        await self.process(tset);
        div.innerHTML = "";
        div.appendChild(tset)
        return;
      }
      else { self.show(subject,div) }
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
    element.appendChild( await UI.tabs.tabWidget(tabOptions) );
    for(let m of element.querySelectorAll('NAV LI')){m.style.padding="none !important"}
    for(let m of element.querySelectorAll('BUTTON')){m.style.width="100%";m.style.height="100%";m.style.padding="none !important";}
    for(let m of element.querySelectorAll('main')){m.style.border="none";m.style["height"]="100%";}
}

