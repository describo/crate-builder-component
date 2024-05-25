import { describe, test, expect, beforeAll, beforeEach, vi } from "vitest";
import { CrateManager } from "./crate-manager.js";
import { ProfileManager } from "./profile-manager.js";
import { readJSON } from "fs-extra";
import Chance from "chance";
const chance = Chance();

describe("Test loading / exporting crate files", () => {
    beforeAll(() => {
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });
    test("a simple crate file", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });
        // console.log(JSON.stringify(crate, null, 2));
        let cm = new CrateManager({ crate });
        const rootDataset = cm.getRootDataset();
        let exportedCrate = cm.exportCrate();
        expect(crate["@graph"].length).toEqual(exportedCrate["@graph"].length);
    });
    test("a simple crate file with the data in various forms", () => {
        // test 1: @type, name not array
        let crate = getBaseCrate();
        crate["@graph"].push({ "@id": "./", "@type": "Dataset", name: "something" });
        let cm = new CrateManager({ crate });
        let rd = cm.getRootDataset();
        expect(rd).toMatchObject({ "@id": "./", "@type": ["Dataset"], name: "something" });

        // test 2: no name
        crate = getBaseCrate();
        crate["@graph"].push({ "@id": "./", "@type": "Dataset" });
        cm = new CrateManager({ crate });
        rd = cm.getRootDataset();
        expect(rd).toMatchObject({ "@id": "./", "@type": ["Dataset"], name: "./" });

        // test 3: @type, name array
        crate = getBaseCrate();
        crate["@graph"].push({ "@id": "./", "@type": ["Dataset"], name: ["something"] });
        cm = new CrateManager({ crate });
        rd = cm.getRootDataset();
        expect(rd).toMatchObject({ "@id": "./", "@type": ["Dataset"], name: "something" });

        // test 4: property as array
        crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: ["something"],
            author: [{ "@id": "http:/schema.org/something" }],
        });
        cm = new CrateManager({ crate });
        rd = cm.getRootDataset();
        expect(rd).toMatchObject({
            "@id": "./",
            "@type": ["Dataset"],
            name: "something",
            author: [{ "@id": "http:/schema.org/something" }],
        });

        // test 5: property not array
        crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: ["something"],
            author: { "@id": "http:/schema.org/something" },
        });
        cm = new CrateManager({ crate });
        rd = cm.getRootDataset();
        expect(rd).toMatchObject({
            "@id": "./",
            "@type": ["Dataset"],
            name: "something",
            author: [{ "@id": "http:/schema.org/something" }],
        });
    });
    test("a simple crate file with root dataset before the root descriptor", async () => {
        let crate = getBaseCrate();
        crate["@graph"] = [
            { "@id": "./", "@type": ["Dataset"], name: "Dataset" },
            ...crate["@graph"],
        ];
        let crateManager = new CrateManager({ crate });
        let exportedCrate = crateManager.exportCrate({});
        expect(crate["@graph"].length).toEqual(exportedCrate["@graph"].length);
    });
    test(`test loading a massive crate file - cooee corpus`, async () => {
        let crate = await readJSON(
            `./src/examples/item/ridiculously-big-collection/ro-crate-metadata.json`
        );
        let cm = new CrateManager({ crate });
        let exportedCrate = cm.exportCrate();
        expect(exportedCrate["@graph"].length).toEqual(7331);
    });
    test("should fail on a crate file without @context", async () => {
        try {
            let crateManager = new CrateManager({ crate: {} });
        } catch (error) {
            expect(error.message).toEqual(`The crate file does not have a '@context'.`);
        }
    });
    test("should fail when entities don't have id's", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });
        crate["@graph"].push({});
        try {
            let crateManager = new CrateManager({ crate });
        } catch (error) {
            expect(error.message).toEqual(`There are problems with this crate.`);
        }
    });
    test("should fail - no root descriptor", async () => {
        let crate = getBaseCrate();
        crate["@graph"] = [];
        let cm = new CrateManager({ crate });
        let errors = cm.getErrors();
        expect(errors.init.messages[0]).toEqual(
            `This crate is invalid. A root descriptor can not been identified.`
        );
    });
    test("should fail - no root dataset", async () => {
        let crate = getBaseCrate();
        let cm = new CrateManager({ crate });
        let errors = cm.getErrors();
        expect(errors.init.messages[0]).toEqual(
            `This crate is invalid. A root dataset can not be identified.`
        );
    });
    test("should fail on a crate file without @graph", async () => {
        let cm = new CrateManager({ crate: { "@context": {} } });
        let errors = cm.getErrors();
        expect(errors.init.messages[0]).toEqual(
            `The crate file does not have '@graph' or it's not an array.`
        );
    });
    test("should fail on a crate file without @graph as array", async () => {
        let cm = new CrateManager({ crate: { "@context": {}, "@graph": {} } });
        let errors = cm.getErrors();
        expect(errors.init.messages[0]).toEqual(
            `The crate file does not have '@graph' or it's not an array.`
        );
    });
    test("should fail on a crate with bad @id's and no @type", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "not expected",
            "@type": ["Person"],
            name: "Dataset",
        });
        let cm = new CrateManager({ crate });
        let errors = cm.getErrors();
        expect(errors.init.messages[0]).toEqual(
            `This crate is invalid. A root dataset can not be identified.`
        );

        crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "#valid id",
            name: "Person",
        });
        cm = new CrateManager({ crate });
        errors = cm.getErrors();
        expect(errors.init.messages[0]).toEqual(
            `This crate is invalid. A root dataset can not be identified.`
        );
    });
    test("with root dataset, one type", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        });

        let crateManager = new CrateManager({ crate });
        let exportedCrate = crateManager.exportCrate({});
        expect(exportedCrate["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", "@type": "Dataset", name: "Dataset" },
        ]);
    });
    test("with root dataset, multiple types", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset", "Something Else"],
            name: "Dataset",
        });

        let crateManager = new CrateManager({ crate });
        let exportedCrate = crateManager.exportCrate({});
        expect(exportedCrate["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", "@type": ["Dataset", "Something Else"], name: "Dataset" },
        ]);
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
        let exportedCrate = crateManager.exportCrate({});
        expect(exportedCrate["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                "@type": "Dataset",
                name: "Dataset",
                text: "some text",
            },
        ]);
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
        let exportedCrate = crateManager.exportCrate({});
        expect(exportedCrate["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                "@type": "Dataset",
                name: "Dataset",
                text: "some text",
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
        let exportedCrate = crateManager.exportCrate({});
        expect(exportedCrate["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                "@type": "Dataset",
                name: "Dataset",
                author: { "@id": "http://entity.com/something" },
            },
            { "@id": "http://entity.com/something" },
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
        let exportedCrate = crateManager.exportCrate({});
        expect(exportedCrate["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                "@type": "Dataset",
                name: "Dataset",
                author: { "@id": "http://entity.com/something" },
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

        let crateManager = new CrateManager({ crate });
        let exportedCrate = crateManager.exportCrate({});
        expect(exportedCrate["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                "@type": "Dataset",
                name: "Dataset",
                author: [{ "@id": "http://entity.com/something" }, "some text"],
            },
            { "@id": "http://entity.com/something" },
        ]);
    });
});

describe("Test interacting with the crate", () => {
    let crate, cm;
    beforeAll(() => {
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });
    beforeEach(async () => {
        crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": "Dataset",
            name: "root dataset",
            text: "something",
        });
        cm = new CrateManager({ crate });
    });
    test("get root dataset", () => {
        let rd = cm.getRootDataset();
        expect(rd["@id"]).toEqual("./");
    });
    test("get context", () => {
        let context = cm.getContext();
        expect(context).toEqual(["https://w3id.org/ro/crate/1.1/context"]);
    });
    test("set context", () => {
        cm.setContext({});
        expect(cm.getContext()).toEqual([]);
    });
    test("set profile manager", () => {
        const profile = {
            metadata: {},
            classes: {},
        };
        const pm = new ProfileManager({ profile });
        expect(pm).toMatchObject({ profile: { metadata: {}, classes: {} } });

        cm.setProfileManager(pm);
        expect(cm.pm).toMatchObject({ profile: { metadata: {}, classes: {} } });
    });
    test(`getting entities from the crate`, () => {
        // no id provided
        try {
            let match = cm.getEntity({});
        } catch (error) {
            expect(error.message).toEqual("An id must be provided");
        }

        // materialise an entity
        let match = cm.getEntity({ id: chance.url() });
        expect(match).toMatchObject({ "@type": ["URL"] });

        // matching entity
        match = cm.getEntity({ id: "./" });
        expect(match).toMatchObject({
            "@id": "./",
            "@type": ["Dataset"],
            name: "root dataset",
            text: ["something"],
        });

        // matching entity - stub only
        match = cm.getEntity({ id: "./", stub: true });
        expect(match).toMatchObject({
            "@id": "./",
            "@type": ["Dataset"],
            name: "root dataset",
        });
    });
    test("add a simple entity to the crate", () => {
        // test 1
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let r = cm.addEntity(entity);
        let ec = cm.exportCrate();
        expect(ec["@graph"].length).toEqual(3);
        expect(r).toBeTruthy;

        // test 2
        entity = {
            "@id": "something",
            "@type": "Thing",
        };
        r = cm.addEntity(entity);
        ec = cm.exportCrate();
        expect(ec["@graph"].length).toEqual(4);
        expect(r).toBeTruthy;

        // test 3
        entity = {
            "@id": "something",
            "@type": "Person",
        };
        r = cm.addEntity(entity);
        ec = cm.exportCrate();
        expect(ec["@graph"].length).toEqual(5);
        expect(r).toBeTruthy;

        // test 4
        try {
            entity = {
                "@id": "http://something.com",
            };
            r = cm.addEntity(entity);
        } catch (error) {
            expect(error.message).toEqual(
                `You can't add an entity without defining the type : '@type'.`
            );
        }

        // test 5
        try {
            entity = {
                name: "some thing",
            };
            r = cm.addEntity({ entity });
        } catch (error) {
            expect(error.message).toEqual(`You can't add an entity without an identifier: '@id'.`);
        }

        // test 6
        try {
            entity = {
                "@id": "./",
                "@type": "Dataset",
            };
            r = cm.addEntity(entity);
        } catch (error) {
            expect(error.message).toEqual(
                `You can't add an entity with id: './' as that will clash with the root dataset.`
            );
        }

        // test 7
        try {
            entity = {
                "@id": "#person",
            };
            r = cm.addEntity({ entity });
        } catch (error) {
            expect(error.message).toEqual(`You can't add an entity without an identifier: '@id'.`);
        }
    });
    test(`prevent adding entities with id's that clash with root dataset or descriptor`, () => {
        try {
            cm.addEntity({ "@id": "./", "@type": "Dataset" });
        } catch (error) {
            expect(error.message).toEqual(
                `You can't add an entity with id: './' as that will clash with the root dataset.`
            );
        }
        try {
            cm.addEntity({ "@id": "ro-crate-metadata.json", "@type": "CreativeWork" });
        } catch (error) {
            expect(error.message).toEqual(
                `You can't add an entity with id: 'ro-crate-metadata.json' as that will clash with the root descriptor.`
            );
        }
        // ensure it fails even when the type is different
        try {
            cm.addEntity({ "@id": "ro-crate-metadata.json", "@type": "Person" });
        } catch (error) {
            expect(error.message).toEqual(
                `You can't add an entity with id: 'ro-crate-metadata.json' as that will clash with the root descriptor.`
            );
        }
    });
    test("add a simple File or Dataset entity to the crate", () => {
        // test 1
        let entity = {
            "@id": "file1.jpg",
            "@type": "File",
            name: "file1.jpg",
        };
        let r = cm.addEntity(entity);
        let ec = cm.exportCrate();
        expect(ec["@graph"].length).toEqual(3);
        expect(r).toBeTruthy;
        expect(ec["@graph"][2]["@id"]).toEqual("file1.jpg");

        // test 2
        entity = {
            "@id": "something",
            "@type": ["File", "Thing"],
        };
        r = cm.addEntity(entity);
        ec = cm.exportCrate();
        expect(ec["@graph"].length).toEqual(4);
        expect(r).toBeTruthy;
        expect(ec["@graph"][3]["@id"]).toEqual("something");
        expect(ec["@graph"][3]["@type"]).toEqual(["File", "Thing"]);

        // test 3
        entity = {
            "@id": "something_else",
            "@type": "Dataset",
        };
        r = cm.addEntity(entity);
        ec = cm.exportCrate();
        expect(ec["@graph"].length).toEqual(5);
        expect(r).toBeTruthy;
        expect(ec["@graph"][4]["@id"]).toEqual("something_else/");
        expect(ec["@graph"][4]["@type"]).toEqual("Dataset");

        // test 4
        entity = {
            "@id": "something_new",
            "@type": ["Dataset", "CreativeWork"],
        };
        r = cm.addEntity(entity);
        ec = cm.exportCrate();
        expect(ec["@graph"].length).toEqual(6);
        expect(r).toBeTruthy;
        expect(ec["@graph"][5]["@id"]).toEqual("something_new/");
        expect(ec["@graph"][5]["@type"]).toEqual(["Dataset", "CreativeWork"]);
    });
    test("add a simple entity to the crate and export as a template", () => {
        let entity = {
            "@id": "#person",
            "@type": "Person",
            name: "person",
            data: "value",
        };
        let e = cm.addEntity(entity);

        let template = cm.exportEntityTemplate({ id: e["@id"] });
        expect(template).toMatchObject({
            "@id": "#person",
            "@type": ["Person"],
            name: "person",
            data: "value",
        });
    });
    test("add a complex entity to the crate and export as a template", () => {
        let entity = {
            "@id": "#person",
            "@type": "Person",
            name: "person",
            data: "value",
        };
        let e = cm.addEntity(entity);
        entity = {
            "@id": "#organisation",
            "@type": "Organisation",
            name: "organisation",
            ceo: { "@id": "http://person.name" },
        };
        e = cm.addEntity(entity);
        cm.linkEntity({
            id: "#person",
            property: "organisation",
            value: { "@id": "#organisation" },
        });

        let template = cm.exportEntityTemplate({
            id: "#person",
            resolveDepth: 1,
        });
        expect(template).toEqual({
            "@id": "#person",
            "@type": ["Person"],
            name: "person",
            data: "value",
            organisation: {
                "@id": "#organisation",
                "@type": ["Organisation"],
                name: "organisation",
            },
        });
    });
    test(`fail template export - bad resolve depth`, () => {
        // test bad resolveDepth
        try {
            template = cm.exportEntityTemplate({
                id: "#person",
                resolveDepth: 4,
            });
        } catch (error) {
            expect(error.message).toEqual(`resolveDepth can only be 0 or 1`);
        }
    });
    test("add a complex entity to the crate", () => {
        let url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: "a person",
            text: "some text",
            author: [{ "@id": url }],
        };
        let e = cm.addEntity(entity);
        let match = cm.getEntity({ id: e["@id"] });
        expect(match).toMatchObject({
            "@id": url,
            "@type": ["Person"],
            name: "a person",
            text: ["some text"],
            author: [{ "@id": url }],
        });
    });
    test("update entity name", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = cm.addEntity(entity);
        expect(e).toBeTruthy;

        let r = cm.updateProperty({
            id: entity["@id"],
            property: "name",
            value: "something else",
        });
        expect(r).toBeTruthy;
        e = cm.getEntity({ id: entity["@id"] });
        expect(e.name).toEqual("something else");
    });
    test("update entity @type", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = cm.addEntity(entity);
        expect(e).toBeTruthy;

        // test 1
        let r = cm.updateProperty({
            id: entity["@id"],
            property: "@type",
            value: ["Person", "Adult"],
        });
        expect(r).toBeTruthy;
        e = cm.getEntity({ id: entity["@id"] });
        expect(e["@type"]).toEqual(["Person", "Adult"]);

        // test 2
        r = cm.updateProperty({
            id: entity["@id"],
            property: "@type",
            value: ["Adult", "Person", "Adult"],
        });
        expect(r).toBeTruthy;
        e = cm.getEntity({ id: entity["@id"] });
        expect(e["@type"]).toEqual(["Adult", "Person"]);
    });
    test("update entity '@id'", () => {
        crate = getBaseCrate();

        const authorId = "http://schema.org/person";
        const newAuthorId = "http://schema.org/author";
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "rd",
            author: [{ "@id": authorId }],
        });
        crate["@graph"].push({
            "@id": authorId,
            "@type": ["Person"],
            name: "a person",
            group: [{ "@id": "#g1" }],
        });
        crate["@graph"].push({
            "@id": "#g1",
            "@type": ["Group"],
            name: "a group",
        });
        cm = new CrateManager({ crate });

        cm.updateProperty({
            id: authorId,
            property: "@id",
            value: newAuthorId,
        });

        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": newAuthorId } },
            {
                "@id": newAuthorId,
                "@reverse": {
                    author: {
                        "@id": "./",
                    },
                },
            },
            {
                "@id": "#g1",
                "@reverse": {
                    group: {
                        "@id": "http://schema.org/author",
                    },
                },
            },
        ]);
    });
    test(`materialising an entity on update`, () => {
        cm.updateProperty({
            id: "http://schema.org/person",
            property: "@id",
            value: "new",
        }).toBeTruty;
        let entity = cm.getEntity({ id: "http://schema.org/person" });
        expect(entity).toEqual({
            "@id": "http://schema.org/person",
            "@type": ["URL"],
            name: "http://schema.org/person",
        });
    });
    test("delete an entity", () => {
        crate = getBaseCrate();
        const authorId = "http://schema.org/person";
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: "rd",
            author: [{ "@id": authorId }],
        });
        crate["@graph"].push({
            "@id": authorId,
            "@type": ["Person"],
            name: "a person",
            group: [{ "@id": "#g1" }],
        });
        crate["@graph"].push({
            "@id": "#g1",
            "@type": ["Group"],
            name: "a group",
        });
        cm = new CrateManager({ crate });

        let rd = cm.getRootDataset();
        // expect(rd.author.length).toEqual(1);

        cm.deleteEntity({ id: authorId });

        let ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            {
                "@id": "#g1",
                "@reverse": {},
            },
        ]);
        expect(ec["@graph"][1]).not.toHaveProperty("author");
    });
    test("prevent deleting the root dataset and the root descriptor", () => {
        try {
            cm.deleteEntity({ id: "./" });
        } catch (error) {
            expect(error.message).toEqual(
                `You can't delete the root dataset or the root descriptor.`
            );
        }
        try {
            cm.deleteEntity({ id: "ro-crate-metadata.json" });
        } catch (error) {
            expect(error.message).toEqual(
                `You can't delete the root dataset or the root descriptor.`
            );
        }
    });
    test(`fail - property updates `, () => {
        // fail updating core property
        try {
            cm.setProperty({
                id: "./",
                property: "@id",
                value: "something else",
            });
        } catch (error) {
            expect(error.message).toEqual(
                `This method does not operate on @id, @type, @reverse, name`
            );
        }
        //  fail bad value
        try {
            cm.setProperty({
                id: "./",
                property: "new",
                value: function () {},
            });
        } catch (error) {
            expect(error.message).toEqual(
                `value must be a string, number, boolean or object with '@id'`
            );
        }
        try {
            cm.setProperty({
                id: "./",
                property: "new",
                value: [],
            });
        } catch (error) {
            expect(error.message).toEqual(
                `value must be a string, number, boolean or object with '@id'`
            );
        }
        // fail - wrong method
        try {
            cm.updateProperty({
                id: "./",
                property: "@id",
                value: [],
            });
        } catch (error) {
            expect(error.message).toEqual(`'@id' property must be a string`);
        }
    });
    test("adding a property to an entity", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = cm.addEntity(entity);

        cm.setProperty({
            id: e["@id"],
            property: "author",
            value: "something else",
        });
        e = cm.getEntity({ id: e["@id"] });
        expect(e.author.length).toEqual(1);
        expect(e.author[0]).toEqual("something else");
    });
    test("a sequence of operations around adding and manipulating properties on an entity", () => {
        cm.setProperty({ id: "./", property: "new", value: "some text" });
        const authorId = chance.url();
        cm.setProperty({ id: "./", property: "author", value: { "@id": authorId } });
        cm.setProperty({ id: "./", property: "author", value: "text" });
        cm.setProperty({ id: "./", property: "author", value: 3 });

        let entity = cm.getEntity({ id: "./" });
        expect(entity).toMatchObject({
            "@id": "./",
            new: ["some text"],
            author: [{ "@id": authorId }, "text", 3],
        });
        // console.log(entity);

        entity = cm.getEntity({ id: "./" });
        expect(entity).toMatchObject({
            "@id": "./",
            new: ["some text"],
            author: [{ "@id": authorId }, "text", 3],
        });

        cm.updateProperty({ id: "./", property: "author", idx: 1, value: "new" });
        entity = cm.getEntity({ id: "./" });
        expect(entity).toMatchObject({
            "@id": "./",
            author: [{ "@id": authorId }, "new", 3],
        });

        cm.setProperty({ id: "./", property: "author", value: 3 });
        cm.updateProperty({ id: "./", property: "author", idx: 1, value: "new" });
        entity = cm.getEntity({ id: "./" });
        expect(entity).toMatchObject({
            "@id": "./",
            author: [{ "@id": authorId }, "new", 3, 3],
        });
        // console.log(entity);
    });
    test("delete a property", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = cm.addEntity(entity);
        e = cm.getEntity({ id: e["@id"] });

        cm.deleteProperty({
            id: e["@id"],
            property: "text",
            idx: 0,
        });

        e = cm.getEntity({ id: e["@id"] });
        expect(e).not.toHaveProperty("text");
    });
    test("a sequence of operations around deleting a property on an entity", () => {
        cm.setProperty({ id: "./", property: "new", value: "some text" });
        const authorId = chance.url();
        cm.setProperty({ id: "./", property: "author", value: { "@id": authorId } });
        cm.setProperty({ id: "./", property: "author", value: "text" });
        cm.setProperty({ id: "./", property: "author", value: 3 });

        let entity = cm.getEntity({ id: "./" });
        expect(entity).toMatchObject({
            "@id": "./",
            new: ["some text"],
            author: [{ "@id": authorId }, "text", 3],
        });

        cm.deleteProperty({ id: "./", property: "author", idx: 1 });
        entity = cm.getEntity({ id: "./" });
        expect(entity).toMatchObject({
            "@id": "./",
            author: [{ "@id": authorId }, 3],
        });

        cm.setProperty({ id: "./", property: "author", value: 3 });
        entity = cm.getEntity({ id: "./" });
        cm.deleteProperty({ id: "./", property: "author", idx: 0 });
        cm.deleteProperty({ id: "./", property: "author", idx: 1 });
        entity = cm.getEntity({ id: "./" });
        expect(entity).toMatchObject({
            "@id": "./",
            author: [3],
        });
    });
    test("link two entities", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = cm.addEntity(entity);

        cm.linkEntity({
            id: "./",
            property: "author",
            value: { "@id": e["@id"] },
        });

        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                author: {
                    "@id": e["@id"],
                },
            },
            {
                "@id": e["@id"],
                "@reverse": {
                    author: {
                        "@id": "./",
                    },
                },
            },
        ]);
    });
    test("unlink two entities", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = cm.addEntity(entity);

        cm.linkEntity({
            id: "./",
            property: "author",
            value: { "@id": e["@id"] },
        });

        cm.unlinkEntity({
            id: "./",
            property: "author",
            value: {
                "@id": e["@id"],
            },
        });

        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));

        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": url },
        ]);
        expect(ec["@graph"][1]).not.toHaveProperty("author");
    });
    test("fail - fail linking / unlinking entities", () => {
        try {
            cm.linkEntity({
                id: "./",
                property: "author",
                value: "string",
            });
        } catch (error) {
            expect(error.message).toEqual(`value must be an object with '@id' defined`);
        }

        try {
            cm.unlinkEntity({
                id: "./",
                property: "author",
                value: "string",
            });
        } catch (error) {
            expect(error.message).toEqual(`value must be an object with '@id' defined`);
        }
    });
    test("linking / unlinking two entities and handling inverse property associations", () => {
        const profile = {
            propertyAssociations: [
                {
                    property: "keywords",
                    propertyId: "https://schema.org/keywords",
                    inverse: {
                        property: "isKeywordOf",
                        propertyId: "https://schema.org/isKeywordOf",
                    },
                },
                {
                    property: "hasMember",
                    propertyId: "https://schema.org/hasMember",
                    inverse: {
                        property: "isMemberOf",
                        propertyId: "https://schema.org/isMemberOf",
                    },
                },
            ],
        };

        const pm = new ProfileManager({ profile });
        cm.setProfileManager(pm);

        const url = chance.url();
        let entity = {
            "@id": "#term",
            "@type": "DefinedTerm",
            name: "a term",
        };
        const e = cm.addEntity(entity);

        // link to root dataset and check
        cm.linkEntity({
            id: "./",
            property: "keywords",
            propertyId: "http://schema.org/keywords",
            value: { "@id": e["@id"] },
        });
        let crate = cm.exportCrate();
        // console.log(JSON.stringify(crate["@graph"], null, 2));
        expect(crate["@graph"][1]).toMatchObject({
            "@id": "./",
            keywords: {
                "@id": "#term",
            },
            "@reverse": {
                isKeywordOf: {
                    "@id": "#term",
                },
            },
        });
        expect(crate["@graph"][2]).toMatchObject({
            "@id": "#term",
            isKeywordOf: {
                "@id": "./",
            },
            "@reverse": {
                keywords: {
                    "@id": "./",
                },
            },
        });

        cm.unlinkEntity({
            id: "./",
            property: "keywords",
            value: { "@id": e["@id"] },
        });
        crate = cm.exportCrate();
        expect(crate["@graph"][1]).toMatchObject({
            "@id": "./",
            "@reverse": {},
        });
        expect(crate["@graph"][2]).toMatchObject({
            "@id": "#term",
            "@reverse": {},
        });
        // console.log(JSON.stringify(crate["@graph"], null, 2));
    });
    test("more complex:: linking / unlinking two entities and handling inverse property associations", () => {
        const profile = {
            propertyAssociations: [
                {
                    property: "keywords",
                    propertyId: "https://schema.org/keywords",
                    inverse: {
                        property: "isKeywordOf",
                        propertyId: "https://schema.org/isKeywordOf",
                    },
                },
                {
                    property: "hasMember",
                    propertyId: "https://schema.org/hasMember",
                    inverse: {
                        property: "isMemberOf",
                        propertyId: "https://schema.org/isMemberOf",
                    },
                },
            ],
        };

        const pm = new ProfileManager({ profile });
        cm.setProfileManager(pm);

        const url = chance.url();
        let entity = {
            "@id": "#term",
            "@type": "DefinedTerm",
            name: "a term",
        };
        const e = cm.addEntity(entity);

        // link to root dataset and check
        cm.linkEntity({
            id: "./",
            property: "keywords",
            propertyId: "http://schema.org/keywords",
            value: { "@id": e["@id"] },
        });
        let crate = cm.exportCrate();
        // console.log(JSON.stringify(crate["@graph"], null, 2));
        expect(crate["@context"][1]).toMatchObject({
            isKeywordOf: "https://schema.org/isKeywordOf",
        });
        expect(crate["@graph"][1].keywords).toEqual({ "@id": "#term" });
        expect(crate["@graph"][1]["@reverse"].isKeywordOf).toEqual({ "@id": "#term" });
        expect(crate["@graph"][2].isKeywordOf).toEqual({ "@id": "./" });
        expect(crate["@graph"][2]["@reverse"].keywords).toEqual({ "@id": "./" });

        // link to itself and check
        cm.linkEntity({
            id: e["@id"],
            property: "keywords",
            value: { "@id": e["@id"] },
        });
        crate = cm.exportCrate();
        // console.log(JSON.stringify(crate["@graph"], null, 2));
        expect(crate["@graph"][2]).toMatchObject({
            isKeywordOf: [{ "@id": "./" }, { "@id": "#term" }],
            keywords: { "@id": "#term" },
            "@reverse": {
                keywords: [{ "@id": "./" }, { "@id": "#term" }],
                isKeywordOf: { "@id": "#term" },
            },
        });

        // link to root dataset via an inverse association
        cm.linkEntity({
            id: e["@id"],
            property: "isMemberOf",
            value: { "@id": "./" },
        });
        crate = cm.exportCrate();

        expect(crate["@graph"][2]).toMatchObject({
            isMemberOf: { "@id": "./" },
            "@reverse": {
                keywords: [{ "@id": "./" }, { "@id": "#term" }],
                isKeywordOf: { "@id": "#term" },
                hasMember: { "@id": "./" },
            },
        });
        expect(crate["@graph"][1]).toMatchObject({
            hasMember: { "@id": "#term" },
            "@reverse": { isMemberOf: { "@id": "#term" } },
        });
        // console.log(JSON.stringify(crate["@graph"], null, 2));

        cm.unlinkEntity({
            id: e["@id"],
            property: "keywords",
            value: {
                "@id": e["@id"],
            },
        });
        crate = cm.exportCrate();
        // console.log(JSON.stringify(crate["@graph"][1], null, 2));
        // console.log(JSON.stringify(crate["@graph"], null, 2));
        expect(crate["@graph"][1]).toMatchObject({
            "@id": "./",
            "@type": "Dataset",
            keywords: {
                "@id": "#term",
            },
            hasMember: {
                "@id": "#term",
            },
            "@reverse": {
                about: {
                    "@id": "ro-crate-metadata.json",
                },
                isKeywordOf: {
                    "@id": "#term",
                },
                isMemberOf: {
                    "@id": "#term",
                },
            },
        });
        expect(crate["@graph"][2]).toMatchObject({
            "@id": "#term",
            "@type": "DefinedTerm",
            name: "a term",
            isKeywordOf: {
                "@id": "./",
            },
            isMemberOf: {
                "@id": "./",
            },
            "@reverse": {
                keywords: {
                    "@id": "./",
                },
                hasMember: {
                    "@id": "./",
                },
            },
        });

        // cm.deleteEntity({ id: e["@id"] });

        // console.log("BEFORE");
        // crate = cm.exportCrate();
        // // console.log(JSON.stringify(crate["@graph"], null, 2));
        // expect(crate["@graph"].length).toEqual(2);

        // // add it back in and link it to root dataset via keywords
        // cm.addEntity(entity);
        // cm.linkEntity({
        //     id: "./",
        //     property: "keywords",
        //     value: { "@id": e["@id"] },
        // });
        // crate = cm.exportCrate();
        // // console.log(JSON.stringify(crate["@graph"], null, 2));

        // // now unlink from the root dataset via keywords prop
        // cm.unlinkEntity({
        //     id: "./",
        //     property: "keywords",
        //     value: {
        //         "@id": e["@id"],
        //     },
        // });
        // crate = cm.exportCrate();
        // expect(crate["@graph"][2]).toMatchObject({
        //     "@id": "#term",
        //     "@type": "DefinedTerm",
        //     name: "a term",
        //     "@reverse": {},
        // });
    });
    test("a sequence of complex '@id' updates across the crate", () => {
        let entity = {
            "@id": "an id",
            "@type": "Person",
            name: "person",
        };
        let e1 = cm.addEntity(entity);
        cm.linkEntity({ id: "./", property: "author", value: { "@id": e1["@id"] } });

        e1 = cm.getEntity({ id: e1["@id"] });
        expect(e1).toMatchObject({ "@id": "#an%20id", "@type": ["Person"], name: "person" });

        let entityChild = {
            "@id": "child id",
            "@type": "Person",
            name: "child",
        };
        let e2 = cm.addEntity(entityChild);
        cm.linkEntity({ id: "#an%20id", property: "child", value: { "@id": e2["@id"] } });
        e2 = cm.getEntity({ id: e2["@id"] });
        expect(e2).toMatchObject({ "@id": "#child%20id", "@type": ["Person"], name: "child" });

        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": "#an%20id" } },
            {
                "@id": "#an%20id",
                child: {
                    "@id": "#child%20id",
                },
                "@reverse": {
                    author: {
                        "@id": "./",
                    },
                },
            },
            {
                "@id": "#child%20id",
                "@reverse": {
                    child: {
                        "@id": "#an%20id",
                    },
                },
            },
        ]);

        // change the id to #a new id
        cm.updateProperty({ id: e1["@id"], property: "@id", value: "a new id" });
        ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": "#a%20new%20id" } },
            {
                "@id": "#a%20new%20id",
            },
            {
                "@id": "#child%20id",
                "@reverse": {
                    child: {
                        "@id": "#a%20new%20id",
                    },
                },
            },
        ]);
        // console.log(JSON.stringify(ec["@graph"], null, 2));

        // change the id to http://schema.org/person
        cm.updateProperty({
            id: "#a%20new%20id",
            property: "@id",
            value: "http://schema.org/person",
        });
        ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": "http://schema.org/person" } },
            {
                "@id": "http://schema.org/person",
            },
            {
                "@id": "#child%20id",
                "@reverse": {
                    child: {
                        "@id": "http://schema.org/person",
                    },
                },
            },
        ]);

        // change the id to #a new id
        cm.updateProperty({
            id: "http://schema.org/person",
            property: "@id",
            value: "a new id",
        });
        ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": "#a%20new%20id" } },
            {
                "@id": "#a%20new%20id",
            },
            {
                "@id": "#child%20id",
                "@reverse": {
                    child: {
                        "@id": "#a%20new%20id",
                    },
                },
            },
        ]);

        // change the id to http://schema.org/person
        cm.updateProperty({
            id: "#a%20new%20id",
            property: "@id",
            value: "http://schema.org/person",
        });
        ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": "http://schema.org/person" } },
            {
                "@id": "http://schema.org/person",
            },
            {
                "@id": "#child%20id",
                "@reverse": {
                    child: {
                        "@id": "http://schema.org/person",
                    },
                },
            },
        ]);
    });
    test("adding a property that is a link to another entity in the crate", () => {
        crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": "Dataset",
            name: "rd",
        });
        crate["@graph"].push({
            "@id": "#person",
            "@type": "Person",
            name: "author",
        });

        let cm = new CrateManager({ crate });
        cm.setProperty({ id: "./", property: "author", value: { "@id": "#person" } });

        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": "#person" } },
            { "@id": "#person", "@reverse": { author: { "@id": "./" } } },
        ]);
    });
    test("adding a property that is not a link to another entity in the crate", () => {
        crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": "Dataset",
            name: "rd",
        });

        let cm = new CrateManager({ crate });
        cm.setProperty({ id: "./", property: "author", value: { "@id": "#person" } });

        let ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": "#person" } },
        ]);
    });
    test("add an entity to the crate and then get it back", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = cm.addEntity(entity);
        let match = cm.getEntity({ id: entity["@id"] });
        expect(match).toMatchObject(e);
    });
    test("find entities by id, type, name", () => {
        let id = chance.url();
        let name = chance.sentence();
        let entity = {
            "@id": id,
            "@type": "Person",
            name: name,
        };
        let e = cm.addEntity(entity);
        let match = [...cm.getEntities({ query: id })];
        expect(match.length).toEqual(1);

        match = [...cm.getEntities({ query: id, type: "Person" })];
        expect(match.length).toEqual(1);

        match = [...cm.getEntities({ query: name.slice(0, 3), type: "Person" })];
        expect(match.length).toEqual(1);

        match = [...cm.getEntities({ type: "Pers" })];
        expect(match.length).toEqual(1);

        match = [
            ...cm.getEntities({
                limit: 0,
                type: "Perso",
                query: name.slice(0, 3),
            }),
        ];
        expect(match.length).toEqual(1);

        try {
            [...cm.getEntities({ query: {} })];
        } catch (error) {
            expect(error.message).toEqual(`query must be a string`);
        }
        try {
            [...cm.getEntities({ type: {} })];
        } catch (error) {
            expect(error.message).toEqual(`type must be a string`);
        }
    });
    test("add an entity then delete it and confirm it's gone", () => {
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = cm.addEntity(entity);
        cm.deleteEntity({ id: e["@id"] });
        let match = cm.getEntity({ id: entity["@id"] });
        expect(match).toBeUndefined;
    });
    test("exporting a simple crate file without unlinked entities", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });

        let cm = new CrateManager({ crate });
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        let e = cm.addEntity(entity);
        cm.deleteEntity({ id: e["@id"] });

        let ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
            },
        ]);
    });
    test("crate exporting", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });

        let cm = new CrateManager({ crate });

        // export base crate
        let ec = cm.exportCrate({});
        expect(ec["@graph"]).toMatchObject([{ "@id": "ro-crate-metadata.json" }, { "@id": "./" }]);

        // add entity and export
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        entity = cm.addEntity(entity);
        ec = cm.exportCrate({});
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": entity["@id"] },
        ]);

        // link ./ -> entity and export
        cm.setProperty({ id: "./", property: "author", value: entity });
        ec = cm.exportCrate({});
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": entity["@id"] } },
            { "@id": entity["@id"], "@reverse": { author: { "@id": "./" } } },
        ]);

        // link entity -> ./ and export - ie ensure it can handle circular refs
        cm.setProperty({ id: entity["@id"], property: "isAuthorOf", value: { "@id": "./" } });
        ec = cm.exportCrate({});
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", "@reverse": { isAuthorOf: { "@id": entity["@id"] } } },
            { "@id": entity["@id"], isAuthorOf: { "@id": "./" } },
        ]);
    });
    test("fail flattening", () => {
        try {
            let flattened = cm.flatten([]);
        } catch (error) {
            expect(error.message).toEqual(`flatten only takes an object.`);
        }
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
                    {
                        "@id": "http://5.some.thing",
                        "@type": "Thing",
                        name: "level5",
                    },
                ],
            },
        };
        let flattened = cm.flatten(json);
        // console.log(JSON.stringify(flattened, null, 2));

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
            {
                "@id": "http://5.some.thing",
                "@type": "Thing",
                name: "level5",
            },
        ]);

        cm.ingestAndLink({
            id: "./",
            property: "language",
            json,
        });
        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                language: {
                    "@id": "http://some.thing",
                },
            },
            {
                "@id": "http://some.thing",
                name: "level1",
                level: {
                    "@id": "http://2.some.thing",
                },
                "@reverse": {
                    language: { "@id": "./" },
                },
            },
            {
                "@id": "http://2.some.thing",
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
                    {
                        "@id": "http://5.some.thing",
                    },
                ],
                "@reverse": {
                    level: { "@id": "http://some.thing" },
                },
            },
            {
                "@id": "http://3.some.thing",
                name: "level3",
                "@reverse": {
                    level: { "@id": "http://2.some.thing" },
                },
            },
            {
                "@id": "http://4.some.thing",
                name: "level4",
                "@reverse": {
                    other: { "@id": "http://2.some.thing" },
                },
            },
            {
                "@id": "http://5.some.thing",
                name: "level5",
                "@reverse": {
                    other: { "@id": "http://2.some.thing" },
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
        cm.ingestAndLink({
            id: "./",
            property: "language",
            json,
        });
        let ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                language: {
                    "@id": "http://some.thing",
                },
            },
            {
                "@id": "http://some.thing",
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
        cm.ingestAndLink({
            id: "./",
            property: "language",
            json,
        });
        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                language: {
                    "@id": "http://some.thing",
                },
            },
            {
                "@id": "http://some.thing",
                "@reverse": {
                    language: {
                        "@id": "./",
                    },
                },
            },
        ]);
        expect(ec["@graph"][2]).not.toHaveProperty("alternateName");
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
        cm.ingestAndLink({
            id: "./",
            property: "author",
            json,
        });
        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));

        // delete the author property from the root dataset
        cm.deleteProperty({
            id: "./",
            property: "author",
            idx: 0,
        });

        ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));

        expect(ec["@graph"].length).toEqual(3);
        expect(ec["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                "@type": "Dataset",
            },
            {
                "@id": "http://some.thing",
                level: {
                    "@id": "http://some.thing",
                },
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
        cm.ingestAndLink({
            id: "./",
            property: "author",
            json,
        });

        // delete the author property from the root dataset
        cm.deleteProperty({
            id: "./",
            property: "author",
            idx: 0,
        });

        cm.purgeUnlinkedEntities();
        let ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([{ "@id": "ro-crate-metadata.json" }, { "@id": "./" }]);
    });
    test("resolve entity associations", async () => {
        crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": "Dataset",
            name: "root dataset",
            text: "something",
        });
        cm = new CrateManager({ crate });
        let profile = await readJSON("./src/examples/profile/profile-with-resolve.json");

        let entity = {
            "@id": "#createAction1",
            "@type": ["CreateAction"],
            name: "A very long named create action to demonstrate what happens with display of long names",
            object: { "@id": "#person2" },
            participant: { "@id": "#participant1" },
            agent: { "@id": "#agent1" },
        };
        let associations = cm.resolveLinkedEntityAssociations({ entity, profile });
        expect(associations).toMatchObject([
            {
                property: "object",
                "@id": "#person2",
            },
            {
                property: "participant",
                "@id": "#participant1",
            },
            {
                property: "agent",
                "@id": "#agent1",
            },
        ]);

        entity = {
            "@id": "#relationship",
            "@type": ["Relationship", "RelatedEntity"],
            source: [{ "@id": "#person1" }, { "@id": "#person2" }],
            target: { "@id": "#thing1" },
        };
        associations = cm.resolveLinkedEntityAssociations({ entity, profile });
        expect(associations).toMatchObject([
            {
                property: "source",
                "@id": "#person1",
            },
            {
                property: "source",
                "@id": "#person2",
            },
            {
                property: "target",
                "@id": "#thing1",
            },
        ]);
    });
    test(`context handling - pass in context to be used as is`, () => {
        cm = new CrateManager({
            crate,
            context: "https://www.researchobject.org/ro-crate/1.1/context.jsonld",
        });
        let context = cm.getContext();
        // console.log(context);
        expect(context).toEqual(["https://www.researchobject.org/ro-crate/1.1/context.jsonld"]);

        cm = new CrateManager({
            crate,
            context: ["https://www.researchobject.org/ro-crate/1.1/context.jsonld"],
        });
        context = cm.getContext();
        expect(context).toEqual(["https://www.researchobject.org/ro-crate/1.1/context.jsonld"]);

        cm = new CrateManager({
            crate,
            context: [
                "https://w3id.org/ro/crate/1.1/context",
                { foaf: "http://xmlns.com/foaf/0.1" },
                { dcterms: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/" },
            ],
        });
        context = cm.getContext();
        expect(context).toEqual([
            "https://w3id.org/ro/crate/1.1/context",
            {
                foaf: "http://xmlns.com/foaf/0.1",
                dcterms: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/",
            },
        ]);
    });
    test(`context handling - adding properties to the crate`, () => {
        crate["@context"] = [
            "https://w3id.org/ro/crate/1.1/context",
            "https://my.domain.com/ontology",
            { foaf: "http://xmlns.com/foaf/0.1/" },
            { dcterms: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/" },
            {
                somePropertyInYourDomain:
                    "https://your.domain/path/to/definition#somePropertyInYourDomain",
            },
        ];
        let cm = new CrateManager({ crate });
        let context = cm.getContext();
        // console.log(context);
        expect(context).toMatchObject([
            "https://w3id.org/ro/crate/1.1/context",
            "https://my.domain.com/ontology",
            {
                foaf: "http://xmlns.com/foaf/0.1/",
                dcterms: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/",
                somePropertyInYourDomain:
                    "https://your.domain/path/to/definition#somePropertyInYourDomain",
            },
        ]);

        // property already defined in context - not added
        cm.setProperty({
            id: "./",
            property: "model",
            propertyId: "http://schema.org/Person",
            value: { "@id": "#model" },
        });
        context = cm.getContext();
        // console.log(context);
        expect(context).toMatchObject([
            "https://w3id.org/ro/crate/1.1/context",
            "https://my.domain.com/ontology",
            {
                foaf: "http://xmlns.com/foaf/0.1/",
                dcterms: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/",
                somePropertyInYourDomain:
                    "https://your.domain/path/to/definition#somePropertyInYourDomain",
            },
        ]);

        // property not defined - is added
        cm.setProperty({
            id: "./",
            property: "model",
            propertyId: "http://www.w3.org/ns/prov#actedOnBehalfOf",
            value: { "@id": "#model" },
        });
        context = cm.getContext();
        // console.log(context);
        expect(context).toMatchObject([
            "https://w3id.org/ro/crate/1.1/context",
            "https://my.domain.com/ontology",
            {
                foaf: "http://xmlns.com/foaf/0.1/",
                dcterms: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/",
                somePropertyInYourDomain:
                    "https://your.domain/path/to/definition#somePropertyInYourDomain",
                model: "http://www.w3.org/ns/prov#actedOnBehalfOf",
            },
        ]);

        // property now defined - not re-added
        cm.setProperty({
            id: "./",
            property: "model",
            propertyId: "http://www.w3.org/ns/prov#actedOnBehalfOf",
            value: { "@id": "#model" },
        });
        context = cm.getContext();
        expect(context).toMatchObject([
            "https://w3id.org/ro/crate/1.1/context",
            "https://my.domain.com/ontology",
            {
                foaf: "http://xmlns.com/foaf/0.1/",
                dcterms: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/",
                somePropertyInYourDomain:
                    "https://your.domain/path/to/definition#somePropertyInYourDomain",
                model: "http://www.w3.org/ns/prov#actedOnBehalfOf",
            },
        ]);

        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec, null, 2));
        expect(ec).toMatchObject({
            "@context": [
                "https://w3id.org/ro/crate/1.1/context",
                "https://my.domain.com/ontology",
                {
                    foaf: "http://xmlns.com/foaf/0.1/",
                    dcterms: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/",
                    somePropertyInYourDomain:
                        "https://your.domain/path/to/definition#somePropertyInYourDomain",
                    model: "http://www.w3.org/ns/prov#actedOnBehalfOf",
                },
            ],
            "@graph": [
                {
                    "@id": "ro-crate-metadata.json",
                },
                {
                    "@id": "./",
                    "@type": "Dataset",
                    model: {
                        "@id": "#model",
                    },
                },
            ],
        });
    });
    test(`storing / removing entity types for lookups`, () => {
        let cm = new CrateManager({ crate });

        expect(cm.entityTypes).toEqual({ CreativeWork: 1, Dataset: 1 });
        expect(cm.getEntityTypes()).toEqual(["CreativeWork", "Dataset"]);

        let entity = {
            "@id": "file1.jpg",
            "@type": "File",
            name: "file1.jpg",
        };
        let r = cm.addEntity(entity);
        expect(cm.getEntityTypes()).toEqual(["CreativeWork", "Dataset", "File"]);

        r = cm.updateProperty({ id: r["@id"], property: "@type", idx: 0, value: "Cow" });
        expect(cm.getEntityTypes()).toEqual(["Cow", "CreativeWork", "Dataset"]);

        cm.deleteEntity({ id: r["@id"] });
        expect(cm.getEntityTypes()).toEqual(["CreativeWork", "Dataset"]);
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
        "@type": "Dataset",
        name: "Dataset",
    });
    return crate;
}
