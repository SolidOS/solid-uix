export async function fetchAndParse(feedUri){

  // fetch feed URI & load it into a DOM structure
  //
  const proxy = (typeof this !="undefined") ?this.proxy :"https://solidcommunity.net/proxy?uri=";
  feedUri = proxy + encodeURI( feedUri );
  let feedDom;
  try {
    let response = await fetch( feedUri );
    let feedContent = await response.text();
    const domParser = new window.DOMParser();
    feedDom = domParser.parseFromString(feedContent, "text/xml")
  }
  catch(e) { alert(e) };

  // find items (RSS) or entries (Atom)
  //
  let items = feedDom.querySelectorAll("item") || null;
  items = items.length<1 ?feedDom.querySelectorAll("entry") :items;

  //
  // parse items
  //
  let parsedItems=[];
  items.forEach( el => {

    // find item link, account for specific kinds of quirks
    //
    let link = el.querySelector("link").innerHTML;
    // vox
    if(!link) link = el.querySelector('link').getAttribute('href');
    // reddit
    if(!link || link.match(/ /)){
      link = el.querySelector('content').innerHTML.replace(/.*\[link\]/ ,'').replace(/a href="/,'').replace(/"&gt;.*/,'').replace(/.*&lt;/,'');
    }
    // engadget
    if(!link.match(/^http/))link=link.replace(/.*\[CDATA\[/,'').replace(/\]\]\>$/,'');

    // always use https, not http
    link = link.replace(/^http:/,'https:');

    // get the title
    let label = el.querySelector("title").innerHTML;
    label = label.replace(/^\<\!\[CDATA\[/,'');
    label = label.replace(/\]\].*\>/,'').trim();

    parsedItems.push({label,link});
  });
  return parsedItems;

}  // END OF fetchAndParse()
