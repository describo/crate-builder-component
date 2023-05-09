<template>
    <div
        class="flex flex-col bg-blue-200 hover:bg-yellow-300 p-2 cursor-pointer rounded"
        @click="loadEntity"
        v-loading="data.loading"
    >
        <div class="text-gray-800 flex flex-col">
            <div class="flex flex-row text-sm">
                <type-icon-component class="text-gray-700" :type="props.entity['@type']" />
                <div>&nbsp;{{ props.entity["@type"] }}:&nbsp; {{ props.entity["@id"] }}</div>
            </div>
            <div class="text-base">
                {{ props.entity.name }}
            </div>
        </div>
    </div>
</template>

<script setup>
import TypeIconComponent from "./TypeIcon.component.vue";
import { vLoading } from "element-plus";
import { reactive } from "vue";

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["load:entity"]);
const data = reactive({ loading: false });

function loadEntity() {
    data.loading = true;
    emit("load:entity", { id: props.entity.describoId });
}
</script>
