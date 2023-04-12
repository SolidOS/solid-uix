import {ProfileSession} from '../src/profile-extractor.js';
const profiles = new ProfileSession({nowarnings:true});
const webid = 'https://jeff-zucker.solidcommunity.net/profile/card#me';

(async ()=>{
  const me = await profiles.load(webid);
  console.log(
    me.get('name'),
    me.get('pronouns'),
    me.get('friends'),
  );
})();
