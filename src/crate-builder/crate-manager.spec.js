import "regenerator-runtime";
import { CrateManager } from "./crate-manager.js";
import Chance from "chance";
const chance = Chance();
import { range, round, compact, groupBy, random } from "lodash";
import { performance } from "perf_hooks";

describe("Test loading / exporting crate files", () => {
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });
    test("a simple crate file", async () => {
        let crate = getBaseCrate();

        let crateManager = new CrateManager({ crate });

        let exportedCrate = crateManager.exportCrate();
        expect(crate).toEqual(exportedCrate);
    });
    test("with root dataset, one type", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        });

        let crateManager = new CrateManager({ crate });

        let exportedCrate = crateManager.exportCrate();
        exportedCrate["@graph"] = exportedCrate["@graph"].map((e) => {
            delete e["@reverse"];
            return e;
        });
        expect(crate).toEqual(exportedCrate);
    });
    test("with root dataset, multiple types", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset", "Something Else"],
            name: "Dataset",
        });

        let crateManager = new CrateManager({ crate });

        let exportedCrate = crateManager.exportCrate();
        exportedCrate["@graph"] = exportedCrate["@graph"].map((e) => {
            delete e["@reverse"];
            return e;
        });
        expect(crate).toEqual(exportedCrate);
    });
    test("with root dataset and one text property", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
            text: "some text",
        });

        let crateManager = new CrateManager({ crate });

        let exportedCrate = crateManager.exportCrate();
        exportedCrate["@graph"] = exportedCrate["@graph"].map((e) => {
            delete e["@reverse"];
            return e;
        });
        expect(crate).toEqual(exportedCrate);
    });
    test("with root dataset and one text property in array", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
            text: ["some text"],
        });

        let crateManager = new CrateManager({ crate });

        let exportedCrate = crateManager.exportCrate();
        let rootDataset = exportedCrate["@graph"].filter((e) => e["@id"] === "./");
        expect(rootDataset).toEqual([
            {
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
                text: "some text",
                "@reverse": {},
            },
        ]);
    });
    test("with root dataset and one reference to another object", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
            author: { "@id": "http://entity.com/something" },
        });
        crate["@graph"].push({
            "@id": "http://entity.com/something",
            "@type": "Person",
            name: "Person",
        });

        let crateManager = new CrateManager({ crate });

        let exportedCrate = crateManager.exportCrate();
        let rootDataset = exportedCrate["@graph"].filter((e) => e["@id"] === "./");
        expect(rootDataset).toEqual([
            {
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
                author: { "@id": "http://entity.com/something" },
                "@reverse": {},
            },
        ]);

        let entity = exportedCrate["@graph"].filter(
            (e) => e["@id"] === "http://entity.com/something"
        );
        expect(entity).toEqual([
            {
                "@id": "http://entity.com/something",
                "@type": "Person",
                name: "Person",
                "@reverse": { author: { "@id": "./" } },
            },
        ]);
    });
    test("with root dataset and one reference to object not in crate", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
            author: { "@id": "http://entity.com/something" },
        });

        let crateManager = new CrateManager({ crate });

        let exportedCrate = crateManager.exportCrate();
        let rootDataset = exportedCrate["@graph"].filter((e) => e["@id"] === "./");
        expect(rootDataset).toEqual([
            {
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
                author: { "@id": "http://entity.com/something" },
                "@reverse": {},
            },
        ]);

        let entity = exportedCrate["@graph"].filter(
            (e) => e["@id"] === "http://entity.com/something"
        );
        expect(entity).toEqual([]);
    });
    test("with root dataset and mixed type values for a property", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
            author: [{ "@id": "http://entity.com/something" }, "some text"],
        });
        crate["@graph"].push({
            "@id": "http://entity.com/something",
            "@type": "Person",
            name: "Person",
        });

        let crateManager = new CrateManager({ crate });

        let exportedCrate = crateManager.exportCrate();
        let rootDataset = exportedCrate["@graph"].filter((e) => e["@id"] === "./");
        expect(rootDataset[0].author).toEqual([
            {
                "@id": "http://entity.com/something",
            },
            "some text",
        ]);
    });
});

describe("Test interacting with the crate", () => {
    let crate, crateManager;
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });
    beforeEach(() => {
        crate = getBaseCrate();
        crate = addRootDataset({ crate });
        crateManager = new CrateManager({ crate });
    });
    test("get root dataset", () => {
        let rootDataset = crateManager.getRootDataset();
        expect(rootDataset.describoLabel).toEqual("RootDataset");
        expect(rootDataset["@id"]).toEqual("./");
    });
    test(`won't find this entity - not in crate`, () => {
        let match = crateManager.getEntity({ id: chance.url() });
        expect(match).toEqual(undefined);
        match = crateManager.getEntity({ describoId: chance.url() });
        expect(match).toEqual(undefined);
    });
    test("add a simple entity to the crate", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });
        expect(e["@id"]).toEqual(entity["@id"]);
        expect(e.name).toEqual(entity.name);
        expect(e.describoId).toBeDefined();
    });
    test("add a complex entity to the crate", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
            author: [{ "@id": chance.url() }],
        };
        let e = crateManager.addEntity({ entity });
        let match = crateManager.getEntity({ describoId: e.describoId });
        expect(match.properties.length).toEqual(2);
        expect(match.reverseConnections.length).toEqual(0);
    });
    test("update entity name", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });

        crateManager.updateEntityName({ describoId: e.describoId, value: "something else" });
        e = crateManager.getEntity({ describoId: e.describoId });
        expect(e.name).toEqual("something else");
    });
    test("adding a property to an entity", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });

        crateManager.addProperty({
            describoId: e.describoId,
            property: "author",
            value: "something else",
        });
        e = crateManager.getEntity({ describoId: e.describoId });
        expect(e.properties.length).toEqual(1);
        expect(e.properties[0].value).toEqual("something else");
    });
    test("link two entities", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = crateManager.addEntity({ entity });

        let rootDataset = crateManager.getRootDataset();
        crateManager.linkEntity({
            srcEntityId: rootDataset.describoId,
            property: "author",
            tgtEntityId: e.describoId,
        });

        let exportedCrate = crateManager.exportCrate();

        e = exportedCrate["@graph"].filter((e) => e["@id"] === "./")[0];
        expect(e).toHaveProperty("author");
        expect(e.author).toEqual({ "@id": url });

        e = exportedCrate["@graph"].filter((e) => e["@id"] === url)[0];
        expect(e["@reverse"].author).toEqual({ "@id": "./" });
    });
    test("unlink two entities", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = crateManager.addEntity({ entity });

        let rootDataset = crateManager.getRootDataset();
        crateManager.linkEntity({
            srcEntityId: rootDataset.describoId,
            property: "author",
            tgtEntityId: e.describoId,
        });

        crateManager.unlinkEntity({
            srcEntityId: rootDataset.describoId,
            property: "author",
            tgtEntityId: e.describoId,
        });

        let exportedCrate = crateManager.exportCrate();
        e = exportedCrate["@graph"].filter((e) => e["@id"] === "./")[0];
        expect(e).not.toHaveProperty("author");

        e = exportedCrate["@graph"].filter((e) => e["@id"] === url)[0];
        expect(e["@reverse"]).not.toHaveProperty("author");
    });
    test("delete a property", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = crateManager.addEntity({ entity });

        crateManager.deleteProperty({ propertyId: e.properties[0].propertyId });

        e = crateManager.getEntity({ id: e["@id"] });
        expect(e.properties.length).toEqual(0);
    });
    test("delete an entity", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
        };
        let e = crateManager.addEntity({ entity });

        let rootDataset = crateManager.getRootDataset();
        crateManager.linkEntity({
            srcEntityId: rootDataset.describoId,
            property: "author",
            tgtEntityId: e.describoId,
        });
        crateManager.deleteEntity({ describoId: e.describoId });

        rootDataset = crateManager.getRootDataset();
        expect(rootDataset.properties.length).toEqual(0);
        expect(crateManager.entities.length).toEqual(1);
    });
    test("update a property", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = crateManager.addEntity({ entity });

        crateManager.updateProperty({
            propertyId: e.properties[0].propertyId,
            value: "something else",
        });

        e = crateManager.getEntity({ id: e["@id"] });
        expect(e.properties[0].value).toEqual("something else");
    });
    test("add an entity to the crate and then get it back", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });

        let match = crateManager.getEntity({ id: entity["@id"] });
        expect({ ...e, properties: [], reverseConnections: [] }).toEqual(match);
        match = crateManager.getEntity({ describoId: e.describoId });
        expect({ ...e, properties: [], reverseConnections: [] }).toEqual(match);
    });
    test("find entities by id, type, name", () => {
        let id = chance.url();
        let name = chance.sentence();
        let entity = {
            "@id": id,
            "@type": "Person",
            name: name,
        };
        let e = crateManager.addEntity({ entity });
        let match = crateManager.findMatchingEntities({ query: id, type: "Person" });
        expect(match.length).toEqual(1);

        match = crateManager.findMatchingEntities({ query: name.slice(0, 3), type: "Person" });
        expect(match.length).toEqual(1);

        match = crateManager.findMatchingEntities({ type: "Pers" });
        expect(match.length).toEqual(1);

        match = crateManager.findMatchingEntities({
            limit: 0,
            type: "Perso",
            query: name.slice(0, 3),
        });
        expect(match.length).toEqual(0);
    });
    test("add an entity then delete it and confirm it's gone", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });

        crateManager.deleteEntity({ describoId: entity.describoId });
        let match = crateManager.getEntity({ id: entity["@id"] });
        expect(match).toBeUndefined;
        match = crateManager.getEntity({ describoId: entity.describoId });
        expect(match).toBeUndefined;
    });
});

describe("Test working with a complex crate", () => {
    let crate, crateManager;
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });
    beforeEach(() => {
        crate = getBaseCrate();
        crate["@graph"].push(
            ...[
                {
                    "@id": "./",
                    "@type": ["Dataset"],
                    name: "Dataset",
                    author: { "@id": "http://some.person.com" },
                },
                {
                    "@id": "http://some.person.com",
                    "@type": "Person",
                    name: "person name",
                    organization: { "@id": "http://an.org.net" },
                },
                {
                    "@id": "http://an.org.net",
                    "@type": "Organization",
                    name: "organization name",
                },
            ]
        );
        crateManager = new CrateManager({ crate });
    });
    test("it should successfully load a complex crate and look correct", () => {
        let crate = crateManager.exportCrate();

        // confirm person reverse linked to root dataset as author
        let person = crate["@graph"].filter((e) => e["@id"] === "http://some.person.com")[0];
        expect(person["@reverse"].author["@id"]).toEqual("./");

        // confirm organization reverse linked to person as organization
        let org = crate["@graph"].filter((e) => e["@id"] === "http://an.org.net")[0];
        expect(org["@reverse"].organization["@id"]).toEqual("http://some.person.com");

        // confirm the internal structure in the crate manager looks sensible

        //  is the author prop of the root dataset a tgtEntity link?
        let rootDataset = crateManager.getRootDataset();
        expect(rootDataset.properties.length).toEqual(1);
        expect(rootDataset.properties[0].property).toEqual("author");

        person = crateManager.getEntity({ describoId: rootDataset.properties[0].tgtEntityId });
        expect(person.properties.length).toEqual(1);
        expect(person.reverseConnections.length).toEqual(1);
        expect(person.properties[0].property).toEqual("organization");
        expect(person.reverseConnections[0].property).toEqual("author");

        org = crateManager.getEntity({ describoId: person.properties[0].tgtEntityId });
        expect(org.reverseConnections.length).toEqual(1);
        expect(org.reverseConnections[0].property).toEqual("organization");
    });
});

describe.skip("Test loading large crates and see how it performs", () => {
    test("n = 10, 100, 500, 1000, 2000, 4000, 8000, 16000", async () => {
        const tests = [10, 100, 500, 1000, 2000, 4000, 8000, 16000];
        // const tests = [2];
        for (const total of tests) {
            let crate = getBaseCrate();
            crate["@graph"].push({
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
            });

            let entities = crate["@graph"].map((e) => {
                return e?.about?.["@id"] === "./" ? null : e;
            });
            entities = compact(entities);
            const runtime = {};

            let t0 = performance.now();
            for (let i in range(total)) {
                let pick = chance.pickone(entities);

                let entity = {
                    "@id": chance.url(),
                    "@type": chance.pickone(["Dataset", "File", "Person", "Organisation"]),
                    name: chance.sentence(),
                    [chance.word()]: [{ "@id": pick["@id"] }],
                };
                crate["@graph"].push(entity);
                entities.push(entity);
            }

            let t1 = performance.now();
            runtime.generate = round(t1 - t0, 2);

            t0 = performance.now();
            let crateManager = new CrateManager({ crate });
            crateManager.init();
            t1 = performance.now();
            runtime.init = round(t1 - t0, 2);

            t0 = performance.now();
            let exportedCrate = crateManager.exportCrate();
            t1 = performance.now();
            runtime.export = round(t1 - t0, 2);

            console.log(
                `N items in crate: ${crate["@graph"].length}, generate: ${runtime.generate}ms, init: ${runtime.init}ms, export: ${runtime.export}ms`
            );
        }
    });
});

describe.skip("Test operations on large entity arrays", () => {
    test("n = 20000", async () => {
        const tests = [20000];
        for (const total of tests) {
            let crate = getBaseCrate();
            crate["@graph"].push({
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
            });

            let entities = crate["@graph"].map((e) => {
                return e?.about?.["@id"] === "./" ? null : e;
            });
            entities = compact(entities);
            const runtime = {};

            let entity;
            for (let i in range(total)) {
                let pick = chance.pickone(entities);

                entity = {
                    "@id": chance.url(),
                    "@type": chance.pickone(["Dataset", "File", "Person", "Organisation"]),
                    name: chance.sentence(),
                    [chance.word()]: [{ "@id": pick["@id"] }],
                };
                crate["@graph"].push(entity);
                entities.push(entity);
            }

            let crateManager = new CrateManager({ crate });
            crateManager.init();

            let t0 = performance.now();
            groupBy(crateManager.entities, "@id");
            let t1 = performance.now();
            runtime.groupByAtId = round(t1 - t0, 2);

            t0 = performance.now();
            groupBy(crateManager.entities, "describoId");
            t1 = performance.now();
            runtime.groupByDescriboId = round(t1 - t0, 2);

            t0 = performance.now();
            entity = crateManager.entities.filter((e) => e["@id"] === entity["@id"]);
            t1 = performance.now();
            runtime.findEntityByFilter = round(t1 - t0, 2);
            console.log(`n = 20000 ${JSON.stringify(runtime)}`);
        }
    });
});

function getBaseCrate() {
    return {
        "@context": ["https://w3id.org/ro/crate/1.1/context"],
        "@graph": [
            {
                "@id": "ro-crate-metadata.json",
                "@type": "CreativeWork",
                conformsTo: {
                    "@id": "https://w3id.org/ro/crate/1.1/context",
                },
                about: {
                    "@id": "./",
                },
            },
        ],
    };
}

function addRootDataset({ crate }) {
    crate["@graph"].push({
        "@id": "./",
        "@type": ["Dataset"],
        name: "Dataset",
    });
    return crate;
}
