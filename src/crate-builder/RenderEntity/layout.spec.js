import { describe, test, expect, beforeAll, beforeEach, vi } from "vitest";
import { ProfileManager } from "../CrateManager/profile-manager";
import { applyLayout } from "./layout";

describe("Test layout handling", () => {
    test("layout test 1", async () => {
        // Test profile without layout
        const profile = {
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/author",
                            name: "author",
                            type: ["Person", "Organisation"],
                        },
                    ],
                },
            },
        };
        const pm = new ProfileManager({ profile });
        const configuration = {
            readonly: false,
        };
        let entity = {
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        };
        let renderTabs, missingRequiredData, tabs;

        ({ renderTabs, missingRequiredData, entity, tabs } = applyLayout({
            configuration,
            entity,
            extraProperties: [],
            profileManager: pm,
        }));
        expect(renderTabs).toBeTruthy;
        expect(missingRequiredData).toBeFalsy;
        expect(tabs).toEqual([]);
    });
    test("layout test 2", async () => {
        // Test profile with layout. About tab with author prop
        const profile = {
            layouts: [
                {
                    appliesTo: ["Dataset"],
                    about: { label: "About" },
                    overflow: {
                        label: "Other",
                    },
                },
            ],
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/author",
                            name: "author",
                            type: ["Person", "Organisation"],
                            group: "about",
                        },
                    ],
                },
            },
        };
        const pm = new ProfileManager({ profile });
        const configuration = {
            readonly: false,
        };
        let entity = {
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        };
        let renderTabs, missingRequiredData, tabs;

        ({ renderTabs, missingRequiredData, entity, tabs } = applyLayout({
            configuration,
            entity,
            extraProperties: [],
            profileManager: pm,
        }));
        expect(renderTabs).toBeTruthy;
        expect(missingRequiredData).toBeFalsy;
        expect(tabs).toMatchObject([
            {
                label: "About",
                name: "about",
                inputs: [
                    {
                        id: "https://schema.org/author",
                        name: "author",
                        type: ["Person", "Organisation"],
                        group: "about",
                    },
                ],
                missingRequiredData: false,
                hasData: false,
            },
            {
                label: "Other",
                name: "overflow",
                inputs: [],
                missingRequiredData: false,
                hasData: false,
            },
        ]);
    });
    test("layout test 3", async () => {
        // Test profile with layout. About tab with author prop.
        //  Grouping defined in the layout.
        const profile = {
            layouts: [
                {
                    appliesTo: ["Dataset"],
                    about: { label: "About", properties: ["author"] },
                    overflow: {
                        label: "Other",
                    },
                },
            ],
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/author",
                            name: "author",
                            type: ["Person", "Organisation"],
                        },
                    ],
                },
            },
        };
        const pm = new ProfileManager({ profile });
        const configuration = {
            readonly: false,
        };
        let entity = {
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        };
        let renderTabs, missingRequiredData, tabs;

        ({ renderTabs, missingRequiredData, entity, tabs } = applyLayout({
            configuration,
            entity,
            extraProperties: [],
            profileManager: pm,
        }));
        expect(renderTabs).toBeTruthy;
        expect(missingRequiredData).toBeFalsy;
        // console.log(JSON.stringify(tabs, null, 2));
        expect(tabs).toMatchObject([
            {
                label: "About",
                name: "about",
                inputs: [
                    {
                        id: "https://schema.org/author",
                        name: "author",
                        type: ["Person", "Organisation"],
                    },
                ],
                missingRequiredData: false,
                hasData: false,
            },
            {
                label: "Other",
                name: "overflow",
                inputs: [],
                missingRequiredData: false,
                hasData: false,
            },
        ]);
    });
    test("layout test 4", async () => {
        // Test profile with layout. About tab with author and contributor.
        //   Grouping defined on prop and in layout.
        const profile = {
            layouts: [
                {
                    appliesTo: ["Dataset"],
                    about: { label: "About", properties: ["author"] },
                    overflow: {
                        label: "Other",
                    },
                },
            ],
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/author",
                            name: "author",
                            type: ["Person", "Organisation"],
                        },
                        {
                            id: "https://schema.org/contributor",
                            name: "contributor",
                            type: ["Person", "Organisation"],
                            group: "about",
                        },
                    ],
                },
            },
        };
        const pm = new ProfileManager({ profile });
        const configuration = {
            readonly: false,
        };
        let entity = {
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        };
        let renderTabs, missingRequiredData, tabs;

        ({ renderTabs, missingRequiredData, entity, tabs } = applyLayout({
            configuration,
            entity,
            extraProperties: [],
            profileManager: pm,
        }));
        expect(renderTabs).toBeTruthy;
        expect(missingRequiredData).toBeFalsy;
        // console.log(JSON.stringify(tabs, null, 2));
        expect(tabs).toMatchObject([
            {
                label: "About",
                name: "about",
                inputs: [
                    {
                        id: "https://schema.org/author",
                    },
                    {
                        id: "https://schema.org/contributor",
                    },
                ],
                missingRequiredData: false,
                hasData: false,
            },
            {
                label: "Other",
                name: "overflow",
                inputs: [],
                missingRequiredData: false,
                hasData: false,
            },
        ]);
    });
    test("layout test 5", async () => {
        // Test profile with layout. About tab with author and contributor.
        //   Grouping defined on prop and in layout. Non existant group for contributor.
        const profile = {
            layouts: [
                {
                    appliesTo: ["Dataset"],
                    about: { label: "About", properties: ["author"] },
                    overflow: {
                        label: "Other",
                    },
                },
            ],
            classes: {
                Dataset: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/author",
                            name: "author",
                            type: ["Person", "Organisation"],
                        },
                        {
                            id: "https://schema.org/contributor",
                            name: "contributor",
                            type: ["Person", "Organisation"],
                            group: "nonexistent",
                        },
                    ],
                },
            },
        };
        const pm = new ProfileManager({ profile });
        const configuration = {
            readonly: false,
        };
        let entity = {
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        };
        let renderTabs, missingRequiredData, tabs;

        ({ renderTabs, missingRequiredData, entity, tabs } = applyLayout({
            configuration,
            entity,
            extraProperties: [],
            profileManager: pm,
        }));
        expect(renderTabs).toBeTruthy;
        expect(missingRequiredData).toBeFalsy;
        // console.log(JSON.stringify(tabs, null, 2));
        expect(tabs).toMatchObject([
            {
                label: "About",
                name: "about",
                inputs: [
                    {
                        id: "https://schema.org/author",
                    },
                ],
                missingRequiredData: false,
                hasData: false,
            },
            {
                label: "Other",
                name: "overflow",
                inputs: [
                    {
                        id: "https://schema.org/contributor",
                    },
                ],
                missingRequiredData: false,
                hasData: false,
            },
        ]);
    });
    test("layout test 6", async () => {
        // Test profile with layout. About tab with author. Parent class with props.
        //   Grouping defined on props.
        const profile = {
            layouts: [
                {
                    appliesTo: ["Dataset"],
                    about: { label: "About", properties: ["author"] },
                    overflow: {
                        label: "Other",
                    },
                },
            ],
            classes: {
                CreativeWork: {
                    definition: "inherit",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/contributor",
                            name: "contributor",
                            type: ["Person", "Organisation"],
                            group: "about",
                        },
                    ],
                },
                Dataset: {
                    definition: "inherit",
                    subClassOf: ["CreativeWork"],
                    inputs: [
                        {
                            id: "https://schema.org/author",
                            name: "author",
                            type: ["Person", "Organisation"],
                            group: "about",
                        },
                    ],
                },
            },
        };
        const pm = new ProfileManager({ profile });
        const configuration = {
            readonly: false,
        };
        let entity = {
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        };
        let renderTabs, missingRequiredData, tabs;

        ({ renderTabs, missingRequiredData, entity, tabs } = applyLayout({
            configuration,
            entity,
            extraProperties: [],
            profileManager: pm,
        }));
        expect(renderTabs).toBeTruthy;
        expect(missingRequiredData).toBeFalsy;
        // console.log(JSON.stringify(tabs, null, 2));
        expect(tabs).toMatchObject([
            {
                label: "About",
                name: "about",
                inputs: [
                    {
                        id: "https://schema.org/author",
                    },
                    {
                        id: "https://schema.org/contributor",
                    },
                ],
                missingRequiredData: false,
                hasData: false,
            },
            {
                label: "Other",
                name: "overflow",
                inputs: [],
                missingRequiredData: false,
                hasData: false,
            },
        ]);
    });
    test("layout test 7", async () => {
        // Test profile with layout. About tab with author. Parent class with props.
        //   Grouping defined on props. Ordering as per properties array.
        const profile = {
            layouts: [
                {
                    appliesTo: ["Dataset"],
                    about: { label: "About", properties: ["contributor"] },
                    overflow: {
                        label: "Other",
                    },
                },
            ],
            classes: {
                CreativeWork: {
                    definition: "inherit",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/contributor",
                            name: "contributor",
                            type: ["Person", "Organisation"],
                            group: "about",
                        },
                    ],
                },
                Dataset: {
                    definition: "inherit",
                    subClassOf: ["CreativeWork"],
                    inputs: [
                        {
                            id: "https://schema.org/author",
                            name: "author",
                            type: ["Person", "Organisation"],
                            group: "about",
                        },
                    ],
                },
            },
        };
        const pm = new ProfileManager({ profile });
        const configuration = {
            readonly: false,
        };
        let entity = {
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
        };
        let renderTabs, missingRequiredData, tabs;

        ({ renderTabs, missingRequiredData, entity, tabs } = applyLayout({
            configuration,
            entity,
            extraProperties: [],
            profileManager: pm,
        }));
        expect(renderTabs).toBeTruthy;
        expect(missingRequiredData).toBeFalsy;
        // console.log(JSON.stringify(tabs, null, 2));
        expect(tabs).toMatchObject([
            {
                label: "About",
                name: "about",
                inputs: [
                    {
                        id: "https://schema.org/contributor",
                    },
                    {
                        id: "https://schema.org/author",
                    },
                ],
                missingRequiredData: false,
                hasData: false,
            },
            {
                label: "Other",
                name: "overflow",
                inputs: [],
                missingRequiredData: false,
                hasData: false,
            },
        ]);
    });
    test("layout test 8", async () => {
        // Test profile with layout. About tab with author. Parent class with props.
        //   Grouping defined on props. Ordering as per properties array.
        //   Property on entity not defined in profile.
        const profile = {
            layouts: [
                {
                    appliesTo: ["Dataset"],
                    about: { label: "About", properties: ["contributor"] },
                    overflow: {
                        label: "Other",
                    },
                },
            ],
            classes: {
                CreativeWork: {
                    definition: "inherit",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/contributor",
                            name: "contributor",
                            type: ["Person", "Organisation"],
                            group: "about",
                        },
                    ],
                },
                Dataset: {
                    definition: "inherit",
                    subClassOf: ["CreativeWork"],
                    inputs: [
                        {
                            id: "https://schema.org/author",
                            name: "author",
                            type: ["Person", "Organisation"],
                            group: "about",
                        },
                    ],
                },
            },
        };
        const pm = new ProfileManager({ profile });
        const configuration = {
            readonly: false,
        };
        let entity = {
            "@id": "./",
            "@type": ["Dataset"],
            name: "Dataset",
            participant: { "@id": "#P", "@type": "Person", name: "#P" },
        };
        let renderTabs, missingRequiredData, tabs;

        ({ renderTabs, missingRequiredData, entity, tabs } = applyLayout({
            configuration,
            entity,
            extraProperties: [],
            profileManager: pm,
        }));
        expect(renderTabs).toBeTruthy;
        expect(missingRequiredData).toBeFalsy;
        // console.log(JSON.stringify(tabs, null, 2));
        expect(tabs).toMatchObject([
            {
                label: "About",
                name: "about",
                inputs: [
                    {
                        id: "https://schema.org/contributor",
                    },
                    {
                        id: "https://schema.org/author",
                    },
                ],
                missingRequiredData: false,
                hasData: false,
            },
            {
                label: "Other",
                name: "overflow",
                inputs: [{ name: "participant" }],
                missingRequiredData: false,
                hasData: false,
            },
        ]);
    });
});
