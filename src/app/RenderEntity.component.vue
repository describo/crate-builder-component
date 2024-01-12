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
        getRootDataset() {
            return data.entities[0];
        },
        getEntity({ id }) {
            let entity = data.entities.filter((e) => e["@id"] === id)[0];
            console.log(entity);
            return entity;
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
            "@id": "./",
            "@type": ["Dataset"],
            relationship: [
                {
                    idx: 0,
                    tgtEntity: {
                        "@id": "#relationship",
                        "@type": ["Relationship", "RelatedEntity"],
                        associations: [],
                    },
                },
            ],
        },
        {
            "@id": "#relationship",
            "@type": ["Relationship", "RelatedEntity"],
            source: [
                {
                    idx: 0,
                    tgtEntity: {
                        "@id": "#person1",
                        "@type": ["Person"],
                        associations: [],
                    },
                },
            ],
            target: [
                {
                    idx: 0,
                    tgtEntity: {
                        "@id": "#thing1",
                        "@type": ["Thing"],
                        associations: [],
                    },
                },
            ],
        },
        {
            "@id": "#person1",
            "@type": ["Person"],
            sourceOf: [
                {
                    idx: 0,
                    tgtEntity: {
                        "@id": "#relationship",
                        "@type": ["Relationship", "RelatedEntity"],
                        associations: [],
                    },
                },
            ],
        },
        {
            "@id": "#thing1",
            "@type": ["Thing"],
            targetOf: [
                {
                    idx: 0,
                    tgtEntity: {
                        "@id": "#relationship",
                        "@type": ["Relationship", "RelatedEntity"],
                        associations: [],
                    },
                },
            ],
        },
    ],
    selectedEntity: {},
});
onBeforeMount(() => {
    loadEntity({ id: "./" });
});

function loadEntity({ id }) {
    data.selectedEntity = data.entities.filter((e) => e["@id"] === id)[0];
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
