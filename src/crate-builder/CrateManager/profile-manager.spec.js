import { describe, test, expect, beforeAll, vi } from "vitest";
import { ProfileManager } from "./profile-manager.js";

describe("Test working with profiles", () => {
    beforeAll(() => {
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });
    test("get type definition and inputs from the profile", () => {
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
        const entity = { "@type": ["Dataset"] };
        const profileManager = new ProfileManager({ profile });
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(1);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
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
        const entity = { "@type": ["Dataset"] };
        const profileManager = new ProfileManager({ profile });
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(1);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get inputs from the profile - handle type Array", () => {
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
                Other: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/description",
                            name: "description",
                            help: "",
                            type: ["Text"],
                            required: true,
                            multiple: false,
                        },
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
        const entity = { "@type": ["Dataset", "Other"] };
        const profileManager = new ProfileManager({ profile });
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(2);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing", "Other"]);
    });
    test("get type definition - no profile, look in schema.org", () => {
        const profile = undefined;
        const profileManager = new ProfileManager({ profile });
        const entity = { "@type": ["Dataset"] };
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(0);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get type definition - no profile, handle type array, look in schema.org", () => {
        const profile = undefined;
        const profileManager = new ProfileManager({ profile });
        const entity = { "@type": ["Dataset"] };
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(0);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get type definition - none defined in profile", () => {
        const profile = {
            metadata: {},
            classes: {},
        };
        const profileManager = new ProfileManager({ profile });
        const entity = { "@type": ["Dataset"] };
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(0);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get layout information from profile", () => {
        const profile = {
            metadata: {},
            layouts: [
                {
                    appliesTo: ["Dataset"],
                    about: {
                        label: "About",
                        description: "",
                    },
                    source: {
                        label: "Original Source Information",
                        description: "",
                    },
                    permissions: {
                        label: "Permissions",
                        description: "",
                    },
                    who: {
                        label: "Who",
                        description: "",
                    },
                    location: {
                        label: "Location",
                        description: "",
                    },
                    overflow: {
                        label: "Other",
                    },
                },
            ],
        };
        const profileManager = new ProfileManager({ profile });
        let layout = profileManager.getLayout({
            entity: { "@id": "#1", "@type": ["Dataset"] },
        });
        expect(layout).toEqual(profile.layouts[0]);
    });
    test("get layout information from profile - no layout", () => {
        const profile = {
            metadata: {},
            hide: {},
            layouts: {},
        };
        const profileManager = new ProfileManager({ profile });
        let layout = profileManager.getLayout({ entity: { "@id": "#1", "@type": ["Thing"] } });
        expect(layout).toBe(null);
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
        const entity = { "@type": ["Dataset"] };
        let { propertyDefinition } = profileManager.getPropertyDefinition({
            property: "date",
            entity,
        });
        expect(propertyDefinition.id).toEqual("https://schema.org/date");
    });
    test("get property definition - not defined in profile, lookup schema.org", () => {
        const profileManager = new ProfileManager({ profile: undefined });
        const entity = { "@type": ["Dataset"] };
        let { propertyDefinition } = profileManager.getPropertyDefinition({
            property: "dateModified",
            entity,
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
        const entity = { "@type": ["Dataset"] };
        let { propertyDefinition } = profileManager.getPropertyDefinition({
            property: "mojumbo",
            entity,
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
        let types = profileManager.mapTypeHierarchies({ types: ["Dataset"] });
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
        let types = profileManager.mapTypeHierarchies({ types: ["Dataset"] });
        expect(types).toEqual(["Dataset", "CreativeWork", "Thing", "NoSuchEntity"]);
    });
    test("get type hierarchy - type not defined in profile or schema.org", () => {
        const profile = {
            metadata: {},
            classes: {
                Children: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [],
                },
            },
        };
        const profileManager = new ProfileManager({ profile });
        let types = profileManager.mapTypeHierarchies({ types: ["Children"] });
        expect(types).toEqual(["Children", "Thing"]);
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
        let types = profileManager.mapTypeHierarchies({ types: ["Thing"] });
        let { inputs } = profileManager.getAllInputs({ entity: { "@type": ["Thing"] } });
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
        let { inputs } = profileManager.getAllInputs({ entity: { "@type": ["Thing"] } });
        inputs = inputs.map((input) => input.id);
        expect(inputs).toEqual([
            "http://schema.org/additionalType",
            "http://schema.org/alternateName",
            "http://purl.org/dc/terms/conformsTo",
            "https://schema.org/date",
            "http://schema.org/description",
            "http://schema.org/disambiguatingDescription",
            "https://www.ica.org/standards/RiC/ontology#hasCreationDate",
            "https://www.ica.org/standards/RiC/ontology#hasModificationDate",
            "http://schema.org/identifier",
            "http://schema.org/image",
            "http://schema.org/mainEntityOfPage",
            "http://schema.org/name",
            "http://schema.org/potentialAction",
            "http://schema.org/sameAs",
            "http://schema.org/subjectOf",
            "https://www.ica.org/standards/RiC/ontology#thingIsConnectedToRelation",
            "https://www.ica.org/standards/RiC/ontology#thingIsContextOfRelation",
            "https://www.ica.org/standards/RiC/ontology#thingIsSourceOfRelation",
            "https://www.ica.org/standards/RiC/ontology#thingIsTargetOfRelation",
            "http://schema.org/url",
        ]);
        expect(inputs.length).toEqual(20);
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
        let { inputs } = profileManager.getAllInputs({ entity: { "@type": ["Thing"] } });
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
        let { inputs } = profileManager.getAllInputs({ entity: { "@type": ["Thing"] } });
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
        let { inputs } = profileManager.getAllInputs({
            entity: { "@type": ["Thing", "Intangible"] },
        });
        inputs = inputs.map((input) => input.id);
        expect(inputs).toEqual([
            "http://schema.org/additionalType",
            "http://schema.org/alternateName",
            "http://purl.org/dc/terms/conformsTo",
            "http://schema.org/description",
            "http://schema.org/disambiguatingDescription",
            "https://www.ica.org/standards/RiC/ontology#hasCreationDate",
            "https://www.ica.org/standards/RiC/ontology#hasModificationDate",
            "http://schema.org/identifier",
            "http://schema.org/image",
            "http://schema.org/mainEntityOfPage",
            "http://schema.org/name",
            "http://schema.org/potentialAction",
            "http://schema.org/sameAs",
            "http://schema.org/subjectOf",
            "https://www.ica.org/standards/RiC/ontology#thingIsConnectedToRelation",
            "https://www.ica.org/standards/RiC/ontology#thingIsContextOfRelation",
            "https://www.ica.org/standards/RiC/ontology#thingIsSourceOfRelation",
            "https://www.ica.org/standards/RiC/ontology#thingIsTargetOfRelation",
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
        let { inputs } = profileManager.getAllInputs({
            entity: { "@type": ["Thing", "MedicalEntity"] },
        });
        inputs = inputs.map((input) => input.id);
        expect(inputs).toEqual([
            "http://schema.org/additionalType",
            "http://schema.org/alternateName",
            "http://schema.org/code",
            "http://purl.org/dc/terms/conformsTo",
            "http://schema.org/description",
            "http://schema.org/disambiguatingDescription",
            "http://schema.org/funding",
            "http://schema.org/guideline",
            "https://www.ica.org/standards/RiC/ontology#hasCreationDate",
            "https://www.ica.org/standards/RiC/ontology#hasModificationDate",
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
            "https://www.ica.org/standards/RiC/ontology#thingIsConnectedToRelation",
            "https://www.ica.org/standards/RiC/ontology#thingIsContextOfRelation",
            "https://www.ica.org/standards/RiC/ontology#thingIsSourceOfRelation",
            "https://www.ica.org/standards/RiC/ontology#thingIsTargetOfRelation",
            "http://schema.org/url",
        ]);
    });
});
