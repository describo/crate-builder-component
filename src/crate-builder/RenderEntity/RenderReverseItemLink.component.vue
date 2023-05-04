<template>
    <div
        class="flex flex-col bg-blue-200 hover:bg-yellow-300 p-3 cursor-pointer rounded"
        @click="loadEntity"
        v-loading="data.loading"
    >
        <span class="text-gray-800 flex flex-row">
            <i class="pt-1 fa-solid fa-chevron-left"></i>&nbsp;
            <type-icon-component class="mr-2 text-gray-700" :type="type" v-if="type" />
            {{ type }}:{{ props.property }} - {{ data.entity.name }}
        </span>
    </div>
</template>

<script setup>
import TypeIconComponent from "./TypeIcon.component.vue";
import { vLoading } from "element-plus";
import { reactive, onMounted, computed } from "vue";
import isArray from "lodash-es/isArray";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    property: {
        type: String,
        required: true,
    },
    entity: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["load:entity"]);
const data = reactive({ loading: false, entity: {} });
let type = computed(() => {
    return isArray(data.entity["@type"])
        ? data.entity["@type"].length === 1
            ? data.entity["@type"][0]
            : data.entity["@type"].join(", ")
        : data.entity["@type"];
});

onMounted(() => {
    loadEntityData();
});

function loadEntity() {
    data.loading = true;
    emit("load:entity", { describoId: props.entity.srcEntityId });
}
async function loadEntityData() {
    data.entity = { ...props.crateManager.getEntity({ describoId: props.entity.srcEntityId }) };
}
</script>
