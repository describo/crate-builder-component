<template>
    <div v-for="(etype, idx) of props.types" :key="idx">
        <el-tag size="large">
            <div class="text-gray-800 font-light flex flex-row space-x-1">
                <div class="" v-if="data.types[etype]">
                    <FontAwesomeIcon :icon="data.types[etype]" fixed-width></FontAwesomeIcon>
                </div>
                <div class="">{{ getTypeLabelFromProfile(etype) }}</div>
            </div>
        </el-tag>
    </div>
</template>

<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
    faBookOpen,
    faAddressCard,
    faPlus,
    faImage,
    faFlag,
    faFolder,
    faDownload,
    faFile,
    faMapMarkerAlt,
    faBarcode,
    faSignLanguage,
    faUniversity,
    faUser,
    faGlobe,
    faParagraph,
    faNewspaper,
    faCubes,
    faCube,
    faScroll,
    faCode,
    faLink,
    faProjectDiagram,
} from "@fortawesome/free-solid-svg-icons";
import { faJs } from "@fortawesome/free-brands-svg-icons";

import { ElTag } from "element-plus";
import { reactive, inject } from "vue";
import { profileManagerKey } from "./keys.js";
const pm = inject(profileManagerKey);

const props = defineProps({
    types: {
        type: Array,
        required: true,
    },
});

function getTypeLabelFromProfile(type) {
    return pm.value?.getTypeLabel(type);
}

const data = reactive({
    types: {
        Book: faBookOpen,
        ContactPoint: faAddressCard,
        ComputerLanguage: faJs,
        CreateAction: faPlus,
        CreativeWork: faImage,
        Country: faFlag,
        Dataset: faFolder,
        DataDownload: faDownload,
        DerivedMaterial: faDownload,
        File: faFile,
        GeoCoordinates: faMapMarkerAlt,
        GeoShape: faMapMarkerAlt,
        IndividualProduct: faBarcode,
        Language: faSignLanguage,
        Organization: faUniversity,
        Organisation: faUniversity,
        Person: faUser,
        Place: faGlobe,
        PropertyValue: faParagraph,
        Publication: faNewspaper,
        RepositoryCollection: faCubes,
        RepositoryObject: faCube,
        ScholarlyArticle: faScroll,
        Script: faCode,
        SoftwareApplication: faCode,
        URL: faLink,
        Workflow: faProjectDiagram,
        WorkflowSketch: faProjectDiagram,
    },
});
</script>
