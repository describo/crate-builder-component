import isString from "lodash-es/isString.js";
import isNumber from "lodash-es/isNumber.js";
import isArray from "lodash-es/isArray.js";
import isPlainObject from "lodash-es/isPlainObject.js";
import isUndefined from "lodash-es/isUndefined.js";
import isBoolean from "lodash-es/isBoolean.js";
import cloneDeep from "lodash-es/cloneDeep.js";
import flattenDeep from "lodash-es/flattenDeep.js";
import compact from "lodash-es/compact.js";
import uniq from "lodash-es/uniq.js";
import intersection from "lodash-es/intersection";
import validatorIsURL from "validator/es/lib/isURL.js";
import validateIriPkg from "./lib/validate-iri";

const urlProtocols = ["http", "https", "ftp", "ftps"];
export class CrateManager {
    constructor() {
        this.em = new Entity();
    }
    async load({ crate, profile }) {
        this.verify({ crate });
        this.profile = profile;
        this.context = crate["@context"];

        let errors = [];
        let warnings = [];
        this.rootDescriptor;
        let entities = [];

        // console.log("Total entities", crate["@graph"].length);
        // console.time();

        // check that the incoming entities look ok
        for (let i = 0; i < crate["@graph"].length; i++) {
            const entity = crate["@graph"][i];
            if (entity["@id"] === "ro-crate-metadata.json") {
                this.rootDescriptor = { ...entity };
            } else {
                // ensure every entity has a defined type
                if (!entity?.["@type"]) {
                    errors.push({
                        message: `The entity does not have '@type' defined.`,
                        entity,
                    });
                    continue;
                }

                // then see if @id is a valid identifier
                if (entity?.["@id"].match(/\s+/)) {
                    warnings.push(
                        `Entity @id: '${entity["@id"]}' has spaces in it. These should be encoded. Describo will do this to pass the validate test but the data will not be changed.`
                    );
                }
                let { isValid, message } = validateId({ id: entity["@id"], type: entity["@type"] });
                if (!isValid) {
                    errors.push({
                        message,
                        entity,
                    });
                    continue;
                }

                entities.push(entity);
            }
        }

        // ingest the entities
        for (let entity of entities) {
            if (entity["@id"] === this.rootDescriptor.about["@id"]) {
                entity["@id"] = "./";
            }

            entity = this.em.setEntity(entity);
        }
        this.em.createMissingEntities();
        this.rootDescriptor.about = { "@id": "./" };

        return { warnings, errors };
        // console.timeEnd();
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
        crate["@graph"] = [cloneDeep(this.rootDescriptor), ...this.em.getEntities({})];
        return crate;
    }

    exportEntityTemplate({ id }) {
        let entity = this.getEntity({ id });

        for (let property of Object.keys(entity["@properties"])) {
            entity[property] = entity["@properties"][property]
                .filter((p) => p.value)
                .map((p) => p.value);
            if (entity[property].length === 0) {
                delete entity[property];
            } else if (entity[property].length === 1) {
                entity[property] = entity[property][0];
            }
        }
        delete entity["@properties"];
        delete entity["@reverse"];

        return entity;
    }

    getRootDataset(config) {
        const stub = config?.stub ? config.stub : false;
        if (this.rootDescriptor?.about?.["@id"]) {
            return this.getEntity({ id: this.rootDescriptor.about["@id"], stub });
        } else {
            return {};
        }
    }

    getEntities({ limit = 5, query = undefined, type = undefined }) {
        return this.em.getEntities({ limit, query, type });
    }

    getEntity({ id, stub = false, resolveLinkedEntityAssociations = true }) {
        let entity;
        if (stub) {
            entity = this.em.getEntityStub(id);
        } else {
            entity = this.em.getEntity({ id });
            if (this?.profile?.resolve && resolveLinkedEntityAssociations) {
                this._resolveLinkedEntityAssociations({ entity });
            }
        }

        return entity;
    }

    setEntity({ entity }) {
        // clone it so we don't intefere with the reference being passed in
        entity = cloneDeep(entity);
        entity = normaliseEntityType({ entity });

        // check there isn't a matching entity already
        let match = this.em.getEntity({ id: entity["@id"] });

        if (isMatchingEntity(entity, match)) {
            return match;
        }
        return this.em.setEntity(entity);
    }

    updateEntity({ id, property, value }) {
        if (!id) throw new Error(`'updateEntity' requires 'id' to be defined`);
        if (!["@id", "@type", "name"].includes(property)) return;
        if (property === "@id") {
            this.em.updateEntityId({ id, value });
        } else if (property === "@type") {
            this.em.updateEntityType({ id, value });
        } else if (property === "name") {
            this.em.updateEntityName({ id, value });
        }
    }

    deleteEntity({ id }) {
        this.em.deleteEntity({ id });
    }

    linkEntity({ id = undefined, property, tgtEntityId }) {
        if (!id) throw new Error(`'linkEntity' requires 'id' to be defined`);
        if (!property) throw new Error(`'linkEntity' requires 'property' to be defined`);
        if (!tgtEntityId) throw new Error(`'linkEntity' requires 'tgtEntityId' to be defined`);
        this.em.setProperty({ id, property, tgtEntityId });
    }

    unlinkEntity({ id = undefined, property, tgtEntityId }) {
        if (!id) throw new Error(`'unlinkEntity' requires 'id' to be defined`);
        if (!property) throw new Error(`'unlinkEntity' requires 'property' to be defined`);
        if (!tgtEntityId) throw new Error(`'unlinkEntity' requires 'tgtEntityId' to be defined`);
        this.em.unlinkEntity({ id, property, tgtEntityId });
    }

    ingestAndLink({ id = undefined, property = undefined, json = {} }) {
        if (!id) throw new Error(`ingestAndLink: 'id' must be defined`);
        if (!property) throw new Error(`ingestAndLink: 'property' must be defined`);

        let flattened = this._flatten(json);
        flattened = flattened.map((entity) => {
            return this.em.setEntity(entity);
        });

        this.linkEntity({ id, property, tgtEntityId: flattened[0]["@id"] });
    }

    setProperty({ id = undefined, property, value, tgtEntityId }) {
        if (!id) throw new Error(`'setProperty' requires 'id' to be defined`);
        this.em.setProperty({ id, property, value, tgtEntityId });
    }

    updateProperty({ id = undefined, property, idx, value }) {
        if (!id) throw new Error(`'updateProperty' requires 'id' to be defined`);
        this.em.updateProperty({ id, property, idx, value });
    }

    deleteProperty({ id = undefined, property, propertyIdx }) {
        if (["@id", "@type", "name", "@reverse"].includes(property)) {
            throw new Error(`You aren't allowed to delete '${property}'`);
        }
        if (!id) throw new Error(`'deleteProperty' requires 'id' to be defined`);
        this.em.deleteProperty({ id, property, propertyIdx });
    }

    purgeUnlinkedEntities() {
        this.em.purgeUnlinkedEntities();
    }

    _flatten(json) {
        if (!isPlainObject(json)) {
            throw new Error(`_flatten only takes an object.`);
        }
        json = cloneDeep(json);
        let flattened = [];
        flattened.push(json);
        for (let property of Object.keys(json)) {
            if (["@id", "@type", "name"].includes(property)) continue;
            if (!isArray(json[property])) json[property] = [json[property]];
            json[property].forEach((instance) => {
                if (isPlainObject(instance)) flattened.push(this._flatten(instance));
            });
            json[property] = json[property].map((instance) => {
                if (isPlainObject(instance)) return { "@id": instance["@id"] };
                return instance;
            });
        }
        return compact(flattenDeep(flattened));
    }

    _resolveLinkedEntityAssociations({ entity }) {
        let resolveConfiguration = this.profile.resolve;
        const resolvers = {};
        resolveConfiguration.forEach((c) => {
            c.types.forEach((type) => {
                resolvers[type] = c.properties;
            });
        });
        const typesToResolve = Object.keys(resolvers);
        for (let property of Object.keys(entity["@properties"])) {
            entity["@properties"][property] = entity["@properties"][property].map((instance) => {
                if (!instance.tgtEntity) return instance;

                // for all entities linked of the source entity
                //   if the type matches the `resolveConfiguration`
                const specificTypesToResolve = intersection(
                    typesToResolve,
                    instance.tgtEntity["@type"]
                );
                const resolveAssociations = specificTypesToResolve.length > 0;
                if (resolveAssociations) {
                    // lookup the full entity
                    let instanceFullEntity = this.getEntity({
                        id: instance.tgtEntity["@id"],
                        resolveLinkedEntityAssociations: false,
                    });
                    // get the list of properties to resolve
                    const propertiesToResolve = flattenDeep(
                        specificTypesToResolve.map((type) => resolvers[type])
                    );
                    // for each property, resolve all the attached entities
                    //  and store in the associations array on the source
                    propertiesToResolve.forEach((property) => {
                        instance.tgtEntity.associations.push(
                            ...instanceFullEntity["@properties"][property].map((e) => ({
                                property,
                                entity: e.tgtEntity,
                            }))
                        );
                    });
                }
                return instance;
            });
        }
    }
}

export function isMatchingEntity(source, target) {
    if (!source || !target) return false;
    let sourceType = [...source["@type"]].sort();
    let targetType = [...target["@type"]].sort();
    return source["@id"] === target["@id"] && sourceType === targetType;
}

export function isURL(value) {
    if (!value) return false;
    if (isNumber(value)) return false;
    if (isBoolean(value)) return false;
    if (value.match(/arcp:\/\/name,.*/)) return true;
    if (value.match(/arcp:\/\/uuid,.*/)) return true;
    if (value.match(/arcp:\/\/ni,sha-256;,.*/)) return true;
    return validatorIsURL(value, {
        require_protocol: true,
        protocols: urlProtocols,
    });
}

export function validateId({ id, type }) {
    if (!id) {
        return { isValid: false };
    }
    if (type) {
        // if type matches File then whatever is provided is valid
        type = isArray(type) ? type.join(", ") : type;
        if (type.match(/file/i)) return { isValid: true };
    }

    // if there are spaces in the id - encode them
    if (id.match(/\s+/)) {
        id = id.replace(/\s+/g, "%20");
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
    // return { isValid: true };

    // if there are spaces in the id - then it's invalid no matter what it is
    // if (id.match(/\s+/)) {
    //     return {
    //         isValid: false,
    //         message: `'@id' contains spaces`,
    //     };
    // }

    // otherwise check that the id is a valid IRI
    try {
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
    } catch (error) {
        return { isValid: false };
    }
}

export function normaliseEntityType({ entity }) {
    if (!entity["@type"]) entity["@type"] = isURL(entity["@id"]) ? ["URL"] : ["Thing"];

    if (isArray(entity["@type"])) return entity;
    if (isBoolean(entity["@type"] || isNumber(entity["@type"]))) {
        entity["@type"] = ["" + entity["@type"]];
    }
    if (isString(entity["@type"]))
        entity["@type"] = entity["@type"].split(",").map((t) => t.trim());
    return entity;
}

export class Entity {
    constructor() {
        this.coreProperties = ["@id", "@type", "@reverse", "@properties", "name"];

        // an array of entities in the crate
        this.entities = [];

        // a mapping of entity id to index in the #entities array
        this.entitiesById = new Map();

        // a mapping of reverse links to entities keyed on entityId and property, e.g.:
        //  #reverse = {
        //      "#person1": {
        //          author: ["./"]
        //      }
        //  }
        this.reverse = {};

        // keep track of all entity @id's so we can add missing entities after load
        this.entityIdentifiers = new Map();
    }

    getEntities({ limit, query = undefined, type = undefined }) {
        if (query) {
            query = query.toLowerCase();
        }
        if (type === "ANY") type = undefined;
        let entities;
        if (query || type) {
            entities = this.entities.filter((e) => {
                if (!e) return e;
                let eid = e["@id"].toLowerCase();
                let etype = isArray(e["@type"])
                    ? e["@type"].join(", ").toLowerCase()
                    : e["@type"].toLowerCase();
                let name = e.name.toLowerCase();
                if (type && !query) {
                    type = type.toLowerCase();
                    return etype.match(type);
                } else if (query && !type) {
                    return eid.match(query) || name.match(query);
                } else if (query && type) {
                    type = type.toLowerCase();
                    return etype.match(type) && (eid.match(query) || name.match(query));
                } else {
                    return e;
                }
            });
        } else {
            entities = [...this.entities];
        }

        if (limit) {
            entities = entities.slice(0, limit);
        }
        entities = entities.map((entity) => {
            if (!entity) return;
            entity = this._getEntity({ id: entity["@id"] });
            entity = this._cleanup(entity);
            entity = this._joinReverseLinks(entity, true);
            return entity;
        });
        return compact(entities);
    }

    getEntity({ id, exportForm = false }) {
        let entity = this._getEntity({ id });
        if (entity) {
            if (exportForm) {
                entity = this._cleanup(entity);
                entity = this._joinReverseLinks(entity, true);
                return entity;
            } else {
                // group properties under an @properties key
                entity["@properties"] = {};
                for (let property of Object.keys(entity)) {
                    let i = -1;
                    if (this.coreProperties.includes(property)) continue;
                    entity["@properties"][property] = entity[property].map((p) => {
                        i++;
                        if (p?.["@id"]) {
                            let tgtEntity = this.getEntityStub(p["@id"]) ?? {};
                            // let tgtEntity = {};
                            tgtEntity.associations = [];
                            return { idx: i, tgtEntity };
                        } else {
                            return { idx: i, property, value: p };
                        }
                    });
                    delete entity[property];
                }

                //  if this entity has reverse links to it - join them in
                entity = this._joinReverseLinks(entity);
                return entity;
            }
        }
    }

    getEntityStub(id) {
        let idx = this.entitiesById.get(id);
        if (idx !== undefined && this.entities[idx]) {
            let e = {};
            ["@id", "@type", "name"].forEach((p) => {
                e[p] = this.entities[idx][p];
            });
            return e;
        }
    }

    setEntity(entity) {
        entity = cloneDeep(entity);

        // ensure the entity data is sensible
        entity = this._normalise(entity, `e${this.entities.length}`);
        entity = this._confirmNoClash(entity);

        // if this entity is already on the stack - return it
        let exists = this._getEntity({ id: entity["@id"] });
        if (exists) return exists;

        // set all properties, other than core props, to array
        for (let property of Object.keys(entity)) {
            if (this.coreProperties.includes(property)) continue;
            if (!isArray(entity[property])) entity[property] = [entity[property]];
        }

        // push the entity onto the stack and add an index reference to it
        const idx = this.entities.push(entity) - 1;
        this.entitiesById.set(entity["@id"], idx);

        // create all the reverse links back to this entity
        //  and track all of the associations so we can create the
        //  the missing entities
        this._indexAssociations({ entity });

        return entity;
    }

    updateEntityId({ id, value }) {
        let { isValid } = validateId({ id: value });
        if (!isValid) value = `#${encodeURIComponent(value)}`;

        const originalId = id;
        const newId = value;

        let entityIdx = this.entitiesById.get(originalId);
        this.entities[entityIdx]["@id"] = newId;
        this.entitiesById.set(newId, entityIdx);
        this.reverse[newId] = cloneDeep(this.reverse[originalId]);

        // walk all the reverse links from this entity
        //   update all of the forward links back to it
        if (this.reverse[newId]) {
            for (let [property, entityIds] of Object.entries(this.reverse[newId])) {
                for (let entityId of entityIds) {
                    // get the related entity
                    let relatedEntityIdx = this.entitiesById.get(entityId);

                    // find the reference to the old id and update it
                    this.entities[relatedEntityIdx][property] = this.entities[relatedEntityIdx][
                        property
                    ].map((instance) => {
                        if (instance?.["@id"] === originalId) return { "@id": newId };
                        return instance;
                    });
                }
            }
        }

        // walk the properties of this entity
        //   update the reverse links back to it
        const entity = this.entities[entityIdx];
        for (let [property, instances] of Object.entries(entity)) {
            if (this.coreProperties.includes(property)) continue;
            for (let instance of instances) {
                if (instance?.["@id"]) {
                    // push the new id
                    this.reverse[instance["@id"]][property].push(newId);

                    // remove the original id
                    this.reverse[instance["@id"]][property] = this.reverse[instance["@id"]][
                        property
                    ].filter((id) => id !== originalId);

                    // ensure there are no duplicates
                    this.reverse[instance["@id"]][property] = uniq(
                        this.reverse[instance["@id"]][property]
                    );
                }
            }
        }

        delete this.reverse[originalId];
        delete this.entitiesById.delete[id];
    }

    updateEntityType({ id, value }) {
        const idx = this.entitiesById.get(id);
        this.entities[idx]["@type"] = uniq(value);
    }

    updateEntityName({ id, value }) {
        const idx = this.entitiesById.get(id);
        this.entities[idx].name = value;
    }

    deleteEntity({ id }) {
        const idx = this.entitiesById.get(id);
        if (idx !== undefined) {
            let entity = this.entities[idx];

            // use #reverse to update all of the entities that link to this one
            if (this.reverse[entity["@id"]]) {
                for (let [property, values] of Object.entries(this.reverse[entity["@id"]])) {
                    values.forEach((id) => {
                        this.unlinkEntity({ id, property, tgtEntityId: entity["@id"] });
                    });
                }
            }

            // then - set the entity to null in the @entities map
            this.entities[idx] = null;

            // and wipe it from the index
            this.entitiesById.delete(entity["@id"]);
        }
    }

    createMissingEntities() {
        for (let [id] of this.entityIdentifiers) {
            let idx = this.entitiesById.get(id);
            if (idx === undefined) {
                this.setEntity({ "@id": id });
            }
        }
    }

    updateProperty({ id, property, idx, value }) {
        const propertyIdx = idx;
        idx = this.entitiesById.get(id);
        if (idx !== undefined) {
            this.entities[idx][property][propertyIdx] = value;
        }
    }

    setProperty({ id, property, value = undefined, tgtEntityId = undefined }) {
        const idx = this.entitiesById.get(id);

        if (!this.entities[idx][property]) this.entities[idx][property] = [];
        // if a value then push onto the stack
        if (value) {
            this.entities[idx][property].push(value);
            return;
        }

        // if a link to another entity
        if (tgtEntityId) {
            let exists =
                this.entities[idx][property].filter((v) => v?.["@id"] === tgtEntityId).length > 0;
            if (exists) return;

            // push onto the stack if not exists
            this.entities[idx][property].push({ "@id": tgtEntityId });

            // setup the reverse link
            if (!this.reverse[tgtEntityId]) {
                this.reverse[tgtEntityId] = {};
            }
            if (!this.reverse[tgtEntityId][property]) {
                this.reverse[tgtEntityId][property] = [];
            }
            this.reverse[tgtEntityId][property].push(id);
            // console.log(this.#reverse[tgtEntityId], property, this.#reverse[tgtEntityId][property]);
        }
        // console.log("#reverse : set property", JSON.stringify(this.#reverse, null, 2));
    }

    deleteProperty({ id, property, propertyIdx }) {
        if (this.coreProperties.includes(property)) {
            throw new Error(`You aren't allowed to delete '${property}'`);
        }
        let idx = this.entitiesById.get(id);
        if (idx !== undefined) {
            let entity = cloneDeep(this.entities[idx]);
            let removedProperty = entity[property].splice(propertyIdx, 1)[0];
            if (!entity[property].length) delete entity[property];
            this.entities[idx] = entity;

            // if this is a linking property, use it to update the reverse links
            //   of that entity which is linked here
            if (removedProperty["@id"]) {
                this.reverse[removedProperty["@id"]][property] = this.reverse[
                    removedProperty["@id"]
                ][property].filter((i) => i !== id);
                if (this.reverse[removedProperty["@id"]][property].length === 0) {
                    delete this.reverse[removedProperty["@id"]][property];
                }
            }
        }
    }

    unlinkEntity({ id, property, tgtEntityId }) {
        let idx = this.entitiesById.get(id);
        if (idx !== undefined) {
            let entity = cloneDeep(this.entities[idx]);
            entity[property] = entity[property].filter((instance) => {
                if (!isPlainObject(instance)) return instance;
                if (isPlainObject(instance) && "@id" in instance && instance["@id"] !== tgtEntityId)
                    return instance;
            });
            if (entity[property].length === 0) delete entity[property];
            this.entities[idx] = entity;
        }

        this.reverse[tgtEntityId][property] = this.reverse[tgtEntityId][property].filter(
            (i) => i != id
        );
    }

    purgeUnlinkedEntities() {
        let linkedEntities = { "./": true };
        let idx = this.entitiesById.get("./");
        if (idx !== undefined) {
            let entity = this.entities[idx];
            walker = walker.bind(this);
            walker(entity);

            this.entities = this.entities.map((entity) => {
                if (!entity) return null;
                if (!linkedEntities[entity["@id"]]) return null;
                return entity;
            });
        }
        function walker(entity) {
            linkedEntities[entity["@id"]] = true;
            for (let property of Object.keys(entity)) {
                if (this.coreProperties.includes(property)) continue;
                entity[property].forEach((instance) => {
                    if (instance?.["@id"] && !linkedEntities[instance["@id"]]) {
                        let idx = this.entitiesById.get(instance["@id"]);
                        if (idx !== undefined) {
                            let entity = this.entities[idx];
                            walker(entity);
                        }
                    }
                });
            }
        }
        // this.entities = this.entities.map((entity) => {
        //     if (!entity) return null;
        //     if (entity["@id"] === "./") return entity;
        //     if (!this.reverse[entity["@id"]]) return null;

        //     let connections = Object.keys(this.reverse[entity["@id"]]).map(
        //         (property) => this.reverse[entity["@id"]][property]
        //     );
        //     connections = flattenDeep(connections);
        //     connections = compact(connections);

        //     let intermediatesKnown = connections.map((id) => {
        //         let e = this.getEntityStub(id);
        //         if (!e || !this.reverse[e["@id"]]) return id;
        //         let c = Object.keys(this.reverse[e["@id"]]).map(
        //             (property) => this.reverse[e["@id"]][property]
        //         );
        //         c = flattenDeep(c);
        //         c = compact(c);
        //         return c;
        //     });
        //     intermediatesKnown = flattenDeep(intermediatesKnown);
        //     return connections.length && intermediatesKnown.length ? entity : null;
        // });
    }

    _getEntity({ id }) {
        let idx = this.entitiesById.get(id);
        if (idx !== undefined) {
            return cloneDeep(this.entities[idx]);
        }
        return false;
    }

    _cleanup(entity) {
        for (let property of Object.keys(entity)) {
            if (["@id", "@type", "name"].includes(property)) continue;
            if (entity[property].length === 1) {
                entity[property] = entity[property][0];
            } else if (entity[property].length === 0) {
                delete entity[property];
            }
        }
        return entity;
    }

    _confirmNoClash(entity) {
        let idx = this.entitiesById.get(entity["@id"]);
        if (idx === undefined || entity["@id"] === "./") return entity;

        let entityLookup = this.entities[idx];
        if (entityLookup["@type"] !== entity["@type"]) {
            const id = `e${this.entities.length}`;
            entity["@id"] = `#${id}`;
        }
        return entity;
    }

    _indexAssociations({ entity }) {
        // remove the context entity id from the map tracking
        //  all id's as we don't need to create this entity
        if (this.entityIdentifiers.has(entity["@id"])) {
            this.entityIdentifiers.delete(entity["@id"]);
        }

        this._walkProperties(entity, (instance, property) => {
            // Create the @reverse links from the referenced entities
            //   back to this one - the context entity
            if (!this.reverse[instance["@id"]]) {
                this.reverse[instance["@id"]] = {};
            }
            if (!this.reverse[instance["@id"]][property]) {
                this.reverse[instance["@id"]][property] = [];
            }
            this.reverse[instance["@id"]][property].push(entity["@id"]);

            // keep track of all entity identifiers referenced from this entity
            //   so that we can go through and create stub entries for anything not
            //   in the crate. This is typically URL references outside the create
            //   which we can create as URL entities so that we have a
            //   referentially complete graph.
            this.entityIdentifiers.set(instance["@id"], true);
        });
    }

    _joinReverseLinks(entity, stubEntry = false) {
        if (this.reverse[entity["@id"]]) {
            entity["@reverse"] = {};
            for (let [property, values] of Object.entries(this.reverse[entity["@id"]])) {
                entity["@reverse"][property] = values.map((t) => {
                    let tgtEntity = this.getEntityStub(t);
                    if (!tgtEntity) return null;
                    if (stubEntry) {
                        return { "@id": tgtEntity["@id"] };
                    } else {
                        return {
                            ...tgtEntity,
                        };
                    }
                });
                entity["@reverse"][property] = compact(entity["@reverse"][property]);
                if (entity["@reverse"][property].length === 0) delete entity["@reverse"][property];
                if (stubEntry && entity["@reverse"][property]) {
                    if (entity["@reverse"][property].length === 1)
                        entity["@reverse"][property] = entity["@reverse"][property][0];
                }
            }
        }
        return entity;
    }

    _normalise(entity, id) {
        if (
            !isString(entity["@type"]) &&
            !isArray(entity["@type"]) &&
            !isUndefined(entity["@type"])
        ) {
            throw new Error(`'@type' property must be a string or an array or not defined at all`);
        }
        if (isUndefined(entity["@id"])) {
            // set it to the generated id
            entity["@id"] = `#${id}`;
        } else if (!isString(entity["@id"])) {
            throw new Error(`'@id' property must be a string`);
        }

        //  normalise the entity['@type']
        entity = normaliseEntityType({ entity });

        // there is an @id - is it valid?
        let { isValid } = validateId({ id: entity["@id"], type: entity["@type"] });
        if (!isValid) entity["@id"] = `#${encodeURIComponent(entity["@id"])}`;

        // is there a name?
        if (!entity.name) entity.name = entity["@id"].replace(/^#/, "");

        // if the name is an array join it back into a string
        if (isArray(entity.name)) entity.name = entity.name.join(" ");

        return entity;
    }

    _walkProperties(entity, fn) {
        for (let property of Object.keys(entity)) {
            if (this.coreProperties.includes(property)) continue;
            for (let instance of entity[property]) {
                if (isPlainObject(instance) && instance["@id"]) {
                    fn(instance, property);
                }
            }
        }
    }
}
