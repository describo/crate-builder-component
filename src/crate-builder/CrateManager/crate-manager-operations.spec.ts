import "regenerator-runtime";
import { describe, expect, test, beforeAll, vi } from "vitest";
import { CrateManager } from "./crate-manager";
import type { UnverifiedCrate } from "../types";

describe("Test loading / exporting crate files", () => {
    beforeAll(() => {
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });
    test("a bunch of entity update operations", async () => {
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
        let cm = new CrateManager({ crate });
        let ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));

        let entities = [...cm.getEntities()];
        expect(entities.length).toEqual(4);
        expect(entities).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            { "@id": "./" },
            { "@id": "#person1" },
            { "@id": "#organisation1" },
        ]);
        // console.log(JSON.stringify(entities, null, 2));

        cm.updateProperty({ id: "#person1", property: "@id", value: "http://person.example.com" });
        ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                author: { "@id": "http://person.example.com" },
            },
            {
                "@id": "http://person.example.com",
            },
            {
                "@id": "#organisation1",
                director: {
                    "@id": "http://person.example.com",
                },
            },
        ]);

        cm.updateProperty({ id: "#organisation1", property: "@id", value: "thebadguys" });
        ec = cm.exportCrate();
        // console.log(JSON.stringify(ec["@graph"], null, 2));
        expect(ec["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                author: { "@id": "http://person.example.com" },
            },
            {
                "@id": "http://person.example.com",
                "@reverse": {
                    director: {
                        "@id": "#thebadguys",
                    },
                },
            },
            {
                "@id": "#thebadguys",
            },
        ]);
        entities = [...cm.getEntities()];
        // console.log(entities);
        expect(entities).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
            },
            {
                "@id": "http://person.example.com",
            },
            {
                "@id": "#thebadguys",
            },
        ]);

        // set the id back to #person1 and delete the organisation
        cm.updateProperty({
            id: "http://person.example.com",
            property: "@id",
            value: "#person1",
        });
        cm.deleteEntity({ id: "#thebadguys" });
        entities = [...cm.getEntities()];
        expect(entities).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
            },
            {
                "@id": "#person1",
            },
        ]);

        // set properties
        try {
            cm.setProperty({
                id: "",
                property: "value",
                propertyId: "http://schema.org/value",
                value: "value",
            });
        } catch (error) {
            (error as Error).message = `'setProperty' requires 'id'`;
        }
        cm.setProperty({ id: "./", property: "data", value: "value" });
        cm.setProperty({ id: "./", property: "data", value: { "@id": "#person1" } });
        entities = [...cm.getEntities()];
        // console.log(entities);
        expect(entities).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                data: ["value", "value", { "@id": "#person1" }],
                author: [{ "@id": "#person1" }],
            },
            {
                "@id": "#person1",
            },
        ]);

        // delete a property
        cm.deleteProperty({
            id: "./",
            property: "data",
            idx: 2,
        });
        entities = [...cm.getEntities()];
        // console.log(entities);
        expect(entities).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                data: ["value", "value"],
                author: [{ "@id": "#person1" }],
            },
            {
                "@id": "#person1",
            },
        ]);

        // set another property
        cm.setProperty({ id: "#person1", property: "authorOf", value: { "@id": "./" } });
        entities = [...cm.getEntities({})];
        expect(entities).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                data: ["value", "value"],
                author: [{ "@id": "#person1" }],
            },
            {
                "@id": "#person1",
                authorOf: [{ "@id": "./" }],
            },
        ]);

        // update a property
        cm.updateProperty({ id: "./", property: "data", idx: 1, value: "new" });
        entities = [...cm.getEntities()];
        expect(entities).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                data: ["value", "new"],
                author: [{ "@id": "#person1" }],
            },
            {
                "@id": "#person1",
                authorOf: [{ "@id": "./" }],
            },
        ]);
        // console.log(entities);

        //  delete an entity
        cm.deleteEntity({ id: "#person1" });
        entities = [...cm.getEntities()];
        expect(entities).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                data: ["value", "new"],
            },
        ]);

        // add an entity
        cm.addEntity({
            "@id": "#person1",
            "@type": "Person",
            name: "person1",
        });
        entities = [...cm.getEntities()];
        expect(entities).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
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
        cm.addEntity({
            "@id": "#person1",
            "@type": "Person",
            name: "person1",
        });
        entities = [...cm.getEntities()];

        // console.log(entities);
        expect(entities).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                data: ["value", "new"],
            },
            {
                "@id": "#person1",
            },
        ]);

        // add an entity with the same id but different type
        cm.addEntity({
            "@id": "#person1",
            "@type": "Organisation",
            name: "person1",
        });
        entities = [...cm.getEntities()];

        expect(entities).toMatchObject([
            { "@id": "ro-crate-metadata.json" },
            {
                "@id": "./",
                data: ["value", "new"],
            },
            {
                "@id": "#person1",
            },
            { "@type": ["Organisation"] },
        ]);

        // console.log(JSON.stringify(entities, null, 2));
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
