import "regenerator-runtime";
import { CrateManager } from "./crate-manager.bundle.js";
import Chance from "chance";
const chance = Chance();

describe("Test loading / exporting crate files", () => {
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });
    test("a simple crate file", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });

        let crateManager = new CrateManager();
        await crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        expect(crate["@graph"].length).toEqual(exportedCrate["@graph"].length);
    });
    test("should fail on a crate file without @context", async () => {
        let crateManager = new CrateManager();
        try {
            await crateManager.load({ crate: {} });
        } catch (error) {
            expect(error.message).toEqual(`The crate file does not have '@context'.`);
        }
    });
    test("should fail on a crate file without @graph", async () => {
        let crateManager = new CrateManager();
        try {
            await crateManager.load({ crate: { "@context": {} } });
        } catch (error) {
            expect(error.message).toEqual(
                `The crate file does not have '@graph' or it's not an array.`
            );
        }
    });
    test("should fail on a crate file without @graph as array", async () => {
        let crateManager = new CrateManager();
        try {
            await crateManager.load({ crate: { "@context": {}, "@graph": {} } });
        } catch (error) {
            expect(error.message).toEqual(
                `The crate file does not have '@graph' or it's not an array.`
            );
        }
    });
    test("should fail on a crate with bad @id's and no @type", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "not expected",
            "@type": ["Dataset"],
            name: "Dataset",
        });

        let crateManager = new CrateManager();
        try {
            await crateManager.load({ crate });
        } catch (error) {
            expect(error.message).toEqual(`The crate is invalid.`);
        }

        crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "#valid id",
            name: "Dataset",
        });

        crateManager = new CrateManager();
        try {
            await crateManager.load({ crate });
        } catch (error) {}
    });
    test("with root dataset, one type", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        });

        let crateManager = new CrateManager();
        await crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        let rootDataset = exportedCrate["@graph"]
            .filter((e) => e["@id"] === "./")
            .map((e) => {
                delete e["@reverse"];
                return e;
            })[0];
        expect(rootDataset).toEqual({ "@id": "./", "@type": ["Dataset"], name: "Dataset" });
    });
    test("with root dataset, multiple types", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset", "Something Else"],
            name: "Dataset",
        });

        let crateManager = new CrateManager();
        await crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        let rootDataset = exportedCrate["@graph"]
            .filter((e) => e["@id"] === "./")
            .map((e) => {
                delete e["@reverse"];
                return e;
            })[0];
        expect(rootDataset).toEqual({
            "@id": "./",
            "@type": ["Dataset", "Something Else"],
            name: "Dataset",
        });
    });
    test("with root dataset and one text property", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
            text: "some text",
        });

        let crateManager = new CrateManager();
        await crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        let rootDataset = exportedCrate["@graph"]
            .filter((e) => e["@id"] === "./")
            .map((e) => {
                delete e["@reverse"];
                return e;
            })[0];
        expect(rootDataset).toMatchObject({ text: "some text" });
    });
    test("with root dataset and one text property in array", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
            text: ["some text"],
        });

        let crateManager = new CrateManager();
        await crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        let rootDataset = exportedCrate["@graph"]
            .filter((e) => e["@id"] === "./")
            .map((e) => {
                delete e["@reverse"];
                return e;
            })[0];
        expect(rootDataset).toMatchObject({ text: "some text" });
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

        let crateManager = new CrateManager();
        await crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        let rootDataset = exportedCrate["@graph"]
            .filter((e) => e["@id"] === "./")
            .map((e) => {
                delete e["@reverse"];
                return e;
            })[0];
        expect(rootDataset).toMatchObject({ author: { "@id": "http://entity.com/something" } });

        let entity = exportedCrate["@graph"].filter(
            (e) => e["@id"] === "http://entity.com/something"
        );
        expect(entity).toMatchObject([
            {
                "@id": "http://entity.com/something",
                "@type": ["Person"],
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

        let crateManager = new CrateManager();
        await crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        let rootDataset = exportedCrate["@graph"].filter((e) => e["@id"] === "./");
        expect(rootDataset).toMatchObject([
            {
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
                author: { "@id": "http://entity.com/something" },
            },
        ]);

        let entity = exportedCrate["@graph"].filter(
            (e) => e["@id"] === "http://entity.com/something"
        );
        expect(entity).toEqual([
            {
                "@id": "http://entity.com/something",
                "@type": ["URL"],
                name: "http://entity.com/something",
                "@reverse": {
                    author: {
                        "@id": "./",
                    },
                },
            },
        ]);
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

        let crateManager = new CrateManager();
        await crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
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
    beforeEach(async () => {
        crate = getBaseCrate();
        crate = addRootDataset({ crate });
        crateManager = new CrateManager();
        await crateManager.load({ crate });
    });
    test("get root dataset", () => {
        // console.log(crateManager);
        let rootDataset = crateManager.getRootDataset();
        // expect(rootDataset.describoLabel).toEqual("RootDataset");
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
        let e = crateManager.setEntity({ entity });
        expect(e["@id"]).toEqual(entity["@id"]);
        expect(e.name).toEqual(entity.name);

        entity = {
            "@id": "something",
            "@type": "Thing",
        };
        e = crateManager.setEntity({ entity });
        expect(e["@id"]).toEqual("#something");
        expect(e.name).toEqual("something");

        entity = {
            "@id": "http://something.com",
        };
        e = crateManager.setEntity({ entity });
        expect(e["@id"]).toEqual("http://something.com");
        expect(e["@type"]).toEqual(["URL"]);
        expect(e.name).toEqual("http://something.com");

        entity = {
            name: "some thing",
        };
        e = crateManager.setEntity({ entity });
        expect(e["@type"]).toEqual(["Thing"]);
        expect(e["@id"]).toMatch(/^#e.*/);

        entity = {
            "@id": "./",
        };
        e = crateManager.setEntity({ entity });
        expect(e["@id"]).toEqual("#e5");
        expect(e["@type"]).toEqual(["Thing"]);
    });
    test("add a simple File or Dataset entity to the crate", () => {
        let entity = {
            "@id": "file1.jpg",
            "@type": "File",
            name: "file1.jpg",
        };
        let e = crateManager.setEntity({ entity });
        expect(e["@id"]).toEqual(entity["@id"]);
        expect(e.name).toEqual(entity.name);

        entity = {
            "@id": "something",
            "@type": ["File", "Thing"],
        };
        e = crateManager.setEntity({ entity });
        expect(e["@id"]).toEqual(entity["@id"]);

        entity = {
            "@id": "something_else",
            "@type": "Dataset",
        };
        e = crateManager.setEntity({ entity });
        expect(e["@id"]).toEqual("#something_else");

        entity = {
            "@id": "something_new",
            "@type": ["Dataset", "CreativeWork"],
        };
        e = crateManager.setEntity({ entity });
        expect(e["@id"]).not.toEqual("#something");
        expect(e["@type"]).toEqual(["Dataset", "CreativeWork"]);
    });
    test("add a simple entity to the crate and export as a template", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
            data: "value",
        };
        let e = crateManager.setEntity({ entity });

        let template = crateManager.exportEntityTemplate({ id: e["@id"] });
        expect(template).toMatchObject({
            ...entity,
            "@type": ["Person"],
        });
    });
    test("add a complex entity to the crate and export as a template", () => {
        let rootDataset = crateManager.getRootDataset();
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.setEntity({ entity });
        crateManager.linkEntity({
            id: rootDataset["@id"],
            property: "author",
            tgtEntityId: e["@id"],
        });

        let template = crateManager.exportEntityTemplate({ id: entity["@id"] });
        expect(template).toMatchObject({ ...entity, "@type": ["Person"] });
    });
    test("add a complex entity to the crate", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
            author: [{ "@id": chance.url() }],
        };
        let e = crateManager.setEntity({ entity });
        let match = crateManager.getEntity({ id: e["@id"] });
        expect(Object.keys(match["@properties"]).length).toEqual(2);
    });
    test("update entity name", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.setEntity({ entity });

        crateManager.updateEntity({
            id: e["@id"],
            property: "name",
            value: "something else",
        });
        e = crateManager.getEntity({ id: e["@id"] });
        expect(e.name).toEqual("something else");
    });
    test("update entity '@id'", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.setEntity({ entity });

        crateManager.updateEntity({
            id: e["@id"],
            property: "@id",
            value: "something else",
        });
        e = crateManager.getEntity({ id: e["@id"] });
        expect(e["@id"]).toEqual("#something%20else");
    });
    test("adding a property to an entity", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.setEntity({ entity });

        crateManager.setProperty({
            id: e["@id"],
            property: "author",
            value: "something else",
        });
        e = crateManager.getEntity({ id: e["@id"] });
        expect(e["@properties"].author.length).toEqual(1);
        expect(e["@properties"].author[0].value).toEqual("something else");
    });
    test("link two entities", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = crateManager.setEntity({ entity });

        let rootDataset = crateManager.getRootDataset();
        crateManager.linkEntity({
            id: rootDataset["@id"],
            property: "author",
            tgtEntityId: e["@id"],
        });

        let exportedCrate = crateManager.exportCrate({});

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
        let e = crateManager.setEntity({ entity });

        let rootDataset = crateManager.getRootDataset();
        crateManager.linkEntity({
            id: rootDataset["@id"],
            property: "author",
            tgtEntityId: e["@id"],
        });

        crateManager.unlinkEntity({
            id: rootDataset["@id"],
            property: "author",
            tgtEntityId: e["@id"],
        });

        let exportedCrate = crateManager.exportCrate({});
        e = exportedCrate["@graph"].filter((e) => e["@id"] === "./")[0];
        expect(e).not.toHaveProperty("author");

        e = exportedCrate["@graph"].filter((e) => e["@id"] === url)[0];
        expect(e).toBeUndefined;
    });
    test("delete a property", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = crateManager.setEntity({ entity });
        e = crateManager.getEntity({ id: e["@id"] });

        crateManager.deleteProperty({
            id: e["@id"],
            property: "text",
            propertyIdx: 0,
        });

        e = crateManager.getEntity({ id: e["@id"] });
        expect(e["@properties"]).toEqual({});
    });
    test("delete an entity", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
        };
        let e = crateManager.setEntity({ entity });

        let rootDataset = crateManager.getRootDataset();
        crateManager.linkEntity({
            id: rootDataset["@id"],
            property: "author",
            tgtEntityId: e["@id"],
        });
        crateManager.deleteEntity({ id: e["@id"] });

        rootDataset = crateManager.getRootDataset();
        expect(rootDataset["@properties"]).toEqual({});
    });
    test("update a property", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = crateManager.setEntity({ entity });
        e = crateManager.getEntity({ id: e["@id"] });

        crateManager.updateProperty({
            id: e["@id"],
            property: "text",
            idx: 0,
            value: "something else",
        });

        e = crateManager.getEntity({ id: e["@id"] });
        expect(e["@properties"].text[0].value).toEqual("something else");
    });
    test("add an entity to the crate and then get it back", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.setEntity({ entity });

        let match = crateManager.getEntity({ id: entity["@id"] });
        expect({ ...e, "@properties": {} }).toEqual(match);
    });
    test("find entities by id, type, name", () => {
        let id = chance.url();
        let name = chance.sentence();
        let entity = {
            "@id": id,
            "@type": "Person",
            name: name,
        };
        let e = crateManager.setEntity({ entity });
        let match = crateManager.getEntities({ query: id, type: "Person" });
        expect(match.length).toEqual(1);

        match = crateManager.getEntities({ query: name.slice(0, 3), type: "Person" });
        expect(match.length).toEqual(1);

        match = crateManager.getEntities({ type: "Pers" });
        expect(match.length).toEqual(1);

        match = crateManager.getEntities({
            limit: 0,
            type: "Perso",
            query: name.slice(0, 3),
        });
        expect(match.length).toEqual(1);
    });
    test("add an entity then delete it and confirm it's gone", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.setEntity({ entity });

        crateManager.deleteEntity({ describoId: e.describoId });
        let match = crateManager.getEntity({ id: entity["@id"] });
        expect(match).toBeUndefined;
        match = crateManager.getEntity({ describoId: entity.describoId });
        expect(match).toBeUndefined;
    });
    test("exporting a simple crate file without unlinked entities", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });

        let crateManager = new CrateManager();
        crateManager.load({ crate });
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.setEntity({ entity });
        crateManager.deleteEntity({ id: e["@id"] });

        crate = crateManager.exportCrate();
        expect(crate["@graph"].length).toEqual(2);
    });
    test("exporting a simple crate file with unlinked entities", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });

        let crateManager = new CrateManager();
        crateManager.load({ crate });
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.setEntity({ entity });

        crate = crateManager.exportCrate({});
        // console.log(JSON.stringify(crate, null, 2));
        expect(crate["@graph"].length).toEqual(3);
    });
    test(`should be able to flatten a complex entity - like one coming from a datapack`, async () => {
        const json = {
            "@id": "http://some.thing",
            "@type": "Thing",
            name: "level1",
            level: {
                "@id": "http://2.some.thing",
                "@type": "Thing",
                name: "level2",
                level: {
                    "@id": "http://3.some.thing",
                    "@type": "Thing",
                    name: "level3",
                },
                other: [
                    {
                        "@id": "http://4.some.thing",
                        "@type": "Thing",
                        name: "level4",
                    },
                    {
                        "@id": "http://5.some.thing",
                        "@type": "Thing",
                        name: "level5",
                    },
                ],
            },
        };
        let flattened = crateManager._flatten(json);

        expect(flattened).toMatchObject([
            {
                "@id": "http://some.thing",
                "@type": "Thing",
                name: "level1",
                level: [
                    {
                        "@id": "http://2.some.thing",
                    },
                ],
            },
            {
                "@id": "http://2.some.thing",
                "@type": "Thing",
                name: "level2",
                level: [
                    {
                        "@id": "http://3.some.thing",
                    },
                ],
                other: [
                    {
                        "@id": "http://4.some.thing",
                    },
                    {
                        "@id": "http://5.some.thing",
                    },
                ],
            },
            {
                "@id": "http://3.some.thing",
                "@type": "Thing",
                name: "level3",
            },
            {
                "@id": "http://4.some.thing",
                "@type": "Thing",
                name: "level4",
            },
            {
                "@id": "http://5.some.thing",
                "@type": "Thing",
                name: "level5",
            },
        ]);

        crateManager.ingestAndLink({
            id: crateManager.getRootDataset()["@id"],
            property: "language",
            json,
        });
        const crate = crateManager.exportCrate({});
        expect(crate["@graph"]).toMatchObject([
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
            {
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
                language: {
                    "@id": "http://some.thing",
                },
            },
            {
                "@id": "http://some.thing",
                "@type": ["Thing"],
                name: "level1",
                level: {
                    "@id": "http://2.some.thing",
                },
                "@reverse": {
                    language: {
                        "@id": "./",
                    },
                },
            },
            {
                "@id": "http://2.some.thing",
                "@type": ["Thing"],
                name: "level2",
                level: {
                    "@id": "http://3.some.thing",
                },
                other: [
                    {
                        "@id": "http://4.some.thing",
                    },
                    {
                        "@id": "http://5.some.thing",
                    },
                ],
                "@reverse": {
                    level: {
                        "@id": "http://some.thing",
                    },
                },
            },
            {
                "@id": "http://3.some.thing",
                "@type": ["Thing"],
                name: "level3",
                "@reverse": {
                    level: {
                        "@id": "http://2.some.thing",
                    },
                },
            },
            {
                "@id": "http://4.some.thing",
                "@type": ["Thing"],
                name: "level4",
                "@reverse": {
                    other: {
                        "@id": "http://2.some.thing",
                    },
                },
            },
            {
                "@id": "http://5.some.thing",
                "@type": ["Thing"],
                name: "level5",
                "@reverse": {
                    other: {
                        "@id": "http://2.some.thing",
                    },
                },
            },
        ]);
    });
    test(`it should handle ingesting json objects with text arrays`, async () => {
        let json = {
            "@id": "http://some.thing",
            "@type": "Thing",
            alternateName: ["name1", "name2", "name3"],
        };
        crateManager.ingestAndLink({
            id: crateManager.getRootDataset()["@id"],
            property: "language",
            json,
        });
        const crate = crateManager.exportCrate({});
        expect(crate["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
                language: {
                    "@id": "http://some.thing",
                },
            },
            {
                "@id": "http://some.thing",
                "@type": ["Thing"],
                name: "http://some.thing",
                alternateName: ["name1", "name2", "name3"],
                "@reverse": {
                    language: {
                        "@id": "./",
                    },
                },
            },
        ]);
    });
    test(`it should handle ingesting json objects whilst ignoring empty properties`, async () => {
        let json = {
            "@id": "http://some.thing",
            "@type": "Thing",
            alternateName: "",
        };
        crateManager.ingestAndLink({
            id: crateManager.getRootDataset()["@id"],
            property: "language",
            json,
        });
        const crate = crateManager.exportCrate({});
        expect(crate["@graph"]).toEqual([
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
            {
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
                language: {
                    "@id": "http://some.thing",
                },
            },
            {
                "@id": "http://some.thing",
                "@type": ["Thing"],
                name: "http://some.thing",
                "@reverse": {
                    language: {
                        "@id": "./",
                    },
                },
            },
        ]);
    });
    test(`it should be able to handle self links`, async () => {
        const json = {
            "@id": "http://some.thing",
            "@type": "Thing",
            name: "level1",
            level: {
                "@id": "http://some.thing",
                "@type": "Thing",
                name: "level2",
            },
        };
        crateManager.ingestAndLink({
            id: crateManager.getRootDataset()["@id"],
            property: "author",
            json,
        });

        // delete the author property from the root dataset
        let rootDataset = crateManager.getRootDataset();
        crateManager.deleteProperty({
            id: rootDataset["@id"],
            property: "author",
            idx: 0,
        });

        let crate = crateManager.exportCrate({});
        expect(crate["@graph"].length).toEqual(3);
        expect(crate["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                "@type": ["Dataset"],
            },
            {},
        ]);
    });
    test(`it should be able to ingest a complex entity, unlink it, and remove all descendants`, async () => {
        const json = {
            "@id": "http://some.thing",
            "@type": "Thing",
            name: "level1",
            level: {
                "@id": "http://some.other.thing",
                "@type": "Thing",
                name: "level2",
            },
        };
        crateManager.ingestAndLink({
            id: crateManager.getRootDataset()["@id"],
            property: "author",
            json,
        });

        // delete the author property from the root dataset
        let rootDataset = crateManager.getRootDataset();
        crateManager.deleteProperty({
            id: rootDataset["@id"],
            property: "author",
            propertyIdx: 0,
        });
        crateManager.purgeUnlinkedEntities();

        let crate = crateManager.exportCrate({});
        expect(crate["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                "@type": ["Dataset"],
            },
        ]);
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
