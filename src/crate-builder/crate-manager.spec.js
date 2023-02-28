import "regenerator-runtime";
import { CrateManager, validateId } from "./crate-manager.js";
import Chance from "chance";
const chance = Chance();
import { range, round, compact, groupBy, random } from "lodash";
import { performance } from "perf_hooks";

describe("Test @id's that should be valid", () => {
    test(`LICENCE.md should be valid`, () => {
        expect(validateId("LICENCE.md", "File")).toBeTrue;
        expect(validateId("LICENCE.md", "File, Licence")).toBeTrue;
        expect(validateId("LICENCE.md", ["File", "Licence"])).toBeTrue;
    });
    test(`/path/to/file should be valid`, () => {
        expect(validateId("/path/to/file", "Dataset")).toBeTrue;
    });
    test(`./ should be valid`, () => {
        expect(validateId("./", "Dataset")).toBeTrue;
    });
    test(`../ should be valid`, () => {
        expect(validateId("../", "Dataset")).toBeTrue;
    });
    test(`_:xxx should be valid`, () => {
        expect(validateId("_:xxx", "Dataset")).toBeTrue;
    });
    test(`#xxx should be valid`, () => {
        expect(validateId("#xxx", "Dataset")).toBeTrue;
    });
    test(`http://schema.org/name should be valid`, () => {
        expect(validateId("http://schema.org/name", "Dataset")).toBeTrue;
    });
    test(`https://schema.org/name should be valid`, () => {
        expect(validateId("https://schema.org/name", "Dataset")).toBeTrue;
    });
    test(`ftp://schema.org/name should be valid`, () => {
        expect(validateId("ftp://schema.org/name", "Dataset")).toBeTrue;
    });
    test(`ftps://schema.org/name should be valid`, () => {
        expect(validateId("ftps://schema.org/name", "Dataset")).toBeTrue;
    });
    test(`arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html`, () => {
        expect(validateId("arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html", "Dataset"))
            .toBeTrue;
    });
    test(`arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/`, () => {
        expect(validateId("arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/", "Dataset"))
            .toBeTrue;
    });
    test(`arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/`, () => {
        expect(
            validateId("arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/", "Dataset")
        ).toBeTrue;
    });
    test(`arcp://name,gallery.example.org/`, () => {
        expect(validateId("arcp://name,gallery.example.org/a", "Dataset")).toBeTrue;
    });
});
describe("Test @id's that should NOT be valid", () => {
    test(`aaa should not be valid`, () => {
        expect(validateId("aaa", "Dataset").message).toEqual(
            "Invalid identifier 'aaa'. See https://github.com/describo/crate-builder-component/blob/master/README.identifiers.md for more information."
        );
    });
    test(`32a423d6-52ab-47e3-a9cd-54f418a48571 should not be valid`, () => {
        expect(validateId("32a423d6-52ab-47e3-a9cd-54f418a48571", "Dataset").message).toEqual(
            `Invalid identifier '32a423d6-52ab-47e3-a9cd-54f418a48571'. See https://github.com/describo/crate-builder-component/blob/master/README.identifiers.md for more information.`
        );
    });
});
describe("Test loading / exporting crate files", () => {
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });
    test("a simple crate file", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });

        let crateManager = new CrateManager();
        crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        expect(crate["@graph"].length).toEqual(exportedCrate["@graph"].length);
    });
    test("should fail on a crate file without @context", async () => {
        let crateManager = new CrateManager();
        try {
            crateManager.load({ crate: {} });
        } catch (error) {
            expect(error.message).toEqual(`The crate file does not have '@context'.`);
        }
    });
    test("should fail on a crate file without @graph", async () => {
        let crateManager = new CrateManager();
        try {
            crateManager.load({ crate: { "@context": {} } });
        } catch (error) {
            expect(error.message).toEqual(
                `The crate file does not have '@graph' or it's not an array.`
            );
        }
    });
    test("should fail on a crate file without @graph as array", async () => {
        let crateManager = new CrateManager();
        try {
            crateManager.load({ crate: { "@context": {}, "@graph": {} } });
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
            crateManager.load({ crate });
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
            crateManager.load({ crate });
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
        crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        let rootDataset = exportedCrate["@graph"]
            .filter((e) => e["@id"] === "./")
            .map((e) => {
                delete e["@reverse"];
                return e;
            })[0];
        let originalRootDataset = crate["@graph"].filter((e) => e["@id"] === "./")[0];
        originalRootDataset["@type"] = originalRootDataset["@type"].join(", ");
        expect(rootDataset).toEqual(originalRootDataset);
    });
    test("with root dataset, multiple types", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset", "Something Else"],
            name: "Dataset",
        });

        let crateManager = new CrateManager();
        crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        let rootDataset = exportedCrate["@graph"]
            .filter((e) => e["@id"] === "./")
            .map((e) => {
                delete e["@reverse"];
                return e;
            })[0];
        let originalRootDataset = crate["@graph"].filter((e) => e["@id"] === "./")[0];
        originalRootDataset["@type"] = originalRootDataset["@type"].join(", ");
        expect(rootDataset).toEqual(originalRootDataset);
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
        crateManager.load({ crate });

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
        crateManager.load({ crate });

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
        crateManager.load({ crate });

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

        let crateManager = new CrateManager();
        crateManager.load({ crate });

        let exportedCrate = crateManager.exportCrate({});
        let rootDataset = exportedCrate["@graph"].filter((e) => e["@id"] === "./");
        expect(rootDataset).toMatchObject([
            {
                "@id": "./",
                "@type": "Dataset",
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
                "@type": "URL",
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
        crateManager.load({ crate });

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
    beforeEach(() => {
        crate = getBaseCrate();
        crate = addRootDataset({ crate });
        crateManager = new CrateManager();
        crateManager.load({ crate });
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

        entity = {
            "@id": "something",
            "@type": "Thing",
        };
        e = crateManager.addEntity({ entity });
        expect(e["@id"]).toEqual("something");
        expect(e.name).toEqual("something");

        entity = {
            "@id": "http://something.com",
        };
        e = crateManager.addEntity({ entity });
        expect(e["@id"]).toEqual("http://something.com");
        expect(e["@type"]).toEqual("URL");
        expect(e.name).toEqual("http://something.com");

        entity = {
            name: "some thing",
        };
        e = crateManager.addEntity({ entity });
        expect(e["@type"]).toEqual("Thing");
        expect(e["@id"]).toMatch(/^#[a-z,0-9]{32}/);

        entity = {
            "@id": "./",
        };
        e = crateManager.addEntity({ entity });
        expect(e["@id"]).toEqual("./");
        expect(e["@type"]).toEqual("Dataset");
    });
    test("add a simple File or Dataset entity to the crate", () => {
        let entity = {
            "@id": "file1.jpg",
            "@type": "File",
            name: "file1.jpg",
        };
        let e = crateManager.addEntity({ entity });
        expect(e["@id"]).toEqual(entity["@id"]);
        expect(e.name).toEqual(entity.name);
        expect(e.describoId).toBeDefined();

        entity = {
            "@id": "something",
            "@type": ["File", "Thing"],
        };
        e = crateManager.addEntity({ entity });
        expect(e["@id"]).toEqual(entity["@id"]);

        entity = {
            "@id": "something",
            "@type": "Dataset",
        };
        e = crateManager.addEntity({ entity });
        expect(e["@id"]).toEqual(entity["@id"]);

        entity = {
            "@id": "something",
            "@type": ["Dataset", "CreativeWork"],
        };
        e = crateManager.addEntity({ entity });
        expect(e["@id"]).toEqual(entity["@id"]);
    });
    test("add a simple entity to the crate and setCurrentEntity", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });

        crateManager.setCurrentEntity({ describoId: e.describoId });
        expect(crateManager.currentEntity).toEqual(e.describoId);
    });
    test("add a simple entity to the crate and export as a template", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });

        let template = crateManager.exportEntityTemplate({ describoId: e.describoId });
        expect(template).toEqual(entity);
    });
    test("add a simple entity to the crate and get browse list", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });

        let list = crateManager.getEntitiesBrowseList();
        expect(list.length).toEqual(2);
    });
    test("add a complex entity to the crate and export as a template", () => {
        let rootDataset = crateManager.getRootDataset();
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });
        crateManager.linkEntity({
            srcEntityId: rootDataset.describoId,
            property: "author",
            tgtEntityId: e.describoId,
        });

        let template = crateManager.exportEntityTemplate({ describoId: e.describoId });
        expect(template).toEqual(entity);
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

        crateManager.updateEntity({
            describoId: e.describoId,
            property: "name",
            value: "something else",
        });
        e = crateManager.getEntity({ describoId: e.describoId });
        expect(e.name).toEqual("something else");
    });
    test("update entity '@id'", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = crateManager.addEntity({ entity });

        crateManager.updateEntity({
            describoId: e.describoId,
            property: "@id",
            value: "something else",
        });
        e = crateManager.getEntity({ describoId: e.describoId });
        expect(e["@id"]).toEqual("something else");
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
        let e = crateManager.addEntity({ entity });
        crateManager.deleteEntity({ describoId: e.describoId });

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
        let e = crateManager.addEntity({ entity });

        crate = crateManager.exportCrate({});
        expect(crate["@graph"].length).toEqual(3);
    });
    test(`should be able to flatten a complex entity - like one coming from a datapack`, async () => {
        const json = {
            "@id": "http://some.thing",
            "@type": "Thing",
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
        let flattened = crateManager.flatten({ json });

        expect(flattened).toEqual([
            {
                "@id": "http://some.thing",
                "@type": "Thing",
                level: {
                    "@id": "http://2.some.thing",
                },
            },
            {
                "@id": "http://2.some.thing",
                "@type": "Thing",
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
            srcEntityId: crateManager.getRootDataset().describoId,
            property: "language",
            json,
        });
        const crate = crateManager.exportCrate({});
        expect(crate["@graph"].length).toEqual(7);
    });
    test(`it should handle ingesting json objects with text arrays`, async () => {
        let json = {
            "@id": "http://some.thing",
            "@type": "Thing",
            alternateName: ["name1", "name2", "name3"],
        };
        crateManager.ingestAndLink({
            srcEntityId: crateManager.getRootDataset().describoId,
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
                "@type": "Dataset",
                name: "Dataset",
                language: {
                    "@id": "http://some.thing",
                },
                "@reverse": {},
            },
            {
                "@id": "http://some.thing",
                "@type": "Thing",
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
            srcEntityId: crateManager.getRootDataset().describoId,
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
                "@type": "Dataset",
                name: "Dataset",
                language: {
                    "@id": "http://some.thing",
                },
                "@reverse": {},
            },
            {
                "@id": "http://some.thing",
                "@type": "Thing",
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
            srcEntityId: crateManager.getRootDataset().describoId,
            property: "author",
            json,
        });

        // delete the author property from the root dataset
        let rootDataset = crateManager.getRootDataset();
        let authorPropertyId = rootDataset.properties.filter((p) => p.property === "author")[0]
            .propertyId;
        crateManager.deleteProperty({ propertyId: authorPropertyId });

        let crate = crateManager.exportCrate({});
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
                "@type": "Dataset",
                "@reverse": {},
                name: "Dataset",
            },
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
            srcEntityId: crateManager.getRootDataset().describoId,
            property: "author",
            json,
        });

        // delete the author property from the root dataset
        let rootDataset = crateManager.getRootDataset();
        let author = rootDataset.properties[0];
        crateManager.deleteProperty({ propertyId: author.propertyId });

        let crate = crateManager.exportCrate({});
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
                "@type": "Dataset",
                "@reverse": {},
                name: "Dataset",
            },
        ]);
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
        crateManager = new CrateManager();
        crateManager.load({ crate });
    });
    test("it should successfully load a complex crate and look correct", () => {
        let crate = crateManager.exportCrate({});

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
