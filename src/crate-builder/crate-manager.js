import { v4 as uuid } from "uuid";
import {
    isString,
    isArray,
    isPlainObject,
    isEmpty,
    groupBy,
    cloneDeep,
    flattenDeep,
    compact,
} from "lodash";
import { isURL } from "validator";
const urlProtocols = ["http", "https", "ftp", "ftps", "arcp"];

export class CrateManager {
    constructor() {
        this.describoProperties = ["describoId", "describoLabel"];
        this.coreProperties = ["describoId", "describoLabel", "@id", "@type", "name"];
        this.entities = [];
        this.properties = [];
        this.currentEntity = undefined;
    }
    load({ crate, profile }) {
        this.verify({ crate });
        this.profile = profile;
        this.context = crate["@context"];

        // store root descriptor as found
        this.rootDescriptor = crate["@graph"].filter(
            (e) => e["@id"] === "ro-crate-metadata.json" && e["@type"] === "CreativeWork"
        )[0];
        // filter root descriptor from the graph
        let graph = crate["@graph"]
            .filter(
                (e) => !(e["@id"] === "ro-crate-metadata.json" && e["@type"] === "CreativeWork")
            )
            .map((e) => {
                // mark root dataset
                return e["@id"] === this.rootDescriptor.about["@id"]
                    ? { describoLabel: "RootDataset", ...e, "@id": "./" }
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

    exportCrate({ purgeUnlinkedEntities = true }) {
        let propertiesGroupedBySrcId, propertiesGroupedByTgtId;
        if (purgeUnlinkedEntities) {
            propertiesGroupedBySrcId = groupBy(this.properties, "srcEntityId");
            propertiesGroupedByTgtId = groupBy(this.properties, "tgtEntityId");
        }
        let crate = {
            "@context": cloneDeep(this.context),
            "@graph": [cloneDeep(this.rootDescriptor)],
        };
        this.entities.forEach((entity) => {
            if (purgeUnlinkedEntities) {
                let rootDataset = this.getRootDataset();
                if (
                    propertiesGroupedBySrcId[entity.describoId]?.length ||
                    propertiesGroupedByTgtId[entity.describoId]?.length ||
                    entity.describoId === rootDataset.describoId
                ) {
                    entity = this.rehydrateEntity({ entity });
                    crate["@graph"].push(entity);
                }
            } else {
                entity = this.rehydrateEntity({ entity });
                crate["@graph"].push(entity);
            }
        });
        return crate;
    }

    exportEntityTemplate({ describoId }) {
        let entity = this.getEntity({ describoId });
        entity = this.rehydrateEntity({ entity });

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

    rehydrateEntity({ entity }) {
        entity = cloneDeep(entity);
        // map in the entity properties
        let properties = this.getEntityProperties({ describoId: entity.describoId });
        properties = groupBy(properties, "property");
        for (let property of Object.keys(properties)) {
            entity[property] = [];
            properties[property].forEach((instance) => {
                if (instance.tgtEntityId) {
                    let targetEntity = this.__lookupEntityByDescriboId({
                        id: instance.tgtEntityId,
                    });
                    entity[property].push({
                        "@id": targetEntity ? targetEntity["@id"] : instance.value,
                    });
                } else {
                    entity[property].push(instance.value);
                }
            });
            if (entity[property].length === 1) entity[property] = entity[property][0];
        }

        // map in the reverse property links
        entity["@reverse"] = {};
        let reverseProperties = this.getEntityReverseConnections({
            describoId: entity.describoId,
        });
        reverseProperties = groupBy(reverseProperties, "property");
        for (let property of Object.keys(reverseProperties)) {
            entity["@reverse"][property] = [];
            reverseProperties[property].forEach((instance) => {
                let referencedEntity = this.entitiesByDescriboId[instance.srcEntityId][0];
                entity["@reverse"][property].push({ "@id": referencedEntity["@id"] });
            });
            if (entity["@reverse"][property].length === 1)
                entity["@reverse"][property] = entity["@reverse"][property][0];
        }

        this.describoProperties.forEach((p) => delete entity[p]);
        return entity;
    }

    getRootDataset() {
        let e = this.entities.filter((e) => e.describoLabel === "RootDataset")[0];
        return this.getEntity({ describoId: e.describoId });
    }

    getEntity({ id, describoId }) {
        let entity;
        if (id) entity = this.__lookupEntityByAtId({ id });
        if (describoId) entity = this.__lookupEntityByDescriboId({ id: describoId });
        if (entity?.describoId) {
            entity.properties = this.getEntityProperties({
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
        let properties = this.properties.filter((p) => p.srcEntityId === describoId);
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
        let entities = this.entities.filter((e) => {
            let eid = e["@id"].toLowerCase();
            let etype = isArray(e["@type"])
                ? e["@type"].join(", ").toLowerCase()
                : e["@type"].toLowerCase();
            type = type.toLowerCase();
            if (type && !query) {
                return etype.match(type);
            } else if (query && !type) {
                return eid.match(query) || e.name.match(query);
            } else if (query && type) {
                return etype.match(type) && (eid.match(query) || e.name.match(query));
            }
        });
        entities = entities.filter((e) => e.describoLabel !== "RootDataset");
        return entities.slice(0, limit);
    }

    addEntity({ entity }) {
        // check there isn't an entity wth that @id already
        let match = this.__lookupEntityByAtId({ id: entity["@id"] });
        if (match) {
            return match;
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

    flattenAndIngest({ json }) {
        let flattened = this.flatten({ json });
        const rootDataset = this.getRootDataset();

        let entities = flattened.map((entity) => {
            return this.__addEntity({ entity });
        });
        this.__index();

        entities.forEach((entity) => {
            this.__processProperties({ entity });
        });
        this.linkEntity({
            srcEntityId: rootDataset.describoId,
            tgtEntityId: entities[0].describoId,
            property: "language",
        });
    }

    __index() {
        this.entitiesByAtId = groupBy(this.entities, "@id");
        this.entitiesByType = groupBy(this.entities, "@type");
        this.entitiesByDescriboId = groupBy(this.entities, "describoId");
    }

    __addEntity({ entity }) {
        entity = { describoId: uuid(), ...entity };
        let e = this.coreProperties
            .map((p) => ({ [p]: entity[p] }))
            .reduce((obj, entry) => ({ ...obj, ...entry }));

        if (!e["@type"]) e["@type"] = this._isURL(e["@id"]) ? "URL" : "Thing";
        if (!e.name) e.name = e["@id"];
        console.debug("Crate Mgr, addEntity", e);
        this.entities.push(e);
        return entity;
    }

    __processProperties({ entity }) {
        const pushProperty = this.__pushProperty.bind(this);

        for (let property of Object.keys(entity)) {
            if (this.coreProperties.includes(property)) continue;

            if (!isArray(entity[property])) entity[property] = [entity[property]];

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
                                "@type": this._isURL(instance["@id"]) ? "URL" : "Thing",
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
        let data = { propertyId: uuid(), srcEntityId, property, value, tgtEntityId };
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

    _isURL(value) {
        return isURL(value, { protocols: urlProtocols });
    }
}
