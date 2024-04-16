// Context setup - load all of the defined contexts
const modules = import.meta.glob("./contexts/*.jsonld", {
    eager: true,
    query: "?raw",
    import: "default",
});

// The RO Crate context can be referenced in different ways in a crate
//  so this mapping allows us to find the definitions loaded above
//  based on any of them
const contextMappings = {
    "https://www.researchobject.org/ro-crate/1.1/context.jsonld":
        "https://w3id.org/ro/crate/1.1/context",
    "https://w3id.org/ro/crate/1.1/context": "https://w3id.org/ro/crate/1.1/context",

    "https://www.researchobject.org/ro-crate/1.2-DRAFT/context.jsonld":
        "https://w3id.org/ro/crate/1.2-DRAFT/context",
    "https://w3id.org/ro/crate/1.2-DRAFT/context": "https://w3id.org/ro/crate/1.2-DRAFT/context",
};

// Then create a data structure for use by CrateManager
const contexts = {};
Object.keys(modules).forEach((key) => {
    let context = JSON.parse(modules[key]);

    // create a definitions lookup
    contexts[context["@id"]] = { href: context["@id"] };

    let definitions = {};
    Object.keys(context["@context"]).forEach((key) => {
        definitions[context["@context"][key]] = true;
    });
    contexts[context["@id"]].definitions = definitions;
});

export function getContextDefinition(id) {
    id = contextMappings[id];
    return contexts[id];
}
