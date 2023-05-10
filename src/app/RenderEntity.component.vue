<template>
    <div class="flex flex-col space-y-2">
        <RenderEntityComponent
            :crate-manager="data.crateManager"
            :profile="data.crateManager.profile"
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
            resolve: {
                RelatedEntity: ["source", "target"],
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
    entities: [
        {
            describoId: "RootDataset",
            "@id": "./",
            "@type": ["Dataset"],
            properties: {
                relationship: [
                    {
                        propertyId: "aa",
                        srcEntityId: "RootDataset",
                        property: "relationship",
                        tgtEntityId: "1",
                        tgtEntity: {
                            describoId: "1",
                            "@id": "#relationship",
                            "@type": "Relationship, RelatedEntity",
                            associations: [
                                {
                                    property: "source",
                                    entity: {
                                        describoId: "2",
                                        "@id": "#person1",
                                        "@type": "Person",
                                        associations: [],
                                    },
                                },
                                {
                                    property: "target",
                                    entity: {
                                        describoId: "3",
                                        "@id": "#thing1",
                                        "@type": "Thing",
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
        {
            describoId: "1",
            "@id": "#relationship",
            "@type": "Relationship, RelatedEntity",
            properties: {
                source: [
                    {
                        propertyId: "ba",
                        srcEntityId: "1",
                        property: "source",
                        tgtEntityId: "2",
                        tgtEntity: {
                            describoId: "2",
                            "@id": "#person1",
                            "@type": "Person",
                            associations: [],
                        },
                    },
                ],
                target: [
                    {
                        propertyId: "bb",
                        srcEntityId: "1",
                        property: "target",
                        tgtEntityId: "3",
                        tgtEntity: {
                            describoId: "3",
                            "@id": "#thing1",
                            "@type": "Thing",
                            associations: [],
                        },
                    },
                ],
            },
        },
        {
            describoId: "2",
            "@id": "#person1",
            "@type": ["Person"],
            properties: {
                sourceOf: [
                    {
                        propertyId: "ca",
                        srcEntityId: "2",
                        property: "sourceOf",
                        tgtEntityId: "1",
                        tgtEntity: {
                            describoId: "1",
                            "@id": "#relationship",
                            "@type": "Relationship, RelatedEntity",
                            associations: [{ property: "source", entity: {} }],
                        },
                    },
                ],
            },
        },
        {
            describoId: "3",
            "@id": "#thing1",
            "@type": ["Thing"],
            properties: {
                targetOf: [
                    {
                        propertyId: "da",
                        srcEntityId: "3",
                        property: "targetOf",
                        tgtEntityId: "1",
                        tgtEntity: {
                            describoId: "1",
                            "@id": "#relationship",
                            "@type": "Relationship, RelatedEntity",
                            associations: [],
                        },
                    },
                ],
            },
        },
    ],
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
    loadEntity({ describoId: "RootDataset" });
});

function loadEntity({ describoId }) {
    // console.log("load:entity", entity);
    data.selectedEntity = data.entities.filter((e) => e.describoId === describoId)[0];
    $router.push({ query: { describoId } });
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
