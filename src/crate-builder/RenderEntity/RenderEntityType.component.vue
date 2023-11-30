<template>
    <div class="flex flex-row">
        <div class="w-1/3 xl:w-1/5 flex flex-col describo-property-name">@type</div>
        <div class="w-2/3 xl:w-4/5 flex flex-row flex-wrap">
            <div v-for="etype of types" :key="etype" class="m-1">
                <el-tag size="large" :closable="closable" @close="deleteType(etype)">{{
                    etype
                }}</el-tag>
            </div>
            <el-select
                class="m-1"
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
import { ref, computed, inject } from "vue";
import { configurationKey } from "./keys.js";
const configuration = inject(configurationKey);

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    entity: {
        type: Object,
        required: true,
    },
});
let selectedClass = ref();

const $emit = defineEmits(["update:entity"]);

let classes = computed(() => {
    return props.crateManager?.profileManager?.getClasses();
});

let types = computed(() => {
    return props.entity["@type"];
});
let closable = computed(() => props.entity["@type"].length > 1);

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
