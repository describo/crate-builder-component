<template>
    <div class="flex flex-row">
        <div class="min-w-32 w-1/3 xl:w-1/5 flex flex-col describo-property-name">@type</div>
        <div class="w-2/3 xl:w-4/5 flex flex-row flex-wrap">
            <div v-for="etype of types" :key="etype" class="m-1">
                <el-tag size="large" :closable="closable" @close="deleteType(etype)">{{
                    getTypeLabelFromProfile(etype)
                }}</el-tag>
            </div>
            <el-select-v2
                class="m-1 select-style"
                filterable
                clearable
                v-model="selectedClass"
                :options="classes"
                placeholder="Select a class to add"
                @change="save"
                v-if="!state.configuration.readonly"
            />
        </div>
    </div>
</template>

<script setup>
import { ElSelectV2, ElTag } from "element-plus";
import { ref, shallowRef, computed, inject, watch } from "vue";
import { profileManagerKey } from "./keys.js";
const pm = inject(profileManagerKey);
import { useStateStore } from "../store.js";
const state = useStateStore();

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
let selectedClass = ref();
let classes = shallowRef(pm.value?.getClasses().map((c) => ({ value: c, label: c })));
let types = computed(() => {
    return props.entity["@type"];
});

const $emit = defineEmits(["update:entity"]);
watch(
    () => pm.value.$key,
    () => {
        classes.value = pm.value?.getClasses().map((c) => ({ value: c, label: c }));
    }
);

let closable = computed(() => props.entity["@type"].length > 1);

function getTypeLabelFromProfile(type) {
    return pm.value?.getTypeLabel(type);
}

function save() {
    $emit("update:entity", {
        property: "@type",
        value: [...props.entity["@type"], selectedClass.value],
    });
    selectedClass.value = undefined;
}
function deleteType(etype) {
    let type = props.entity["@type"].filter((t) => t != etype);
    $emit("update:entity", {
        property: "@type",
        value: type,
    });
    selectedClass.value = undefined;
}
</script>

<style scoped>
.select-style {
    @apply w-64 !important;
}
</style>
