<template>
    <div class="p-4">
        <describo-crate-builder :crate="data.crate" :profile="data.profile" />
    </div>
</template>

<script setup>
import { reactive } from "vue";

const data = reactive({
    crate: {
        "@context": [
            "https://w3id.org/ro/crate/1.1/context",
            {
                "@vocab": "http://schema.org/",
            },
            {
                txc: {
                    "@id": "http://purl.archive.org/textcommons/terms#",
                },
            },
            {
                "@base": null,
            },
        ],
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
                name: "SLNSW_FL814 something or other",
                date: "2022-09-05T14:00:00.000Z",
                memberOf: [
                    {
                        "@id": "https://catalog.nyingarn.net/view/collection/Collection1",
                    },
                    {
                        "@id": "https://catalog.nyingarn.net/view/collection/Collection2",
                    },
                ],
                "@reverse": {},
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
