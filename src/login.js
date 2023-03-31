const authSession = UI.authn.authSession;
const loginButtonArea = document.querySelector("[data-uiv=solidLogin]");

document.addEventListener('DOMContentLoaded', function() {

    if(authSession && loginButtonArea) {
        loginButtonArea.style.display="none";
        authSession.onLogin(()=>{
          initLogin('login');
        });
        authSession.onLogout( ()=>{
          if(this) this.podOwner=null;
          initLogin('logout');
        });
        authSession.onSessionRestore( ()=>{
          initLogin('refresh')
        });
    }    

}); 

export async function initLogin(loginType){
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
        if(self) self.podOwner = me.value;
        if(note) note.style.display="none";
    }
    else {
        loginButtonArea.style.display="inline-block";
        button.value = inLabel || "Log in!";           
        button.title = "--- click to log in!";
        if(note) note.style.display="block";
    }
}      
