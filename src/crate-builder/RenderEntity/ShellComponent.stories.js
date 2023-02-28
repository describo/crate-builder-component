import RenderEntityComponent from "./Shell.component.vue";
import { CrateManager } from "../crate-manager.js";

export default {
    component: RenderEntityComponent,
    argTypes: {
        le: { action: "loadEntity" },
        sc: { action: "saveCrate" },
        ap: { action: "addProperty" },
        sp: { action: "saveProperty" },
        dp: { action: "deleteProperty" },
        ie: { action: "ingestEntity" },
        de: { action: "deleteEntity" },
        sct: { action: "saveCrateTemplate" },
        set: { action: "saveEntityTemplate" },
    },
    parameters: {
        docs: () => null,
    },
};

const Template = (args, { argTypes }) => ({
    components: { RenderEntityComponent },
    props: Object.keys(argTypes),
    template: `
        <RenderEntityComponent v-bind="$props"
            @load:entity="le"
            @save:crate="sc"
            @add:property="ap"
            @save:property="sp"
            @delete:property="dp"
            @ingest:entity="ie"
            @update:entity="ue"
            @link:entity="le"
            @delete:entity="de"
            @save:crate:template="sct"
            @save:entity:template="set"
        />`,
});

const crateManager = new CrateManager();
crateManager.profile = {
    metadata: {
        name: "Describo Test Profile with groups",
        description: "A profile with entries for each of the supported datatypes",
        version: 0.1,
        warnMissingProperty: true,
    },
    layouts: {
        "Organisation, School": [
            { name: "About", description: "", inputs: ["schoolName", "orgName"] },
        ],
        School: [{ name: "About", description: "", inputs: ["schoolName"] }],
        Organisation: [{ name: "About", description: "", inputs: ["orgName"] }],
    },
    classes: {
        Entity: {
            definition: "override",
            subClassOf: [],
            inputs: [
                {
                    id: "https://schema.org/entityProfileDefinition",
                    name: "entityProfileProperty",
                    help: "Provide a name",
                    type: ["Text"],
                    required: true,
                    multiple: false,
                },
            ],
        },
        School: {
            definition: "override",
            subClassOf: [],
            inputs: [
                {
                    id: "https://schema.org/schoolProfileDefinition",
                    name: "schoolProfileProperty",
                    help: "Provide a name",
                    type: ["Text"],
                    required: true,
                    multiple: false,
                },
            ],
        },
        "Public School": {
            definition: "override",
            subClassOf: [],
            inputs: [
                {
                    id: "https://schema.org/publicSchoolProfileDefinition",
                    name: "publicSchoolProperty",
                    help: "Provide a name",
                    required: true,
                    multiple: false,
                    type: ["Text"],
                },
            ],
        },
    },
};

const args = {
    crateManager,
    configuration: {
        mode: "online",
        enableContextEditor: false,
        enableCratePreview: false,
        enableBrowseEntities: false,
        enableTemplateSave: false,
        readonly: false,
        enableTemplateLookups: false,
        enableDataPackLookups: false,
    },
};
export const SimpleEntity = Template.bind({});
SimpleEntity.args = {
    ...args,
    entity: {
        describoId: "A",
        "@id": "A",
        "@type": "Entity",
        name: "A",
    },
};

export const SimpleEntityWithOneEntityType = Template.bind({});
SimpleEntityWithOneEntityType.args = {
    ...args,
    entity: {
        describoId: "A",
        "@id": "A",
        "@type": "Entity",
        name: "A",
        properties: {
            entityType: [
                {
                    property: "entityType",
                    propertyId: "px",
                    srcEntityId: "ex",
                    tgtEntityId: "tx",
                    tgtEntity: {
                        describoId: "tx",
                        "@id": "tx",
                        "@type": "Entity",
                        name: `School`,
                    },
                },
            ],
        },
    },
};

export const SimpleEntityWithEntityTypeArray = Template.bind({});
SimpleEntityWithEntityTypeArray.args = {
    ...args,
    entity: {
        describoId: "A",
        "@id": "A",
        "@type": "Entity",
        name: "A",
        properties: {
            entityType: [
                {
                    property: "entityType",
                    propertyId: "px1",
                    srcEntityId: "ex",
                    tgtEntityId: "tx1",
                    tgtEntity: {
                        describoId: "tx1",
                        "@id": "tx1",
                        "@type": "Entity",
                        name: `School`,
                    },
                },
                {
                    property: "entityType",
                    propertyId: "px2",
                    srcEntityId: "ex",
                    tgtEntityId: "tx2",
                    tgtEntity: {
                        describoId: "tx2",
                        "@id": "tx2",
                        "@type": "Entity",
                        name: `Public School`,
                    },
                },
            ],
        },
    },
};
