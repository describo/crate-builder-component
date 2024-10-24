import { describe, test, expect, beforeAll, vi } from "vitest";
import { CrateManager } from "./crate-manager";
import { readJSON } from "fs-extra";
import type { UnverifiedCrate } from "../types";

describe("Test loading / exporting crate files", () => {
    beforeAll(() => {
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });
    test("a simple crate file", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });
        let cm = new CrateManager({ crate });
        let exportedCrate = cm.exportCrate();
        expect(crate["@graph"].length).toEqual(exportedCrate["@graph"].length);
    });
    test("a simple crate file - test id remapping", async () => {
        let crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": "Dataset",
            name: "root dataset",
            author: { "@id": "invalid id" },
        });
        crate["@graph"].push({
            "@id": "invalid id",
            "@type": "Person",
            name: "person",
            other: { "@id": "second invalid id" },
        });
        crate["@graph"].push({
            "@id": "second invalid id",
            "@type": "Person",
            name: "person",
        });
        let cm = new CrateManager({ crate });
        let exportedCrate = cm.exportCrate();
        expect(exportedCrate["@graph"]).toMatchObject([
            {
                "@id": "ro-crate-metadata.json",
            },
            {
                "@id": "./",
                author: {
                    "@id": "#invalid%20id",
                },
            },
            {
                "@id": "#invalid%20id",
                other: {
                    "@id": "#second%20invalid%20id",
                },
            },
            {
                "@id": "#second%20invalid%20id",
                "@reverse": {
                    other: {
                        "@id": "#invalid%20id",
                    },
                },
            },
        ]);
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
        crate["@graph"].push({ "@id": "./", "@type": ["Dataset"], name: ["something"] as any });
        cm = new CrateManager({ crate });
        rd = cm.getRootDataset();
        expect(rd).toMatchObject({ "@id": "./", "@type": ["Dataset"], name: "something" });

        // test 4: property as array
        crate = getBaseCrate();
        crate["@graph"].push({
            "@id": "./",
            "@type": ["Dataset"],
            name: ["something"] as any,
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
            name: ["something"] as any,
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
        let exportedCrate = crateManager.exportCrate();
        expect(crate["@graph"].length).toEqual(exportedCrate["@graph"].length);
    });
    test("a crate file with non standard root dataset id - like arcp rubbish", async () => {
        let crate: UnverifiedCrate = {
            "@context": ["https://w3id.org/ro/crate/1.1/context"],
            "@graph": [
                {
                    "@id": "ro-crate-metadata.json",
                    "@type": "CreativeWork",
                    conformsTo: {
                        "@id": "https://w3id.org/ro/crate/1.1/context",
                    },
                    about: {
                        "@id": "arcp://name,cooee-corpus/corpus/root",
                    },
                },
                {
                    "@id": "arcp://name,cooee-corpus/corpus/root",
                    "@type": "Dataset",
                    name: "rubbish",
                },
            ],
        };
        let cm = new CrateManager({ crate });
        let exportedCrate = cm.exportCrate();
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
        let cm = new CrateManager({ crate: {} as UnverifiedCrate });
        expect(cm.getErrors().init).toMatchObject({
            description: "Errors encountered on crate load. These need to be fixed manually.",
            messages: ["The crate file does not have a '@context'."],
        });
    });
    test("should not fail when entities don't have id's", async () => {
        let crate = getBaseCrate();
        crate = addRootDataset({ crate });
        crate["@graph"].push({});
        new CrateManager({ crate });
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
        let cm = new CrateManager({ crate: { "@context": {} } as UnverifiedCrate });
        let errors = cm.getErrors();
        expect(errors.init.messages[0]).toEqual(
            `The crate file does not have '@graph' or it's not an array.`
        );
    });
    test("should fail on a crate file without @graph as array", async () => {
        let cm = new CrateManager({ crate: { "@context": {}, "@graph": {} } as UnverifiedCrate });
        let errors = cm.getErrors();
        expect(errors.init.messages[0]).toEqual(
            `The crate file does not have '@graph' or it's not an array.`
        );
    });
    test("should handle crate file without conformsTo in root descriptor", async () => {
        let crate: UnverifiedCrate = {
            "@context": ["https://w3id.org/ro/crate/1.1/context"],
            "@graph": [
                {
                    "@id": "ro-crate-metadata.json",
                    "@type": "CreativeWork",
                    about: {
                        "@id": "./",
                    },
                },
            ],
        };
        let cm = new CrateManager({ crate });
        let warnings = cm.getWarnings();
        expect(warnings).toMatchObject({
            hasWarning: true,
            init: {
                description:
                    "Issues encountered on crate load that should be fixed but aren't breaking",
                messages: [
                    "This root descriptor does not specify 'conformsTo'. It will be set to RO Crate v1.1",
                ],
            },
        });
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
        let exportedCrate = crateManager.exportCrate();
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
        let exportedCrate = crateManager.exportCrate();
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
        let exportedCrate = crateManager.exportCrate();
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
        let exportedCrate = crateManager.exportCrate();
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
        let exportedCrate = crateManager.exportCrate();
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
        let exportedCrate = crateManager.exportCrate();
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
        let exportedCrate = crateManager.exportCrate();
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
