import "regenerator-runtime";
import { CrateManager, Property, Entity } from "./crate-manager.bundle.js";
// import { ROCrate } from "ro-crate";
import { readJSON } from "fs-extra";
import path from "path";
import Chance from "chance";
const chance = Chance();

describe("Test set, get, delete, update of properties with a simple value", () => {
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });
    test(`test adding and removing an entity property with a simple value`, () => {
        const pp = new Property();
        let property = pp.set({ srcEntityId: "e1", property: "simple", value: "other" });
        // console.log(JSON.stringify(properties, null, 2));
        expect(pp).toMatchObject({
            properties: [{ srcEntityId: "e1", property: "simple", value: "other" }],
            propertiesByEntityId: {
                e1: [0],
            },
        });
        // console.log(property);

        pp.delete({ srcEntityId: "e1", propertyId: property.propertyId });
        expect(pp).toMatchObject({
            properties: [undefined],
            propertiesByEntityId: {},
        });
        // console.log(JSON.stringify(properties, null, 2));
    });
    test(`test adding and updating an entity property with a simple value`, () => {
        const pp = new Property();
        let property = pp.set({ srcEntityId: "e1", property: "simple", value: "other" });
        // console.log(JSON.stringify(properties, null, 2));
        expect(pp).toMatchObject({
            properties: [{ srcEntityId: "e1", property: "simple", value: "other" }],
            propertiesByEntityId: {
                e1: [0],
            },
        });
        // console.log(property);

        pp.update({ srcEntityId: "e1", propertyId: property.propertyId, value: "new" });
        expect(pp).toMatchObject({
            properties: [{ value: "new" }],
            propertiesByEntityId: {},
        });
    });
    test(`test adding two properties with a simple value and removing the first one`, () => {
        const pp = new Property();
        let property1 = pp.set({
            srcEntityId: "e1",
            property: "simple",
            value: "other",
        });

        let property2 = pp.set({
            srcEntityId: "e1",
            property: "simple",
            value: "something else",
        });
        // console.log(JSON.stringify(properties, null, 2));
        // console.log(pp);

        pp.delete({ srcEntityId: "e1", propertyId: property1.propertyId });
        expect(pp).toMatchObject({
            properties: [undefined, {}],
            propertiesByEntityId: {
                e1: [1],
            },
        });
        // console.log(JSON.stringify(properties, null, 2));
    });
    test(`test a sequence of simple property additions and deletions`, () => {
        const pp = new Property();

        //  add a simple property
        let property1 = pp.set({
            srcEntityId: "e1",
            property: "p1",
            value: "p1",
        });

        //  add a second simple property
        let property2 = pp.set({
            srcEntityId: "e1",
            property: "p2",
            value: "p2",
        });
        // console.log(JSON.stringify(properties, null, 2));

        //  delete the first property
        pp.delete({ srcEntityId: "e1", propertyId: property1.propertyId });
        expect(pp).toMatchObject({
            properties: [undefined, {}],
            propertiesByEntityId: {
                e1: [1],
            },
        });

        //  add a third simple property
        let property3 = pp.set({
            srcEntityId: "e1",
            property: "p3",
            value: "p3",
        });
        // console.log(JSON.stringify(properties, null, 2));

        for (let property of pp.propertiesByEntityId["e1"]) {
            expect(typeof property).toBe("number");
        }
        expect(pp.properties[0]).toBeUndefined;
    });
    test(`test that we don't add the same property twice`, () => {
        const pp = new Property();
        let property = {
            srcEntityId: "e1",
            property: "simple",
            value: "other",
        };
        pp.set(property);
        // console.log(JSON.stringify(properties, null, 2));
        expect(pp).toMatchObject({
            properties: [{ srcEntityId: "e1", property: "simple", value: "other" }],
            propertiesByEntityId: {
                e1: [0],
            },
        });
        // console.log(property);
        let p = pp.set(property);
        expect(p).toMatchObject(property);

        // console.log(JSON.stringify(properties, null, 2));
    });
    test(`test retrieving an entities properties`, () => {
        const pp = new Property();
        let property = pp.set({
            srcEntityId: "e1",
            property: "simple",
            value: "other",
        });
        // console.log(JSON.stringify(properties, null, 2));

        let entityProperties = pp.get({ srcEntityId: "e1" });
        // console.log(JSON.stringify(entityProperties, null, 2));
        expect(entityProperties).toMatchObject([
            {
                srcEntityId: "e1",
                property: "simple",
                value: "other",
            },
        ]);
    });
});

describe("Test set, get and delete of association properties", () => {
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });
    test(`test adding and removing an entity property with an association`, () => {
        const pp = new Property();
        let property = pp.set({ srcEntityId: "e1", property: "link", tgtEntityId: "e2" });
        // console.log(JSON.stringify(properties, null, 2));
        expect(pp).toMatchObject({
            properties: [{ srcEntityId: "e1", property: "link", tgtEntityId: "e2" }],
            propertiesByEntityId: {
                e1: [0],
                e2: [0],
            },
        });
        // console.log(property);

        pp.delete({ srcEntityId: "e1", propertyId: property.propertyId });
        expect(pp).toMatchObject({
            properties: [undefined],
            propertiesByEntityId: {},
        });
        // console.log(JSON.stringify(properties, null, 2));
    });
    test(`test adding two link properties removing the first one`, () => {
        const pp = new Property();
        let property1 = pp.set({
            srcEntityId: "e1",
            property: "link",
            tgtEntityId: "e2",
        });

        let property2 = pp.set({
            srcEntityId: "e2",
            property: "link",
            tgtEntityId: "e1",
        });
        // console.log(JSON.stringify(properties, null, 2));

        pp.delete({ srcEntityId: "e1", propertyId: property1.propertyId });
        expect(pp).toMatchObject({
            properties: [undefined, {}],
            propertiesByEntityId: {
                e1: [1],
                e2: [1],
            },
        });
        // console.log(JSON.stringify(properties, null, 2));
    });
    test(`test a sequence of simple property additions and deletions`, () => {
        const pp = new Property();

        //  add a link property
        let property1 = pp.set({
            srcEntityId: "e1",
            property: "p1",
            tgtEntityId: "e2",
        });

        //  add a second link property
        let property2 = pp.set({
            srcEntityId: "e1",
            property: "p2",
            tgtEntityId: "e2",
        });
        // console.log(JSON.stringify(properties, null, 2));

        //  delete the first property
        pp.delete({ srcEntityId: "e1", propertyId: property1.propertyId });
        // console.log(JSON.stringify(properties, null, 2));
        expect(pp).toMatchObject({
            properties: [undefined, {}],
            propertiesByEntityId: {
                e1: [1],
                e2: [1],
            },
        });

        //  add a third link property
        let property3 = pp.set({
            srcEntityId: "e1",
            property: "p3",
            value: "p3",
        });
        // console.log(JSON.stringify(properties, null, 2));

        for (let property of pp.propertiesByEntityId["e1"]) {
            expect(typeof property).toBe("number");
        }
        expect(pp.properties[0]).toBeUndefined;
    });
    test(`test that we don't add the same property twice`, () => {
        const pp = new Property();
        let property = {
            srcEntityId: "e1",
            property: "link",
            tgtEntityId: "e2",
        };
        pp.set(property);
        // console.log(JSON.stringify(properties, null, 2));
        expect(pp).toMatchObject({
            properties: [{ srcEntityId: "e1", property: "link", tgtEntityId: "e2" }],
            propertiesByEntityId: {
                e1: [0],
            },
        });
        // console.log(property);
        let p = pp.set(property);
        expect(p).toMatchObject(property);

        // console.log(JSON.stringify(properties, null, 2));
    });
    test(`test retrieving an entities properties`, () => {
        const pp = new Property();
        let property = pp.set({
            srcEntityId: "e1",
            property: "link",
            tgtEntityId: "e2",
        });
        // console.log(JSON.stringify(properties, null, 2));

        let entityProperties = pp.get({ srcEntityId: "e1" });
        // console.log(JSON.stringify(entityProperties, null, 2));
        expect(entityProperties).toMatchObject([
            {
                srcEntityId: "e1",
                property: "link",
                tgtEntityId: "e2",
            },
        ]);
    });
});

describe("Test entity definition normalisation", () => {
    test(`test normalising known, good definition`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee.__normalise(entity);
        expect(entity).toMatchObject({ "@id": "#1", "@type": "Dataset", name: "e1" });
    });
    test(`test normalising known, good definition with describoId defined`, () => {
        const ee = new Entity();
        let entity = {
            describoId: "RootDataset",
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee.__normalise(entity);
        expect(entity).toMatchObject({
            describoId: "RootDataset",
            "@id": "#1",
            "@type": "Dataset",
            name: "e1",
        });
    });
    test(`test normalising no @id`, () => {
        const ee = new Entity();
        let entity = {
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee.__normalise(entity);
        expect(entity).toMatchObject({ "@id": entity["@id"], "@type": "Dataset", name: "e1" });
    });
    test(`test normalising @id not string`, () => {
        const ee = new Entity();
        let entity = {
            "@id": 1,
            "@type": "Dataset",
            name: "e1",
        };
        try {
            entity = ee.__normalise(entity);
        } catch (error) {
            expect(error.message).toBeDefined;
        }

        entity = {
            "@id": { object: "as string" },
            "@type": "Dataset",
            name: "e1",
        };
        try {
            entity = ee.__normalise(entity);
        } catch (error) {
            expect(error.message).toBeDefined;
        }

        entity = {
            "@id": ["x"],
            "@type": "Dataset",
            name: "e1",
        };
        try {
            entity = ee.__normalise(entity);
        } catch (error) {
            expect(error.message).toBeDefined;
        }
    });
    test(`test normalising @id `, () => {
        const ee = new Entity();
        let entity = {
            "@id": "https://schema.org/Dataset",
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee.__normalise(entity);
        expect(entity).toMatchObject({
            "@id": "https://schema.org/Dataset",
            "@type": "Dataset",
            name: "e1",
        });
    });
    test(`test normalising no name property defined`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "https://schema.org/Dataset",
            "@type": "Dataset",
        };
        entity = ee.__normalise(entity);
        expect(entity).toMatchObject({
            "@id": "https://schema.org/Dataset",
            "@type": "Dataset",
            name: "https://schema.org/Dataset",
        });
    });
    test(`test normalising @type`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "https://schema.org/Dataset",
            name: "e1",
        };
        entity = ee.__normalise(entity);
        expect(entity).toMatchObject({
            "@id": "https://schema.org/Dataset",
            "@type": "URL",
            name: "e1",
        });

        entity = {
            "@id": "#1",
            name: "e1",
        };
        entity = ee.__normalise(entity);
        expect(entity).toMatchObject({
            "@id": "#1",
            "@type": "Thing",
            name: "e1",
        });

        entity = {
            "@id": "#1",
            "@type": ["Dataset", "Thing"],
            name: "e1",
        };
        entity = ee.__normalise(entity);
        expect(entity).toMatchObject({
            "@id": "#1",
            "@type": "Dataset, Thing",
            name: "e1",
        });
    });
});

describe("Test updating entity core properties", () => {
    test(`test adding and removing an entity`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee.set(entity);
        expect(ee).toMatchObject({
            entities: [entity],
            entitiesBy: {
                atId: { "#1": 0 },
                describoId: { [entity.describoId]: 0 },
            },
        });

        try {
            ee.update({ srcEntityId: entity.describoId, property: "something", value: "2" });
        } catch (error) {
            expect(error.message).toBeDefined;
        }

        ee.update({ srcEntityId: entity.describoId, property: "@id", value: "2" });
        expect(ee.entities).toMatchObject([{ "@id": "#2" }]);

        ee.update({ srcEntityId: entity.describoId, property: "name", value: "something else" });
        expect(ee.entities).toMatchObject([{ name: "something else" }]);

        ee.update({ srcEntityId: entity.describoId, property: "@type", value: "Person" });
        expect(ee.entities).toMatchObject([{ "@type": "Person" }]);

        ee.update({
            srcEntityId: entity.describoId,
            property: "@type",
            value: ["Dataset", "Person"],
        });
        expect(ee.entities).toMatchObject([{ "@type": ["Dataset", "Person"] }]);
    });
});

describe("Test set, get and delete of simple entities without non core properties", () => {
    test(`test adding and removing an entity`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee.set(entity);
        expect(ee).toMatchObject({
            entities: [entity],
            entitiesBy: {
                atId: { "#1": 0 },
                describoId: { [entity.describoId]: 0 },
            },
        });

        ee.delete({ srcEntityId: entity.describoId });
        expect(ee).toMatchObject({
            entities: [undefined],
            entitiesBy: { atId: {}, describoId: {} },
        });
    });
    test(`test adding two entities and removing one`, () => {
        const ee = new Entity();

        // add an entity
        let entity1 = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity1 = ee.set(entity1);

        // add a second entity
        let entity2 = {
            "@id": "2",
            "@type": "Dataset",
            name: "e2",
        };
        entity2 = ee.set(entity2);
        // console.log(ee);

        expect(ee).toMatchObject({
            entities: [entity1, entity2],
            entitiesBy: {
                atId: { "#1": 0, "#2": 1 },
                describoId: { [entity1.describoId]: 0, [entity2.describoId]: 1 },
            },
        });

        // delete the first entity
        ee.delete({ srcEntityId: entity1.describoId });
        // console.log(ee);
        expect(ee).toMatchObject({
            entities: [undefined, entity2],
            entitiesBy: { atId: { "#2": 1 }, describoId: { [entity2.describoId]: 1 } },
        });
    });
    test(`test a sequence of simple additions and deletions`, () => {
        const ee = new Entity();

        // add an entity
        let entity1 = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity1 = ee.set(entity1);

        // add a second entity
        let entity2 = {
            "@id": "2",
            "@type": "Dataset",
            name: "e2",
        };
        entity2 = ee.set(entity2);
        // console.log(ee);

        expect(ee).toMatchObject({
            entities: [entity1, entity2],
            entitiesBy: {
                atId: { "#1": 0, "#2": 1 },
                describoId: { [entity1.describoId]: 0, [entity2.describoId]: 1 },
            },
        });

        // delete the first entity
        ee.delete({ srcEntityId: entity1.describoId });
        // console.log(ee);
        expect(ee).toMatchObject({
            entities: [undefined, entity2],
            entitiesBy: { atId: { "#2": 1 }, describoId: { [entity2.describoId]: 1 } },
        });

        // add a third entity
        let entity3 = {
            "@id": "3",
            "@type": "Dataset",
            name: "e3",
        };
        entity3 = ee.set(entity3);
        // console.log(ee);
        expect(ee).toMatchObject({
            entities: [undefined, entity2, entity3],
            entitiesBy: {
                atId: { "#2": 1, "#3": 2 },
                describoId: { [entity2.describoId]: 1, [entity3.describoId]: 2 },
            },
        });
    });
    test(`test that we don't add the same entity twice`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee.set(entity);
        expect(ee).toMatchObject({
            entities: [entity],
            entitiesBy: {
                atId: { "#1": 0 },
                describoId: { [entity.describoId]: 0 },
            },
        });
        entity = ee.set(entity);
        // console.log(ee);

        expect(ee).toMatchObject({
            entities: [entity],
            entitiesBy: {
                atId: { "#1": 0 },
                describoId: { [entity.describoId]: 0 },
            },
        });
    });
    test(`test that we don't overwrite an entity with differing type but same @id`, () => {
        const ee = new Entity();
        let entity1 = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity1 = ee.set(entity1);
        expect(ee).toMatchObject({
            entities: [entity1],
            entitiesBy: {
                atId: { "#1": 0 },
                describoId: { [entity1.describoId]: 0 },
            },
        });

        let entity2 = {
            "@id": "1",
            "@type": "Thing",
            name: "e2",
        };
        entity2 = ee.set(entity2);
        // console.log(ee);

        expect(ee).toMatchObject({
            entities: [entity1, entity2],
            entitiesBy: {
                atId: { "#1": 0, [entity2.describoId]: 1 },
                describoId: { [entity1.describoId]: 0 },
            },
        });
    });
    test(`test retrieving an entity`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee.set(entity);
        // console.log(ee);

        let entityDefinition = ee.get({ srcEntityId: entity["@id"] });
        expect(entity).toMatchObject(entityDefinition);
        entityDefinition = ee.get({ srcEntityId: entity.describoId });
        expect(entity).toMatchObject(entityDefinition);
    });
});

describe("Test set, get and delete of entities with non core properties", () => {
    test(`test adding and removing an entity with a simple property`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
            something: "value",
        };
        entity = ee.set(entity);

        ee.processEntityProperties(entity);
        // console.log(ee);
        // console.log(ee.pp);

        expect(ee).toMatchObject({
            entities: [entity],
            pm: {
                properties: [],
                propertiesByEntityId: {},
            },
        });

        // re-add it but with something prop set to array of values
        entity.something = ["value", "value1"];
        ee.processEntityProperties(entity);
        // console.log(ee);
        // console.log(ee.pp);

        // console.log(ee);
        expect(ee).toMatchObject({
            entities: [entity],
            pm: {
                properties: [{}, {}],
                propertiesByEntityId: {
                    [entity.describoId]: [{}, {}],
                },
            },
        });
    });
    test(`test adding and removing an entity with an association property`, () => {
        const ee = new Entity();
        let entity1 = {
            "@id": "#1",
            "@type": "Dataset",
            name: "e1",
            something: { "@id": "#2" },
        };
        let entity2 = {
            "@id": "#2",
            "@type": "Dataset",
            name: "e2",
        };
        entity1 = ee.set(entity1);
        entity2 = ee.set(entity2);

        ee.processEntityProperties(entity1);
        // console.log(ee);
        // console.log(ee.pp.propertiesByEntityId);

        expect(ee).toMatchObject({
            entities: [entity1, entity2],
            pm: {
                properties: [],
                propertiesByEntityId: {},
            },
        });
    });
});

describe("Test finding entities", () => {
    test("find entities by id, type, name", () => {
        const em = new Entity();

        let id = chance.url();
        let name = chance.sentence();
        let entity = {
            "@id": id,
            "@type": "Person",
            name: name,
        };
        let e = em.set(entity);
        // console.log(em);

        let match = em.find({ query: id, type: "Person" });
        // console.log(match);
        expect(match.length).toEqual(1);

        match = em.find({ query: name.slice(0, 3), type: "Person" });
        expect(match.length).toEqual(1);

        match = em.find({ type: "Pers" });
        expect(match.length).toEqual(1);

        match = em.find({
            limit: 0,
            type: "Perso",
            query: name.slice(0, 3),
        });
        expect(match.length).toEqual(0);
    });
});

describe("A bunch of operations on entities", () => {
    test("Varying entity and property operations", () => {
        const ee = new Entity();
        // create an entity
        let entity1 = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        let { describoId } = ee.set(entity1);
        entity1.describoId = describoId;
        ee.processEntityProperties(entity1);

        // set a simple property on the entity
        ee.setProperty({ srcEntityId: entity1.describoId, property: "prop", value: "value" });

        // set an association property on the entity
        ee.setProperty({ srcEntityId: entity1.describoId, property: "link", tgtEntityId: "#2" });

        // add a second entity
        let entity2 = {
            "@id": "2",
            "@type": "Dataset",
            name: "e1",
            author: { "@id": "#4" },
            date: "xxx",
        };
        ({ describoId } = ee.set(entity2));
        entity2.describoId = describoId;
        ee.processEntityProperties(entity2);
        // console.log(JSON.stringify(ee, null, 2));

        let property = ee.getProperties({ srcEntityId: entity1.describoId })[0];
        ee.deleteProperty({ srcEntityId: entity1.describoId, propertyId: property.propertyId });
        // console.log(JSON.stringify(ee, null, 2));

        ee.delete({ srcEntityId: entity1.describoId });
        // console.log(JSON.stringify(ee, null, 2));

        // ee.delete({ srcEntityId: entity2.describoId });
        // console.log(JSON.stringify(ee, null, 2));
    });
});

describe.skip("perf testing", () => {
    test("test ro crate init", async () => {
        let data = await readJSON(
            path.join(
                path.resolve(
                    __dirname,
                    "../../src/examples/item/ridiculously-big-collection/ro-crate-metadata.json"
                )
            )
        );
        console.time("ro crate load");
        new ROCrate(data, { array: true, link: true });
        console.timeEnd("ro crate load");
    });
    test("test crate manager init", async () => {
        let data = await readJSON(
            path.join(
                path.resolve(
                    __dirname,
                    "../../src/examples/item/ridiculously-big-collection/ro-crate-metadata.json"
                )
            )
        );
        console.time("cm load");
        let cm = new CrateManager();
        cm.load({ crate: data });
        console.timeEnd("cm load");
    });
});
