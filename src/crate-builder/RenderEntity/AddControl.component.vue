<template>
    <div class="flex flex-row flex-wrap">
        <div v-for="(type, idx) of types" :key="idx">
            <el-button
                @click="toggle(type)"
                type="primary"
                class="focus:outline-none focus:border-2 focus:border-green-600 m-1"
            >
                <div v-show="!selectedType || selectedType !== type">
                    <FontAwesomeIcon :icon="faPlus"></FontAwesomeIcon>
                </div>
                <div v-show="selectedType === type">
                    <FontAwesomeIcon :icon="faTimes"></FontAwesomeIcon>
                </div>
                &nbsp;{{ getTypeLabelFromProfile(type) }}
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { ElButton } from "element-plus";
import { computed, inject } from "vue";
import { profileManagerKey } from "./keys.js";
const pm = inject(profileManagerKey);

const props = defineProps({
    types: {
        type: [String, Array],
        required: true,
    },
    selectedType: {
        required: true,
    },
});

const emit = defineEmits(["add", "close"]);
let selectedType = computed(() => props.selectedType);
let types = computed(() => props.types);

function getTypeLabelFromProfile(type) {
    return pm.value?.getTypeLabel(type);
}
function toggle(type) {
    if (props.selectedType === type) {
        emit("close");
    } else {
        emit("add", { type });
    }
}
</script>
