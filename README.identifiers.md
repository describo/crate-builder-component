# Identifiers in your crate

- [Identifiers in your crate](#identifiers-in-your-crate)
  - [What is valid](#what-is-valid)
  - [What happens when crates are loaded into the component](#what-happens-when-crates-are-loaded-into-the-component)

According to the [JSON-LD spec, IRI's](https://www.w3.org/TR/json-ld11/#iris) should be used to
identify nodes. That said, the spec defines some other types of identifiers that are valid in
JSON-LD but are not valid IRI's.

So, when a crate is loaded into the component it will first check that all identifiers are actually
valid. If invalid identifiers are found, the crate will not be loaded and an `error` event will be
emitted.

## What is valid

Here's the [function in crate-manager.js, line 560](./src/crate-builder/crate-manager.js) with an
explanation following.

```
export function validateId(id) {
    // @id is relative
    if (id.match(/^\/.*/)) return true;

    // @id starting with . is valid
    if (id.match(/^\..*/)) return true;

    // @id starting with # is valid
    if (id.match(/^\#.*/)) return true;

    // @id with blank node is valid
    if (id.match(/^\_:.*/)) return true;

    // arcp URI's are valid
    if (id.match(/arcp:\/\/name,.*/)) return true;
    if (id.match(/arcp:\/\/uuid,.*/)) return true;
    if (id.match(/arcp:\/\/ni,sha-256;,.*/)) return true;

    // otherewise check that the id is a valid IRI
    return validateIri(id, IriValidationStrategy.Strict);
}
```

-   relative @id's:
    -   `/something/a/b/c`
    -   `//...`
    -   `../`
    -   `./`
-   @id's starting with `#` as these signify the reference is internal to the crate
-   @id's starting with `_:` as these are blank nodes
-   arcp @id`s are considered valid: see https://arxiv.org/pdf/1809.06935.pdf
-   anything that validates against the
    [IRI spec - RFC 3987](https://www.rfc-editor.org/rfc/rfc3987)

## What happens when crates are loaded into the component

Every node is checked for a valid id and if they all are, then the crate is loaded.

As the component is ingesting each of the entities, it checks that it has an @type property and
tries to set it accordingly. To do this it uses the @id of the entity and if it's a URL, then @type
becomes `URL` otherwise @type is set to `Thing`.

As it's loading the properties of an entity, it checks to see if there is a entity with that ID in
the crate. In most cases, a property will reference some entity in the crate but there are
exceptions. It is perfectly ok to have an @id point to some URL outside of the crate and in that
case, there won't be a matching entity. For example:

```
{
    @id: '...',
    @type: 'Thing',
    @author: { @id: "http://the-authors-website.com/name.html"}
}
```

The above is perfectly valid but for Describo to work, it needs to have that as a reference in the
crate. So, when processing that property Describo will create an entity internally for it:

```
{
    @id: "http://the-authors-website.com/name.html",
    @type: 'URL',
    name: "http://the-authors-website.com/name.html"
}
```

Notice that the type is URL. That's because the ID is checked to see if it's a URL or not. If it's
not, then it would be set to Thing as there is no way of knowing what it is.

> This next bit is super important to understand. If you have a reference to an entity in your crate
> that does not resolve to a URL or something inside the crate, Describo will create Thing entities
> and that's probably not what you want. The answer is that you need to ensure that all of your
> references either resolved to something in the crate (with valid identifiers as Describo doesn't
> do any data fixing) or be a valid URL so that the additional entries it adds make sense.
