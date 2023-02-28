<template>
    <div class="flex flex-row">
        <div class="w-1/3 xl:w-1/5 flex flex-col">@id</div>

        <div class="w-2/3 xl:w-4/5 flex flex-row" v-if="!configuration.readonly">
            <div
                v-if="
                    entity.describoLabel === 'RootDataset' ||
                    ['Dataset', 'File'].includes(entity['@type'])
                "
                class=""
            >
                {{ entity["@id"] }}
            </div>
            <div v-else class="flex-grow">
                <text-component
                    class="w-full"
                    type="text"
                    :property="data.property"
                    :value="entity['@id']"
                    @save:property="save"
                />
            </div>
        </div>
        <div class="w-2/3 xl:w-4/5 flex flex-row" v-else>
            <div v-if="isURL(entity['@id'])">
                <a class="text-blue-800" :href="entity['@id']" target="_blank">{{
                    entity["@id"]
                }}</a>
            </div>
            <div v-else>{{ entity["@id"] }}</div>
        </div>
    </div>
</template>

<script setup>
import TextComponent from "../primitives/Text.component.vue";
import { reactive, watch, inject } from "vue";
import { isURL } from "../crate-manager.js";
const configuration = inject("configuration");

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["update:entity"]);

let data = reactive({
    property: "@id",
    value: props.entity.value,
});

watch(
    () => props.entity["@id"],
    () => {
        data.value = props.entity["@id"];
    }
);

async function save(data) {
    emit("update:entity", data);
}
</script>
