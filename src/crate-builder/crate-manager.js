import isString from "lodash-es/isString";
import isArray from "lodash-es/isArray";
import isPlainObject from "lodash-es/isPlainObject";
import isEmpty from "lodash-es/isEmpty";
import groupBy from "lodash-es/groupBy";
import cloneDeep from "lodash-es/cloneDeep";
import flattenDeep from "lodash-es/flattenDeep";
import compact from "lodash-es/compact";
import orderBy from "lodash-es/orderBy";
import validatorIsURL from "validator/es/lib/isURL.js";
const urlProtocols = ["http", "https", "ftp", "ftps"];
import validateIriPkg from "./lib/validate-iri";
import cuid2 from "./lib/cuid2";
const createId = cuid2.init({ length: 32 });

export class CrateManager {
    constructor() {
        this.describoProperties = ["describoId", "describoLabel"];
        this.coreProperties = ["describoId", "describoLabel", "@id", "@type", "@reverse", "name"];
        this.entities = [];
        this.properties = [];
        this.currentEntity = undefined;
    }
    load({ crate, profile }) {
        this.verify({ crate });
        this.profile = profile;
        this.context = crate["@context"];

        /**
         *
         * ORIGINAL Method with a few passes over the graph
         *   of course this means the larger the graph, the longer this takes
         *
         *
        // store root descriptor as found
        // this.rootDescriptor = crate["@graph"].filter(
        //     (e) => e["@id"] === "ro-crate-metadata.json" && e["@type"] === "CreativeWork"
        // )[0];

        // filter root descriptor from the graph
        // let graph = crate["@graph"]
        //     .filter(
        //         (e) => !(e["@id"] === "ro-crate-metadata.json" && e["@type"] === "CreativeWork")
        //     )
        //     .map((e) => {
        //         // mark root dataset
        //         return e["@id"] === this.rootDescriptor.about["@id"]
        //             ? { describoLabel: "RootDataset", ...e, "@id": "./" }
        //             : e;
        //     });
         */

        /** Doing it this way means we partition on the first pass */
        this.errors = [];
        this.rootDescriptor;
        let graph = [];
        for (let [i, e] of crate["@graph"].entries()) {
            if (e["@id"] === "ro-crate-metadata.json") {
                this.rootDescriptor = { ...e };
            } else {
                //  ensure every entity has a defined type
                if (!e?.["@type"]) {
                    this.errors.push({
                        message: `The entity does not have '@type' defined.`,
                        entity: e,
                    });
                    continue;
                }

                // then see if @id is a valid IRI
                let result = validateId(e["@id"], e["@type"]);
                if (result?.message) {
                    this.errors.push({
                        message: result.message,
                        entity: e,
                    });
                }

                graph.push(e);
            }
        }
        if (this.errors.length) throw new Error(`The crate is invalid.`);

        // and then on the second pass we mark the root dataset
        //   so in total - one less pass over the entire graph
        graph = graph.map((e) => {
            // mark root dataset
            return e["@id"] === this.rootDescriptor.about["@id"]
                ? { ...e, describoLabel: "RootDataset", "@id": "./" }
                : e;
        });
        this.rootDescriptor.about["@id"] = "./";

        // for each entity, populate entities and properties structs
        let entities = graph.map((entity) => {
            return this.__addEntity({ entity });
        });
        this.__index();

        entities.forEach((entity) => {
            this.__processProperties({ entity });
        });
        try {
            this.getRootDataset();
        } catch (error) {
            throw new Error(`A root dataset cannot be identified in the crate.`);
        }
    }

    verify({ crate }) {
        if (!crate["@context"]) {
            throw new Error(`The crate file does not have '@context'.`);
        }
        if (!crate["@graph"] || !isArray(crate["@graph"])) {
            throw new Error(`The crate file does not have '@graph' or it's not an array.`);
        }
    }

    setCurrentEntity({ describoId }) {
        this.currentEntity = describoId;
    }

    exportCrate() {
        // the context will come from the profile if defined or the original crate otherwise
        let crate = {
            "@context": this.profile?.context
                ? cloneDeep(this.profile.context)
                : cloneDeep(this.context),
            "@graph": [cloneDeep(this.rootDescriptor)],
        };

        this.__purgeUnlinkedEntities();
        let propertiesGroupedBySrcId = groupBy(this.properties, "srcEntityId");
        let reverseConnectionsGroupedByTgtId = groupBy(this.properties, "tgtEntityId");
        this.entities.forEach((entity) => {
            entity = cloneDeep(entity);
            entity["@type"] = entity["@type"].split(", ");
            entity = this.rehydrateEntity({
                entity,
                propertiesGroupedBySrcId,
                reverseConnectionsGroupedByTgtId,
            });
            crate["@graph"].push(entity);
        });
        return crate;
    }

    exportEntityTemplate({ describoId }) {
        let entity = this.getEntity({ describoId });
        let propertiesGroupedBySrcId = groupBy(this.properties, "srcEntityId");
        let reverseConnectionsGroupedByTgtId = groupBy(this.properties, "tgtEntityId");
        entity = this.rehydrateEntity({
            entity,
            propertiesGroupedBySrcId,
            reverseConnectionsGroupedByTgtId,
        });

        // remove all the internal stuff
        delete entity.reverseConnections;
        delete entity.properties;
        delete entity["@reverse"];

        // iterate over all properties and remove anything that points to something else
        Object.keys(entity).forEach((property) => {
            if (isArray(entity[property])) {
                entity[property] = entity[property].filter((instance) => {
                    if (!isPlainObject(instance)) return instance;
                });
            } else if (isPlainObject(entity[property])) {
                delete entity[property];
            }
        });
        return entity;
    }

    rehydrateEntity({ entity, propertiesGroupedBySrcId, reverseConnectionsGroupedByTgtId }) {
        entity = cloneDeep(entity);
        let properties = propertiesGroupedBySrcId[entity.describoId];
        properties = groupBy(properties, "property");

        // map in the entity properties
        for (let property of Object.keys(properties)) {
            entity[property] = [];
            properties[property].forEach((instance) => {
                if (instance.tgtEntityId) {
                    entity[property].push({
                        "@id": this.__lookupEntityByDescriboId({ id: instance.tgtEntityId })["@id"],
                    });
                } else {
                    entity[property].push(instance.value);
                }
            });
            if (entity[property].length === 1) entity[property] = entity[property][0];
        }

        // map in the reverse property links
        entity["@reverse"] = {};
        let reverseProperties = reverseConnectionsGroupedByTgtId[entity.describoId];
        reverseProperties = groupBy(reverseProperties, "property");
        for (let property of Object.keys(reverseProperties)) {
            entity["@reverse"][property] = [];
            reverseProperties[property].forEach((instance) => {
                let referencedEntity = this.__lookupEntityByDescriboId({
                    id: instance.srcEntityId,
                });
                entity["@reverse"][property].push({ "@id": referencedEntity["@id"] });
            });
            if (entity["@reverse"][property].length === 1)
                entity["@reverse"][property] = entity["@reverse"][property][0];
        }

        this.describoProperties.forEach((p) => delete entity[p]);
        return entity;
    }

    getRootDataset() {
        return this.getEntity({ describoId: "RootDataset" });
    }

    getEntity({ id, describoId, loadProperties = true }) {
        let entity;
        if (id) entity = this.__lookupEntityByAtId({ id });
        if (describoId) entity = this.__lookupEntityByDescriboId({ id: describoId });
        if (entity?.describoId && loadProperties) {
            entity.properties = this.getEntityProperties({
                describoId: entity.describoId,
            }).map((c) => {
                if (c.tgtEntityId && c.tgtEntityId !== "not found") {
                    return {
                        ...c,
                    };
                } else {
                    return c;
                }
            });
            entity.reverseConnections = this.getEntityReverseConnections({
                describoId: entity.describoId,
            }).map((c) => {
                if (c.tgtEntityId && c.tgtEntityId !== "not found") {
                    return {
                        ...c,
                        tgtEntity: this.__lookupEntityByDescriboId({ id: c.tgtEntityId }),
                    };
                } else {
                    return c;
                }
            });
        }
        return entity;
    }

    getEntityProperties({ describoId, grouped = false }) {
        let properties = this.properties
            .filter((p) => p.srcEntityId === describoId)
            .map((p) => {
                return {
                    ...p,
                    tgtEntity: this.__lookupEntityByDescriboId({ id: p.tgtEntityId }),
                };
            });

        if (grouped) return groupBy(properties, "property");
        return properties;
    }

    getEntityReverseConnections({ describoId, grouped = false }) {
        let properties = this.properties.filter((p) => p.tgtEntityId === describoId);
        if (grouped) return groupBy(properties, "property");
        return properties;
    }

    getEntitiesBrowseList() {
        const propertiesGroupedBySrcId = groupBy(this.properties, "srcEntityId");
        const propertiesGroupedByTgtId = groupBy(this.properties, "tgtEntityId");
        return this.entities.map((entity) => {
            return {
                ...entity,
                isConnected:
                    propertiesGroupedBySrcId[entity.describoId]?.length ||
                    propertiesGroupedByTgtId[entity.describoId]?.length,
            };
        });
    }

    findMatchingEntities({ limit = 5, query = undefined, type = undefined }) {
        if (query) {
            query = query.toLowerCase();
        }
        let entities = this.entities.filter((e) => {
            let eid = e["@id"].toLowerCase();
            let etype = isArray(e["@type"])
                ? e["@type"].join(", ").toLowerCase()
                : e["@type"].toLowerCase();
            type = type.toLowerCase();
            let name = e.name.toLowerCase();
            if (type && !query) {
                return etype.match(type);
            } else if (query && !type) {
                return eid.match(query) || e.name.match(query);
            } else if (query && type) {
                return etype.match(type) && (eid.match(query) || name.match(query));
            }
        });
        entities = entities.filter((e) => e.describoLabel !== "RootDataset");
        return entities.slice(0, limit);
    }

    addEntity({ entity }) {
        // check there isn't an entity wth that @id already
        let match = this.__lookupEntityByAtId({ id: entity["@id"] });
        if (match && (match?.["@type"] === entity["@type"] || entity["@id"] === "./")) {
            return match;
        } else if (match && match?.["@type"] !== entity["@type"]) {
            // @id matches something in the graph but the type is not the same
            //   generate a random @id so that the entity can be added
            entity["@id"] = `#${createId()}`;
            entity = this.__addEntity({ entity });
            this.__processProperties({ entity });
            this.__index();
            return this.getEntity({ describoId: entity.describoId });
        } else {
            //  if not
            entity = this.__addEntity({ entity });
            this.__processProperties({ entity });
            this.__index();
            return this.getEntity({ describoId: entity.describoId });
        }
    }

    deleteEntity({ describoId }) {
        this.entities = this.entities.filter((e) => e.describoId !== describoId);
        this.properties = this.properties.filter(
            (p) => p.srcEntityId !== describoId && p.tgtEntityId !== describoId
        );
        this.__purgeUnlinkedEntities();
        this.__index();
    }

    updateEntity({ describoId, property, value }) {
        describoId = describoId ? describoId : this.currentEntity;
        this.entities = this.entities.map((e) => {
            return e.describoId === describoId ? { ...e, [property]: value } : e;
        });
        this.__index();
    }

    addProperty({ describoId = undefined, property, value }) {
        this.__pushProperty({
            srcEntityId: describoId ? describoId : this.currentEntity,
            property,
            value,
        });
    }

    updateProperty({ propertyId, value }) {
        console.debug("Crate Mgr, updateProperty", propertyId, value);
        this.properties = this.properties.map((p) => {
            return p.propertyId == propertyId ? { ...p, value } : p;
        });
    }

    deleteProperty({ propertyId }) {
        console.debug("Crate Mgr, deleteProperty", propertyId);

        this.properties = this.properties.filter((p) => p.propertyId !== propertyId);
        this.__purgeUnlinkedEntities();
    }

    linkEntity({ srcEntityId, property, tgtEntityId }) {
        srcEntityId = srcEntityId ? srcEntityId : this.currentEntity;
        let existingLink = this.properties.filter(
            (p) =>
                p.property === property &&
                p.srcEntityId === srcEntityId &&
                p.tgtEntityId === tgtEntityId
        );
        if (!existingLink.length) {
            this.__pushProperty({ srcEntityId, property, tgtEntityId });
        }
    }

    unlinkEntity({ srcEntityId, property, tgtEntityId }) {
        this.properties = this.properties.filter(
            (p) =>
                !(
                    p.property === property &&
                    p.srcEntityId === srcEntityId &&
                    p.tgtEntityId === tgtEntityId
                )
        );
    }

    flatten({ json }) {
        json = cloneDeep(json);
        let flattened = [];
        flattened.push(json);
        Object.keys(json).forEach((property) => {
            if (isPlainObject(json[property])) {
                flattened.push(this.flatten({ json: json[property] }));
                flattened = compact(flattened);
                json[property] = { "@id": json[property]["@id"] };
            } else if (isArray(json[property])) {
                json[property].forEach((instance) => {
                    if (isPlainObject(instance)) flattened.push(this.flatten({ json: instance }));
                });
                json[property] = json[property].map((instance) => {
                    if (isPlainObject(instance)) return { "@id": instance["@id"] };
                    return instance;
                });
            }
        });
        return compact(flattenDeep(flattened));
    }

    ingestAndLink({ srcEntityId = undefined, property = undefined, json = {} }) {
        if (!property) throw new Error(`ingestAndLink: 'property' must be defined`);

        if (!srcEntityId) {
            srcEntityId = this.getRootDataset().describoId;
        }

        let flattened = this.flatten({ json });
        let entities = flattened.map((entity) => {
            return this.__addEntity({ entity });
        });
        this.__index();

        entities.forEach((entity) => {
            this.__processProperties({ entity });
        });
        this.linkEntity({
            srcEntityId,
            tgtEntityId: entities[0].describoId,
            property,
        });
    }

    __purgeUnlinkedEntities() {
        let walk = walker.bind(this);
        let linkedEntities = [];
        let rootDataset = this.getRootDataset();

        walk(rootDataset);
        function walker(entity) {
            linkedEntities.push(entity.describoId);
            entity.properties.forEach((p) => {
                if (p.tgtEntityId && !linkedEntities.includes(p.tgtEntityId)) {
                    walk(this.getEntity({ describoId: p.tgtEntityId }));
                }
            });
        }

        this.entities = this.entities.filter((entity) =>
            linkedEntities.includes(entity.describoId)
        );
        this.properties = this.properties.filter((property) =>
            linkedEntities.includes(property.srcEntityId)
        );
    }

    __index() {
        this.entitiesByAtId = groupBy(this.entities, "@id");
        this.entitiesByType = groupBy(this.entities, "@type");
        this.entitiesByDescriboId = groupBy(this.entities, "describoId");
    }

    __addEntity({ entity }) {
        const id = entity.describoLabel ?? createId();

        // is there an @id?
        if (entity["@id"]) {
            // ensure @id is a string
            entity["@id"] = entity["@id"] + "";
        } else {
            // set it to the generated describoId
            entity["@id"] = `#${id}`;
        }

        // is there a name?
        if (!entity.name) entity.name = entity["@id"];

        // if no @type then set to URL or Thing
        if (!entity["@type"]) entity["@type"] = isURL(entity["@id"]) ? "URL" : "Thing";

        // set type as string if it's an array
        if (isArray(entity["@type"])) entity["@type"] = entity["@type"].join(", ");

        entity = { describoId: id, ...entity };
        let e = this.coreProperties
            .map((p) => ({ [p]: entity[p] }))
            .reduce((obj, entry) => ({ ...obj, ...entry }));

        console.debug("Crate Mgr, addEntity", e);
        this.entities.push(e);
        return entity;
    }

    __processProperties({ entity }) {
        const pushProperty = this.__pushProperty.bind(this);

        for (let property of Object.keys(entity)) {
            if (this.coreProperties.includes(property)) continue;

            if (!isArray(entity[property])) entity[property] = [entity[property]];
            entity[property] = orderBy(entity[property], "@id");

            entity[property].forEach((instance) => {
                if (isString(instance) && !isEmpty(instance)) {
                    pushProperty({
                        srcEntityId: entity.describoId,
                        property,
                        value: instance,
                    });
                }

                if (isPlainObject(instance)) {
                    let targetEntity = this.__lookupEntityByAtId({ id: instance["@id"] });
                    if (targetEntity) {
                        pushProperty({
                            srcEntityId: entity.describoId,
                            property,
                            tgtEntityId: targetEntity.describoId,
                        });
                    } else if (!targetEntity) {
                        targetEntity = this.addEntity({
                            entity: {
                                "@id": instance["@id"],
                                "@type": isURL(instance["@id"]) ? "URL" : "Thing",
                                name: instance["@id"],
                            },
                        });
                        pushProperty({
                            srcEntityId: entity.describoId,
                            property,
                            tgtEntityId: targetEntity.describoId,
                        });
                    }
                }
            });
        }
    }

    __pushProperty({ srcEntityId, property, value, tgtEntityId }) {
        let data = { propertyId: createId(), srcEntityId, property, value, tgtEntityId };
        console.debug("Crate Mgr, addProperty", data);
        this.properties.push(data);
    }

    __lookupEntityByAtId({ id }) {
        let targetEntity = cloneDeep(this.entitiesByAtId[id]);
        if (targetEntity?.length) return targetEntity.shift();
    }

    __lookupEntityByDescriboId({ id }) {
        let targetEntity = cloneDeep(this.entitiesByDescriboId[id]);
        if (targetEntity?.length) return targetEntity.shift();
    }
}

export function isURL(value) {
    if (value.match(/arcp:\/\/name,.*/)) return true;
    if (value.match(/arcp:\/\/uuid,.*/)) return true;
    if (value.match(/arcp:\/\/ni,sha-256;,.*/)) return true;
    return validatorIsURL(value, {
        require_protocol: true,
        protocols: urlProtocols,
    });
}

export function validateId(id, type) {
    // if type matches File then whatever is provided is valid
    type = isArray(type) ? type.join(", ") : type;
    if (type.match(/file/i)) return true;

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
    let result = validateIriPkg.validateIri(id, validateIriPkg.IriValidationStrategy.Strict);
    if (!result) {
        // it's valid
        return true;
    } else if (result?.message?.match(/Invalid IRI according to RFC 3987:/)) {
        // otherwise
        const message = `${result.message.replace(
            /Invalid IRI according to RFC 3987:/,
            "Invalid identifier"
        )}. See https://github.com/describo/crate-builder-component/blob/master/README.identifiers.md for more information.`;
        result.message = message;
    }
    return result;
}
