import { describe, test, expect, beforeAll, vi } from "vitest";
import { ProfileManager } from "./profile-manager";
import type { NormalisedEntityDefinition, NormalisedProfile } from "../types";

describe("Test working with profiles", () => {
    beforeAll(() => {
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });
    test("get type definition and inputs from the profile", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        const entity = { "@type": ["Dataset"] } as NormalisedEntityDefinition;
        const profileManager = new ProfileManager({ profile });
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(1);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get type definition from the profile - handle type Array", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        const entity = { "@type": ["Dataset"] } as NormalisedEntityDefinition;
        const profileManager = new ProfileManager({ profile });
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(1);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get inputs from the profile - handle type Array", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        const entity = { "@type": ["Dataset", "Other"] } as NormalisedEntityDefinition;
        const profileManager = new ProfileManager({ profile });
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(2);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing", "Other"]);
    });
    test("get type definition - no profile, look in schema.org", () => {
        const profile = undefined;
        const profileManager = new ProfileManager({ profile });
        const entity = { "@type": ["Dataset"] } as NormalisedEntityDefinition;
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(0);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get type definition - no profile, handle type array, look in schema.org", () => {
        const profile = undefined;
        const profileManager = new ProfileManager({});
        const entity = { "@type": ["Dataset"] } as NormalisedEntityDefinition;
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(0);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get type definition - none defined in profile", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
            classes: {},
        };
        const profileManager = new ProfileManager({ profile });
        const entity = { "@type": ["Dataset"] } as NormalisedEntityDefinition;
        let inputs = profileManager.getInputsFromProfile({ entity });
        expect(inputs.length).toEqual(0);

        let typeHierarchies = profileManager.getEntityTypeHierarchy({ entity });
        expect(typeHierarchies).toEqual(["Dataset", "CreativeWork", "Thing"]);
    });
    test("get layout information from profile", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
            classes: [] as any,
            layouts: [
                {
                    appliesTo: ["Dataset"],
                    about: {
                        name: "about",
                        label: "About",
                        description: "",
                    },
                    source: {
                        name: "Original Source Information",
                        label: "Original Source Information",
                        description: "",
                    },
                    permissions: {
                        name: "Permissions",
                        label: "Permissions",
                        description: "",
                    },
                    who: {
                        name: "Who",
                        label: "Who",
                        description: "",
                    },
                    location: {
                        name: "Location",
                        label: "Location",
                        description: "",
                    },
                    overflow: {
                        name: "Other",
                        label: "Other",
                    },
                },
            ] as any,
        };
        const profileManager = new ProfileManager({ profile });
        let layout = profileManager.getLayout({
            entity: { "@id": "#1", "@type": ["Dataset"] },
        });
        expect(layout).toEqual((profile as any).layouts[0]);
    });
    test("get layout information from profile - no layout", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
            classes: [] as any,
            layouts: {} as any,
        };
        const profileManager = new ProfileManager({ profile });
        let layout = profileManager.getLayout({ entity: { "@id": "#1", "@type": ["Thing"] } });
        expect(layout).toBe(null);
    });
    test("get property definition - defined in profile", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        const entity = { "@type": ["Dataset"] } as NormalisedEntityDefinition;
        let { propertyDefinition } = profileManager.getPropertyDefinition({
            property: "date",
            entity,
        });
        expect(propertyDefinition.id).toEqual("https://schema.org/date");
    });
    test("get property definition - not defined in profile, lookup schema.org", () => {
        const profileManager = new ProfileManager({ profile: undefined });
        const entity = { "@type": ["Dataset"] } as NormalisedEntityDefinition;
        let { propertyDefinition } = profileManager.getPropertyDefinition({
            property: "dateModified",
            entity,
        });
        expect(propertyDefinition.id).toEqual("http://schema.org/dateModified");
        expect(propertyDefinition.type.sort()).toEqual(["Date", "DateTime"]);
    });
    test("get property definition - not defined in profile or schema.org; create default entry", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        const entity = { "@type": ["Dataset"] } as NormalisedEntityDefinition;
        let { propertyDefinition } = profileManager.getPropertyDefinition({
            property: "mojumbo",
            entity,
        });
        expect(propertyDefinition.type).toEqual(["Text"]);
    });
    test("get type hierarchy - type defined in profile, assume schema.org subClass", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        expect(types).toEqual(["Thing"]);
        let { inputs } = profileManager.getAllInputs({
            entity: { "@type": ["Thing"] } as NormalisedEntityDefinition,
        });
        let iis = inputs.map((input) => input.id);
        expect(iis).toEqual(["https://schema.org/date"]);
        expect(iis.length).toEqual(1);
    });
    test("get inputs for type defined in profile - no subClass in profile, definition inherit", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        let { inputs } = profileManager.getAllInputs({
            entity: { "@type": ["Thing"] } as NormalisedEntityDefinition,
        });
        let iis = inputs.map((input) => input.id);
        expect(iis).toEqual([
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
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
        let { inputs } = profileManager.getAllInputs({
            entity: { "@type": ["Thing"] } as NormalisedEntityDefinition,
        });
        let iis = inputs.map((input) => input.id);
        expect(iis).toEqual(["https://schema.org/date"]);
        expect(iis.length).toEqual(1);
    });
    test("get inputs for type defined in profile - subClass in profile, definition inherit", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
                    subClassOf: [""],
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
        let { inputs } = profileManager.getAllInputs({
            entity: { "@type": ["Thing"] } as NormalisedEntityDefinition,
        });
        let iis = inputs.map((input) => input.id);
        expect(iis.sort()).toEqual(["https://schema.org/date", "https://schema.org/somethingElse"]);
        expect(iis.length).toEqual(2);
    });
    test("get inputs for type array defined in profile - test 1", () => {
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
            entity: { "@type": ["Thing", "Intangible"] } as NormalisedEntityDefinition,
        });
        let iis = inputs.map((input) => input.id);
        expect(iis).toEqual([
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
        const profile: NormalisedProfile = {
            metadata: {} as any,
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
            entity: { "@type": ["Thing", "MedicalEntity"] } as NormalisedEntityDefinition,
        });
        let iis = inputs.map((input) => input.id);
        expect(iis).toEqual([
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
