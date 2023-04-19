import * as util from './utils.js';
let authSession, loginButtonArea;

document.addEventListener('DOMContentLoaded', function() {

    if(typeof UI === "undefined") return;
    authSession = UI.authn.authSession;
    loginButtonArea = document.querySelector("[data-uix=solidLogin]");

    if(authSession && loginButtonArea) {
        loginButtonArea.style.display="none";
        authSession.onLogin(()=>{
          initLogin('login');
        });
        authSession.onLogout( ()=>{
          if(this) this.profileOwner=null;
          initLogin('logout');
        });
        authSession.onSessionRestore( ()=>{
          initLogin('refresh')
        });
    }    

}); 

function setAppContext(){
  if(window.inDataKitchen){
    window.SolidAppContext = {
        noAuth : window.origin,
         webId : window.origin + "/profile/card#me",
           app : window.origin,
    };
    window.$SolidTestEnvironment = {
        iconBase : "/common/icons/",
        originalIconBase : "/common/originalIcons/",
    };
  }
  window.SolidAppContext ||= {};
  window.SolidAppContext.scroll = "212"
}

export async function initLogin(loginType){
    setAppContext();
    const self=this;
    if(!loginButtonArea){return;}
    loginButtonArea.innerHTML="";
    loginButtonArea.appendChild(UI.login.loginStatusBox(document, null, {}));
    const signupButton = loginButtonArea.querySelectorAll('input')[1];
    if(signupButton) signupButton.style.display="none";
    let me = await UI.authn.checkUser();
    let button = loginButtonArea.querySelector('input');         
    let dataset = loginButtonArea.dataset;
    let inLabel = dataset.inlabel;
    let outLabel = dataset.outlabel;
    let transparent = dataset.transparent;
    let note = document.getElementById('notificationArea');
    if (me) {       
        loginButtonArea.style.display="inline-block";
        button.value = outLabel || "Log out!";           
        button.title= "--- logged in as " + me.value + "\n--- click to logout";
        button.style.color="green";
        if(self) self.profileOwner = me.value;
        if(note) note.style.display="none";
    }
    else {
        loginButtonArea.style.display="inline-block";
        button.value = inLabel || "Log in!";           
        button.title = "--- click to log in!";
        if(note && !await util.localWebid()) note.style.display="block";
        else if(note) note.style.display="none";        
    }
}      
