<template>
    <div class="flex flex-row">
        <div class="w-1/3 xl:w-1/5 flex flex-col">Identifier</div>

        <div class="w-2/3 xl:w-4/5 flex flex-row">
            <div v-if="['Dataset', 'File'].includes(entity['@type'])" class="">
                {{ entity["@id"] }}
            </div>
            <div v-else>
                <text-component
                    class="w-full"
                    type="text"
                    property="@id"
                    :value.sync="entity.name"
                    @save:property="save"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import TextComponent from "../base-components/Text.component.vue";
import { reactive, watch } from "vue";
import { debounce } from "lodash";

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["save:property"]);

let data = reactive({
    property: "name",
    value: props.entity.value,
});

watch(
    () => props.entity["@id"],
    () => {
        data.value = props.entity["@id"];
    }
);

async function save(data) {
    emit("save:property", {
        property: "@id",
        value: data.value,
    });
}
</script>
