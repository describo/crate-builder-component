import isArray from "lodash-es/isArray.js";
import isNumber from "lodash-es/isNumber.js";
import isBoolean from "lodash-es/isBoolean.js";
import isString from "lodash-es/isString.js";
import isEmpty from "lodash-es/isEmpty.js";
import isUndefined from "lodash-es/isUndefined.js";
import difference from "lodash-es/difference.js";
import round from "lodash-es/round.js";
import uniq from "lodash-es/uniq.js";
import uniqBy from "lodash-es/uniqBy.js";
import isPlainObject from "lodash-es/isPlainObject.js";
import flattenDeep from "lodash-es/flattenDeep.js";
import intersection from "lodash-es/intersection.js";
import { validateId } from "./validate-identifier.js";
import { normalise, isURL } from "./lib.js";
import { toRaw } from "vue";
import { getContextDefinition } from "./contexts.js";

const structuredClone = function (data) {
    return window.structuredClone(toRaw(data));
};

/**
 * @class
 *
 * @name CrateManager
 * @param {crate} - an RO Crate to handle
 * @description A class to work with RO-Crates
 */
export class CrateManager {
    constructor({ crate, context = undefined }) {
        // the crate
        this.crate = undefined;

        // entity reverse associations
        this.reverse = {};

        // number of entities in the graph
        this.graphLength = undefined;

        // shortcuts to the root descriptor and dataset
        this.rootDescriptor = undefined;
        this.rootDataset = undefined;

        // the mapping of entity id to index in this.crate['@graph]
        this.entityIdIndex = {};

        // reference to a context that has been provided
        //  this takes precedence over anything else
        this.providedContext = undefined;

        // otherwise, Crate Manager will manage the context
        this.contextDefinitions = undefined;
        this.localContext = {};

        this.coreProperties = ["@id", "@type", "@reverse", "name"];
        this.errors = {
            hasError: false,
            init: {
                description: `Errors encountered on crate load. These need to be fixed manually.`,
                messages: [],
            },
            missingIdentifier: {
                description: `The entity does not have an identifier (@id).`,
                entity: [],
            },
            missingTypeDefinition: {
                description: `The entity does not have a defined type (@type).`,
                entity: [],
            },
            invalidIdentifier: {
                description: `The entity identifier (@id) is not valid. See https://github.com/describo/crate-builder-component/blob/master/README.identifiers.md for more information`,
                entity: [],
            },
        };
        this.warnings = {
            hasWarning: false,
            invalidIdentifier: {
                description: `The entity identifier (@id) has spaces in it that should be encoded. Describo will do this to pass the validate test but the data must be corrected manually.`,
                entity: [],
            },
        };
        const t0 = performance.now();

        // verify some basic structural elements exist
        if (!crate["@context"]) {
            this.__setError("init", `The crate file does not have a '@context'.`);
            return;
        }
        if (!crate["@graph"] || !isArray(crate["@graph"])) {
            this.__setError("init", `The crate file does not have '@graph' or it's not an array.`);
            return;
        }
        const graphLength = crate["@graph"].length;
        for (let i = 0; i < graphLength; i++) {
            const entity = crate["@graph"][i];

            // if the entity is the root descriptor, store it
            if (entity["@id"] === "ro-crate-metadata.json") {
                this.rootDescriptor = entity;
            }

            // if the entity is the root dataset, store it and ensure the @id is correct
            if (entity["@id"] === this.rootDescriptor?.about?.["@id"]) {
                this.rootDataset = entity;

                // set the root dataset @id to './'
                this.rootDataset["@id"] = "./";
                this.rootDescriptor.about["@id"] = "./";
            }

            // validate each entity
            if (!("@id" in entity)) {
                this.__setError("missingIdentifier", entity);
                continue;
            }
            if (!("@type" in entity)) {
                this.__setError("missingTypeDefinition", entity);
                continue;
            }

            //  does the id have spaces in it? log a warning
            if (entity["@id"].match(/\s+/)) {
                this.__setWarning("invalidIdentifier", entity);
            }

            // is it a valid identifier?
            let { isValid } = validateId({ id: entity["@id"], type: entity["@type"] });
            if (!isValid) {
                this.__setError("invalidIdentifier", entity);
                continue;
            }

            // create the id to index reference
            crate["@graph"][i] = normalise(entity, i);
            this.entityIdIndex[entity["@id"]] = i;
            this.reverse[entity["@id"]] = {};
        }

        // if we get to here and haven't located a root descriptor; bail - this
        //  crate is borked
        if (!this.rootDescriptor) {
            this.__setError(
                "init",
                `This crate is invalid. A root descriptor can not been identified.`
            );
            return;
        }

        // if we don't have a root dataset, then we need to make another pass to find it
        //
        //  this will happen if the root dataset comes before the root descriptor in the
        //  graph
        if (!this.rootDataset) {
            for (let i = 0; i < graphLength; i++) {
                const entity = crate["@graph"][i];

                // if the entity is the root dataset, store it and ensure the @id is correct
                if (
                    [
                        this.rootDescriptor.about["@id"],
                        this.rootDescriptor.about?.[0]?.["@id"],
                    ].includes(entity["@id"])
                ) {
                    this.rootDataset = entity;

                    // set the root dataset @id to './'
                    this.rootDataset["@id"] = "./";
                    this.rootDescriptor.about["@id"] = "./";
                    break;
                }
            }
        }

        // if we still haven't identified a root dataset then the crate is badly broken
        if (!this.rootDataset) {
            this.__setError("init", `This crate is invalid. A root dataset can not be identified.`);
            return;
        }

        // one final iteration over the crate to record the reverse links
        //  and make sure every property is an array
        for (let i = 0; i < graphLength; i++) {
            let entity = crate["@graph"][i];

            for (let property of Object.keys(entity)) {
                // if an entity does not have a name, set the @id as the name
                if (!entity.name) entity.name = entity["@id"];
                if (this.coreProperties.includes(property)) continue;

                entity[property] = [].concat(entity[property]);

                // now find the linked entities and populate the reverse links array
                entity[property].forEach((instance) => {
                    if (instance?.["@id"] && this.reverse[instance["@id"]]) {
                        if (!this.reverse[instance["@id"]][property]) {
                            this.reverse[instance["@id"]][property] = [];
                        }
                        this.reverse[instance["@id"]][property].push({ "@id": entity["@id"] });
                    }
                });
            }
        }

        if (this.errors.hasError) {
            return;
        }

        // looks good - let's save some things
        this.crate = crate;
        this.graphLength = graphLength;

        // assemble all the definitions for use managing the local context
        this.contextDefinitions = this.__collectAllDefinitions(
            this.__normaliseContext(crate["@context"])
        );
        if (context) {
            // if we're given a context, store it for use later
            this.providedContext = structuredClone(this.__normaliseContext(context));
        }

        const t1 = performance.now();
        console.debug(`Crate load: ${round(t1 - t0, 1)}ms`);
    }

    /** Get the context
     * @returns the crate context
     */
    getContext() {
        if (this.providedContext) {
            return structuredClone(this.providedContext);
        } else {
            let context = this.crate["@context"];
            context = this.__normaliseContext(context);
            if (!isEmpty(this.localContext)) {
                context = [...context, this.localContext];
                context = this.__normaliseContext(context);
            }
            return structuredClone(context);
        }
    }

    /**
     * Set the context
     *
     * @description This is equivalent to a profile author setting a context. It gets
     *   used as is and data updates going forward do not get dealth with.
     * @param {*} context
     */
    setContext(context) {
        this.providedContext = this.__normaliseContext(context);
    }

    /**
     * Get the root dataset
     *
     * @returns the root dataset entity
     * @example

const cm = new CrateManager({ crate })
let rd = cm.getRootDataset()

     */
    getRootDataset() {
        let rootDataset = structuredClone(this.rootDataset);
        rootDataset["@reverse"] = structuredClone(this.reverse[rootDataset["@id"]]);
        return rootDataset;
    }

    /**
     * Get an entity
     *
     * @param {Object} options
     * @param {string} - the id of the entity to get
     * @param {boolean} - if true, only the `@id, @type and name` prop's will be returned. That is,
     *                           you get a stub entry not the complete entity data.
     * @returns the entity
     *
     * @example

const cm = new CrateManager({ crate })

// get the full entity
let rd = cm.getEntity({ id: './' })

// return a stub entry
rd = cm.getEntity({ id: './', stub: true })

     */
    getEntity({ id, stub = false, link = true }) {
        if (!id) throw new Error(`An id must be provided`);
        let indexRef = this.entityIdIndex[id];
        let entity = structuredClone(this.crate["@graph"][indexRef]);

        // id's pointing outside the crate won't resolve so we
        //   'materialise' them here
        if (!entity) return this.__materialiseEntity({ id });

        entity["@reverse"] = structuredClone(this.reverse[entity["@id"]]) ?? {};
        if (stub) {
            return { "@id": entity["@id"], "@type": entity["@type"], name: entity.name };
        }
        if (link) {
            for (let property of Object.keys(entity)) {
                if (this.coreProperties.includes(property)) continue;
                entity[property] = entity[property].map((value) => {
                    if (value?.["@id"]) {
                        return this.getEntity({ id: value["@id"], stub: true });
                    }
                    return value;
                });
            }
        }
        return entity;
    }

    /**
     *@generator
     *
     * @param {Object} params
     * @param {Number} params.limit - how many entities to return
     * @param {string} params.query - a string to match against @id, @type and name
     * @param {string} params.type -  a string to match against @type
     * @yields {entity}
     * @example

const cm = new CrateManager({crate})
let entities = cm.getEntities()

for (let entity of entities) {
    ...
}

To get an array just spread the return
let entities = [ ...cm.getEntities() ]

// query @id, @type and name
entities = cm.getEntities({ query: 'person' })

// query @id, @type and name for entites of type Person
entities = cm.getEntities({ query: 'person', type: 'Person' })

// query @id, @type and name for entites of type Person - limit 10 matches
entities = cm.getEntities({ query: 'person', type: 'Person', limit: 10 })

     */
    *getEntities(params = { limit: undefined, query: undefined, type: undefined }) {
        let { limit, query, type } = params;

        if (!isString(query) && !isUndefined(query)) {
            throw new Error(`query must be a string`);
        }
        if (!isString(type) && !isUndefined(type)) {
            throw new Error(`type must be a string`);
        }
        if (query) {
            query = query.toLowerCase();
        }
        if (type === "ANY") type = undefined;

        let count = 0;
        for (let i = 0; i < this.graphLength; i++) {
            let entity = this.crate["@graph"][i];
            if (!entity) continue;
            if (query || type) {
                let eid = entity["@id"].toLowerCase();
                let etype = isArray(entity["@type"])
                    ? entity["@type"].join(", ").toLowerCase()
                    : entity["@type"].toLowerCase();
                let name = entity.name.toLowerCase();
                if (type && !query) {
                    type = type.toLowerCase();
                    if (etype.match(type)) {
                        yield structuredClone(entity);
                        count += 1;
                    }
                } else if (query && !type) {
                    if (eid.match(query) || name.match(query)) {
                        yield structuredClone(entity);
                        count += 1;
                    }
                } else if (query && type) {
                    type = type.toLowerCase();
                    if (etype.match(type) && (eid.match(query) || name.match(query))) {
                        yield structuredClone(entity);
                        count += 1;
                    }
                }
            } else {
                if (entity) {
                    yield structuredClone(entity);
                    count += 1;
                }
            }

            if (limit && count === limit) return;
        }
    }

    /**
     * resolveLinkedEntities
     *
     * Given an entity and a profile, if the entity matches a resolve configuration
     *   this method will populate the entities linked from the resolve properties
     *   defined in the profile.
     *
     * @param {Object} entity
     * @param {Object} profile
     *
     * @returns an array of associations
     * @example

// given an entity
let entity = {
    "@id": "#createAction1",
    "@type": ["CreateAction"],
    name: "A very long named create action to demonstrate what happens with display of long names",
    object: { "@id": "#person2" },
    participant: { "@id": "#participant1" },
    agent: { "@id": "#agent1" },
};

// and a profile with a resolve configuration
let profile = {
    ...
    resolve: [
        {
            types: [ 'Relationship', 'Related' ],
            properties: [ 'source', 'target' ]
        },
        {
            types: [ 'CreateAction', 'EditAction' ],
            properties: [ 'object', 'participant', 'agent' ]
        }
    ]
    ...
}

// get a list of the associated entities
console.log(cm.resolveLinkedEntityAssociations({ entity, profile }))


associations === [
  {
    property: 'object',
    '@id': '#person2',
    '@type': [ 'Thing' ],
    name: '#person2'
  },
  {
    property: 'participant',
    '@id': '#participant1',
    '@type': [ 'Thing' ],
    name: '#participant1'
  },
  {
    property: 'agent',
    '@id': '#agent1',
    '@type': [ 'Thing' ],
    name: '#agent1'
  }
]

     */
    resolveLinkedEntityAssociations({ entity, profile }) {
        if (!profile?.resolve) return [];
        let resolveConfiguration = profile.resolve;
        const resolvers = {};
        resolveConfiguration.forEach((c) => {
            c.types.forEach((type) => {
                resolvers[type] = c.properties;
            });
        });

        // does the entity @type overlap with a resolve configuration?
        const match = intersection(Object.keys(resolvers), entity["@type"]);
        if (!match.length) {
            // the current entity does match a resolve definition
            return [];
        }

        // what properties need to be resolved?
        const propertiesToResolve = flattenDeep(match.map((type) => resolvers[type]));

        let associations = [];
        for (let property of Object.keys(entity)) {
            // skip core prop's and any prop not specifically configured to resolve
            if (this.coreProperties.includes(property)) continue;
            if (!propertiesToResolve.includes(property)) continue;

            // resolve away
            let values = [].concat(entity[property]);
            values.forEach((value) => {
                if (!("@id" in value)) return value;
                associations.push({
                    property,
                    ...this.getEntity({ id: value["@id"], stub: true }),
                });
            });
        }
        return associations;
    }

    /**
     * Add an entity to the graph
     *
     * @param {Object} entity - an entity definition to add to the crate
     * @description
     *  The entity must have '@id' and '@type' defined.
     * @returns the entity
     * @example

const cm = new CrateManager({ crate })
let entity = {
    "@id": '#e1',
    "@type": "Person",
    name: 'person1',
};
let r = cm.addEntity(entity);

     */
    addEntity(entity) {
        if (!("@id" in entity)) {
            throw new Error(`You can't add an entity without an identifier: '@id'.`);
        }
        if (!("@type" in entity)) {
            throw new Error(`You can't add an entity without defining the type : '@type'.`);
        }

        const e = structuredClone(entity);
        entity = normalise(e, this.graphLength);
        entity = this.__confirmNoClash(entity);
        if (!entity) {
            entity = normalise(e, this.graphLength);
            return this.getEntity({ id: entity["@id"] });
        }

        // set all properties, other than core props, to array
        for (let property of Object.keys(entity)) {
            if (this.coreProperties.includes(property)) continue;

            // ensure it's an array
            entity[property] = [].concat(entity[property]);

            // then filter out empty properties with empty strings
            entity[property] = entity[property].filter((p) => p !== "");

            // remove empty properties
            if (!entity[property].length) delete entity[property];
        }

        // push it into the graph
        this.crate["@graph"].push(entity);

        // create the index and reverse lookup entries
        this.graphLength = this.crate["@graph"].length;
        this.entityIdIndex[entity["@id"]] = this.graphLength - 1;
        this.reverse[entity["@id"]] = {};

        return entity;
    }

    /**
     * Delete an entity
     *
     * @param {Object} options
     * @param {string} options.id - the id of the entity to delete from the crate
     *
     * @returns true if successful
     * @example

const cm = new CrateManager({ crate })
cm.deleteEntity({ id: '#e1' })

     */
    deleteEntity({ id }) {
        if (!id) throw new Error(`'deleteEntity' requires 'id' to be defined`);
        if ([this.rootDescriptor["@id"], this.rootDataset["@id"]].includes(id)) {
            throw new Error(`You can't delete the root dataset or the root descriptor.`);
        }

        const indexRef = this.entityIdIndex[id];
        const entity = this.crate["@graph"][indexRef];

        // get the entity, find what it links to and remove it from the reverse of those linkages
        for (let [property, instances] of Object.entries(entity)) {
            if (this.coreProperties.includes(property)) continue;
            for (let instance of instances) {
                if (instance?.["@id"]) {
                    this.reverse[instance["@id"]][property] = this.reverse[instance["@id"]][
                        property
                    ].filter((i) => i["@id"] !== id);

                    // remove the property if it's empty
                    if (!this.reverse[instance["@id"]][property].length) {
                        delete this.reverse[instance["@id"]][property];
                    }
                }
            }
        }

        // now do the same by walking the reverse links from this entity
        for (let [property, instances] of Object.entries(this.reverse[entity["@id"]])) {
            if (this.coreProperties.includes(property)) continue;
            for (let instance of instances) {
                if (instance?.["@id"]) {
                    let linkIndexRef = this.entityIdIndex[instance["@id"]];
                    let linkEntity = this.crate["@graph"][linkIndexRef];
                    linkEntity[property] = linkEntity[property].filter((i) => i["@id"] !== id);

                    // remove the property if it's empty
                    if (!linkEntity[property].length) {
                        delete linkEntity[property];
                    }
                }
            }
        }

        delete this.entityIdIndex[id];
        delete this.reverse[id];
        this.crate["@graph"][indexRef] = undefined;

        return true;
    }

    /**
     * Set a property on an entity
     *
     * @param {Object} options
     * @param {options.id} options.id - the id of the entity to add the property to
     * @param {options.property } options.property - the property to add
     * @param {options.value} options.value - the data to add to that property. Can be string or object with '@id'
     * @returns true if successful
     * @example

const cm = new CrateManager({ crate })
const authorId = chance.url();

//  setting an object reference
cm.setProperty({ id: "./", property: "author", value: { "@id": authorId } });

//  setting a text string
cm.setProperty({ id: "./", property: "author", value: "text" });

//  setting a number
cm.setProperty({ id: "./", property: "author", value: 3 });

     */
    setProperty({ id, property, propertyId, value }) {
        if (this.coreProperties.includes(property)) {
            throw new Error(`This method does not operate on ${this.coreProperties.join(", ")}`);
        }
        if (!id) throw new Error(`'setProperty' requires 'id' to be defined`);
        if (!property) throw new Error(`setProperty' requires 'property' to be defined`);
        if (!value) throw new Error(`'setProperty' requires 'value' to be defined`);

        const indexRef = this.entityIdIndex[id];
        const entity = this.crate["@graph"][indexRef];
        if (!(property in entity)) {
            entity[property] = [];
        }
        // validate the value's shape - v. important
        if (isString(value) || isNumber(value) || isBoolean(value)) {
            entity[property].push(value);
        } else if (isPlainObject(value) && "@id" in value) {
            // value makes sense
            // but make sure it's only the id and not the whole entity
            value = { "@id": value["@id"] };

            // and don't add duplicates
            let ids = entity[property].filter((v) => v?.["@id"]).map((v) => v["@id"]);
            if (!ids.includes(value["@id"])) entity[property].push(value);

            // and add a @reverse link
            this.__addReverse({ id, property, value });
        } else {
            // value doesn't make sense - bail
            throw new Error(`value must be a string, number, boolean or object with '@id'`);
        }
        this.__updateContext({ name: property, id: propertyId });
        return true;
    }

    /**
     * Update a property on an entity
     *
     * @param {Object} options
     * @param {string} options.id - the id of the entity to add the property to
     * @param {string} options.property - the property to add
     * @param {string} options.idx - the idx of the property array to update
     * @param {string} options.value - the data to add to that property, string or object with '@id'
     * @example

const cm = new CrateManager({ crate })
cm.updateProperty({ id: "./", property: "@id", value: "something else" });
cm.updateProperty({ id: "./", property: "author", idx: 1, value: "new" });

     */
    updateProperty({ id, property, idx, value }) {
        if (!id) throw new Error(`'setProperty' requires 'id' to be defined`);
        if (!property) throw new Error(`setProperty' requires 'property' to be defined`);
        if (!value) throw new Error(`'setProperty' requires 'value' to be defined`);

        if (this.coreProperties.includes(property)) {
            let indexRef = this.entityIdIndex[id];
            if (!indexRef) {
                let entity = this.__materialiseEntity({ id });
                entity = this.addEntity(entity);
                indexRef = this.entityIdIndex[entity["@id"]];
            }
            let entity = this.crate["@graph"][indexRef];
            if (property === "@id") {
                //  update @id
                this.__updateEntityId({ entity, newId: value });
            } else if (property === "@type") {
                //  update @type
                entity["@type"] = uniq(value);
            } else if (property === "name") {
                // update name
                // ensure we're setting a string value for the name property
                if (isArray(value)) value = value.join(", ");
                entity.name = value;
            }
        } else {
            if (idx !== 0 && !idx) throw new Error(`setProperty' requires 'idx' to be defined`);

            let indexRef = this.entityIdIndex[id];
            let entity = this.crate["@graph"][indexRef];
            entity[property][idx] = value;
        }
        return true;
    }

    /**
     * Delete a property from the entity
     *
     * @param {Object}
     * @param {string} options.id - the id of the entity to remove the property value from
     * @param {string} options.property - the property
     * @param {string} options.idx - the idx of the property array to delete
     * @example

const cm = new CrateManager({ crate })
cm.deleteProperty({ id: "./", property: "author", idx: 1 });

     */
    deleteProperty({ id, property, idx }) {
        if (!id) throw new Error(`'deleteProperty' requires 'id' to be defined`);
        if (!property) throw new Error(`deleteProperty' requires 'property' to be defined`);
        if (idx !== 0 && !idx) throw new Error(`deleteProperty' requires 'idx' to be defined`);

        const indexRef = this.entityIdIndex[id];
        const entity = this.crate["@graph"][indexRef];
        entity[property].splice(idx, 1);
        if (!entity[property].length) delete entity[property];
    }

    /**
     * Ingest and link a nested json object
     *
     * @param {Object} options
     * @param {string} options.id - the id of the entity to join the data into
     * @param {string} options.property - the property to join the data into
     * @param {json} options.json - the data object to join in
     * @example

const cm = new CrateManager({ crate })
let json = {
    ...,
}
cm.ingestAndLink({
    id: "./",
    property: "language",
    json,
});

     */
    ingestAndLink({ id = undefined, property = undefined, propertyId = undefined, json = {} }) {
        if (!id) throw new Error(`ingestAndLink: 'id' must be defined`);
        if (!property) throw new Error(`ingestAndLink: 'property' must be defined`);

        let flattened = this.flatten(json);
        flattened = flattened.map((entity) => {
            entity = normalise(entity, this.graphLength);
            return this.addEntity(entity);
        });

        this.linkEntity({ id, property, propertyId, value: { "@id": flattened[0]["@id"] } });
    }

    /**
     * Flatten a nested json object to an array
     *
     * @param {Object} json - a potentially nested data blob to flatten into array
     * @returns an array of objects
     * @example

const cm = new CrateManager({ crate })
let json = {
    ...,
}
let arrayOfObjects = cm.flatten(json)

     */
    flatten(json) {
        if (!isPlainObject(json)) {
            throw new Error(`flatten only takes an object.`);
        }
        json = structuredClone(toRaw(json));
        let flattened = [];
        flattened.push(json);
        for (let property of Object.keys(json)) {
            if (["@id", "@type", "name"].includes(property)) continue;
            if (!isArray(json[property])) json[property] = [json[property]];
            json[property].forEach((instance) => {
                if (isPlainObject(instance)) flattened.push(this.flatten(instance));
            });
            json[property] = json[property].map((instance) => {
                if (isPlainObject(instance)) return { "@id": instance["@id"] };
                return instance;
            });
        }
        return flattenDeep(flattened).map((e) => e);
    }

    /**
     * Link two entities
     *
     * @param {Object} options
     * @param {string} options.id - the id of the entity to add the association to
     * @param {string} options.property - the property to add the association to
     * @param {object} options.value - an object with '@id' defining the association to create
     * @example

const cm = new CrateManager({ crate })
cm.linkEntity({ id: './', property: 'author', value: { '@id': '#e1' }})

     **/
    linkEntity({ id = undefined, property = undefined, propertyId = undefined, value }) {
        if (!id) throw new Error(`'linkEntity' requires 'id' to be defined`);
        if (!property) throw new Error(`'linkEntity' requires 'property' to be defined`);
        if (!value) throw new Error(`'linkEntity' requires 'value' to be defined`);
        if (!isPlainObject(value) || !value["@id"]) {
            throw new Error(`value must be an object with '@id' defined`);
        }
        this.setProperty({ id, property, propertyId, value });
    }

    /**
     * Unlink two entities
     *
     * @param {Object} options
     * @param {string} options.id - the id of the entity to remove the association from
     * @param {string} options.property - the property containing the association
     * @param {object} options.value - an object with '@id' defining the association to remove
     * @example

const cm = new CrateManager({ crate })
const cm = new CrateManager({ crate })
cm.unlinkEntity({ id: './', property: 'author', value: { '@id': '#e1' }})

     **/
    unlinkEntity({ id = undefined, property, value }) {
        if (!id) throw new Error(`'unlinkEntity' requires 'id' to be defined`);
        if (!property) throw new Error(`'unlinkEntity' requires 'property' to be defined`);
        if (!value) throw new Error(`'unlinkEntity' requires 'value' to be defined`);
        if (!isPlainObject(value) || !value["@id"]) {
            throw new Error(`value must be an object with '@id' defined`);
        }

        let indexRef = this.entityIdIndex[id];
        let entity = this.crate["@graph"][indexRef];
        entity[property] = entity[property].filter((v) => {
            if (v?.["@id"] && v["@id"] === value["@id"]) {
                // do nothing - we don't want it
            } else {
                return v;
            }
        });
        if (!entity[property].length) delete entity[property];
        if (this.reverse[value["@id"]]) {
            this.reverse[value["@id"]][property] = this.reverse[value["@id"]][property].filter(
                (v) => {
                    v["@id"] !== value["@id"];
                }
            );
            if (!this.reverse[value["@id"]][property].length)
                delete this.reverse[value["@id"]][property];
        }
    }

    /**
     * Purge unlinked entities from the crate
     *
     * @description - clean up the graph and purge any unlinked entities including disconnected subtrees.
     * @example

const cm = new CrateManager({ crate })
cm.purgeUnlinkedEntities()

     */
    purgeUnlinkedEntities() {
        let linkedEntities = { "ro-crate-metadata.json": true };
        let indexRef = this.entityIdIndex["./"];
        if (indexRef !== undefined) {
            let entity = this.crate["@graph"][indexRef];
            walker = walker.bind(this);
            walker(entity);

            for (let i = 0; i < this.graphLength; i++) {
                let entity = this.crate["@graph"][i];
                if (entity && !linkedEntities[entity["@id"]]) {
                    let indexRef = this.entityIdIndex[entity["@id"]];
                    delete this.entityIdIndex[entity["@id"]];
                    delete this.reverse[entity["@id"]];
                    this.crate["@graph"][indexRef] = undefined;
                }
            }
        }
        function walker(entity) {
            linkedEntities[entity["@id"]] = true;
            for (let property of Object.keys(entity)) {
                if (this.coreProperties.includes(property)) continue;
                entity[property].forEach((instance) => {
                    if (instance?.["@id"] && !linkedEntities[instance["@id"]]) {
                        let indexRef = this.entityIdIndex[instance["@id"]];
                        if (indexRef !== undefined) {
                            let entity = this.crate["@graph"][indexRef];
                            walker(entity);
                        }
                    }
                });
            }
        }
    }

    /**
     * Export the RO-Crate
     * @returns the complete ro-crate
     * @example

const cm = new CrateManager({ crate })
let crate = cm.exportCrate()

     */
    exportCrate() {
        const t0 = performance.now();
        // const crate = structuredClone(this.crate);

        let entities = this.crate["@graph"]
            .filter((e) => e)
            .map((e) => {
                e = structuredClone(e);
                e["@reverse"] = structuredClone(this.reverse[e["@id"]]);
                for (let p of Object.keys(e)) {
                    if (p === "@reverse") {
                        for (let rp of Object.keys(e["@reverse"])) {
                            if (isArray(e[p][rp]) && e[p][rp].length === 1) e[p][rp] = e[p][rp][0];
                        }
                    } else {
                        if (isArray(e[p]) && e[p].length === 1) e[p] = e[p][0];
                    }
                }
                return e;
            });
        const crate = {
            "@context": this.getContext(),
            "@graph": entities,
        };
        const t1 = performance.now();
        console.debug(`Crate export: ${round(t1 - t0, 1)}ms`);
        // console.log(JSON.stringify(this.crate, null, 2));
        return crate;
    }

    /**
     *
     * @param {Object} options
     * @param {String} options.id - the id of the entity to export as a template
     * @param {String} options.resolveDepth - 0 or 1. If 1, linked entities will be joined in
     * @description
     *
     * 1. If resolveDepth = 0 then the entity is returned with all associations removed
     * 2.  If resolveDepth = 1 then the entity is returned with one level of associations populated but
     *    all of their associations will be removed.
     *
     * @returns entity
     * @example

const cm = new CrateManager({ crate })
let entity = cm.exportEntityTemplate({ id: '#person' })
let entity = cm.exportEntityTemplate({ id: '#person', resolveDepth: 1 })

     */
    exportEntityTemplate({ id, resolveDepth = 0 }) {
        if (![0, 1].includes(resolveDepth)) {
            throw new Error(`resolveDepth can only be 0 or 1`);
        }
        let indexRef = this.entityIdIndex[id];
        let entity = structuredClone(this.crate["@graph"][indexRef]);

        for (let property of Object.keys(entity)) {
            if (["@id", "@type", "name"].includes(property)) continue;

            entity[property] = entity[property]
                .map((value) => {
                    if (value?.["@id"]) {
                        if (resolveDepth === 0) return undefined;
                        let linkedIndexRef = this.entityIdIndex[value["@id"]];
                        let linkedEntity = structuredClone(this.crate["@graph"][linkedIndexRef]);
                        linkedEntity = this.__removeAssociations(linkedEntity);
                        return linkedEntity;
                    } else {
                        return value;
                    }
                })
                .map((v) => v);
            if (entity[property].length === 0) {
                delete entity[property];
            } else if (entity[property].length === 1) {
                entity[property] = entity[property][0];
            }
        }
        return entity;
    }

    /**
     * getErrors
     *
     * @returns { errors }
     *
     */
    getErrors() {
        return this.errors;
    }

    /**
     * getWarnings
     *
     * @returns { warnings }
     */
    getWarnings() {
        return this.warnings;
    }

    __updateContext({ name, id }) {
        if (id && !(id in this.contextDefinitions)) {
            // the property or class isn't defined in the context
            //   add it in the definitions for lookups later
            //   store it in the local context which gets joined
            //    in where required.
            this.contextDefinitions[id] = true;
            this.localContext[name] = id;
        }
    }

    /**
     * Normalise context
     *
     * @description Collapse all objects into a single object
     * @param {*} context
     * @returns context
     */
    __normaliseContext(context) {
        context = [].concat(context);
        let entries = {};
        for (let entry of context) {
            if (isPlainObject(entry)) entries = { ...entries, ...entry };
        }
        context = context.filter((e) => isString(e));
        if (!isEmpty(entries)) context = [...context, entries];
        return context;
    }

    __collectAllDefinitions(context) {
        let definitions = {};

        for (let entry of context) {
            if (isString(entry)) {
                // likely the ro-crate context - see if it is
                let def = getContextDefinition(entry);
                if (def) {
                    definitions = { ...definitions, ...def.definitions };
                } else {
                    definitions[entry] = true;
                }
            } else if (isPlainObject(entry)) {
                for (let e of Object.entries(entry)) {
                    definitions[e[1]] = true;
                }
            }
        }
        // console.log(definitions);
        return definitions;
    }

    __setError(error, entity) {
        let errorPath = error === "init" ? "messages" : "entity";
        this.errors[error][errorPath].push(entity);
        this.errors.hasError = true;
    }
    __setWarning(warning, entity) {
        this.warnings[warning].entity.push(entity);
        this.warnings.hasWarning = true;
    }
    __materialiseEntity({ id }) {
        return {
            "@id": id,
            "@type": isURL(id) ? ["URL"] : ["Thing"],
            name: id,
        };
    }
    __confirmNoClash(entity) {
        // if it looks like the root dataset - throw an error
        //  can't have multiple root datasets
        if (entity["@id"] === "./") {
            throw new Error(
                `You can't add an entity with id: './' as that will clash with the root dataset.`
            );
        }
        // if it looks like the root descriptor - throw an error
        //  can't have multiple root descriptors
        if (entity["@id"] === "ro-crate-metadata.json") {
            throw new Error(
                `You can't add an entity with id: 'ro-crate-metadata.json' as that will clash with the root descriptor.`
            );
        }

        let idx = this.entityIdIndex[entity["@id"]];

        // if there is no id clash, return the entity as is
        if (idx === undefined) return entity;

        // if the id is already used, check that the type is different
        //   if it is, change the id and return the entity for inclusion
        let entityLookup = this.crate["@graph"][idx];
        if (!difference(entityLookup?.["@type"], entity["@type"]).length) {
            return false;
        } else {
            const id = `e${this.graphLength + 1}`;
            entity["@id"] = `#${id}`;
            return entity;
        }
    }
    __updateEntityId({ entity, newId }) {
        const originalId = entity["@id"];
        entity = structuredClone(entity);
        entity["@id"] = newId;
        entity = normalise(entity, this.graphLength);
        entity = this.__confirmNoClash(entity);

        // get the entity using the original id and then walk the properties forward
        //  to find what it links to. For each of those, set the reverse link to the new id
        let indexRef = this.entityIdIndex[originalId];
        let oe = this.crate["@graph"][indexRef];
        for (let [property, instances] of Object.entries(oe)) {
            if (this.coreProperties.includes(property)) continue;
            for (let instance of instances) {
                if (instance?.["@id"]) {
                    this.reverse[instance["@id"]][property].push({ "@id": entity["@id"] });

                    this.reverse[instance["@id"]][property] = this.reverse[instance["@id"]][
                        property
                    ].filter((i) => i["@id"] !== originalId);
                    this.reverse[instance["@id"]][property] = uniqBy(
                        this.reverse[instance["@id"]][property],
                        "@id"
                    );
                }
            }
        }

        // now walk the reverse links of the entity to update the references to it
        if (this.reverse[originalId]) {
            for (let [property, links] of Object.entries(this.reverse[originalId])) {
                for (let link of links) {
                    let linkIndexRef = this.entityIdIndex[link["@id"]];
                    let linkedEntity = this.crate["@graph"][linkIndexRef];

                    linkedEntity[property].push({ "@id": entity["@id"] });
                    linkedEntity[property] = linkedEntity[property].filter(
                        (i) => i["@id"] !== originalId
                    );
                }
            }
        }

        // finally update the entity @id
        indexRef = this.entityIdIndex[originalId];
        this.crate["@graph"][indexRef]["@id"] = entity["@id"];

        // remove the original index ref
        delete this.entityIdIndex[originalId];

        // add the new one
        this.entityIdIndex[entity["@id"]] = indexRef;

        // copy the reverse associations to the new id
        this.reverse[entity["@id"]] = structuredClone(this.reverse[originalId]);

        // and remove the original reverse associations
        delete this.reverse[originalId];

        // console.log(JSON.stringify(this.crate["@graph"], null, 2));
        // console.log("");
        // console.log("");
        // console.log("");
        // console.log(JSON.stringify(this.reverse, null, 2));
        // console.log("");
        // console.log("");
        // console.log("");
        // console.log(JSON.stringify(this.entityIdIndex, null, 2));
    }
    __addReverse({ id, property, value }) {
        const linkIndexRef = this.entityIdIndex[value["@id"]];

        if (linkIndexRef) {
            if (!this.reverse[value["@id"]][property]) this.reverse[value["@id"]][property] = [];
            this.reverse[value["@id"]][property].push({ "@id": id });
        }
    }
    __removeAssociations(entity) {
        for (let property of Object.keys(entity)) {
            if (this.coreProperties.includes(property)) continue;
            entity[property] = entity[property].filter((value) => !value?.["@id"]);
            if (!entity[property].length) delete entity[property];
        }
        return entity;
    }
}