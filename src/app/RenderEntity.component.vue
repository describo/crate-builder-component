<template>
    <div class="flex flex-col space-y-2">
        <RenderEntityComponent
            :crate-manager="data.crateManager"
            :entity="data.selectedEntity"
            :configuration="data.configuration"
            @load:entity="loadEntity"
            @add:property="addProperty"
            @save:property="saveProperty"
            @delete:property="deleteProperty"
            @ingest:entity="ingestEntity"
            @link:entity="linkEntity"
            @update:entity="updateEntity"
            @delete:entity="deleteEntity"
        />
    </div>
</template>

<script setup>
import RenderEntityComponent from "../crate-builder/RenderEntity/Shell.component.vue";

import { reactive, onBeforeMount, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Lookup } from "./lookup.js";
const lookup = new Lookup();
const $router = useRouter();
const $route = useRoute();

const data = reactive({
    loading: false,
    crateManager: {
        profile: {
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
                School: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/schoolName",
                            name: "schoolName",
                            help: "Provide a name",
                            type: ["Text"],
                            required: true,
                            multiple: false,
                        },
                    ],
                },
                Organisation: {
                    definition: "override",
                    subClassOf: [],
                    inputs: [
                        {
                            id: "https://schema.org/orgName",
                            name: "orgName",
                            help: "Provide a name",
                            required: true,
                            multiple: false,
                            type: ["Text"],
                        },
                    ],
                },
            },
        },
    },
    configuration: {
        enableContextEditor: false,
        enableCratePreview: false,
        enableBrowseEntities: false,
        enableTemplateSave: false,
        readonly: false,
        enableTemplateLookups: false,
        enableDataPackLookups: false,
        mode: "online",
    },
    entities: {
        A: {
            describoId: "A",
            "@id": "A",
            "@type": "Entity",
            name: "A",
            properties: {
                entityType: [
                    {
                        propertyId: "A1",
                        srcEntityId: "A",
                        property: "entityType",
                        tgtEntityId: "D",
                        tgtEntity: { "@id": "D", "@type": "EntityType", name: "School" },
                    },
                    {
                        propertyId: "A2",
                        srcEntityId: "A",
                        property: "entityType",
                        tgtEntityId: "E",
                        tgtEntity: { "@id": "E", "@type": "EntityType", name: "Organisation" },
                    },
                ],
                link: [
                    {
                        propertyId: "A3",
                        srcEntityId: "A",
                        property: "link",
                        tgtEntityId: "B",
                        tgtEntity: { "@id": "B", "@type": "Entity", name: "B" },
                    },
                ],
                text: [
                    {
                        propertyId: "A4",
                        srcEntityId: "A",
                        property: "text",
                        value: "A: some text",
                    },
                ],
            },
        },
        B: {
            describoId: "B",
            "@id": "B",
            "@type": "Entity",
            name: "B",
            properties: {
                entityType: [
                    {
                        propertyId: "B1",
                        srcEntityId: "B",
                        property: "entityType",
                        tgtEntityId: "D",
                        tgtEntity: { "@id": "D", "@type": "EntityType", name: "School" },
                    },
                ],
                link: [
                    {
                        propertyId: "B2",
                        srcEntityId: "B",
                        property: "link",
                        tgtEntityId: "C",
                        tgtEntity: { "@id": "C", "@type": "Entity", name: "C" },
                    },
                ],
                text: [
                    {
                        propertyId: "B2",
                        srcEntityId: "B",
                        property: "text",
                        value: "B: some text",
                    },
                ],
            },
        },
        C: {
            describoId: "C",
            "@id": "C",
            "@type": "Entity",
            name: "C",
            properties: {
                entityType: [
                    {
                        propertyId: "C2",
                        srcEntityId: "C",
                        property: "entityType",
                        tgtEntityId: "E",
                        tgtEntity: { "@id": "E", "@type": "EntityType", name: "Organisation" },
                    },
                ],
                link: [
                    {
                        propertyId: "C2",
                        srcEntityId: "C",
                        property: "link",
                        tgtEntityId: "A",
                        tgtEntity: { "@id": "A", "@type": "Entity", name: "A" },
                    },
                ],
                text: [
                    {
                        propertyId: "C2",
                        srcEntityId: "C",
                        property: "text",
                        value: "C: some text",
                    },
                ],
            },
        },
        D: {
            describoId: "D",
            "@id": "D",
            "@type": "EntityType",
            name: "School",
            properties: {},
        },
        E: {
            describoId: "E",
            "@id": "E",
            "@type": "EntityType",
            name: "Organisation",
            properties: {},
        },
    },
    selectedEntity: {},
});
watch(
    () => $route.query.describoId,
    (n, o) => {
        if (data.selectedEntity.describoId !== $route.query.describoId)
            loadEntity({ describoId: $route.query.describoId });
    }
);
onBeforeMount(() => {
    loadEntity({ describoId: "A" });
});

function loadEntity(entity) {
    // console.log("load:entity", entity);
    data.selectedEntity = data.entities[entity.describoId];
    $router.push({ query: { describoId: entity.describoId } });
}

function saveProperty(data) {
    console.log("save:property", data);
}
function deleteProperty(data) {
    console.log("delete:property", data);
}
function addProperty(data) {
    console.log("add:property", data);
}
function ingestEntity(data) {
    console.log("ingest:entity", data);
}
function linkEntity(data) {
    console.log("link:entity", data);
}
function updateEntity(data) {
    console.log("update:entity", data);
}
function deleteEntity(data) {
    console.log("delete:entity", data);
}
</script>
