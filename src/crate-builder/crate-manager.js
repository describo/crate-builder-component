import isString from "lodash-es/isString";
import isNumber from "lodash-es/isNumber";
import isArray from "lodash-es/isArray";
import isPlainObject from "lodash-es/isPlainObject";
import isEmpty from "lodash-es/isEmpty";
import isUndefined from "lodash-es/isUndefined";
import groupBy from "lodash-es/groupBy";
import cloneDeep from "lodash-es/cloneDeep";
import flattenDeep from "lodash-es/flattenDeep";
import compact from "lodash-es/compact";
import intersection from "lodash-es/intersection";
import validatorIsURL from "validator/es/lib/isURL.js";
import validateIriPkg from "./lib/validate-iri";
import cuid2 from "./lib/cuid2";
const createId = cuid2.init({ length: 32 });

const urlProtocols = ["http", "https", "ftp", "ftps"];
export class CrateManager {
    constructor() {
        this.em = new Entity();
    }
    async load({ crate, profile, progress = {} }) {
        this.verify({ crate });
        this.profile = profile;
        this.context = crate["@context"];

        /** Doing it this way means we partition on the first pass */
        this.errors = [];
        this.rootDescriptor;
        let graph = [];
        let i, e;
        for ([i, e] of crate["@graph"].entries()) {
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
                let { isValid, message } = validateId({ id: e["@id"], type: e["@type"] });
                if (!isValid) {
                    this.errors.push({
                        message,
                        entity: e,
                    });
                }

                graph.push(e);
            }
        }
        const totalEntities = i;

        if (this.errors.length) throw new Error(`The crate is invalid.`);

        // and then on the second pass we mark the root dataset
        //   so in total - one less pass over the entire graph
        graph = graph.map((e) => {
            // mark root dataset
            return e["@id"] === this.rootDescriptor.about["@id"]
                ? { ...e, describoId: "RootDataset", "@id": "./" }
                : e;
        });
        this.rootDescriptor.about["@id"] = "./";

        let reportAt = 200;
        // for each entity, populate entities and properties structs
        i = 0;
        let entities = [];
        for (let entity of graph) {
            // let entities = graph.map((entity) => {
            i += 1;
            if (i % reportAt === 0) {
                progress.percent = (i / (totalEntities * 2)) * 100;
                await new Promise((resolve) => setTimeout(resolve, 2));
            }
            let { describoId } = this.em.set(entity);
            entity.describoId = describoId;
            entities.push(entity);
        }
        progress.percent = (i / (totalEntities * 2)) * 100;
        // console.log(entities);

        reportAt = 1000;
        for (let entity of entities) {
            i += 1;
            this.em.processEntityProperties(entity);
            if (i % reportAt === 0) {
                progress.percent = (i / (totalEntities * 2)) * 100;
                await new Promise((resolve) => setTimeout(resolve, 2));
            }
        }
        progress.percent = (i / (totalEntities * 2)) * 100;
        await new Promise((resolve) => setTimeout(resolve, 5));
        // console.log(JSON.stringify(this.em, null, 2));
    }

    verify({ crate }) {
        if (!crate["@context"]) {
            throw new Error(`The crate file does not have '@context'.`);
        }
        if (!crate["@graph"] || !isArray(crate["@graph"])) {
            throw new Error(`The crate file does not have '@graph' or it's not an array.`);
        }
    }

    exportCrate() {
        // the context will come from the profile if defined or the original crate otherwise
        let crate = {
            "@context": this.profile?.context
                ? cloneDeep(this.profile.context)
                : cloneDeep(this.context),
            "@graph": [cloneDeep(this.rootDescriptor)],
        };

        // this.__purgeUnlinkedEntities();
        this.em.entities.forEach((entity) => {
            entity = this.__rehydrateEntity({ describoId: entity.describoId });
            crate["@graph"].push(entity);
        });
        return crate;
    }

    exportEntityTemplate({ describoId }) {
        let entity = this.__rehydrateEntity({ describoId });
        entity["@type"] = entity["@type"].join(", ");

        // remove all the internal stuff
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

    getRootDataset() {
        return this.getEntity({ describoId: "RootDataset" });
    }

    getEntity({
        id,
        describoId,
        loadEntityProperties = true,
        resolveLinkedEntities = true,
        resolveLinkedEntityAssociations = true,
        groupProperties = false,
    }) {
        // can't resolve linked entities without loading properties
        if (!loadEntityProperties && resolveLinkedEntities) resolveLinkedEntities = false;
        // can't resolve linked entity associations without first resolving linked entities
        if (!resolveLinkedEntities && resolveLinkedEntityAssociations)
            resolveLinkedEntityAssociations = false;

        let entity = this.em.get({ srcEntityId: id ?? describoId });
        if (!entity?.describoId) return;

        if (loadEntityProperties) {
            let properties = this.em.getProperties({ srcEntityId: entity.describoId });
            entity.properties = properties.filter((p) => p.srcEntityId === entity.describoId);
            entity.reverseConnections = properties.filter(
                (p) => p.tgtEntityId === entity.describoId
            );
        }
        if (resolveLinkedEntities) {
            // resolve links from this enttity to others
            entity.properties = entity.properties.map((p) => {
                return {
                    ...p,
                    tgtEntity: {
                        ...this.em.get({ srcEntityId: p?.tgtEntityId }),
                        associations: [],
                    },
                };
            });

            //  resolve links back to this entity @reverse
            entity.reverseConnections = entity.reverseConnections.map((p) => {
                return {
                    ...p,
                    tgtEntity: this.em.get({ srcEntityId: p?.tgtEntityId }),
                };
            });
        }
        if (resolveLinkedEntityAssociations) {
            this.resolveLinkedEntityAssociations({ entity });
        }
        if (groupProperties) {
            entity.properties = groupBy(entity.properties, "property");
            entity.reverseConnections = groupBy(entity.reverseConnections, "property");
        }

        return entity;
    }

    resolveLinkedEntityAssociations({ entity }) {
        let profile = this.profile;
        if (!profile || !profile?.resolve) return;

        let resolveConfiguration = profile.resolve;
        const resolvers = {};
        resolveConfiguration.forEach((c) => {
            c.types.forEach((type) => {
                resolvers[type] = c.properties;
            });
        });

        const typesToResolve = Object.keys(resolvers);
        for (let entityProperty of entity.properties) {
            let tgtEntity = entityProperty.tgtEntity;
            const type = tgtEntity["@type"]?.split(",").map((t) => t.trim());
            const specificTypesToResolve = intersection(typesToResolve, type);

            let associations = [];
            for (let type of specificTypesToResolve) {
                const propertiesToResolve = resolvers[type];
                let e = this.getEntity({
                    describoId: tgtEntity.describoId,
                });
                let properties = e.properties;
                for (let entityProperty of properties) {
                    if (propertiesToResolve.includes(entityProperty.property)) {
                        associations.push({
                            property: entityProperty.property,
                            entity: this.getEntity({
                                describoId: entityProperty.tgtEntityId,
                                loadEntityProperties: false,
                            }),
                        });
                    }
                }
            }
            tgtEntity.associations = associations;
        }
    }

    findMatchingEntities({ limit = 5, query = undefined, type = undefined }) {
        return this.em.find({ limit, query, type });
    }

    addEntity({ entity }) {
        // clone it so we don't intefere with the reference being passed in
        entity = cloneDeep(entity);

        // check there isn't a matching entity already
        let match = this.em.get({ srcEntityId: entity["@id"] });
        if (match && (match?.["@type"] === entity["@type"] || entity["@id"] === "./")) {
            // console.log(match);
            return match;
        } else {
            let { describoId } = this.em.set(entity);
            entity.describoId = describoId;

            this.em.processEntityProperties(entity);
            return entity;
        }
    }

    deleteEntity({ describoId }) {
        this.em.delete({ srcEntityId: describoId });
    }

    updateEntity({ describoId, property, value }) {
        this.em.update({ srcEntityId: describoId, property, value });
    }

    addProperty({ describoId = undefined, property, value }) {
        this.em.setProperty({ srcEntityId: describoId, property, value });
    }

    updateProperty({ describoId, propertyId, value }) {
        // console.debug("Crate Mgr, updateProperty", propertyId, value);
        this.em.updateProperty({ srcEntityId: describoId, propertyId, value });
    }

    deleteProperty({ describoId, propertyId }) {
        console.debug("Crate Mgr, deleteProperty", propertyId);
        this.em.deleteProperty({ srcEntityId: describoId, propertyId });
    }

    linkEntity({ srcEntityId, property, tgtEntityId }) {
        this.em.setProperty({ srcEntityId, property, tgtEntityId });
    }

    unlinkEntity({ srcEntityId, propertyId, property, tgtEntityId }) {
        this.em.deleteProperty({ srcEntityId, propertyId, property, tgtEntityId });
    }

    ingestAndLink({ srcEntityId = undefined, property = undefined, json = {} }) {
        if (!property) throw new Error(`ingestAndLink: 'property' must be defined`);

        let flattened = this.__flatten(json);

        let entities = flattened.map((entity) => {
            let { describoId } = this.em.set(entity);
            entity.describoId = describoId;
            return entity;
        });

        entities.forEach((entity) => {
            this.em.processEntityProperties(entity);
        });
        this.linkEntity({ srcEntityId, property, tgtEntityId: entities[0].describoId });
    }

    __flatten({ json }) {
        json = cloneDeep(json);
        let flattened = [];
        flattened.push(json);
        Object.keys(json).forEach((property) => {
            if (isPlainObject(json[property])) {
                flattened.push(this.__flatten({ json: json[property] }));
                flattened = compact(flattened);
                json[property] = { "@id": json[property]["@id"] };
            } else if (isArray(json[property])) {
                json[property].forEach((instance) => {
                    if (isPlainObject(instance)) flattened.push(this.__flatten({ json: instance }));
                });
                json[property] = json[property].map((instance) => {
                    if (isPlainObject(instance)) return { "@id": instance["@id"] };
                    return instance;
                });
            }
        });
        return compact(flattenDeep(flattened));
    }

    __purgeUnlinkedEntities() {
        let walk = walker.bind(this);
        let linkedEntities = {};
        let rootDataset = this.getEntity({
            describoId: "RootDataset",
            resolveLinkedEntities: false,
        });

        walk(rootDataset);
        function walker(entity) {
            linkedEntities[entity.describoId] = true;
            entity.properties.forEach((p) => {
                if (p.tgtEntityId && !linkedEntities[p.tgtEntityId]) {
                    walk(
                        this.getEntity({ describoId: p.tgtEntityId, resolveLinkedEntities: false })
                    );
                }
            });
        }

        this.em.entities.forEach((entity) => {
            if (!linkedEntities[entity.describoId]) {
                this.em.delete({ srcEntityId: entity.describoId });
            }
        });
    }

    __rehydrateEntity({ describoId }) {
        let entity = this.getEntity({ describoId, groupProperties: true });
        entity["@type"] = entity["@type"].split(", ");

        for (let property of Object.keys(entity.properties)) {
            entity[property] = entity.properties[property].map((p) => {
                if (p.value) return p.value;
                if (p.tgtEntityId) return { "@id": p.tgtEntity["@id"] };
            });
            if (entity[property].length === 1) entity[property] = entity[property][0];
        }
        entity["@reverse"] = {};
        for (let property of Object.keys(entity.reverseConnections)) {
            entity["@reverse"][property] = entity.reverseConnections[property].map((p) => {
                if (p.value) return p.value;
                if (p.tgtEntityId)
                    return { "@id": this.em.get({ srcEntityId: p.srcEntityId })["@id"] };
            });
            if (entity["@reverse"][property].length === 1)
                entity["@reverse"][property] = entity["@reverse"][property][0];
        }

        this.em.describoProperties.forEach((p) => delete entity[p]);
        delete entity.properties;
        delete entity.reverseConnections;
        if (!entity["@reverse"]) entity["@reverse"] = {};
        return entity;
    }
}

export function isURL(value) {
    if (!value) return false;
    if (isNumber(value)) return false;
    if (value.match(/arcp:\/\/name,.*/)) return true;
    if (value.match(/arcp:\/\/uuid,.*/)) return true;
    if (value.match(/arcp:\/\/ni,sha-256;,.*/)) return true;
    return validatorIsURL(value, {
        require_protocol: true,
        protocols: urlProtocols,
    });
}

export function validateId({ id, type }) {
    if (type) {
        // if type matches File then whatever is provided is valid
        type = isArray(type) ? type.join(", ") : type;
        if (type.match(/file/i)) return { isValid: true };
    }

    // @id is relative
    if (id.match(/^\/.*/)) return { isValid: true };

    // @id starting with . is valid
    if (id.match(/^\..*/)) return { isValid: true };

    // @id starting with # is valid
    if (id.match(/^\#.*/)) return { isValid: true };

    // @id with blank node is valid
    if (id.match(/^\_:.*/)) return { isValid: true };

    // arcp URI's are valid
    if (id.match(/arcp:\/\/name,.*/)) return { isValid: true };
    if (id.match(/arcp:\/\/uuid,.*/)) return { isValid: true };
    if (id.match(/arcp:\/\/ni,sha-256;,.*/)) return { isValid: true };

    // otherewise check that the id is a valid IRI
    let result = validateIriPkg.validateIri(id, validateIriPkg.IriValidationStrategy.Strict);
    if (!result) {
        // it's valid
        return { isValid: true };
    } else if (result?.message?.match(/Invalid IRI according to RFC 3987:/)) {
        // otherwise
        const message = `${result.message.replace(
            /Invalid IRI according to RFC 3987:/,
            "Invalid identifier"
        )}. See https://github.com/describo/crate-builder-component/blob/master/README.identifiers.md for more information.`;
        return { isValid: false, message };
    }
}

export class Entity {
    constructor() {
        this.describoProperties = ["describoId"];
        this.coreProperties = [...this.describoProperties, "@id", "@type", "@reverse", "name"];

        this.entities = [];
        this.entitiesBy = {
            atId: {},
            describoId: {},
        };
        this.pm = new Property();
    }

    set(entity) {
        entity = this.__normalise(entity);
        entity = this.__confirmNoClash(entity);

        // if this entity is already on the stack - return it
        let exists = this.__entityExists(entity);
        if (exists) return exists;

        entity = this.coreProperties
            .map((p) => ({ [p]: entity[p] }))
            .reduce((obj, entry) => ({ ...obj, ...entry }));

        const idx = this.entities.push(entity) - 1;
        this.entitiesBy.atId[entity["@id"]] = idx;
        this.entitiesBy.describoId[entity.describoId] = idx;

        return entity;
    }

    update({ srcEntityId, property, value }) {
        if (!["@id", "@type", "name"].includes(property)) {
            throw new Error(`This method can only update '@id', '@type' and 'name' properties`);
        }

        if (property === "@id") {
            let result = validateId({ id: value });
            if (!result.isValid) {
                value = `#${encodeURIComponent(value)}`;
            }
        }
        let idx = this.entitiesBy.describoId[srcEntityId] ?? this.entitiesBy.atId[srcEntityId];

        let entity = {
            ...this.entities[idx],
            [property]: value,
        };
        this.entities[idx] = entity;
    }

    get({ srcEntityId }) {
        const idx = this.entitiesBy.describoId[srcEntityId] ?? this.entitiesBy.atId[srcEntityId];
        if (idx !== undefined) {
            return cloneDeep(this.entities[idx]);
        }
    }

    delete({ srcEntityId }) {
        const idx = this.entitiesBy.describoId[srcEntityId];
        const entity = this.entities[idx];

        let properties = this.pm.get({ srcEntityId });
        properties?.forEach((p) => {
            if (p?.propertyId) this.pm.delete({ srcEntityId, propertyId: p.propertyId });
        });

        delete this.entitiesBy.atId[entity["@id"]];
        delete this.entitiesBy.describoId[entity.describoId];
        delete this.entities[idx];
    }

    processEntityProperties(entity) {
        for (let property of Object.keys(entity)) {
            if (this.coreProperties.includes(property)) continue;

            entity[property] = flattenDeep([entity[property]]);

            for (let instance of entity[property]) {
                if (!isArray(instance) && !isPlainObject(instance)) {
                    this.setProperty({ srcEntityId: entity.describoId, property, value: instance });
                } else if (isPlainObject(instance)) {
                    let tgtEntity = this.get({ srcEntityId: instance["@id"] });
                    if (!tgtEntity) {
                        // we didn't find this entity so inject one - the set method will
                        //  instantiate something relevant
                        tgtEntity = this.set({ "@id": instance["@id"] });
                    }
                    this.setProperty({
                        srcEntityId: entity.describoId,
                        property,
                        tgtEntityId: tgtEntity.describoId,
                    });
                }
            }
        }
    }

    setProperty({ srcEntityId, property, value, tgtEntityId }) {
        this.pm.set({
            srcEntityId,
            property,
            value,
            tgtEntityId,
        });
    }

    getProperty({ srcEntityId, propertyId }) {
        let properties = this.pm.get({ srcEntityId });
        return properties.filter((p) => p.propertyId === propertyId)[0];
    }

    getProperties({ srcEntityId }) {
        let properties = this.pm.get({ srcEntityId });
        return compact(properties);
    }

    updateProperty({ srcEntityId, propertyId, value }) {
        this.pm.update({ srcEntityId, propertyId, value });
    }

    deleteProperty({ srcEntityId, propertyId, property, tgtEntityId }) {
        if (property && tgtEntityId) {
            propertyId = this.pm.get({ srcEntityId, property, tgtEntityId })[0].propertyId;
        }
        this.pm.delete({ srcEntityId, propertyId });
    }

    find({ limit = 5, query = undefined, type = undefined }) {
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
        entities = entities.filter((e) => e.describoId !== "RootDataset");
        return entities.slice(0, limit);
    }

    __entityExists(entity) {
        let idx = this.entitiesBy.atId[entity["@id"]];
        if (idx !== undefined) return this.entities[idx];
        return false;
    }

    __confirmNoClash(entity) {
        let idx = this.entitiesBy.atId[entity["@id"]];
        if (idx !== undefined && entity["@id"] !== "./") {
            let entityLookup = this.entities[idx];
            if (entityLookup["@type"] !== entity["@type"]) {
                const id = `#${createId()}`;
                entity["@id"] = id;
                entity.describoId = id;
            }
        }
        return entity;
    }

    __normalise(entity) {
        const id = `#${createId()}`;
        if (
            !isString(entity["@type"]) &&
            !isArray(entity["@type"]) &&
            !isUndefined(entity["@type"])
        ) {
            throw new Error(`'@type' property must be a string or an array or not defined at all`);
        }
        if (isUndefined(entity["@id"])) {
            // set it to the generated describoId
            entity["@id"] = id;
        } else if (!isString(entity["@id"])) {
            throw new Error(`'@id' property must be a string`);
        } else if (entity["@id"] && entity["@type"]) {
            // there is an @id - is it valid?
            let { isValid } = validateId({ id: entity["@id"], type: entity["@type"] });
            if (!isValid) entity["@id"] = `#${encodeURIComponent(entity["@id"])}`;
        } else if (entity["@id"] && !entity["@type"]) {
            // there is an @id - is it valid?
            let { isValid } = validateId({ id: entity["@id"] });
            if (!isValid) entity["@id"] = `#${encodeURIComponent(entity["@id"])}`;
        }

        // is there a name?
        if (!entity.name) entity.name = entity["@id"].replace(/^#/, "");

        // if no @type then set to URL or Thing
        if (!entity["@type"]) entity["@type"] = isURL(entity["@id"]) ? "URL" : "Thing";

        // set type as string if it's an array
        if (isArray(entity["@type"])) entity["@type"] = entity["@type"].join(", ");

        if (!entity.describoId) entity.describoId = id.replace("#", "");
        return entity;
    }
}

export class Property {
    constructor() {
        this.properties = [];
        this.propertiesByEntityId = {};
        this.lookup = {};
    }

    set({ srcEntityId, property, value, tgtEntityId }) {
        this.__addLookupEntry({ srcEntityId, property, value, tgtEntityId });

        // if this property is an association and is already on the stack - return it
        if (tgtEntityId) {
            let exists = this.__propertyExists({ srcEntityId, property, value, tgtEntityId });
            if (exists) return exists;
        }

        // otherwise create the property and push it onto the stack
        let data = {
            propertyId: createId(),
            srcEntityId,
            property,
            value,
            tgtEntityId,
        };
        const idx = this.properties.push(data) - 1;

        // init the entity entry in propertiesByEntityId
        //  and push a reference to the property
        if (!this.propertiesByEntityId[srcEntityId]) this.propertiesByEntityId[srcEntityId] = [];
        this.propertiesByEntityId[srcEntityId].push(idx);

        if (value) {
            this.lookup[srcEntityId][property][value] = idx;
        } else if (tgtEntityId) {
            // this is a linking property
            // init the entity entry in propertiesByEntityId
            //  and push a reference to the property
            if (!this.propertiesByEntityId[tgtEntityId])
                this.propertiesByEntityId[tgtEntityId] = [];
            this.propertiesByEntityId[tgtEntityId].push(idx);
            this.lookup[srcEntityId][property][tgtEntityId] = idx;
        }

        return data;
    }

    get({ srcEntityId }) {
        return (
            cloneDeep(this.propertiesByEntityId[srcEntityId]?.map((idx) => this.properties[idx])) ??
            []
        );
    }

    update({ srcEntityId, propertyId, value }) {
        let properties = this.propertiesByEntityId[srcEntityId];

        // find the index of the property in the properties array
        let propertyIndex;
        properties.forEach((idx) => {
            if (this.properties[idx].propertyId === propertyId) {
                propertyIndex = idx;
            }
        });

        // update the property value
        this.properties[propertyIndex].value = value;
    }

    delete({ srcEntityId, propertyId }) {
        let propertiesToKeep = [];
        for (let idx of this.propertiesByEntityId[srcEntityId]) {
            const property = this.properties[idx];
            if (property) {
                if (property.propertyId !== propertyId) {
                    propertiesToKeep.push(idx);
                    continue;
                }
                if (property.tgtEntityId) {
                    const tgtEntityId = property.tgtEntityId;
                    this.propertiesByEntityId[tgtEntityId] = this.propertiesByEntityId[
                        tgtEntityId
                    ].filter((idx) => {
                        const property = this.properties[idx];
                        if (property.propertyId !== propertyId) return idx;
                    });
                    if (isEmpty(this.propertiesByEntityId[tgtEntityId])) {
                        delete this.propertiesByEntityId[tgtEntityId];
                    }
                    delete this.lookup[srcEntityId]?.[property?.property]?.[tgtEntityId];
                }
                delete this.properties[idx];
            }
        }
        this.propertiesByEntityId[srcEntityId] = propertiesToKeep;
        if (isEmpty(this.propertiesByEntityId[srcEntityId])) {
            delete this.propertiesByEntityId[srcEntityId];
        }
    }

    __addLookupEntry({ srcEntityId, property, value, tgtEntityId }) {
        if (!this.lookup[srcEntityId]) {
            this.lookup[srcEntityId] = {
                [property]: {
                    [value]: undefined,
                    [tgtEntityId]: undefined,
                },
            };
        }
        if (!this.lookup[srcEntityId][property]) {
            this.lookup[srcEntityId][property] = {
                [value]: undefined,
                [tgtEntityId]: undefined,
            };
        }
    }

    __propertyExists({ srcEntityId, property, value, tgtEntityId }) {
        if (this.lookup[srcEntityId][property][value] !== undefined) {
            const idx = this.lookup[srcEntityId][property][value];
            return this.properties[idx];
        } else if (this.lookup[srcEntityId][property][tgtEntityId] !== undefined) {
            const idx = this.lookup[srcEntityId][property][tgtEntityId];
            return this.properties[idx];
        } else {
            return false;
        }
    }
}
