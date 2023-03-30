const authSession = UI.authn.authSession;
const loginButtonArea = document.querySelector("[data-uiv=solidLogin]");

document.addEventListener('DOMContentLoaded', function() {

    if (authSession && loginButtonArea) {
        loginButtonArea.style.display="none";
        authSession.onLogin(initLogin);
        authSession.onLogout(initLogin);
        authSession.onSessionRestore(initLogin);
    }    
    initLogin();

}); 

export async function initLogin(){
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
    if (me) {       
        loginButtonArea.style.display="inline-block";
        button.value = outLabel || "Log out!";           
        button.title= "--- logged in as " + me.value + "\n--- click to logout";
        button.style.color="green";
    }
    else {
        loginButtonArea.style.display="inline-block";
        button.value = inLabel || "Log in!";           
        button.title = "--- click to log in!";
    }
}      
