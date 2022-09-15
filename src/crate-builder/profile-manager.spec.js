import "regenerator-runtime";
import { range, round, compact, groupBy, random } from "lodash";
import { ProfileManager } from "./profile-manager.js";

describe("Test working with profiles", () => {
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });
    test("get type definition from the profile", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let type = profileManager.getTypeDefinition({ type: "Dataset" });
        expect(type).toEqual(profile.classes.Dataset);
    });
    test("get type definition from the profile - handle type Array", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let type = profileManager.getTypeDefinition({ type: ["Dataset"] });
        expect(type).toEqual(profile.classes.Dataset);
    });
    test("get type definition - no profile", () => {
        const profile = undefined;
        const profileManager = new ProfileManager({ profile });
        let type = profileManager.getTypeDefinition({ type: "Dataset" });
        expect(type).toEqual({ definition: "inherit", inputs: [] });
    });
    test("get type definition - no profile - handle type array", () => {
        const profile = undefined;
        const profileManager = new ProfileManager({ profile });
        let type = profileManager.getTypeDefinition({ type: ["Dataset"] });
        expect(type).toEqual({ definition: "inherit", inputs: [] });
    });
    test("get type definition - none defined in profile", () => {
        const profile = {
            metadata: {},
            classes: {},
        };
        const profileManager = new ProfileManager({ profile });
        let type = profileManager.getTypeDefinition({ type: "Dataset" });
        expect(type).toEqual({ definition: "inherit", inputs: [] });
    });
    test("get layout information from profile", () => {
        const profile = {
            metadata: {},
            hide: {
                Dataset: ["field2"],
            },
            layouts: {
                Dataset: [{ group1: ["field1"] }],
            },
        };
        const profileManager = new ProfileManager({ profile });
        let { layouts, hide } = profileManager.getLayout({ type: "Dataset" });
        expect(layouts).toEqual(profile.layouts.Dataset);
        expect(hide).toEqual(profile.hide.Dataset);
    });
    test("get layout information from profile - no layout", () => {
        const profile = {
            metadata: {},
            hide: {},
            layouts: {},
        };
        const profileManager = new ProfileManager({ profile });
        let { layouts, hide } = profileManager.getLayout({ type: "Dataset" });
        expect(layouts).toBe(undefined);
        expect(hide).toBe(undefined);
    });
    test("get property definition - defined in profile", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let { propertyDefinition } = profileManager.getPropertyDefinition({
            property: "date",
            type: "Dataset",
        });
        expect(propertyDefinition.id).toEqual("https://schema.org/date");
    });
    test("get property definition - not defined in profile, lookup schema.org", () => {
        const profileManager = new ProfileManager({ profile: undefined });
        let { propertyDefinition } = profileManager.getPropertyDefinition({
            property: "dateModified",
            type: "Dataset",
        });
        expect(propertyDefinition.id).toEqual("http://schema.org/dateModified");
        expect(propertyDefinition.type).toEqual(["Date", "DateTime"]);
    });
    test("get property definition - not defined in profile or schema.org; create default entry", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let { propertyDefinition } = profileManager.getPropertyDefinition({
            property: "mojumbo",
            type: "Dataset",
        });
        expect(propertyDefinition.type).toEqual(["Text"]);
    });
    test("get type hierarchy - type defined in profile, assume schema.org subClass", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let types = profileManager.mapTypeHierarchies(["Dataset"]);
        expect(types).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get type hierarchy - type defined in profile with subClass", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: ["NoSuchEntity"],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let types = profileManager.mapTypeHierarchies(["Dataset"]);
        expect(types).toEqual(["Dataset", "CreativeWork", "Thing", "NoSuchEntity"]);
    });
    test("get inputs for type defined in profile - no subClass in profile, definition override", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let types = profileManager.mapTypeHierarchies(["Dataset"]);
        let { inputs } = profileManager.getInputs({ types: ["Dataset"] });
        expect(inputs.length).toEqual(124);
    });
    test("get inputs for type defined in profile - no subClass in profile, definition inherit", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "inherit",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let { inputs } = profileManager.getInputs({ types: ["Dataset"] });
        expect(inputs.length).toEqual(133);
    });
    test("get inputs for type defined in profile - subClass in profile, definition inherit, props dup'ed", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: ["NoSuchEntity"],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
                NoSuchEntity: {
                    definition: "override",
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let { inputs } = profileManager.getInputs({ types: ["Dataset"] });
        expect(inputs.length).toEqual(124);
        expect(inputs.filter((i) => i.name === "date").length).toEqual(1);
    });
    test("get inputs for type defined in profile - subClass in profile, definition inherit, props not dup'ed", () => {
        const profile = {
            metadata: {},
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: ["NoSuchEntity"],
                    inputs: [
                        {
                            id: "https://schema.org/date",
                            name: "date",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
                NoSuchEntity: {
                    definition: "override",
                    inputs: [
                        {
                            id: "https://schema.org/nosuchprop",
                            name: "nosuchprop",
                            label: "Attach a date",
                            help: "",
                            type: ["Date"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let { inputs } = profileManager.getInputs({ types: ["Dataset"] });
        expect(inputs.length).toEqual(125);
        expect(inputs.filter((i) => i.name === "date").length).toEqual(1);
        expect(inputs.filter((i) => i.name === "nosuchprop").length).toEqual(1);
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
