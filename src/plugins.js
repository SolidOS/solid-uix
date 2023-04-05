const uixAppBase = 'https://jeff-zucker.github.io/solid-uix/';

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
    let x = (UI.store.any(app,UI.ns.space('workspace'))||{}).value;
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
         return location;
       }
       else {
         alert(message)
       }
     });
   }
   catch(e){alert(e)}
}
async function _ensureInstalled(pluginName,pluginContainer){
  try {
    let r = await UI.store.fetcher.load(pluginContainer);
    if(r.status>199&&r.status<300) return true; // already there
  }
  catch(e){
    if(!confirm(`Install '${pluginName}'?`)) return;
    try {
      let resources = _resources[pluginName];
      for(let resource of resources){
        _addPluginResource(pluginContainer,resource);
      }
      return true;
    }
    catch(e) { console.log(e); return; }
  }
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
  catch(e) { alert("Can't get "+source ); return; }
  try{
    r2 = await UI.store.fetcher.webOperation('PUT',target,{
      body: await r1.text(),
      contentType: "text/turtle",
    });
    if(!r.ok) alert(target +"--"+ r.message);
  }
  catch(e) { alert("Can't get "+target ); return; }
}
