<template>
    <div class="flex flex-col cursor-pointer m-1" @click="loadEntity">
        <div class="flex flex-col space-y-2">
            <div class="border-b border-gray-500 text-sm flex-grow">
                {{ decodeURIComponent(entity["@id"]) }}
            </div>
            <div class="flex flex-col xl:flex-row xl:space-x-2">
                <div class="text-base flex flex-row space-x-1">
                    <RenderTypesComponent :types="entity['@type']" />
                </div>
                <div class="">
                    {{ props.entity.name }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import RenderTypesComponent from "./RenderTypes.component.vue";

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["load:entity"]);

function loadEntity() {
    emit("load:entity", { id: props.entity["@id"] });
}
</script>
