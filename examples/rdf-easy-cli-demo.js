import {rdfEasy} from '../src/rdf-easy.js';
let document = 'http://localhost:3101/profile/card';
(async ()=>{
  let myDoc = await rdfEasy.load(document);
  console.log(
    myDoc.any(':me foaf:name *'),
    myDoc.each(':me foaf:knows *'),
  )
})();
/*
Local Kitchen User [
  'https://angelo.veltens.org/profile/card#me',
  'https://bourgeoa.solidcommunity.net/profile/card#me',
  'https://ewingson.solidcommunity.net/profile/card#me'
]
*/
