const uixAppBase = 'https://jeff-zucker.github.io/solid-uix/';

export async function processStandAlonePlugin(element){
  element.addEventListener('click',async(e)=>{
    e.preventDefault();
    return await _processStandAlonePlugin(this,e.target);
  });
}
async function _processStandAlonePlugin(self,element){
  //
  // if not imported, import it and get its output by running it
  //
  let output;
  self.plugin ||= {};
  let thisPlugin = self.plugin[element.href];
  if(!thisPlugin){
    const {plugin} = await import(element.dataset.source)
    thisPlugin = plugin
    output = await thisPlugin.runPlugin(UI,self);
    self.plugin[thisPlugin.slug] = thisPlugin;
  }
  //
  // if there is no area to display it, create the area
  //
  let pluginsArea = document.getElementById('pluginArea');  
  let thisPluginArea = document.getElementById(thisPlugin.slug);
  if(!thisPluginArea){
    thisPluginArea = document.createElement('DIV');
    thisPluginArea.id = thisPlugin.slug;
    pluginsArea.appendChild(thisPluginArea);
  }
  //
  // if the area isn't already filled, fill it with the output
  //
  // TBD : process the area's uix varaiables/actions
  //
  if(thisPluginArea.innerHTML.trim().length==0){
    thisPluginArea.appendChild(output);
  }
  //
  // hide other plugins and show this one
  //
  let titleBar = document.body.querySelector('[data-uix=currentPage]');
  if(titleBar) titleBar.innerHTML = thisPlugin.title;
  let pluginAreas = pluginsArea.querySelectorAll('#'+pluginsArea.id+' > DIV');
  for(let pArea of pluginAreas){
    pArea.classList.add('hidden')
  }
  thisPluginArea.classList.remove('hidden');
}

export async function processPlugin(pluginName,element){
  this.plugins ||= {};
  const user = await this.profileSession.loggedInUser();
  let pluginContainer;
  if(!this.plugins[pluginName]){
     let uixContainer = await _getUixContainerFromPrefs(user)
                     || await _putUixContainerInPrefs(user);
     if(typeof uixContainer==="undefined") return;
     pluginContainer = uixContainer + "plugins/" + pluginName + "/";
     let installed = await _ensureInstalled(pluginName,pluginContainer);
     if(!installed) return;
     this.plugins[pluginName]=pluginContainer;
  }
  pluginContainer ||= this.plugins[pluginName];
  if(pluginName==='quicknotes'){
    let form =  await this.showForm({
      form: `${pluginContainer}assets/quicknotes.ttl#Form`,
      formSubject: `${pluginContainer}assets/quicknotes.ttl#Data`,
    });
    let area = await form.querySelector('TEXTAREA');
    if(element && area) element.appendChild( area );
  }
}
async function _getUixContainerFromPrefs(user){
    if(typeof user==="undefined") return;
    let app = UI.rdf.sym(uixAppBase+'index.html');
    let graph = user.nget('space:preferencesFile');
    const container = UI.store.any(app,UI.ns.space('workspace'),null,graph);
    if(container) return container.value;
    if(!user) return;
    let prefs = user.context.preferencesFile;
    await UI.store.fetcher.load(prefs);
    return (UI.store.any(app,UI.ns.space('workspace'))||{}).value;
  }
async function _putUixContainerInPrefs(user){
   if(typeof user==="undefined") return;
   const msg = `
You can install plugins by specififying a container below.\nOr cancel to skip installation.
`;
   const suggestion = user.get('storages')[0] + "uix/";
   let location = prompt(msg,suggestion);
   if(!location) return;
   try {
     let s = UI.rdf.sym(uixAppBase+'index.html');
     let p = UI.ns.space('workspace');
     let o = UI.rdf.sym(location);
     let g = user.nget('space:preferencesFile');
     let insertStmt = UI.rdf.st(s,p,o,g);
     UI.store.updater.update([],[insertStmt],(uri,ok,message)=>{
       if(ok) {
         UI.store.add(insertStmt); // so we can see it now
         window.location.reload();
         return location;
       }
       else {
         alert(message)
       }
     });
   }
   catch(e){console.log(e)}
}
async function _ensureInstalled(pluginName,pluginContainer){
/*
  try {
    let r = await UI.store.fetcher.load(pluginContainer);
    if(r.status>199&&r.status<300) return true; // already there
  }
  catch(e){
    // clear the 404 from the attempted fetch ???
    //     UI.store = UI.store.remove(pluginContainer);
*/
//    if(!confirm(`Install '${pluginName}'?`)) return;
    try {
      let resources = _resources[pluginName];
      for(let resource of resources){
        _addPluginResource(pluginContainer,resource);
      }
      // window.location.reload();
      return true;
    }
    catch(e) { console.log(e); return; }
//  }

}
const _resources = {
  quicknotes : ["assets/quicknotes.ttl"],  
}
async function _addPluginResource(pluginContainer,resource){
  const source = uixAppBase + resource
  const target = pluginContainer + resource
  let r1,r2;
  try{
    r1 = await fetch(source);
  }
  catch(e) { alert("Can't get from "+source ); return; }
  try{
    r2 = await UI.store.fetcher.webOperation('PUT',target,{
      body: await r1.text(),
      contentType: "text/turtle",
    });
    if(!r2.ok) console.log(target +"-bad put"+ r.message);
  }
  catch(e) { alert("Can't put to "+target ); return; }
}
