import "regenerator-runtime";
import { CrateManager } from "./crate-manager.bundle.js";

describe("Test loading / exporting crate files", () => {
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });
    test.only("a bunch of entity update operations", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": "Dataset",
            name: "root dataset",
            data: "value",
            author: { "@id": "#person1" },
        });
        crate["@graph"].push({
            "@id": "#person1",
            "@type": "Person",
            name: "person1",
        });
        crate["@graph"].push({
            "@id": "#organisation1",
            "@type": "Organisation",
            name: "org1",
            director: { "@id": "#person1" },
        });

        //  load the crate in
        let cm = new CrateManager();
        await cm.load({ crate });
        let entities = cm.getEntities({});
        expect(entities.length).toEqual(3);
        expect(entities).toMatchObject([
            { "@id": "./" },
            {
                "@id": "#person1",
            },
            {},
        ]);
        // console.log(JSON.stringify(entities, null, 2));

        cm.updateEntity({ id: "#person1", property: "@id", value: "http://person.example.com" });
        entities = cm.getEntities({});
        // console.log(JSON.stringify(entities, null, 2));
        expect(entities).toMatchObject([
            { author: { "@id": "http://person.example.com" } },
            {
                "@id": "http://person.example.com",
                "@reverse": { author: { "@id": "./" } },
            },
            { director: { "@id": "http://person.example.com" } },
        ]);

        cm.updateEntity({ id: "#organisation1", property: "@id", value: "thebadguys" });
        entities = cm.getEntities({});
        // console.log(JSON.stringify(entities, null, 2));
        expect(entities).toMatchObject([
            {},
            {
                "@id": "http://person.example.com",
                "@reverse": { director: { "@id": "#thebadguys" } },
            },
            { "@id": "#thebadguys", director: { "@id": "http://person.example.com" } },
        ]);

        // set the id back to #person1 and delete the organisation
        cm.updateEntity({
            id: "http://person.example.com",
            property: "@id",
            value: "#person1",
        });
        cm.deleteEntity({ id: "#thebadguys" });
        entities = cm.getEntities({});

        // set properties
        try {
            cm.setProperty({ property: "value", value: "value" });
        } catch (error) {
            error.message = `'setProperty' requires 'id' or 'describoId' to be defined`;
        }
        cm.setProperty({ id: "./", property: "data", value: "value" });
        cm.setProperty({ id: "./", property: "data", tgtEntityId: "#person1" });
        entities = cm.getEntities({});
        expect(entities).toMatchObject([
            {
                "@id": "./",
                data: ["value", "value", { "@id": "#person1" }],
                author: { "@id": "#person1" },
            },
            {
                "@id": "#person1",
            },
        ]);

        // delete a property
        cm.deleteProperty({
            id: "./",
            property: "data",
            propertyIdx: 2,
        });
        entities = cm.getEntities({});
        expect(entities).toMatchObject([
            {
                "@id": "./",
                data: ["value", "value"],
                author: { "@id": "#person1" },
            },
            {
                "@id": "#person1",
            },
        ]);

        // set another property
        cm.setProperty({ id: "#person1", property: "authorOf", tgtEntityId: "./" });
        entities = cm.getEntities({});
        expect(entities).toMatchObject([
            {
                "@id": "./",
                data: ["value", "value"],
                author: { "@id": "#person1" },
            },
            {
                "@id": "#person1",
                authorOf: { "@id": "./" },
            },
        ]);

        // update a property
        cm.updateProperty({ id: "./", property: "data", idx: 1, value: "new" });
        entities = cm.getEntities({});
        expect(entities).toMatchObject([
            {
                "@id": "./",
                data: ["value", "new"],
                author: { "@id": "#person1" },
            },
            {
                "@id": "#person1",
                authorOf: { "@id": "./" },
            },
        ]);
        // console.log(entities);

        //  delete an entity
        cm.deleteEntity({ id: "#person1" });
        entities = cm.getEntities({});
        // console.log(entities);
        // // console.log(JSON.stringify(entities, null, 2));
        expect(entities).toMatchObject([
            {
                "@id": "./",
                data: ["value", "new"],
            },
        ]);

        // add an entity
        cm.setEntity({
            entity: {
                "@id": "#person1",
                "@type": "Person",
                name: "person1",
            },
        });
        entities = cm.getEntities({});
        expect(entities).toMatchObject([
            {
                "@id": "./",
                data: ["value", "new"],
            },
            {
                "@id": "#person1",
            },
        ]);
        // console.log(JSON.stringify(entities, null, 2));

        // add the same entity
        cm.setEntity({
            entity: {
                "@id": "#person1",
                "@type": "Person",
                name: "person1",
            },
        });
        entities = cm.getEntities({});

        expect(entities).toMatchObject([
            {
                "@id": "./",
                data: ["value", "new"],
            },
            {
                "@id": "#person1",
            },
        ]);
        // console.log(JSON.stringify(entities, null, 2));
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
