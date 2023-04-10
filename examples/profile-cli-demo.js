import {ProfileSession} from '../src/profile.js';
const profiles = new ProfileSession({nowarnings:true});
const webid = 'https://jeff-zucker.solidcommunity.net/profile/card#me';

async function test(){
  const me = await profiles.add(webid);
  console.log(
    me.get('name'),
    me.get('pronouns'),
    me.get('friends'),
  );
  process.exit();
}
test();
