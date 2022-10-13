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
        expect(propertyDefinition.type.sort()).toEqual(["Date", "DateTime"]);
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
                Thing: {
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
        let types = profileManager.mapTypeHierarchies(["Thing"]);
        let { inputs } = profileManager.getInputs({ types: ["Thing"] });
        inputs = inputs.map((input) => input.id);
        expect(inputs).toEqual(["https://schema.org/date"]);
        expect(inputs.length).toEqual(1);
    });
    test("get inputs for type defined in profile - no subClass in profile, definition inherit", () => {
        const profile = {
            metadata: {},
            classes: {
                Thing: {
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
        let { inputs } = profileManager.getInputs({ types: ["Thing"] });
        inputs = inputs.map((input) => input.id);
        expect(inputs).toEqual([
            "http://schema.org/additionalType",
            "http://schema.org/alternateName",
            "https://schema.org/date",
            "http://schema.org/description",
            "http://schema.org/disambiguatingDescription",
            "http://schema.org/identifier",
            "http://schema.org/image",
            "http://schema.org/mainEntityOfPage",
            "http://schema.org/name",
            "http://schema.org/potentialAction",
            "http://schema.org/sameAs",
            "http://schema.org/subjectOf",
            "http://schema.org/url",
        ]);
        expect(inputs.length).toEqual(13);
    });
    test("get inputs for type defined in profile - subClass in profile, definition inherit, props dup'ed", () => {
        const profile = {
            metadata: {},
            classes: {
                Thing: {
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
        let { inputs } = profileManager.getInputs({ types: ["Thing"] });
        inputs = inputs.map((input) => input.id);
        expect(inputs).toEqual(["https://schema.org/date"]);
        expect(inputs.length).toEqual(1);
    });
    test("get inputs for type defined in profile - subClass in profile, definition inherit", () => {
        const profile = {
            metadata: {},
            classes: {
                Thing: {
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
                            id: "https://schema.org/somethingElse",
                            name: "else",
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
        let { inputs } = profileManager.getInputs({ types: ["Thing"] });
        inputs = inputs.map((input) => input.id);
        expect(inputs.sort()).toEqual([
            "https://schema.org/date",
            "https://schema.org/somethingElse",
        ]);
        expect(inputs.length).toEqual(2);
    });
    test("get inputs for type array defined in profile - test 1", () => {
        const profile = {
            metadata: {},
            classes: {
                "Thing, Intangible": {
                    definition: "inherit",
                    subClassOf: [],
                    inputs: [],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let { inputs } = profileManager.getInputs({ types: ["Thing", "Intangible"] });
        inputs = inputs.map((input) => input.id);
        expect(inputs).toEqual([
            "http://schema.org/additionalType",
            "http://schema.org/alternateName",
            "http://schema.org/description",
            "http://schema.org/disambiguatingDescription",
            "http://schema.org/identifier",
            "http://schema.org/image",
            "http://schema.org/mainEntityOfPage",
            "http://schema.org/name",
            "http://schema.org/potentialAction",
            "http://schema.org/sameAs",
            "http://schema.org/subjectOf",
            "http://schema.org/url",
        ]);
    });
    test("get inputs for type array defined in profile - test 2", () => {
        const profile = {
            metadata: {},
            classes: {
                "Thing, MedicalEntity": {
                    definition: "inherit",
                    subClassOf: [],
                    inputs: [],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let { inputs } = profileManager.getInputs({ types: ["Thing", "MedicalEntity"] });
        inputs = inputs.map((input) => input.id);
        expect(inputs).toEqual([
            "http://schema.org/additionalType",
            "http://schema.org/alternateName",
            "http://schema.org/code",
            "http://schema.org/description",
            "http://schema.org/disambiguatingDescription",
            "http://schema.org/funding",
            "http://schema.org/guideline",
            "http://schema.org/identifier",
            "http://schema.org/image",
            "http://schema.org/legalStatus",
            "http://schema.org/mainEntityOfPage",
            "http://schema.org/medicineSystem",
            "http://schema.org/name",
            "http://schema.org/potentialAction",
            "http://schema.org/recognizingAuthority",
            "http://schema.org/relevantSpecialty",
            "http://schema.org/sameAs",
            "http://schema.org/study",
            "http://schema.org/subjectOf",
            "http://schema.org/url",
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
