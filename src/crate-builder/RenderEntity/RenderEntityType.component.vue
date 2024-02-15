<template>
    <div class="flex flex-row">
        <div class="w-1/3 xl:w-1/5 flex flex-col describo-property-name">@type</div>
        <div class="w-2/3 xl:w-4/5 flex flex-row flex-wrap">
            <div v-for="etype of types" :key="etype" class="m-1">
                <el-tag size="large" :closable="closable" @close="deleteType(etype)">{{
                    getTypeLabelFromProfile(etype)
                }}</el-tag>
            </div>
            <el-select
                class="m-1 select-style"
                v-model="selectedClass"
                clearable
                filterable
                @change="save"
                v-if="!configuration.readonly"
            >
                <el-option
                    v-for="entity in classes"
                    :key="entity"
                    :label="entity"
                    :value="entity"
                />
            </el-select>
        </div>
    </div>
</template>

<script setup>
import { ElSelect, ElOption, ElTag } from "element-plus";
import { ref, shallowRef, computed, inject, watch } from "vue";
import { configurationKey, profileManagerKey } from "./keys.js";
const configuration = inject(configurationKey);
const pm = inject(profileManagerKey);

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
let selectedClass = ref();
let classes = shallowRef(pm.value?.getClasses());
let types = computed(() => {
    return props.entity["@type"];
});

const $emit = defineEmits(["update:entity"]);
watch(
    () => pm.value.$key,
    () => {
        classes.value = pm.value?.getClasses();
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
