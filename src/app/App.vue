<template>
    <div class="p-4">
        <describo-crate-builder :crate="data.crate" :profile="data.profile" />
    </div>
</template>

<script setup>
import { reactive } from "vue";

const data = reactive({
    crate: {
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
            {
                "@id": "./",
                "@type": "Dataset",
                name: "root dataset",
                author: { "@id": "https://some.one.com" },
            },
            {
                "@id": "https://some.one.com",
                "@type": "Person",
                name: "some one",
            },
        ],
    },

    profile: {
        metadata: {
            name: "Describo Test Profile",
            description: "A profile with entries for each of the supported datatypes",
            version: 0.1,
            warnMissingProperty: true,
        },
        // hide: {
        //     Dataset: ["date"],
        // },
        // layouts: {
        //     Dataset: [
        //         { name: "Metadata About", description: "", inputs: ["author"] },
        //         // { name: "group2", description: "", inputs: ["TextArea", "text", "url"] },
        //     ],
        //     // Place: [{ name: "important", description: "", inputs: ["geojson"] }],
        // },
        classes: {
            Dataset: {
                definition: "override",
                subClassOf: [],
                inputs: [
                    {
                        id: "https://schema.org/date",
                        name: "date",
                        label: "Date",
                        help: "Attach a date",
                        type: ["Geo"],
                        required: true,
                        multiple: false,
                    },
                ],
            },
            Person: {
                definition: "inherit",
                subClassOf: [],
                inputs: [
                    {
                        id: "https://schema.org/name",
                        name: "name",
                        label: "name",
                        help: "The name the person",
                        required: true,
                        multiple: false,
                        type: ["Text"],
                    },
                ],
            },
            Organisation: {
                definition: "override",
                subClassOf: [],
                inputs: [
                    {
                        id: "https://schema.org/name",
                        name: "name",
                        label: "name",
                        help: "The name of the organisation",
                        required: true,
                        multiple: false,
                        type: ["Text"],
                    },
                ],
            },
        },
        enabledClasses: ["Dataset", "Person", "Organisation"],
    },
});
</script>
