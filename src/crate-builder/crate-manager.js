import { v4 as uuid } from "uuid";
import { isString, isArray, isPlainObject, groupBy, cloneDeep } from "lodash";
import { isURL } from "validator";
const urlProtocols = ["http", "https", "ftp", "ftps", "arcp"];

// export function getProfileDefinitionForProperty({ profile, entityType, property }) {
//     let entityDefinition = profile.classes[entityType];
//     let propertyDefinition = entityDefinition.inputs.filter((p) => p.name === property)[0];
//     return propertyDefinition;
// }

export class CrateManager {
    constructor({ crate, profile }) {
        this.describoProperties = ["describoId", "describoLabel"];
        this.coreProperties = ["describoId", "describoLabel", "@id", "@type", "name"];
        this.entities = [];
        this.properties = [];
        this.currentEntity = undefined;
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
                    ? { describoLabel: "RootDataset", ...e }
                    : e;
            });

        // for each entity, populate entities and properties structs
        let entities = graph.map((entity) => {
            return this.__addEntity({ entity });
        });
        this.__index();

        entities.forEach((entity) => {
            this.__processProperties({ entity });
        });
    }

    setCurrentEntity({ describoId }) {
        this.currentEntity = describoId;
    }

    exportCrate() {
        let crate = {
            "@context": cloneDeep(this.context),
            "@graph": [cloneDeep(this.rootDescriptor)],
        };
        this.entities.forEach((entity) => {
            entity = this.rehydrateEntity({ entity });
            crate["@graph"].push(entity);
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
                    if (isURL(instance.value, { protocols: urlProtocols })) {
                        entity[property].push({ "@id": instance.value });
                    } else {
                        entity[property].push(instance.value);
                    }
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

    updateEntityName({ describoId, value }) {
        this.entities = this.entities.map((e) => {
            return e.describoId === describoId ? { ...e, name: value } : e;
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
        console.debug("Crate Mgr, addEntity", e);
        this.entities.push(e);
        return entity;
    }

    __processProperties({ entity }) {
        const pushProperty = this.__pushProperty.bind(this);

        for (let prop of Object.keys(entity)) {
            if (this.coreProperties.includes(prop)) continue;

            if (isString(entity[prop])) {
                pushProperty({
                    srcEntityId: entity.describoId,
                    property: prop,
                    value: entity[prop],
                });
            } else if (isPlainObject(entity[prop])) {
                entity[prop] = [entity[prop]];
            }

            if (isArray(entity[prop])) {
                entity[prop].forEach((instance) => {
                    if (isString(instance)) {
                        pushProperty({
                            srcEntityId: entity.describoId,
                            property: prop,
                            value: instance,
                        });
                    } else if (isPlainObject(instance)) {
                        if ("@id" in instance) {
                            let targetEntity = this.__lookupEntityByAtId({ id: instance["@id"] });
                            if (targetEntity) {
                                pushProperty({
                                    srcEntityId: entity.describoId,
                                    property: prop,
                                    tgtEntityId: targetEntity?.describoId,
                                });
                            } else {
                                pushProperty({
                                    srcEntityId: entity.describoId,
                                    property: prop,
                                    value: instance["@id"],
                                });
                            }
                        }
                    }
                });
            }
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
}
