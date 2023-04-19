import {UIX} from './uix-core.js';
import * as util from './utils.js';

export class SolidOSFrontEnd extends UIX {
  async init(){
    await super.init();
    toggleUserPanel(this.profileOwner,this);
  }


async showSolidOSLink(subject,element,self){
  if(!subject) return console.log("No subject supplied for SolidOSLink!");

  /* hide other plugins, show solidOS */
  let pluginsArea = document.getElementById('pluginArea');  
  let plugins = pluginsArea.querySelectorAll('#pluginArea > DIV');  
  let solidArea = pluginsArea.querySelector('[data-uix=solidOSbrowser]');  
  for(let pArea of plugins){
    pArea.classList.add('hidden')
  }
  solidArea.classList.remove('hidden')

  const opt = element.dataset || {};
  subject = subject.uri ?subject :util.sym(subject);
  const params = new URLSearchParams(location.search)        
  params.set('uri', subject.uri);                                    
  let base = util.currentContainer() + "index.html";
  const o = panes.getOutliner(opt.dom || document);
  await refreshProfileOwner(subject.uri,element,self);
  let currentPage = document.body.querySelector("[data-uix=currentPage]");
  if(currentPage) currentPage.innerHTML = subject.uri;
  let pane = opt.pane ?panes.byName(opt.pane) :null;
  await o.GotoSubject(subject,true,pane,true,null,opt.outlineElement);
  window.history.replaceState({}, '', `${base}?${params}`);  
}
}  
// CREATE/REFRESH USER & PROFILEOWNER MENUS
//
export async function toggleUserPanel(profileOwner,self){
    const userPanel = document.getElementById('userPanel');
    const menuToggle = document.getElementById('userMenuToggle');
    const ownerMenu = document.querySelector('.profileOwnerMenu');
    if(ownerMenu) ownerMenu.style.display = profileOwner ?"block" :"none";   
    if(!userPanel) return;
    let user = (typeof UI !="undefined") ?UI.authn.currentUser() :null;
    user ||= await util.localWebid();
    self.profileOwner ||= await util.localWebid();
    function toggleVis(e){
      let target = document.getElementById('userPanel');
      if(target) target.classList.toggle('hidden')
    }
    if(user) {
      menuToggle.style.opacity="100%";
      menuToggle.style.cursor="pointer";
      if(self.profileOwner){
        let owner = await self.profileSession.add(self.profileOwner);
        let home = owner.get('storages')[0];
        menuToggle.addEventListener('click',toggleVis)
        await self.show(home,{dataset:{linktype:"SolidOS",uix:'profileOwnerHome',pane:"folder"}});
      }
    }
    else {
      menuToggle.style.opacity="50%";
      menuToggle.style.cursor="default";
      menuToggle.removeEventListener('click',toggleVis)
    }
  }
export async function refreshProfileOwner(webid,element,self){
    /** 
         Refresh the profileOwner areas: name,role,pronouns,photo,profileOwnerMenu
         But only when needed
    **/
    const action = element && element.dataset ?element.dataset.uix :"";
    const isPodAction = action.match(/^profileOwner/i);
    const isUserAction = action.match(/^user/i) && !action.match(/(communities|friends)/i);
    const user = typeof UI != "undefined" ?(UI.authn.currentUser()||"").value :null;
    self.profileOwner ||= user;
    self.profileOwner ||= await util.localWebid();
    if(!webid) return;                // no new owner, so no refresh
    if(isPodAction) return;           // action is by existing profileOwner, so no refresh
    if(isUserAction) webid=user;
    if(webid===self.profileOwner) return; // new owner is already pod owner, so no refresh
    /**
       Okay, let's refresh
    **/
    self.profileOwner = webid;
    let actionElements = document.body.querySelectorAll('[data-uix]') || [];
    for(let actionElement of actionElements){
      let act = actionElement.dataset.uix;
      if(act.match(/^profileOwner/i)){
        if(act.match(/(name|pronouns|role)/i)) actionElement.innerHTML="";
        if(act.match(/photo/i)) actionElement.src="";
        await self.process(actionElement);
      }
    }
  }

