export async function accordion(element){
  for(let kid of element.childNodes){
    if(kid.tagName==="UL"){
        kid.style="list-style:none;margin-left:0;padding-left:0;";        
        kid.classList.add('hidden');
        continue;
    }
    kid.style="padding:1rem;margin:0;border-bottom:1px solid #909090; background:#dddddd; cursor:pointer;display:grid;grid-template-columns=auto auto;border-right:1px solid grey";
    let html = kid.innerHTML;
    kid.innerHTML = `<span>${html}</span><span style="display:inline-block;text-align:right;margin-top:-1.5rem">&#9660;</span>`;

    kid.addEventListener('click',async ()=>{
      const selectedDropdown = kid.nextSibling.nextSibling;
      let displays = element.querySelectorAll('UL');             
      let kidHiddenNow = selectedDropdown.classList.contains('hidden');
      for(let d of displays){
        d.classList.add('hidden')
      }
      if(kidHiddenNow) selectedDropdown.classList.remove('hidden');
      else selectedDropdown.classList.add('hidden');
      let toDefer = selectedDropdown.dataset.defer;
      let hasContent = selectedDropdown.innerHTML.length;
//      if(toDefer && !hasContent){
      if(toDefer){
//        selectedDropdown.dataset.uix=toDefer;
        selectedDropdown.dataset.from=toDefer;
        let loading = document.createElement('P');
        loading.innerHTML = "loading ...";
        loading.style["margin-right"]="0.5rem";
        selectedDropdown.appendChild(loading);
        await this.process(selectedDropdown);
        loading.style.display="none";
      }
    });
  }
}
