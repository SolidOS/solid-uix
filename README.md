# Solid UIX 

-- data-rich Solid components with little or no coding

The Solid UIX framework supports low and no-code building of Solid apps and websites by embedding simple tags in HTML.  Sites and apps built with Solid UIX are easy to make language independent and support a symbiotic division of labor between those who manage data and those who present it to the public.

Please see this demo, a [complete reimagining of the SolidOS frontend](https://jeff-zucker.github.io/solid-uix/index.html) for an example app built entirely with Solid UIX.

## Basic Usage

A Solid UIX variable can be applied to any HTML tag like so:

```html
<h1 data-uiv="podOwnerName"></h1>
```

That snippet, when viewed, will show the name of the owner of the pod being visited as an h1 heading.  The name will be retrieved from the pod owner's profile and could be in the foaf:name or vcard:fn fields, you don't need to care about that.

### Multiple data values in multi-valued HTML elements

For HTML elements that accept multiple values (e.g. a list or a select), multiple values will be shown.  For example, if the pod owner has multiple storages, this will show all of them in the HTML structures indicated :

```html
<ul data-uiv="podOwnerStorages"></ul>
<select data-uiv="podOwnerStorages"></select>
```

### Multiple values in single-value elements

If a variable returns multiple values and the varible is in a single-value context (e.g. a heading rather than a list), the default is to display the first value.  However, if you add the *data-format* attribute, the list of items will be shown as a comma-separated string :

```html
<b data-uiv="podOwnerStorages" data-format="string"></b>
```

### Referencing sources

UIX variables can reference the owner of the pod being visited, the logged-in user, or any user defined in the HTML.  For example :

* The current logged-in user's name - `<b data-uiv="userName"></b>`

* The name of the owner of the pod being visited - `<b data-uiv="podOwnerName"></b>`

* The name of the owner of any pod
```
   <b     data-uiv = "podOwnerName" 
       data-source = "http://ex.org/profile/card#me"
   ></b>
```

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


&copy; Jeff Zucker, 2023 all rights reserved; May be freely distributed under an MIT license.