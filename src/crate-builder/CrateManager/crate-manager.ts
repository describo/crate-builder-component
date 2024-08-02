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
import compact from "lodash-es/compact.js";
import isEqual from "lodash-es/isEqual.js";
import { validateId } from "./validate-identifier.js";
import { normalise, isURL } from "./lib.js";
import { toRaw } from "vue";
import { getContextDefinition } from "./contexts";
import type {
    UnverifiedContext,
    NormalisedContext,
    UnverifiedCrate,
    NormalisedCrate,
    ProfileManagerType,
    UnverifiedEntityDefinition,
    NormalisedEntityDefinition,
    EntityReference,
    PrimitiveType,
    NormalisedProfile,
} from "../../types.d";

interface errorsInterface {
    hasError: Boolean;
    init: { description: string; messages: string[] };
    missingIdentifier: { description: string; entity: UnverifiedEntityDefinition[] };
    missingTypeDefinition: { description: string; entity: UnverifiedEntityDefinition[] };
    invalidIdentifier: { description: string; entity: UnverifiedEntityDefinition[] };
}

interface warningsInterface {
    hasWarning: Boolean;
    init: { description: string; messages: string[] };
    invalidIdentifier: { description: string; entity: UnverifiedEntityDefinition[] };
}

const entityDateCreatedProperty = "hasCreationDate";
const entityDateUpdatedProperty = "hasModificationDate";

const structuredClone = function (data: any) {
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
    crate: {
        "@context": NormalisedContext;
        "@graph": Array<NormalisedEntityDefinition | undefined>;
    };
    pm: ProfileManagerType;
    reverse: {
        [key: string]: any;
    };
    graphLength: number;
    rootDescriptor?: number;
    rootDataset?: number;
    entityIdIndex: {
        [key: string]: number;
    };
    providedContext: UnverifiedContext;
    contextDefinitions: { [key: string]: boolean };
    localContext: { [key: string]: string };
    entityTypes: { [key: string]: number };
    entityTimestamps: Boolean;
    blankNodes: string[];
    coreProperties: string[];
    errors: errorsInterface;
    warnings: warningsInterface;

    constructor({
        crate,
        pm,
        context = undefined,
        entityTimestamps = false,
    }: {
        crate: UnverifiedCrate;
        pm: ProfileManagerType;
        context: UnverifiedContext;
        entityTimestamps: Boolean;
    }) {
        // the crate
        this.crate = {
            "@context": [{}],
            "@graph": [],
        };

        // the profile manager - if you've set a profile
        this.pm = pm;

        // entity reverse associations
        this.reverse = {};

        // shortcuts to the root descriptor and dataset
        this.rootDescriptor = undefined;
        this.rootDataset = undefined;

        // the mapping of entity id to index in this.crate['@graph]
        this.entityIdIndex = {};

        // reference to a context that has been provided
        //  this takes precedence over anything else
        this.providedContext = undefined;

        // otherwise, Crate Manager will manage the context
        this.contextDefinitions = {};
        this.localContext = {};

        // entity types in the crate - for browse entities; filter by type
        this.entityTypes = {};

        // should entity created and updated timestamps be automatically managed / added
        this.entityTimestamps = entityTimestamps;

        // keep track of blank nodes for when we mint new ones
        // this.blankNodes = [ '_:Relationship1', '_:Relationship2', '_:CreateAction1', '_:CreateAction2', ... ]
        this.blankNodes = [];

        // entity core properties
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
            init: {
                description: `Issues encountered on crate load that should be fixed but aren't breaking`,
                messages: [],
            },
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

        // number of entities in the graph
        this.graphLength = crate["@graph"].length;

        // iterate over the graph find the root descriptor first
        for (let i = 0; i < this.graphLength; i++) {
            if (crate["@graph"][i]["@id"] === "ro-crate-metadata.json") {
                this.rootDescriptor = i;

                // while we're here
                //  check that about exists and is an object not an array
                if ("about" in crate["@graph"][i]) {
                    if (Array.isArray(crate["@graph"][i].about)) {
                        crate["@graph"][i].about = (crate["@graph"][i].about as any[])[0];
                    }
                } else {
                    this.__setError(
                        "init",
                        `This crate is invalid. The root descriptor does not have an about property.`
                    );
                }

                // check that conformsTo exists and is an object not an array
                if (!("conformsTo" in crate["@graph"][i])) {
                    this.__setWarning(
                        "init",
                        `This root descriptor does not specify 'conformsTo'. It will be set to RO Crate v1.1`
                    );
                    crate["@graph"][i].confirmsTo = { "@id": "https://w3id.org/ro/crate/1.1" };
                }

                break;
            }
        }
        // if we haven't located a root descriptor; bail - this crate is borked
        if (this.rootDescriptor === undefined) {
            this.__setError(
                "init",
                `This crate is invalid. A root descriptor can not been identified.`
            );
            return;
        }

        // now locate the root dataset and ensure the id is sensible
        const rootDescriptor = crate["@graph"][this.rootDescriptor];
        for (let i = 0; i < this.graphLength; i++) {
            if (
                isEntityReference(rootDescriptor.about) &&
                crate["@graph"][i]["@id"] === rootDescriptor.about["@id"]
            ) {
                this.rootDataset = i;

                // set the root dataset @id to './'
                crate["@graph"][i]["@id"] = "./";
                rootDescriptor.about["@id"] = "./";
                break;
            }
        }

        if (this.rootDataset === undefined) {
            this.__setError("init", `This crate is invalid. A root dataset can not be identified.`);
            return;
        }

        // as we process the graph, we do our best to normalise the entities
        //  this includes ensuring the id is valid and sensible
        //  if it's not, it might get rewritten
        // if that happens, we need to ensure any links in the graph are also
        //  rewritten to the new identifier
        const idMap: { [key: string]: string } = {};

        // process the the graph
        for (let i = 0; i < this.graphLength; i++) {
            // if the entity is empty - ignore it
            if (isPlainObject(crate["@graph"][i]) && isEmpty(crate["@graph"][i])) continue;

            try {
                const normalisedEntity: NormalisedEntityDefinition = normalise(
                    crate["@graph"][i],
                    i
                );
                // store the old to new mappings
                idMap[(crate["@graph"][i] as EntityReference)["@id"]] = normalisedEntity["@id"];

                // is it a blank node? Store it if it is
                if (normalisedEntity["@id"].match(/^_:/)) {
                    this.blankNodes.push(normalisedEntity["@id"]);
                }
                // copy the entity into the internal structure
                this.crate["@graph"].push(structuredClone(normalisedEntity));

                // create the id to index reference
                this.entityIdIndex[normalisedEntity["@id"]] = this.crate["@graph"].length - 1;
                this.reverse[normalisedEntity["@id"]] = {};

                // store the entity type for lookups by type
                this.__storeEntityType(normalisedEntity);
            } catch (error) {
                this.__setError(
                    "init",
                    `Ignoring bad entity ${JSON.stringify({ "@id": crate["@graph"][i]["@id"], "@type": crate["@graph"][i]["@type"] })}`
                );
            }
        }
        // console.log(this.crate["@graph"]);
        // console.log(this.entityIdIndex);
        // console.log(this.reverse);
        // console.log(this.entityTypes);

        // one final iteration over the crate to record the reverse links
        for (let i = 0; i < this.graphLength; i++) {
            const normalisedEntity = this.crate["@graph"][i] as NormalisedEntityDefinition;
            if (!normalisedEntity) continue;

            for (let property of Object.keys(normalisedEntity)) {
                if (this.coreProperties.includes(property)) continue;

                (normalisedEntity[property] as any[]).forEach((entry) => {
                    // remap any id's that were changed
                    if (entry?.["@id"])
                        entry["@id"] = idMap[entry["@id"]] ? idMap[entry["@id"]] : entry["@id"];

                    // set up reverse links
                    if (entry?.["@id"] && this.reverse[entry["@id"]]) {
                        if (!this.reverse[entry["@id"]][property]) {
                            this.reverse[entry["@id"]][property] = [];
                        }
                        let links = this.reverse[entry["@id"]][property].map(
                            (l: { "@id": string }) => l["@id"]
                        );
                        if (!links.includes(normalisedEntity["@id"])) {
                            this.reverse[entry["@id"]][property].push({
                                "@id": normalisedEntity["@id"],
                            });
                        }
                    }
                });
            }
        }

        if (this.errors.hasError) {
            return;
        }

        // assemble all the definitions for use managing the local context
        this.crate["@context"] = this.__normaliseContext(crate["@context"]);
        this.contextDefinitions = this.__collectAllDefinitions(this.crate["@context"]);
        if (context) {
            // if we're given a context, store it for use later
            this.providedContext = structuredClone(this.__normaliseContext(context));
        }

        const t1 = performance.now();
        console.debug(`Crate ingest and prep: ${round(t1 - t0, 1)}ms`);
    }

    /** Get the context
     * @returns the crate context
     */
    getContext(): NormalisedContext {
        if (this.providedContext) {
            return structuredClone(this.providedContext);
        } else {
            let context = this.crate["@context"] as UnverifiedContext;
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
    setContext(context: NormalisedContext) {
        this.providedContext = this.__normaliseContext(context);
    }

    /**
     * Set a profile
     * @description  CrateManager can set reverse associations if defined in a profile.
     *
     * */
    setProfileManager(pm: ProfileManagerType) {
        this.pm = pm;
    }

    /**
     * Get the root dataset
     *
     * @returns the root dataset entity
     * @example

const cm = new CrateManager({ crate })
let rd = cm.getRootDataset()

     */
    getRootDataset(): NormalisedEntityDefinition {
        let rootDataset: NormalisedEntityDefinition = structuredClone(
            this.crate["@graph"][this.rootDataset as number] as NormalisedEntityDefinition
        );
        rootDataset["@reverse"] = structuredClone(this.reverse[rootDataset["@id"]]);
        return rootDataset;
    }

    /**
     * Get an entity
     *
     * @param {Object} options
     * @param {string} options.id - the id of the entity to get
     * @param {boolean} options.stub - if true, only the `@id, @type and name` prop's will be returned. That is,
     *                   you get a stub entry not the complete entity data.
     * @param {boolean} options.link - if true, all the associated entities are filled out as stubs
     * @param {boolean} options.materialise - if true, the entity will be created if it doesn't exist (consider
     *                  when URL's point outside the crate, in this case, they will be created as entities inside it)
     * @returns the entity
     *
     * @example

const cm = new CrateManager({ crate })

// get the full entity
let rd = cm.getEntity({ id: './' })

// return a stub entry
rd = cm.getEntity({ id: './', stub: true })

     */
    getEntity({
        id,
        stub = false,
        link = true,
        materialise = true,
    }: {
        id: string;
        stub?: boolean;
        link?: boolean;
        materialise?: boolean;
    }): NormalisedEntityDefinition | undefined {
        if (!id) throw new Error(`An id must be provided`);
        let indexRef = this.entityIdIndex[id];
        let entity = structuredClone(this.crate["@graph"][indexRef]);

        // encode the id
        id = encodeURI(id);

        // id's pointing outside the crate won't resolve so we
        //   'materialise' them here
        if (!entity && materialise) return this.__materialiseEntity({ id });
        if (!entity && !materialise) return undefined;

        entity["@reverse"] = structuredClone(this.reverse[entity["@id"]]) ?? {};
        if (stub) {
            return { "@id": entity["@id"], "@type": entity["@type"], name: entity.name };
        }
        if (link) {
            for (let property of Object.keys(entity)) {
                if (this.coreProperties.includes(property)) continue;
                entity[property] = entity[property].map((value: EntityReference) => {
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
     *  Get Entity Types
     *
     * @returns an array of entity types, sorted, found in the crate
     */
    getEntityTypes(): string[] {
        return Object.keys(this.entityTypes).sort();
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
    *getEntities(
        params: { limit?: number; query?: string; type?: string } = {
            limit: undefined,
            query: undefined,
            type: undefined,
        }
    ): Generator<NormalisedEntityDefinition> {
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
                    ? (entity["@type"].join(", ") as string).toLowerCase()
                    : (entity["@type"] as string).toLowerCase();
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
     *
     * locateEntity
     *
     * @description Given a set of id's, find the entity or entities that link to all of them.
     *  This is really for finding grouping type entities like Relationships and Actions so that
     *  you can augment their description.
     *  @param { object } params
     *  @param { array } params.entityIds - an array of entity id's that are linked to from another entity
     *  @param { boolean } params.strict - if true return entities that have exactly entityIds linked. If false,
     *                          return entities that have at least entityIds linked
     *  @returns [] entities matching or undefined
     */

    locateEntity({
        entityIds,
        strict = true,
    }: {
        entityIds: string[];
        strict: boolean;
    }): NormalisedEntityDefinition[] | undefined {
        // encode entityIds
        entityIds = entityIds.map((eid) => encodeURI(eid));

        // console.log(entityIds);
        // get one id and use that to resolve what it links to
        let entity = this.getEntity({ id: entityIds[0], materialise: false });

        //   if it doesn't link to anything then there's no match
        if (!entity) return undefined;

        // if it does, for each match walk the entity forward and find out what it links to
        // console.log(entity, this.reverse);
        let thisEntityLinksTo = this.reverse[entity["@id"]];

        let matches: { [key: string]: string[] } = {};
        for (let property of Object.keys(thisEntityLinksTo)) {
            for (let e of thisEntityLinksTo[property]) {
                matches[e["@id"]] = [];
            }
        }

        let entityMatches: NormalisedEntityDefinition[] = [];
        for (let entityId of Object.keys(matches)) {
            let entity = this.getEntity({ id: entityId });
            if (entity) {
                for (let property of Object.keys(entity)) {
                    if (this.coreProperties.includes(property)) continue;
                    for (let instance of entity[property]) {
                        if (!isEntityReference(instance)) continue;
                        if ((instance as EntityReference)?.["@id"])
                            matches[entityId].push(instance["@id"]);
                    }
                }
                if (strict) {
                    // if strict is true then check if the linked entities match exactly
                    if (isEqual(matches[entityId].sort(), entityIds.sort()))
                        entityMatches.push(entity);
                } else {
                    // otherwise, check that entityIds is a subset of matches
                    if (intersection(matches[entityId], entityIds).length === entityIds.length) {
                        entityMatches.push(entity);
                    }
                }
            }
        }
        return entityMatches;
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
    resolveLinkedEntityAssociations({
        entity,
        profile,
    }: {
        entity: NormalisedEntityDefinition;
        profile: NormalisedProfile;
    }):
        | {
              property: string;
              "@id": string;
              "@type": string[];
              name: string;
          }[]
        | [] {
        if (!profile?.resolve) return [];
        let resolveConfiguration = profile.resolve;
        const resolvers: { [key: string]: any } = {};
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

        let associations: Array<{
            property: string;
            "@id": string;
            "@type": string[];
            name: string;
        }> = [];

        for (let property of Object.keys(entity)) {
            // skip core prop's and any prop not specifically configured to resolve
            if (this.coreProperties.includes(property)) continue;
            if (!propertiesToResolve.includes(property)) continue;

            // resolve away
            let values = [].concat(entity[property] as any);
            values.forEach((value) => {
                if (!("@id" in value)) return value;
                associations.push({
                    property,
                    ...(this.getEntity({
                        id: value["@id"],
                        stub: true,
                    }) as NormalisedEntityDefinition),
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
    addEntity(entity: UnverifiedEntityDefinition): NormalisedEntityDefinition {
        if (!("@id" in entity)) {
            throw new Error(`You can't add an entity without an identifier: '@id'.`);
        }
        if (!("@type" in entity)) {
            throw new Error(`You can't add an entity without defining the type : '@type'.`);
        }

        const e = structuredClone(entity);
        let normalisedEntity = normalise(e, this.graphLength);
        normalisedEntity = this.__confirmNoClash({
            entity: normalisedEntity,
        }) as NormalisedEntityDefinition;
        if (!normalisedEntity) {
            normalisedEntity = normalise(e, this.graphLength);
            return this.getEntity({ id: normalisedEntity["@id"] }) as NormalisedEntityDefinition;
        }

        // set all properties, other than core props, to array
        for (let property of Object.keys(normalisedEntity)) {
            if (this.coreProperties.includes(property)) continue;

            // ensure it's an array
            entity[property] = [].concat(normalisedEntity[property] as []);

            // then filter out empty properties with empty strings
            normalisedEntity[property] = (entity[property] as []).filter((p) => p !== "");
        }

        // manage timestamps
        if (this.entityTimestamps) {
            normalisedEntity[entityDateCreatedProperty] = [new Date().toISOString()];
            normalisedEntity[entityDateUpdatedProperty] = [new Date().toISOString()];
        }

        // push it into the graph
        this.crate["@graph"].push(normalisedEntity);

        // create the index and reverse lookup entries
        this.graphLength = this.crate["@graph"].length;
        this.entityIdIndex[normalisedEntity["@id"]] = this.graphLength - 1;
        this.reverse[normalisedEntity["@id"]] = {};
        this.__storeEntityType(normalisedEntity);

        return normalisedEntity;
    }

    /**
     * Add an entity with a blank node id ('_:...') to the graph.
     *
     * @description Use this when you want to add a non contextual entity to the graph. In thoses
     *   cases providing an @id and name don't really make sense even though those properties are still required
     *   therefore this method simplifies the process of adding those entity types. For example,
     *   Actions (e.g. CreateAction), Relationships, GeoShape, GeoCoordinates etc
     *
     * @param {string} type - the entity type to configure for the new entity
     * @returns the entity
     * @example

const cm = new CrateManager({ crate })
let r = cm.addBlankNode('Relationship);

r === {
    '@id': '_:Relationship1',
    '@type': [ 'Relationship' ],
    name: '_:Relationship1'
}

     */
    addBlankNode(type: string): NormalisedEntityDefinition {
        const blankNodeTypeMatches = this.blankNodes.filter((n) => n.match(type));
        const id = `_:${type}${blankNodeTypeMatches.length + 1}`;
        this.blankNodes.push(id);
        let entity = {
            "@id": id,
            "@type": type,
            name: id,
        };
        return this.addEntity(entity as UnverifiedEntityDefinition);
    }

    /**
     * Add files or folders - use addFile or addFolder in preference to this
     *
     * @description This is a helper method specifically for adding files and folders in the crate. This method
     *   will add the intermediate paths as 'Datasets' (as per the spec) and link everything via the hasPart
     *   property as required. It is assumed that the path is relative to the root of the folder.
     *
     * @param {object} params
     * @param {string} params.path - a file or folder path
     * @param {string} params.type - the type of thing being added - File or Dataset
     * @returns the entity
     * @example

const cm = new CrateManager({ crate })
let r = cm.addFileOrFolder('/a/b/c/file.txt);
     */
    addFileOrFolder({
        path,
        type = "File",
    }: {
        path: string;
        type: string;
    }): NormalisedEntityDefinition {
        if (!["File", "Dataset"].includes(type)) {
            throw new Error(`'addFileOrFolder' type must be File or Dataset`);
        }

        // ensure folders end in '/'
        if (type === "Dataset" && !path.match(/.*\/$/)) {
            path = `${path}/`;
        }

        // remove initial slash if there is one
        if (path.match(/^\//)) {
            path = path.substring(1);
        }

        //  create the file path as individual datasets before joining
        //   the file into the right place
        let paths: string[] = path.split("/").slice(0, -1);
        let i = 0;
        const entities: NormalisedEntityDefinition[] = paths.map((p) => {
            let entity = {
                "@id": i > 0 ? `${paths.slice(0, i).join("/")}/${p}/` : `${p}/`,
                "@type": ["Dataset"],
                name: i > 0 ? `${paths.slice(0, i).join("/")}/${p}/` : `${p}/`,
            };
            entity["@id"] = encodeURI(entity["@id"]);
            let normalisedEntity: NormalisedEntityDefinition = this.addEntity(
                entity as UnverifiedEntityDefinition
            );
            i += 1;
            return normalisedEntity;
        });
        i = 0;
        for (let e of entities) {
            if (i === 0) {
                this.linkEntity({
                    id: "./",
                    property: "hasPart",
                    propertyId: "https://schema.org/hasPart",
                    value: { "@id": e["@id"] },
                });
            } else {
                this.linkEntity({
                    id: entities[i - 1]["@id"],
                    property: "hasPart",
                    propertyId: "https://schema.org/hasPart",
                    value: { "@id": e["@id"] },
                });
            }
            i += 1;
        }

        let entity = {
            "@id": encodeURI(path),
            "@type": [type],
            name: path,
        };
        if (type === "File") {
            let id = "./";
            if (entities.length) {
                id = entities.slice(-1)[0]?.["@id"];
            }

            const sourceEntity = this.getEntity({
                id,
                stub: true,
            }) as NormalisedEntityDefinition;
            this.ingestAndLink({
                id: sourceEntity["@id"],
                property: "hasPart",
                propertyId: "https://schema.org/hasPart",
                json: entity as UnverifiedEntityDefinition,
            });
        }
        return this.getEntity({ id: entity["@id"], stub: true }) as NormalisedEntityDefinition;
    }

    /**
     * Add file
     *
     * @description This is a helper method specifically for adding files to the crate. This method
     *   will add the intermediate paths as 'Datasets' (as per the spec) and link everything via the hasPart
     *   property as required. It is assumed that the path is relative to the root of the folder.
     *
     * @param {string} path - a file path to add - ensure the file path is relative to the folder root
     * @returns the entity
     * @example

const cm = new CrateManager({ crate })
let r = cm.addFile('/a/b/c/file.txt);
     */
    addFile(path: string): NormalisedEntityDefinition {
        return this.addFileOrFolder({ path, type: "File" });
    }

    /**
     * Add folder
     *
     * @description This is a helper method specifically for adding folders to the crate. This method
     *   will add the intermediate paths as 'Datasets' (as per the spec) and link everything via the hasPart
     *   property as required. It is assumed that the path is relative to the root of the folder.
     *
     * @param {string} path - a folder path to add - ensure the folder path is relative to the folder root
     * @returns the entity
     * @example

const cm = new CrateManager({ crate })
let r = cm.addFolder('/a/b/c);
     */
    addFolder(path: string): NormalisedEntityDefinition {
        return this.addFileOrFolder({ path, type: "Dataset" });
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
    deleteEntity({ id }: { id: string }) {
        if (!id) throw new Error(`'deleteEntity' requires 'id' to be defined`);
        if (
            [
                (this.crate["@graph"][this.rootDescriptor as number] as NormalisedEntityDefinition)[
                    "@id"
                ],
                (this.crate["@graph"][this.rootDataset as number] as NormalisedEntityDefinition)[
                    "@id"
                ],
            ].includes(id)
        ) {
            throw new Error(`You can't delete the root dataset or the root descriptor.`);
        }

        const indexRef = this.entityIdIndex[id];
        const entity = this.crate["@graph"][indexRef];
        if (!entity) return;

        this.__removeEntityType(entity);

        // get the entity, find what it links to and remove it from the reverse of those linkages
        for (let [property, instances] of Object.entries(entity as NormalisedEntityDefinition)) {
            if (this.coreProperties.includes(property)) continue;
            for (let instance of instances) {
                if (!isEntityReference(instance)) continue;
                if (instance?.["@id"] && this.reverse[instance["@id"]]) {
                    this.reverse[instance["@id"]][property] = this.reverse[instance["@id"]][
                        property
                    ].filter((i: any) => i["@id"] !== id);

                    // remove the property if it's empty
                    if (!this.reverse[instance["@id"]][property].length) {
                        delete this.reverse[instance["@id"]][property];
                    }
                }
            }
        }

        // now do the same by walking the reverse links from this entity
        for (let [property, instances] of Object.entries(
            this.reverse[entity["@id"]] as NormalisedEntityDefinition
        )) {
            if (this.coreProperties.includes(property)) continue;
            for (let instance of instances) {
                if (!isEntityReference(instance)) continue;
                if (instance["@id"]) {
                    let linkIndexRef = this.entityIdIndex[instance["@id"]];
                    let linkEntity = this.crate["@graph"][linkIndexRef];
                    if (linkEntity) {
                        linkEntity[property] = linkEntity[property].filter((i) => {
                            if (isEntityReference(i)) {
                                return i["@id"] !== id;
                            } else {
                                return i;
                            }
                        });

                        // remove the property if it's empty
                        if (!linkEntity[property].length) {
                            delete linkEntity[property];
                        }
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
    setProperty({
        id,
        property,
        propertyId,
        value,
    }: {
        id: string;
        property: string;
        propertyId?: string;
        value: PrimitiveType | EntityReference;
    }): boolean | undefined {
        if (this.coreProperties.includes(property)) {
            throw new Error(`This method does not operate on ${this.coreProperties.join(", ")}`);
        }
        if (!id) throw new Error(`'setProperty' requires 'id' to be defined`);
        if (!property) throw new Error(`setProperty' requires 'property' to be defined`);
        if (value !== false && !value)
            throw new Error(`'setProperty' requires 'value' to be defined`);

        //  just don't set an empty object on a property
        if (isPlainObject(value) && isEmpty(value)) return;

        const indexRef = this.entityIdIndex[id];
        const entity = this.crate["@graph"][indexRef];
        if (isUndefined(entity)) return;

        if (!(property in entity)) {
            entity[property] = [];
        }
        // validate the value's shape - v. important
        if (isString(value) || isNumber(value) || isBoolean(value)) {
            (entity[property] as any[]).push(value);
        } else if (isPlainObject(value) && "@id" in value) {
            // value makes sense
            // but make sure it's only the id and not the whole entity
            value = { "@id": value["@id"] };

            // and don't add duplicates
            let ids = entity[property]
                .filter((v) => (v as EntityReference)?.["@id"])
                .map((v) => (v as EntityReference)?.["@id"]);
            if (!ids.includes(value["@id"])) entity[property].push(value as any);

            // and add a @reverse link
            this.__addReverse({ id, property, value });
        } else {
            // value doesn't make sense - bail
            throw new Error(`value must be a string, number, boolean or object with '@id'`);
        }
        this.__updateContext({ name: property, id: propertyId });

        // manage timestamps
        if (this.entityTimestamps) {
            entity[entityDateUpdatedProperty] = [new Date().toISOString()];
        }
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
    updateProperty({
        id,
        property,
        idx,
        value,
    }: {
        id: string;
        property: string;
        idx: number;
        value: PrimitiveType | PrimitiveType[] | EntityReference;
    }): NormalisedEntityDefinition | undefined | string {
        if (!id) throw new Error(`'setProperty' requires 'id' to be defined`);
        if (!property) throw new Error(`setProperty' requires 'property' to be defined`);
        if (value !== false && !value)
            throw new Error(`'setProperty' requires 'value' to be defined`);

        //  just don't set an empty object on a property
        if (isPlainObject(value) && isEmpty(value)) return;

        let indexRef = this.entityIdIndex[id];
        if (!indexRef) return `No such entity: ${id}`;
        const entity = this.crate["@graph"][indexRef];
        if (!entity) return;

        if (this.coreProperties.includes(property)) {
            if (property === "@id") {
                //  update @id
                this.__updateEntityId({
                    oldId: (entity as EntityReference)?.["@id"],
                    newId: value as string,
                });
            } else if (property === "@type") {
                //  update @type
                //   ensure it's an array first though or weird sh*t happens
                value = [].concat(value as any);

                //  when updating the type we first need to clear out the
                //   old types and then set the new so we end up with correct
                //   reference counts
                this.__removeEntityType(entity);
                entity["@type"] = uniq(value) as [];
                this.__storeEntityType(entity);
            } else if (property === "name") {
                // update name
                // ensure we're setting a string value for the name property
                if (isArray(value)) value = value.join(", ");
                entity.name = String(value);
            }
        } else {
            if (idx !== 0 && !idx) throw new Error(`setProperty' requires 'idx' to be defined`);
            (entity[property] as any[])[idx] = value;
        }

        // manage timestamps
        if (this.entityTimestamps) {
            entity[entityDateUpdatedProperty] = [new Date().toISOString()];
        }
        return entity;
    }

    /**
     * Delete a specific property from the entity. That is, an instance of a property.
     *
     * @param {Object}
     * @param {string} options.id - the id of the entity to remove the property value from
     * @param {string} options.property - the property
     * @param {string} options.idx - the idx of the property array to delete
     * @example

const cm = new CrateManager({ crate })
cm.deleteProperty({ id: "./", property: "author", idx: 1 });

     */
    deleteProperty({ id, property, idx }: { id: string; property: string; idx?: number }) {
        if (!id) throw new Error(`'deleteProperty' requires 'id' to be defined`);
        if (!property) throw new Error(`deleteProperty' requires 'property' to be defined`);
        // if (idx !== 0 && !idx) throw new Error(`deleteProperty' requires 'idx' to be defined`);

        let entity;
        if (idx || idx === 0) {
            // delete just that property instance
            const indexRef = this.entityIdIndex[id];
            entity = this.crate["@graph"][indexRef];
            if (isUndefined(entity)) return;

            entity[property].splice(idx, 1);
            if (!entity[property].length) delete entity[property];
        } else if (idx === undefined) {
            const indexRef = this.entityIdIndex[id];
            entity = this.crate["@graph"][indexRef];
            if (isUndefined(entity)) return;

            if (!entity[property]) return;

            // iterate over the values and unlink any linked properties
            entity[property].forEach((instance) => {
                if ((instance as EntityReference)?.["@id"])
                    this.unlinkEntity({ id, property, value: instance as EntityReference });
            });

            // now delete whatever is left
            delete entity[property];
        }

        // manage timestamps
        if (this.entityTimestamps && !isUndefined(entity)) {
            entity[entityDateUpdatedProperty] = [new Date().toISOString()];
        }
    }

    /**
     * Ingest and link a nested json object
     *
     * @param {Object} options
     * @param {string} options.id - the id of the entity to join the data into
     * @param {string} options.property - the property to join the data into
     * @param {string} options.propertyId - the propertyId of the property - ie the url to the definition
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
    ingestAndLink({
        id = undefined,
        property = undefined,
        propertyId = undefined,
        json = {},
    }: {
        id: string | undefined;
        property: string | undefined;
        propertyId: string | undefined;
        json: UnverifiedEntityDefinition;
    }) {
        if (!id) throw new Error(`ingestAndLink: 'id' must be defined`);
        if (!property) throw new Error(`ingestAndLink: 'property' must be defined`);

        let flattened = this.flatten(json);
        let entities: NormalisedEntityDefinition[] = flattened.map(
            (entity: UnverifiedEntityDefinition) => {
                let normalisedEntity: NormalisedEntityDefinition = normalise(
                    entity,
                    this.graphLength
                );
                normalisedEntity = this.addEntity(normalisedEntity);
                return normalisedEntity;
            }
        );

        this.linkEntity({ id, property, propertyId, value: { "@id": entities[0]["@id"] } });

        //  go through and set all of the reverse links
        for (let entity of entities) {
            for (let property of Object.keys(entity)) {
                if (this.coreProperties.includes(property)) continue;
                (entity[property] as []).forEach((instance) => {
                    if (instance?.["@id"]) {
                        this.__addReverse({ id: entity["@id"], property, value: instance });
                    }
                });
            }
        }
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
    flatten(json: UnverifiedEntityDefinition): NormalisedEntityDefinition[] {
        if (!isPlainObject(json)) {
            throw new Error(`flatten only takes an object.`);
        }
        json = structuredClone(toRaw(json));
        let flattened = [];
        flattened.push(json);
        for (let property of Object.keys(json)) {
            if (["@id", "@type", "name"].includes(property)) continue;

            if (!isArray(json[property])) json[property] = [json[property] as any];

            json[property].forEach((instance) => {
                if (isPlainObject(instance)) flattened.push(this.flatten(instance as any));
            });
            json[property] = json[property].map((instance: any) => {
                if (isPlainObject(instance)) return { "@id": instance["@id"] };
                return instance;
            });
        }
        return flattenDeep(flattened as []).map((e) => e);
    }

    /**
     * Link two entities
     *
     * @description Link two entities via a property. If there is a profile defined
     *      and it has reverse associations, then they will be added.
     * @param {Object} options
     * @param {string} options.id - the id of the entity to add the association to
     * @param {string} options.property - the property to add the association to
     * @param {string} options.propertyId - the propertyId of the property - ie the url to the definition
     * @param {object} options.value - an object with '@id' defining the association to create
     * @example

const cm = new CrateManager({ crate })
cm.linkEntity({ id: './', property: 'author', value: { '@id': '#e1' }})

     **/
    linkEntity({
        id,
        property,
        propertyId = undefined,
        value,
    }: {
        id: string;
        property: string;
        propertyId?: string;
        value: { "@id": string };
    }): void {
        if (!id) throw new Error(`'linkEntity' requires 'id' to be defined`);
        if (!property) throw new Error(`'linkEntity' requires 'property' to be defined`);
        if (!value) throw new Error(`'linkEntity' requires 'value' to be defined`);
        if (!isPlainObject(value) || !value["@id"]) {
            throw new Error(`value must be an object with '@id' defined`);
        }
        this.setProperty({ id, property, propertyId, value });

        // set inverse association if required
        const associations = this.pm?.getPropertyAssociations() ?? {};
        if (associations[property]) {
            let inverse = associations[property];
            this.setProperty({
                id: value["@id"],
                property: inverse.property,
                propertyId: inverse.propertyId,
                value: { "@id": id },
            });
        }
    }

    /**
     * Unlink two entities
     *
     * @description Remove an association between two entities. If there is a profile defined
     *      and it has reverse associations, then they will be removed as well.
     * @param {Object} options
     * @param {string} options.id - the id of the entity to remove the association from
     * @param {string} options.property - the property containing the association
     * @param {object} options.value - an object with '@id' defining the association to remove
     * @example

const cm = new CrateManager({ crate })
const cm = new CrateManager({ crate })
cm.unlinkEntity({ id: './', property: 'author', value: { '@id': '#e1' }})

     **/
    unlinkEntity({
        id = undefined,
        property = undefined,
        value = undefined,
        stop = false,
    }: {
        id: string | undefined;
        property: string | undefined;
        value: { "@id": string } | undefined;
        stop?: boolean;
    }) {
        if (!id) throw new Error(`'unlinkEntity' requires 'id' to be defined`);
        if (!property) throw new Error(`'unlinkEntity' requires 'property' to be defined`);
        if (!value) throw new Error(`'unlinkEntity' requires 'value' to be defined`);
        if (!isPlainObject(value) || !value["@id"]) {
            throw new Error(`value must be an object with '@id' defined`);
        }

        // console.log("START", id, property, value["@id"]);
        // get the source entity
        let indexRef = this.entityIdIndex[id];
        let entity = this.crate["@graph"][indexRef];
        if (!entity) return;
        // console.log("SOURCE ENTITY BEFORE ", entity);

        // and remove the linked entity from the specified property
        entity[property] = (entity[property] as []).filter((v) => {
            if (v?.["@id"] && v["@id"] === value["@id"]) {
                // do nothing - we don't want it
            } else {
                return v;
            }
        });
        if (!entity[property].length) delete entity[property];

        // manage timestamps
        if (this.entityTimestamps) {
            entity[entityDateUpdatedProperty] = [new Date().toISOString()];
        }
        // console.log("SOURCE ENTITY AFTER", entity);

        // clean up the reverse mapping back value['@id'] -> id

        // console.log(`TARGET ENTITY BEFORE REVERSE`, this.reverse[value["@id"]]);
        // console.log();
        if (this.reverse[value["@id"]]) {
            this.reverse[value["@id"]][property] = this.reverse[value["@id"]][property].filter(
                (v: any) => {
                    if (isEntityReference(v)) return v["@id"] !== id;
                }
            );
            if (!this.reverse[value["@id"]][property].length)
                delete this.reverse[value["@id"]][property];
        }
        // console.log(`TARGET ENTITY AFTER REVERSE`, this.reverse[value["@id"]]);
        // remove any inverse associations
        const associations = this.pm?.getPropertyAssociations() ?? {};
        if (associations[property] && !stop) {
            const inverse = associations[property];
            // console.log(inverse, value["@id"], property, id);
            this.unlinkEntity({
                id: value["@id"],
                property: inverse.property,
                value: { "@id": id },
                stop: true, // V. IMPORTANT so we don't get into an infinite loop
            });
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
    purgeUnlinkedEntities(): void {
        let walker = (entity: NormalisedEntityDefinition) => {
            linkedEntities[entity["@id"]] = true;
            for (let property of Object.keys(entity)) {
                if (this.coreProperties.includes(property)) continue;
                for (let instance of entity[property]) {
                    if (!isEntityReference(instance)) continue;
                    if (instance?.["@id"] && !linkedEntities[instance["@id"]]) {
                        let indexRef = this.entityIdIndex[instance["@id"]];
                        if (indexRef !== undefined) {
                            let entity = this.crate["@graph"][indexRef];
                            walker(entity as NormalisedEntityDefinition);
                        }
                    }
                }
            }
        };

        walker = walker.bind(this);
        let linkedEntities: { [key: string]: boolean } = { "ro-crate-metadata.json": true };

        let rootDescriptor = this.getEntity({ id: "ro-crate-metadata.json" });
        if (!rootDescriptor) return;
        // let indexRef = this.entityIdIndex["ro-crate-metadata.json"];
        // we first need to walk the graph from the root descriptor
        //  and assemble a list of linked entities that we get to by
        //  following forward looking associations
        walker(rootDescriptor);

        // then, we walk the entire graph and look for entities
        //   that are not already linked. When we find one, we walk
        //   it forwards to see if it links to anything already linked
        //   and if yes, then we link it
        // think things like relationships and actions that may link
        //   to enities in the graph even though they themselves are not linked to
        for (let i = 0; i < this.graphLength; i++) {
            let entity = this.crate["@graph"][i];
            if (!entity) continue;
            if (!linkedEntities[entity["@id"]]) {
                for (let property of Object.keys(entity)) {
                    if (this.coreProperties.includes(property)) continue;
                    for (let instance of entity[property]) {
                        if (!isEntityReference(instance)) continue;
                        if (instance?.["@id"] && linkedEntities[instance["@id"]]) {
                            linkedEntities[entity["@id"]] = true;
                        }
                    }
                }
            }
        }

        // now we can remove everything we couldn't get to
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

    /**
     * Export the RO-Crate
     * @returns the complete ro-crate
     * @example

const cm = new CrateManager({ crate })
let crate = cm.exportCrate()

     */
    exportCrate(): NormalisedCrate {
        const t0 = performance.now();
        // const crate = structuredClone(this.crate);

        let entities = this.crate["@graph"]
            .filter((e) => {
                return !isUndefined(e);
            })
            .map((e) => {
                const entity = structuredClone(e);
                entity["@reverse"] = structuredClone(this.reverse[e["@id"]]) as {
                    [key: string]: { "@id": string }[];
                };

                for (let property of Object.keys(entity)) {
                    if (property === "@reverse") {
                        for (let rp of Object.keys(entity["@reverse"])) {
                            if (isArray(entity[property][rp]) && entity[property][rp].length === 1)
                                entity[property][rp] = entity[property][rp][0];
                        }
                    } else {
                        if (isArray(entity[property]) && entity[property].length === 1)
                            entity[property] = entity[property][0];
                    }
                }
                return entity;
            });

        const context: NormalisedContext = this.getContext();
        const crate = {
            "@context": context.length === 1 ? context[0] : context,
            "@graph": entities,
        } as NormalisedCrate;
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
    exportEntityTemplate({
        id,
        resolveDepth = 0,
    }: {
        id: string;
        resolveDepth: number;
    }): NormalisedEntityDefinition {
        if (![0, 1].includes(resolveDepth)) {
            throw new Error(`resolveDepth can only be 0 or 1`);
        }
        let indexRef = this.entityIdIndex[id];
        let entity = structuredClone(this.crate["@graph"][indexRef]);

        for (let property of Object.keys(entity)) {
            if (this.coreProperties.includes(property)) continue;

            entity[property] = entity[property].map((value: EntityReference) => {
                if (value?.["@id"]) {
                    if (resolveDepth === 0) return undefined;
                    let linkedIndexRef = this.entityIdIndex[value["@id"]];
                    let linkedEntity = structuredClone(this.crate["@graph"][linkedIndexRef]);
                    linkedEntity = this.__removeAssociations(linkedEntity);
                    delete linkedEntity["@reverse"];
                    return linkedEntity;
                } else {
                    return value;
                }
            });
            entity[property] = compact(entity[property]);
            if (entity[property].length === 0) {
                delete entity[property];
            } else if (entity[property].length === 1) {
                entity[property] = entity[property][0];
            }
        }
        delete entity["@reverse"];
        return entity;
    }

    /**
     * getErrors
     *
     * @returns { errors }
     *
     */
    getErrors(): errorsInterface {
        return this.errors;
    }

    /**
     * getWarnings
     *
     * @returns { warnings }
     */
    getWarnings(): warningsInterface {
        return this.warnings;
    }

    __updateContext({ name, id }: { name: string; id?: string }): void {
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
    __normaliseContext(context: UnverifiedContext): NormalisedContext {
        context = [].concat(context);
        let entries = {};
        for (let entry of context) {
            if (isPlainObject(entry)) entries = { ...entries, ...entry };
        }
        context = context.filter((e: string | {}) => isString(e));
        if (!isEmpty(entries)) context = [...context, entries];
        return context;
    }
    __storeEntityType(entity: NormalisedEntityDefinition): void {
        // store the entity type for lookups by type
        entity["@type"].forEach((type) => {
            if (!this.entityTypes[type]) {
                this.entityTypes[type] = 1;
            } else {
                this.entityTypes[type] += 1;
            }
        });
    }
    __removeEntityType(entity: NormalisedEntityDefinition) {
        // update the entity type's store
        entity["@type"].forEach((type) => {
            this.entityTypes[type] -= 1;
            if (this.entityTypes[type] === 0) delete this.entityTypes[type];
        });
    }
    __collectAllDefinitions(context: NormalisedContext): { [key: string]: boolean } {
        let definitions: { [key: string]: boolean } = {};

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
                for (let [key, value] of Object.entries(entry)) {
                    definitions[value as string] = true;
                }
            }
        }
        // console.log(definitions);
        return definitions;
    }
    __setError(error: keyof typeof this.errors, entity: string | UnverifiedEntityDefinition) {
        if (error === "init") {
            this.errors.init.messages.push(entity as string);
        } else if (error in this.errors) {
            (this.errors[error] as any).entity.push(entity as UnverifiedEntityDefinition);
        }
        this.errors.hasError = true;
    }
    __setWarning(warning: keyof typeof this.warnings, entity: string | UnverifiedEntityDefinition) {
        if (warning in this.warnings) {
            (this.warnings[warning] as any).entity.push(entity as UnverifiedEntityDefinition);
        }
        this.warnings.hasWarning = true;
    }
    __materialiseEntity({ id }: { id: string }): NormalisedEntityDefinition {
        return {
            "@id": id,
            "@type": isURL(id) ? ["URL"] : ["Thing"],
            name: id,
        } as NormalisedEntityDefinition;
    }
    __confirmNoClash({
        entity,
        mintNewId = true,
    }: {
        entity: NormalisedEntityDefinition;
        mintNewId?: boolean;
    }): NormalisedEntityDefinition | boolean {
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
            // if get to here then there's a clash

            if (mintNewId) {
                const id = `e${this.graphLength + 1}`;
                entity["@id"] = `#${id}`;
                return entity;
            } else {
                throw new Error("That id is already used on another entity");
            }
        }
    }
    __updateEntityId({ oldId, newId }: { oldId: string; newId: string }) {
        if (!oldId) throw new Error(`You must provide the id to change: oldId`);
        if (!newId) throw new Error(`You must provide the id for the change: newId`);
        // get the original entity and see if we can set this new id on it
        //  we clone the original entity as we don't want to set anything yet
        let indexRef = this.entityIdIndex[oldId];
        // console.log("ORIGINAL ENTITY", JSON.stringify(this.crate["@graph"][indexRef], null, 2));
        let entity = structuredClone(this.crate["@graph"][indexRef]);
        entity["@id"] = newId;
        entity = normalise(entity, this.graphLength);
        entity = this.__confirmNoClash({ entity, mintNewId: false });
        // console.log("NEW ENTITY", JSON.stringify(entity, null, 2));

        // get the entity using the original id and then walk the properties forward
        //  to find what it links to. For each of those, set the reverse link to the new id
        indexRef = this.entityIdIndex[oldId];
        let oe = this.crate["@graph"][indexRef];
        for (let [property, instances] of Object.entries(oe as NormalisedEntityDefinition)) {
            if (this.coreProperties.includes(property)) continue;
            // for (let instance of instances) {
            //     if (instance?.["@id"]) {
            //         // console.log(
            //         //     "FORWARD LINKED ENTITY BEFORE",
            //         //     property,
            //         //     this.reverse[instance["@id"]][property]
            //         // );
            //         this.reverse[instance["@id"]][property].push({ "@id": entity["@id"] });
            //         this.reverse[instance["@id"]][property] = this.reverse[instance["@id"]][
            //             property
            //         ].filter((i) => i["@id"] !== oldId);
            //         this.reverse[instance["@id"]][property] = uniqBy(
            //             this.reverse[instance["@id"]][property],
            //             "@id"
            //         );
            //         // console.log(
            //         //     "FORWARD LINKED ENTITY AFTER",
            //         //     property,
            //         //     this.reverse[instance["@id"]][property]
            //         // );
            //     }
            // }
            (instances as []).forEach((instance: EntityReference) => {
                if (instance?.["@id"]) {
                    // console.log(
                    //     "FORWARD LINKED ENTITY BEFORE",
                    //     property,
                    //     this.reverse[instance["@id"]][property]
                    // );
                    this.reverse[instance["@id"]][property].push({ "@id": entity["@id"] });
                    this.reverse[instance["@id"]][property] = this.reverse[instance["@id"]][
                        property
                    ].filter((i: EntityReference) => i["@id"] !== oldId);
                    this.reverse[instance["@id"]][property] = uniqBy(
                        this.reverse[instance["@id"]][property],
                        "@id"
                    );
                    // console.log(
                    //     "FORWARD LINKED ENTITY AFTER",
                    //     property,
                    //     this.reverse[instance["@id"]][property]
                    // );
                }
            });
        }

        // walk the reverse links from this entity and update the forrward links
        // now walk the reverse links of the entity to update the references to it
        if (this.reverse[oldId]) {
            for (let [property, links] of Object.entries(this.reverse[oldId])) {
                // for (let link of links) {
                //     let linkIndexRef = this.entityIdIndex[link["@id"]];
                //     let linkedEntity = this.crate["@graph"][linkIndexRef];

                //     // console.log("REVERSE LINKED ENTITY BEFORE", property, linkedEntity[property]);
                //     linkedEntity[property].push({ "@id": entity["@id"] });
                //     linkedEntity[property] = linkedEntity[property].filter(
                //         (i) => i["@id"] !== oldId
                //     );
                //     // console.log("REVERSE LINKED ENTITY AFTER", property, linkedEntity[property]);
                // }
                (links as []).forEach((link: EntityReference) => {
                    let linkIndexRef = this.entityIdIndex[link["@id"]];
                    let linkedEntity = this.crate["@graph"][linkIndexRef];

                    if (
                        linkedEntity &&
                        linkedEntity[property] &&
                        Array.isArray(linkedEntity[property])
                    ) {
                        // console.log("REVERSE LINKED ENTITY BEFORE", property, linkedEntity[property]);
                        linkedEntity[property].push({ "@id": entity["@id"] } as EntityReference);
                        linkedEntity[property] = linkedEntity[property].filter((i) => {
                            if (isEntityReference(i)) return i["@id"] !== oldId;
                        });
                    }
                    // console.log("REVERSE LINKED ENTITY AFTER", property, linkedEntity[property]);
                });
            }
        }

        // now we can update the original entity in the graph
        // set the new id on the entity itself
        indexRef = this.entityIdIndex[oldId];
        (this.crate["@graph"][indexRef] as EntityReference)["@id"] = entity["@id"];
        // console.log("NEW ENTITY IN GRAPH", JSON.stringify(this.crate["@graph"][indexRef], null, 2));

        // update the index ref's
        delete this.entityIdIndex[oldId];
        // console.log("OLDID lookup", this.entityIdIndex[oldId]);
        this.entityIdIndex[entity["@id"]] = indexRef;
        // console.log("NEWID lookup", this.entityIdIndex[entity["@id"]]);
        // console.log(
        //     "NEW ENTITY IN GRAPH",
        //     JSON.stringify(this.crate["@graph"][this.entityIdIndex[entity["@id"]]], null, 2)
        // );

        // copy the reverse associations to the new id
        //   and then remove the original reverse associations
        this.reverse[entity["@id"]] = structuredClone(this.reverse[oldId]);
        delete this.reverse[oldId];
        // console.log(
        //     "NEW ENTITY REVERSE CONNECTIONS",
        //     entity["@id"],
        //     JSON.stringify(this.reverse[entity["@id"]], null, 2)
        // );

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
    __addReverse({
        id,
        property,
        value,
    }: {
        id: string;
        property: string;
        value: EntityReference;
    }) {
        const linkIndexRef = this.entityIdIndex[value["@id"]];

        if (linkIndexRef) {
            if (!this.reverse[value["@id"]][property]) this.reverse[value["@id"]][property] = [];

            let links = this.reverse[value["@id"]][property].map(
                (l: EntityReference) => l?.["@id"]
            );
            if (!links.includes(id)) {
                this.reverse[value["@id"]][property].push({ "@id": id });
            }
            // this.reverse[value["@id"]][property].push({ "@id": id });
            // this.reverse[value["@id"]][property] = uniqBy(
            //     this.reverse[value["@id"]][property],
            //     "@id"
            // );
        }
    }
    __removeAssociations(entity: NormalisedEntityDefinition): NormalisedEntityDefinition {
        for (let property of Object.keys(entity)) {
            if (this.coreProperties.includes(property)) continue;
            entity[property] = entity[property].filter((value) => {
                if (isEntityReference(value)) return !value["@id"];
            });
            if (!entity[property].length) delete entity[property];
        }
        return entity;
    }
}

function isEntityReference(obj: any): obj is EntityReference {
    return (
        typeof obj === "object" && obj !== null && "@id" in obj && typeof obj["@id"] === "string"
    );
}
