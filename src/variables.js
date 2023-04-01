import * as util from './utils.js';

export const interpolateVariable = {

owner: (variableName,callingElement,actors)=>{
  variableName = variableName.replace(/^podowner/,'');
  let podOwner = actors.owner;
  if(!podOwner){
    return console.log(`Can't find pod owner or show variable '${variableName}'`);
  }
  return podOwner.get(variableName,callingElement);
},

user: (variableName,callingElement,actors)=>{
  variableName = variableName.replace(/^user/,'');
  let loggedInUser = actors.user;
  if(!loggedInUser){
    return console.log(`No logged in user , can't show user variable'${variableName}'`);
  }
  else {
    return loggedInUser.get(variableName,callingElement);
  }
},

solid: (variableName,callingElement)=>{
  variableName = variableName.replace(/^solid/,'');
  const solidVar = {
    logo: ()=>{
      return "https://solidproject.org/assets/img/solid-emblem.svg";
    },
    login: ()=>{
      return "";
    },
    osbrowser: ()=>{
      return `
        <header id="PageHeader"></header>
        <div id="right-column-tabulator">
          <div class="TabulatorOutline" role="main" id="suicTabulator">
            <table id="outline"></table>
            <div id="GlobalDashboard"></div>
          </div>
        </div>
        <footer id="PageFooter"></footer>
      `;
    },
  }
  if(!solidVar[variableName]) alert(variableName);
  return solidVar[variableName]() || "";
}

}
