# Profile Extractor

This small library provides a simple programatic interface to Solid profiles and can be run either on the command-line or in a browser.

## Basic Usage

Here's a working command-line script :

```javascript
import {ProfileSession} from 'profile-extractor';
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
```
That will show my name regardless of whether it is in a vcard:fn or foaf:name triple and will return the webID if neither is found.  The pronouns will be concatenated with the appropriate number of slashes. Friends will be returned as an array.

Currently supported aliases for profile searches are : 

* name
* webid
* pronouns
* photo
* inbox
* roles
* issuers
* storages
* instances
* communities
* friends.  

Multivalued fields like *friends* and *communities* are returned as arrays of IRIs except for *instances* which is an array of IRI/forClass pairs. This supports targeting instances in a specified class:

```javascript
  for(let instance of profile.get('instances')){
     if(!instance.forClass.match(/Tracker/))continue;
     console.log(instance.link);
  }       
```

With instances, communities, and friends, the **getWithNames()** method returns an array of pairs with each pair being the label or name of the thing and its URI.  Unlike the *get* method, *getWithNames* needs an await - it has to go open the associated files rather than depending on what is in the profile.

For predicates not covered by one of the aliases, the *get()* method accepts either full URIs or, for vocabularies known to [solid-namespace](https://github.com/solid/solid-namespace), curies. These all return the same thing:

```javascript
  profile.get('storages');
  profile.get('solid:storage');
  profile.get('http://www.w3.org/ns/solid/terms#storage');
```

The *get()* method will return the results from triples in the webID owner's profile document and publicTypeIndex and, if the script is running with the appropriate permission, also the preferencesFile and privateTypeIndex. These are all loaded with *load()*. If you additionally want to load documents in `rdfs:seeAlso` triples, use this form of call:

```
   const profile = await load(webid,{includeSeeAlsos=true});
```

You can also cycle through the array returned by `profile.get('rdfs:seeAlso')` and load each file manually if you prefer.

## Advanced Usage

You can use the *nget()* and *ngetAll() methods to return NamedNodes instead of strings.  The standard profile documents are also available as NamedNodes - when youou load a profile and its related documents with `const profile = await profiles.load(webid);`,  the returned profile object looks like this:

```json
  {
    webid,            // NamedNode of webID
    publicProfile,    // NamedNode of profile doc
    preferencesFile,  // NamedNode of preferences file
    privateTypeIndex, // NamedNode of private type index
    publicTypeIndex   // NamedNode of public type index
  }
```
Note, if the script is running as someone other than the webID owner, you can expect the preferencesFile and privateTypeIndex to be undefined.

## Using in a browser

Profile-Extractor can be used in a browser by first importing either [solid-ui]() or [mashlib]().  If you also import [solid-uix](README.md), you can call Profile-Extractor methods with simple HTML embeds.

&copy; Jeff Zucker, 2023; all rights reserved; may be freely distributed under an MIT license

