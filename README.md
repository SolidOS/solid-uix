# Solid UIX 

-- data-rich Solid components with little or no coding

The Solid UIX framework supports low and no-code building of Solid apps and websites by embedding simple tags in HTML.  Sites and apps built with Solid UIX are easy to make language independent and support a symbiotic division of labor between those who manage data and those who present it to the public.

Please see this demo, a [complete reimagining of the SolidOS frontend](https://jeff-zucker.github.io/solid-uix/index.html) for an example app built entirely with Solid UIX.

## Basic Usage

A Solid UIX variable can be applied to any HTML tag like so:

```html
<h1 data-uix="podOwnerName"></h1>
```

That snippet, when viewed, will show the name of the owner of the pod being visited as an h1 heading.  The name will be retrieved from the pod owner's profile and could be in the foaf:name or vcard:fn fields, you don't need to care about that.

### Multiple data values in multi-valued HTML elements

For HTML elements that accept multiple values (e.g. a list or a select), multiple values will be shown.  For example, if the pod owner has multiple storages, this will show all of them in the HTML structures indicated :

```html
<ul data-uix="podOwnerStorages"></ul>
<select data-uix="podOwnerStorages"></select>
```
### Referencing sources

UIX variables can reference the owner of the pod being visited, the logged-in user, or any user defined in the HTML.  For example :

* The current logged-in user's name - `<b data-uix="userName"></b>`

* The name of the owner of the pod being visited - `<b data-uix="podOwnerName"></b>`

* The name of the owner of any pod
```
   <b     data-uix = "podOwnerName" 
       data-source = "http://ex.org/profile/card#me"
   ></b>
```

## Supported Variables

The following variables may be used with with either "user" or "podOwner" prepended.  For example "Name can be used as either podOwnerName or userName:

Single-value : name, pronouns, photo, inbox, webid

Multiple-value : roles, issuers, storages, instances, communities, friends

These variables only apply to logged-in users:

    editProfile, editPreferences

These variables do not require a user-specifier :

    solidLogo, solidLogin

For predicates not covered by one of the variables, you can use either full URIs or, for vocabularies known to [solid-namespace](https://github.com/solid/solid-namespace), curies. These all show the same thing:

```html
  <div data-source="http://example.com/profile/card#me">
    <h1 uix="podOwnerInbox"></h1>
    <h1 uix="ldp:inbox"></h1>
    <h1 uix="http://www.w3.org/ns/solid/terms#storage"></h1>
  </div>
```
Note the usage above - we can specify the source of the profile once and it applies to all uix elements that are its children.  Also note that since we have specified a source, "podOwner", in this context, means the owner of the pod specified in the source, not of the pod we are visiting.

## Queries

More docs coming soon, here's the TL;DR ...

This runs a store.each using the specified values

```html
<select id="myTopicSelector"
       data-uiq = "* a bk:Topic"
    data-source = "/public/s/solid-uix/news.ttl"
></select>
```

This takes the value of the previously shown select and uses it as a parameter in a query :

```html
<select id="myCollectionSelector"
             data-uiq = "* bk:hasTopic ?"
          data-source = "/public/s/solid-uix/news.ttl"
       data-paramFrom = "#myTopicSelector"
></select>
```

## Actions

More docs coming soon, here's the TL;DR ...

* buttons can automatically submit the value of the closest select
* selects can fire actions in other components

## Coming soon ...

Nested components, SPARQL queries, custom templates.

&copy; Jeff Zucker, 2023 all rights reserved; May be freely distributed under an MIT license.