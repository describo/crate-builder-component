<template>
    <div v-for="(etype, idx) of props.types" :key="idx">
        <el-tag size="large">
            <div class="text-gray-800 font-light flex flex-row space-x-1">
                <div class="" v-if="data.types[etype]">
                    <i class="fa-solid fa-fw" :class="data.types[etype]"></i>
                </div>
                <div class="">{{ etype }}</div>
            </div>
        </el-tag>
    </div>
</template>

<script setup>
import { reactive } from "vue";
const props = defineProps({
    types: {
        type: Array,
        required: true,
    },
});

const data = reactive({
    types: {
        Book: "fa-book-open",
        ContactPoint: "fa-address-card",
        CreateAction: "fa-plus",
        CreativeWork: "fa-image",
        Country: "fa-flag",
        Dataset: "fa-folder",
        DataDownload: "fa-download",
        DerivedMaterial: "fa-download",
        File: "fa-file",
        GeoCoordinates: "fa-map-marker-alt",
        GeoShape: "fa-map-marker-alt",
        IndividualProduct: "fa-barcode",
        Language: "fa-sign-language",
        Organization: "fa-university",
        Organisation: "fa-university",
        Person: "fa-user",
        Place: "fa-globe",
        PropertyValue: "fa-paragraph",
        Publication: "fa-newspaper",
        RepositoryCollection: "fa-cubes",
        RepositoryObject: "fa-cube",
        ScholarlyArticle: "fa-scroll",
        Script: "fa-code",
        SoftwareApplication: "fa-code",
        URL: "fa-link",
        Workflow: "fa-project-diagram",
        WorkflowSketch: "fa-project-diagram",
    },
});
</script>
