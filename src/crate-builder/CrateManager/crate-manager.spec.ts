import { describe, test, expect, beforeAll, beforeEach, vi } from "vitest";
import { CrateManager } from "./crate-manager";
import { ProfileManager } from "./profile-manager";
import { readJSON } from "fs-extra";
import Chance from "chance";
const chance = Chance();
import type {
    CrateManagerType,
    EntityReference,
    NormalisedEntityDefinition,
    NormalisedProfile,
    UnverifiedCrate,
    UnverifiedEntityDefinition,
} from "../types";

describe("Test interacting with the crate", () => {
    let crate: UnverifiedCrate, cm: CrateManagerType;
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
    test("normalising contexts with varying shapes", () => {
        let context: any = "https://w3id.org/ro/crate/1.1/context";
        let normalisedContext = cm.__normaliseContext(context);
        expect(normalisedContext).toEqual(["https://w3id.org/ro/crate/1.1/context"]);

        context = ["https://w3id.org/ro/crate/1.1/context"];
        normalisedContext = cm.__normaliseContext(context);
        expect(normalisedContext).toEqual(["https://w3id.org/ro/crate/1.1/context"]);

        context = [
            "https://w3id.org/ro/crate/1.1/context",
            { hasPart: "https://schema.org/hasPart" },
            { schema: "https://schema.org" },
        ];
        normalisedContext = cm.__normaliseContext(context);
        expect(normalisedContext).toEqual([
            "https://w3id.org/ro/crate/1.1/context",
            {
                hasPart: "https://schema.org/hasPart",
                schema: "https://schema.org",
            },
        ]);
    });
    test("get context", () => {
        let context = cm.getContext();
        expect(context).toEqual(["https://w3id.org/ro/crate/1.1/context"]);
    });
    test("set context", () => {
        cm.setContext({} as any);
        expect(cm.getContext()).toEqual([]);
    });
    test("set profile manager", () => {
        const profile: any = {
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
            let match = cm.getEntity({} as any);
        } catch (error) {
            expect((error as Error).message).toEqual("An id must be provided");
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
        let entity: UnverifiedEntityDefinition = {
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
            expect((error as Error).message).toEqual(
                `You can't add an entity without defining the type : '@type'.`
            );
        }

        // test 5
        try {
            entity = {
                name: "some thing",
            };
            r = cm.addEntity({ entity } as UnverifiedEntityDefinition);
        } catch (error) {
            expect((error as Error).message).toEqual(
                `You can't add an entity without an identifier: '@id'.`
            );
        }

        // test 6
        try {
            entity = {
                "@id": "./",
                "@type": "Dataset",
            };
            r = cm.addEntity(entity);
        } catch (error) {
            expect((error as Error).message).toEqual(
                `You can't add an entity with id: './' as that will clash with the root dataset.`
            );
        }

        // test 7
        try {
            entity = {
                "@id": "#person",
            };
            r = cm.addEntity({ entity } as UnverifiedEntityDefinition);
        } catch (error) {
            expect((error as Error).message).toEqual(
                `You can't add an entity without an identifier: '@id'.`
            );
        }
    });
    test(`prevent adding entities with id's that clash with root dataset or descriptor`, () => {
        try {
            cm.addEntity({ "@id": "./", "@type": "Dataset" });
        } catch (error) {
            expect((error as Error).message).toEqual(
                `You can't add an entity with id: './' as that will clash with the root dataset.`
            );
        }
        try {
            cm.addEntity({ "@id": "ro-crate-metadata.json", "@type": "CreativeWork" });
        } catch (error) {
            expect((error as Error).message).toEqual(
                `You can't add an entity with id: 'ro-crate-metadata.json' as that will clash with the root descriptor.`
            );
        }
        // ensure it fails even when the type is different
        try {
            cm.addEntity({ "@id": "ro-crate-metadata.json", "@type": "Person" });
        } catch (error) {
            expect((error as Error).message).toEqual(
                `You can't add an entity with id: 'ro-crate-metadata.json' as that will clash with the root descriptor.`
            );
        }
    });
    test("add a simple entity to the crate and export as a template", () => {
        let entity = {
            "@id": "#person",
            "@type": "Person",
            name: "person",
            data: "value",
        };
        let e = cm.addEntity(entity);

        let template = cm.exportEntityTemplate({ id: e["@id"], resolveDepth: 1 });
        expect(template).toMatchObject({
            "@id": "#person",
            "@type": ["Person"],
            name: "person",
            data: "value",
        });
    });
    test(`Ensure no id clashes when entity type is different`, () => {
        let topic = {
            "@id": "#1234",
            "@type": "Topic",
            name: "topic",
        };
        let e = cm.addEntity(topic);
        expect(e).toEqual({ "@id": "#1234", "@type": ["Topic"], name: "topic" });

        let theme = {
            "@id": "#1234",
            "@type": "Theme",
            name: "theme",
        };
        e = cm.addEntity(theme);
        expect(e).toEqual({ "@id": "#e4", "@type": ["Theme"], name: "theme" });

        e = cm.addEntity(e);
        expect(e).toMatchObject({ "@id": "#e4", "@type": ["Theme"], name: "theme" });
    });
    test("add a complex entity to the crate and export as a template", () => {
        let entity: UnverifiedEntityDefinition = {
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
            let _template = cm.exportEntityTemplate({
                id: "#person",
                resolveDepth: 4,
            });
        } catch (error) {
            expect((error as Error).message).toEqual(`resolveDepth can only be 0 or 1`);
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
        let e: NormalisedEntityDefinition = cm.addEntity(entity);
        expect(e).toBeTruthy;

        let r = cm.updateProperty({
            id: entity["@id"],
            idx: 0,
            property: "name",
            value: "something else",
        });
        expect(r).toBeTruthy;
        e = cm.getEntity({ id: entity["@id"] }) as NormalisedEntityDefinition;
        expect(e.name).toEqual("something else");
    });
    test("update entity @type", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
        };
        let e: NormalisedEntityDefinition = cm.addEntity(entity);
        expect(e).toBeTruthy;

        // test 1
        let r = cm.updateProperty({
            id: entity["@id"],
            property: "@type",
            idx: 0,
            value: ["Person", "Adult"],
        });
        expect(r).toBeTruthy;
        e = cm.getEntity({ id: entity["@id"] }) as NormalisedEntityDefinition;
        expect(e["@type"]).toEqual(["Person", "Adult"]);

        // test 2
        r = cm.updateProperty({
            id: entity["@id"],
            property: "@type",
            value: ["Adult", "Person", "Adult"],
        });
        expect(r).toBeTruthy;
        e = cm.getEntity({ id: entity["@id"] }) as NormalisedEntityDefinition;
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
    test(`trying to set a property on a non-existent entity`, () => {
        let result = cm.updateProperty({
            id: "http://schema.org/person",
            property: "@id",
            value: "new",
        });
        expect(result).toEqual(undefined);
    });
    test("delete an entity", () => {
        const f1 = cm.addFile("/file1.txt");
        const f2 = cm.addFile("/file2.txt");
        let r1 = cm.addEntity({ "@id": "_:r1", "@type": "Relationship", name: "r1" });
        let r2 = cm.addEntity({ "@id": "_:r2", "@type": "Relationship", name: "r2" });

        // cm.linkEntity({ id: "./", property: "hasPart", value: r1 });
        // cm.linkEntity({ id: "./", property: "hasPart", value: r2 });

        // delete an entity that is not linked to anything
        cm.deleteEntity({ id: r1["@id"] });
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file1.txt" },
            { "@id": "file2.txt" },
            { "@id": "_:r2" },
        ]);

        // console.log(JSON.stringify(cm.exportCrate()["@graph"], null, 2));

        // re-add the entity and link a file to it
        r1 = cm.addEntity({ "@id": "_:r1", "@type": "Relationship", name: "r1" });
        cm.linkEntity({ id: "./", property: "hasPart", value: r1 });
        cm.setProperty({
            id: r1["@id"],
            property: "object",
            propertyId: "",
            value: f1,
        });
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file1.txt" },
            { "@id": "file2.txt" },
            { "@id": "_:r2" },
            { "@id": "_:r1", object: { "@id": "file1.txt" } },
        ]);

        // now delete it and check everything else is still there
        cm.deleteEntity({ id: r1["@id"] });
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file1.txt" },
            { "@id": "file2.txt" },
            { "@id": "_:r2" },
        ]);
        // console.log(JSON.stringify(cm.exportCrate()["@graph"], null, 2));

        // re-add the entity and link a file to it
        r1 = cm.addEntity({ "@id": "_:r1", "@type": "Relationship", name: "r1" });
        // cm.linkEntity({ id: "./", property: "hasPart", value: r1 });
        cm.setProperty({
            id: r1["@id"],
            property: "object",
            propertyId: "",
            value: f1,
        });

        //  link the same file to a different entity
        cm.setProperty({
            id: r2["@id"],
            property: "object",
            propertyId: "",
            value: f1,
        });
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file1.txt" },
            { "@id": "file2.txt" },
            { "@id": "_:r2", object: { "@id": "file1.txt" } },
            { "@id": "_:r1", object: { "@id": "file1.txt" } },
        ]);

        // now delete it and check everything else is still there
        cm.deleteEntity({ id: r1["@id"] });
        // console.log(JSON.stringify(cm.exportCrate()["@graph"], null, 2));
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file1.txt" },
            { "@id": "file2.txt" },
            { "@id": "_:r2" },
        ]);
    });
    test("prevent deleting the root dataset and the root descriptor", () => {
        try {
            cm.deleteEntity({ id: "./" });
        } catch (error) {
            expect((error as Error).message).toEqual(
                `You can't delete the root dataset or the root descriptor.`
            );
        }
        try {
            cm.deleteEntity({ id: "ro-crate-metadata.json" });
        } catch (error) {
            expect((error as Error).message).toEqual(
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
            expect((error as Error).message).toEqual(
                `This method does not operate on @id, @type, @reverse, name`
            );
        }
        //  fail bad value
        try {
            cm.setProperty({
                id: "./",
                property: "new",
                value: {} as EntityReference,
            });
        } catch (error) {
            expect((error as Error).message).toEqual(
                `value must be a string, number, boolean or object with '@id'`
            );
        }
        try {
            cm.setProperty({
                id: "./",
                property: "new",
                value: [] as any,
            });
        } catch (error) {
            expect((error as Error).message).toEqual(
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
            expect((error as Error).message).toEqual(
                `'@id' property must be a string or not defined at all`
            );
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
        e = cm.getEntity({ id: e["@id"] }) as NormalisedEntityDefinition;
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
    test("delete a instance of data attached to a property", () => {
        const url = chance.url();
        let entity = {
            "@id": url,
            "@type": "Person",
            name: chance.sentence(),
            text: "some text",
        };
        let e = cm.addEntity(entity);
        e = cm.getEntity({ id: e["@id"] }) as NormalisedEntityDefinition;

        cm.deleteProperty({
            id: e["@id"],
            property: "text",
            idx: 0,
        });

        e = cm.getEntity({ id: e["@id"] }) as NormalisedEntityDefinition;
        expect(e).not.toHaveProperty("text");
    });
    test("delete all data connected to a property", () => {
        let entity: UnverifiedEntityDefinition = {
            "@id": "#person1",
            "@type": "Person",
            name: "person1",
            text: ["some text", "some other text"],
        };
        let e1 = cm.addEntity(entity);
        e1 = cm.getEntity({ id: e1["@id"] }) as NormalisedEntityDefinition;

        // link it to another entity
        entity = {
            "@id": "#person2",
            "@type": "Person",
            name: "person2",
        };
        let e2 = cm.addEntity(entity);
        e2 = cm.getEntity({ id: e2["@id"] }) as NormalisedEntityDefinition;

        cm.linkEntity({ id: e1["@id"], property: "knows", value: e2 });

        let crate = cm.exportCrate();
        expect(crate["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
            },
            {
                "@id": "#person1",
                "@type": "Person",
                name: "person1",
                text: ["some text", "some other text"],
                knows: { "@id": "#person2" },
            },
            {
                "@id": "#person2",
                "@type": "Person",
                name: "person2",
            },
        ]);

        // delete a property without associations
        cm.deleteProperty({
            id: e1["@id"],
            property: "text",
        });

        e1 = cm.getEntity({ id: e1["@id"] }) as NormalisedEntityDefinition;
        expect(e1).not.toHaveProperty("text");

        // ensure it doesn't fail when that same prop doesn't exist
        cm.deleteProperty({
            id: e1["@id"],
            property: "text",
        });
        e1 = cm.getEntity({ id: e1["@id"] }) as NormalisedEntityDefinition;
        expect(e1).not.toHaveProperty("text");

        expect(crate["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
            },
            {
                "@id": "#person1",
                "@type": "Person",
                name: "person1",
                knows: { "@id": "#person2" },
            },
            {
                "@id": "#person2",
                "@type": "Person",
                name: "person2",
            },
        ]);

        // delete a property with associations
        cm.deleteProperty({
            id: e1["@id"],
            property: "knows",
        });
        e1 = cm.getEntity({ id: e1["@id"] }) as NormalisedEntityDefinition;
        expect(e1).not.toHaveProperty("text");

        crate = cm.exportCrate();
        expect(crate["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
            },
            {
                "@id": "#person1",
            },
            {
                "@id": "#person2",
            },
        ]);
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
                value: "string" as any,
            });
        } catch (error) {
            expect((error as Error).message).toEqual(`value must be an object with '@id' defined`);
        }

        try {
            cm.unlinkEntity({
                id: "./",
                property: "author",
                value: "string" as any,
            });
        } catch (error) {
            expect((error as Error).message).toEqual(`value must be an object with '@id' defined`);
        }
    });
    test("linking / unlinking two entities and handling inverse property associations", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
            classes: [] as any,
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
            metadata: {} as any,
            classes: [] as any,
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
        expect((crate["@graph"][1]["@reverse"] as any).isKeywordOf).toEqual({ "@id": "#term" });
        expect(crate["@graph"][2].isKeywordOf).toEqual({ "@id": "./" });
        expect((crate["@graph"][2]["@reverse"] as any).keywords).toEqual({ "@id": "./" });

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

        e1 = cm.getEntity({ id: e1["@id"] }) as NormalisedEntityDefinition;
        expect(e1).toMatchObject({ "@id": "#an%20id", "@type": ["Person"], name: "person" });

        let entityChild = {
            "@id": "child id",
            "@type": "Person",
            name: "child",
        };
        let e2 = cm.addEntity(entityChild);
        cm.linkEntity({ id: "#an%20id", property: "child", value: { "@id": e2["@id"] } });
        e2 = cm.getEntity({ id: e2["@id"] }) as NormalisedEntityDefinition;
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
            [...cm.getEntities({ query: {} as any })];
        } catch (error) {
            expect((error as Error).message).toEqual(`query must be a string`);
        }
        try {
            [...cm.getEntities({ type: {} as any })];
        } catch (error) {
            expect((error as Error).message).toEqual(`type must be a string`);
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
        let ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([{ "@id": "ro-crate-metadata.json" }, { "@id": "./" }]);

        // add entity and export
        let entity = {
            "@id": chance.url(),
            "@type": "Person",
            name: chance.sentence(),
        };
        cm.addEntity(entity);
        ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": entity["@id"] },
        ]);

        // link ./ -> entity and export
        cm.setProperty({ id: "./", property: "author", value: entity });
        ec = cm.exportCrate();
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", author: { "@id": entity["@id"] } },
            { "@id": entity["@id"], "@reverse": { author: { "@id": "./" } } },
        ]);

        // link entity -> ./ and export - ie ensure it can handle circular refs
        cm.setProperty({ id: entity["@id"], property: "isAuthorOf", value: { "@id": "./" } });
        ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./", "@reverse": { isAuthorOf: { "@id": entity["@id"] } } },
            { "@id": entity["@id"], isAuthorOf: { "@id": "./" } },
        ]);
    });
    test("fail flattening", () => {
        try {
            let flattened = cm.flatten([] as any);
        } catch (error) {
            expect((error as Error).message).toEqual(`flatten only takes an object.`);
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
            propertyId: "https://schema.org/languageId",
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
            propertyId: "https://schema.org/languageId",
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
            propertyId: "https://schema.org/languageId",
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
            propertyId: "https://schema.org/author",
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
            propertyId: "https://schema.org/author",
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
    test(`check purging unlinked nodes; confirm it handles linking type entities like relationships`, () => {
        // add a blank node not linked to anything
        cm.addBlankNode("Relationship");

        // and an entity linked to root dataset
        cm.ingestAndLink({
            id: "./",
            property: "people",
            propertyId: "https://schema.org/author",
            json: { "@id": "#1", "@type": "Person", name: "#1" },
        });

        // confirm they are both there
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "_:Relationship1" },
            { "@id": "#1" },
        ]);

        // purge unlinked and confirm blank node gone
        cm.purgeUnlinkedEntities();
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "#1" },
        ]);

        // re add blank node and link to the entity in the graph
        const e = cm.addBlankNode("Relationship");
        cm.setProperty({
            id: e["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": "#1" },
        });
        // console.log(cm.exportCrate()["@graph"]);
        cm.purgeUnlinkedEntities();
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "#1" },
            { "@id": "_:Relationship2" },
        ]);
        // console.log(cm.exportCrate()["@graph"]);
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

        let entity: any = {
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
            target: { "@id": "#thing1" } as any,
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

        cm.updateProperty({ id: r["@id"], property: "@type", idx: 0, value: "Cow" });
        expect(cm.getEntityTypes()).toEqual(["Cow", "CreativeWork", "Dataset"]);

        cm.deleteEntity({ id: r["@id"] });
        expect(cm.getEntityTypes()).toEqual(["CreativeWork", "Dataset"]);
    });
    test("test creating blank nodes", () => {
        let cm = new CrateManager({ crate });

        let e = cm.addBlankNode("Relationship");
        expect(e).toEqual({
            "@id": "_:Relationship1",
            "@type": ["Relationship"],
            name: "_:Relationship1",
        });

        e = cm.addBlankNode("Relationship");
        expect(e).toEqual({
            "@id": "_:Relationship2",
            "@type": ["Relationship"],
            name: "_:Relationship2",
        });

        e = cm.addBlankNode("GeoShape");
        expect(e).toEqual({
            "@id": "_:GeoShape1",
            "@type": ["GeoShape"],
            name: "_:GeoShape1",
        });

        e = cm.addBlankNode("CreateAction");
        expect(e).toEqual({
            "@id": "_:CreateAction1",
            "@type": ["CreateAction"],
            name: "_:CreateAction1",
        });

        // ensure we don't clash with pre-existing blank nodes
        e = cm.addBlankNode("Relationship");
        expect(e).toMatchObject({
            "@id": "_:Relationship3",
            "@type": ["Relationship"],
            name: "_:Relationship3",
        });
    });
    test(`test locating entities - strict matching`, () => {
        let cm = new CrateManager({ crate });

        const r1 = cm.addBlankNode("Relationship");
        const r2 = cm.addBlankNode("Relationship");
        const e1 = cm.addEntity({ "@id": "/a/b/file1.txt", "@type": "File", name: "/file1.txt" });
        const e2 = cm.addEntity({ "@id": "/file2.txt", "@type": "File", name: "/file2.txt" });
        const e3 = cm.addFile("/a/c/d/file.png");
        const e4 = cm.addFile("/a/c/d/file with spaces.png");

        // link e1 and e2 entities to r1
        cm.linkEntity({
            id: r1["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e1["@id"] },
        });

        cm.linkEntity({
            id: r1["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e2["@id"] },
        });

        // link all of the entities to r2
        cm.linkEntity({
            id: r2["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e2["@id"] },
        });
        cm.linkEntity({
            id: r2["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e3["@id"] },
        });
        cm.linkEntity({
            id: r2["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e4["@id"] },
        });

        // console.log(JSON.stringify(cm.exportCrate()["@graph"], null, 2));

        // won't find a matching entity
        let matches = cm.locateEntity({ entityIds: ["file1.txt", "/file2.txt"] });
        expect(matches).toEqual(undefined);

        // will not find a matching entity - not an exact match
        matches = cm.locateEntity({ entityIds: ["/file1.txt"] });
        expect(matches).toEqual(undefined);

        // will find a matching entity - an exact match
        matches = cm.locateEntity({ entityIds: ["/a/b/file1.txt", "/file2.txt"] });
        expect(matches).toMatchObject([
            {
                "@id": "_:Relationship1",
                "@type": ["Relationship"],
                name: "_:Relationship1",
            },
        ]);

        // will find a matching entity - an exact match
        matches = cm.locateEntity({ entityIds: ["/file2.txt", "/a/b/file1.txt"] });
        expect(matches).toMatchObject([
            {
                "@id": "_:Relationship1",
                "@type": ["Relationship"],
                name: "_:Relationship1",
            },
        ]);

        // will not find a matching entity - no match
        matches = cm.locateEntity({ entityIds: ["/file2.pdf", "/file1.txt"] });
        expect(matches).toEqual(undefined);

        // will find a matching entity - an exact match
        matches = cm.locateEntity({
            entityIds: ["a/c/d/file.png", "/file2.txt", "a/c/d/file with spaces.png"],
        });
        expect(matches).toMatchObject([
            {
                "@id": "_:Relationship2",
                "@type": ["Relationship"],
                name: "_:Relationship2",
            },
        ]);

        matches = cm.locateEntity({
            entityIds: ["/file2.txt", "a/c/d/file.png", "a/c/d/file with spaces.png"],
        });
        expect(matches).toMatchObject([
            {
                "@id": "_:Relationship2",
                "@type": ["Relationship"],
                name: "_:Relationship2",
            },
        ]);

        matches = cm.locateEntity({
            entityIds: ["/file2.txt", "a/c/d/file.png", "a/c/d/file with spaces.png"],
        });
        expect(matches).toMatchObject([
            {
                "@id": "_:Relationship2",
                "@type": ["Relationship"],
                name: "_:Relationship2",
            },
        ]);
    });
    test(`test locating entities - subset matching`, () => {
        let cm = new CrateManager({ crate });

        const r1 = cm.addBlankNode("Relationship");
        const r2 = cm.addBlankNode("Relationship");
        const e1 = cm.addEntity({ "@id": "/a/b/file1.txt", "@type": "File", name: "/file1.txt" });
        const e2 = cm.addEntity({ "@id": "/file2.txt", "@type": "File", name: "/file2.txt" });
        const e3 = cm.addFile("/a/c/d/file.png");
        const e4 = cm.addFile("/a/c/d/file with spaces.png");

        // link e1 and e2 entities to r1
        cm.linkEntity({
            id: r1["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e1["@id"] },
        });

        cm.linkEntity({
            id: r1["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e2["@id"] },
        });

        // link e2, e3 and e4 to r2
        cm.linkEntity({
            id: r2["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e2["@id"] },
        });
        cm.linkEntity({
            id: r2["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e3["@id"] },
        });
        cm.linkEntity({
            id: r2["@id"],
            property: "object",
            propertyId: "https://schema.org/object",
            value: { "@id": e4["@id"] },
        });

        // console.log(JSON.stringify(cm.exportCrate()["@graph"], null, 2));

        // won't find a matching entity
        let matches = cm.locateEntity({ entityIds: ["file1.txt", "/file2.txt"] });
        expect(matches).toEqual(undefined);

        // will find a matching entity - subset match
        matches = cm.locateEntity({ entityIds: ["/file2.txt"], strict: false });
        expect(matches).toMatchObject([{ "@id": "_:Relationship1" }, { "@id": "_:Relationship2" }]);

        // will find a matching entity - an exact match
        matches = cm.locateEntity({ entityIds: ["/a/b/file1.txt", "/file2.txt"], strict: false });
        expect(matches).toMatchObject([
            {
                "@id": "_:Relationship1",
            },
        ]);
    });
    test("add files and folders to the crate", () => {
        let e = cm.addFile("/file.txt");
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file.txt", "@type": "File" },
        ]);
        expect(e).toEqual({ "@id": "file.txt", "@type": ["File"], name: "file.txt" });

        e = cm.addFolder("images");
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file.txt", "@type": "File" },
            { "@id": "images/", "@type": "Dataset" },
        ]);
        expect(e).toEqual({ "@id": "images/", "@type": ["Dataset"], name: "images/" });

        cm.addFile("/folder/file.txt");
        // console.log(cm.exportCrate()["@graph"]);
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file.txt", "@type": "File" },
            { "@id": "images/", "@type": "Dataset" },
            { "@id": "folder/", "@type": "Dataset" },
            { "@id": "folder/file.txt", "@type": "File" },
        ]);

        cm.addFile("/a/b/c/d/file.png");
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file.txt", "@type": "File" },
            { "@id": "images/", "@type": "Dataset" },
            { "@id": "folder/", "@type": "Dataset" },
            { "@id": "folder/file.txt", "@type": "File" },
            { "@id": "a/", "@type": "Dataset" },
            { "@id": "a/b/", "@type": "Dataset" },
            { "@id": "a/b/c/", "@type": "Dataset" },
            { "@id": "a/b/c/d/", "@type": "Dataset" },
            { "@id": "a/b/c/d/file.png", "@type": "File" },
        ]);

        e = cm.addFolder("/a/j/f/g");
        // console.log(JSON.ddstringify(cm.exportCrate()["@graph"], null, 2));
        expect(cm.exportCrate()["@graph"]).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "file.txt", "@type": "File" },
            { "@id": "images/", "@type": "Dataset" },
            { "@id": "folder/", "@type": "Dataset" },
            { "@id": "folder/file.txt", "@type": "File" },
            { "@id": "a/", "@type": "Dataset" },
            { "@id": "a/b/", "@type": "Dataset" },
            { "@id": "a/b/c/", "@type": "Dataset" },
            { "@id": "a/b/c/d/", "@type": "Dataset" },
            { "@id": "a/b/c/d/file.png", "@type": "File" },
            { "@id": "a/j/", "@type": "Dataset" },
            { "@id": "a/j/f/", "@type": "Dataset" },
            { "@id": "a/j/f/g/", "@type": "Dataset" },
        ]);
        expect(e).toEqual({ "@id": "a/j/f/g/", "@type": ["Dataset"], name: "a/j/f/g/" });
    });
});

function getBaseCrate(): UnverifiedCrate {
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

function addRootDataset({ crate }: { crate: UnverifiedCrate }) {
    crate["@graph"].push({
        "@id": "./",
        "@type": "Dataset",
        name: "Dataset",
    });
    return crate;
}
