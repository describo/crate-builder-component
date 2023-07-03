import "regenerator-runtime";
import { CrateManager, Property, Entity } from "./crate-manager.bundle.js";
// import { ROCrate } from "ro-crate";
import { readJSON } from "fs-extra";
import path from "path";
import Chance from "chance";
const chance = Chance();

describe("Test entity definition normalisation", () => {
    test(`test normalising known, good definition`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee._normalise(entity, "e0");
        expect(entity).toMatchObject({ "@id": "#1", "@type": ["Dataset"], name: "e1" });
    });
    test(`test normalising known, good definition with describoId defined`, () => {
        const ee = new Entity();
        let entity = {
            describoId: "RootDataset",
            "@id": "1",
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee._normalise(entity, "e0");
        expect(entity).toMatchObject({
            describoId: "RootDataset",
            "@id": "#1",
            "@type": ["Dataset"],
            name: "e1",
        });
    });
    test(`test normalising no @id`, () => {
        const ee = new Entity();
        let entity = {
            "@type": "Dataset",
            name: "e1",
        };
        entity = ee._normalise(entity, "e0");
        expect(entity).toMatchObject({ "@id": entity["@id"], "@type": ["Dataset"], name: "e1" });
    });
    test(`test normalising @id not string`, () => {
        const ee = new Entity();
        let entity = {
            "@id": 1,
            "@type": "Dataset",
            name: "e1",
        };
        try {
            entity = ee._normalise(entity, "e0");
        } catch (error) {
            expect(error.message).toBeDefined;
        }

        entity = {
            "@id": { object: "as string" },
            "@type": "Dataset",
            name: "e1",
        };
        try {
            entity = ee._normalise(entity, "e1");
        } catch (error) {
            expect(error.message).toBeDefined;
        }

        entity = {
            "@id": ["x"],
            "@type": "Dataset",
            name: "e1",
        };
        try {
            entity = ee._normalise(entity, "e2");
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
        entity = ee._normalise(entity, "e0");
        expect(entity).toMatchObject({
            "@id": "https://schema.org/Dataset",
            "@type": ["Dataset"],
            name: "e1",
        });
    });
    test(`test normalising no name property defined`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "https://schema.org/Dataset",
            "@type": "Dataset",
        };
        entity = ee._normalise(entity, "e0");
        expect(entity).toMatchObject({
            "@id": "https://schema.org/Dataset",
            "@type": ["Dataset"],
            name: "https://schema.org/Dataset",
        });
    });
    test(`test normalising @type`, () => {
        const ee = new Entity();
        let entity = {
            "@id": "https://schema.org/Dataset",
            name: "e1",
        };
        entity = ee._normalise(entity, "e0");
        expect(entity).toMatchObject({
            "@id": "https://schema.org/Dataset",
            "@type": ["URL"],
            name: "e1",
        });

        entity = {
            "@id": "#1",
            name: "e1",
        };
        entity = ee._normalise(entity, "e0");
        expect(entity).toMatchObject({
            "@id": "#1",
            "@type": ["Thing"],
            name: "e1",
        });

        entity = {
            "@id": "#1",
            "@type": ["Dataset", "Thing"],
            name: "e1",
        };
        entity = ee._normalise(entity, "e0");
        expect(entity).toMatchObject({
            "@id": "#1",
            "@type": ["Dataset", "Thing"],
            name: "e1",
        });
    });
});
