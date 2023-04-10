import {rdfEasy} from '../src/rdf-easy.js';

const playground = rdfEasy.inMemoryStorage();
playground.add([
  `:A1 :name  Alice`,
  `:A1 :age   19`,
  `:B2 :name  Bob`,
  `:B2 :age   22`,
  `:me :knows :A1`,
  `:me :knows :B2`,
]); 
for(let friend of playground.each(':me :knows *')){
  console.log( 
    playground.any(`${friend} :name *`),  
    playground.any(`${friend} :age *`), 
  );
}
playground.add(`:me dct:title The Grand Poobah`);
console.log( playground.any(':me dct:title *') );

/* Expected Output

Alice 19
Bob 22
The Grand Poobah

*/
