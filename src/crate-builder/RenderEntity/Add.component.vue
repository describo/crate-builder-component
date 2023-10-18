<template>
    <div
        class="flex flex-row my-2 space-x-2 items-center rounded"
        :class="{ 'bg-indigo-200 p-1': data.addType }"
    >
        <add-control-component
            :crate-manager="props.crateManager"
            :types="types"
            :selected-type="data.addType"
            @add="add"
            @close="close"
        />

        <div v-if="addSimpleType" class="w-full">
            <text-component
                v-if="data.addType === 'Text'"
                :property="props.property"
                type="text"
                @save:property="createProperty"
                :placeholder="$t('add_text')"
            />
            <text-component
                v-if="data.addType === 'TextArea'"
                :property="props.property"
                type="textarea"
                @save:property="createProperty"
            />
            <date-component
                v-if="data.addType === 'Date'"
                :property="props.property"
                @save:property="createProperty"
            />
            <date-time-component
                v-if="data.addType === 'DateTime'"
                :property="props.property"
                @save:property="createProperty"
            />
            <number-component
                v-if="['Number', 'Float', 'Integer'].includes(data.addType)"
                :property="props.property"
                @save:property="createProperty"
            />
            <time-component
                v-if="data.addType === 'Time'"
                :property="props.property"
                @save:property="createProperty"
            />
            <select-component
                v-if="data.addType === 'Select'"
                :property="props.property"
                :definition="props.definition"
                @save:property="createProperty"
            />
            <url-component
                v-if="data.addType === 'URL'"
                :property="props.property"
                :definition="props.definition"
                @create:entity="createEntity"
            />
            <select-url-component
                v-if="data.addType === 'SelectURL'"
                :property="props.property"
                :definition="props.definition"
                @create:entity="createEntity"
            />
            <select-object-component
                v-if="data.addType === 'SelectObject'"
                :property="props.property"
                :definition="props.definition"
                @create:entity="createEntity"
            />
            <geo-component
                v-if="['Geo', 'GeoCoordinates', 'GeoShape'].includes(data.addType)"
                :crate-manager="props.crateManager"
                :property="props.property"
                @create:entity="createEntity"
                @link:entity="linkEntity"
            />
        </div>
        <div v-else class="w-full">
            <div
                class="flex flex-row space-x-2 divide-y divide-gray-300 text-gray-600"
                v-if="data.addType"
            >
                <div class="w-full">
                    <div class="" v-if="data.addType === 'ANY'">
                        {{ $t("associate_any_prompt") }}
                    </div>
                    <div class="" v-if="data.addType !== 'ANY'">
                        {{ $t("associate_existing_prompt", { addType: data.localisedAddType }) }}
                    </div>
                    <autocomplete-component
                        :crate-manager="props.crateManager"
                        :type="data.addType"
                        @link:entity="linkEntity"
                        @create:entity="createEntity"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import AddControlComponent from "./AddControl.component.vue";
import TextComponent from "../primitives/Text.component.vue";
import DateComponent from "../primitives/Date.component.vue";
import DateTimeComponent from "../primitives/DateTime.component.vue";
import TimeComponent from "../primitives/Time.component.vue";
import NumberComponent from "../primitives/Number.component.vue";
import UrlComponent from "../primitives/Url.component.vue";
import SelectComponent from "../primitives/Select.component.vue";
import SelectUrlComponent from "../primitives/SelectUrl.component.vue";
import SelectObjectComponent from "../primitives/SelectObject.component.vue";
import GeoComponent from "../primitives/Geo.component.vue";
import AutocompleteComponent from "./AutoComplete.component.vue";
import { reactive, computed } from "vue";
import { $t } from "../i18n";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    property: {
        type: String,
        required: true,
    },
    definition: {
        type: Object,
        required: true,
    },
    embedded: {
        type: Boolean,
        default: false,
    },
});
const $emit = defineEmits(["create:property", "create:entity", "link:entity"]);

const data = reactive({
    simpleTypes: [
        "Text",
        "TextArea",
        "Date",
        "DateTime",
        "Time",
        "Number",
        "Float",
        "Integer",
        "URL",
        "Value",
        "Select",
        "SelectURL",
        "SelectObject",
        "Geo",
        "GeoCoordinates",
        "GeoShape",
    ],
    addType: undefined,
    localisedAddType: undefined,
});

let types = computed(() => {
    if (!props.definition.type || props.definition.type === "Value") return "";
    return props.definition.type;
});
let addSimpleType = computed(() => {
    return data.simpleTypes.includes(data.addType);
});
function close() {
    data.addType = undefined;
    data.localisedAddType = undefined;
}
function add({ type }) {
    data.addType = type;
    data.localisedAddType = props.crateManager?.profileManager?.getTypeLabel(type);
}
function createProperty(data) {
    // console.debug("Add Component : emit(create:property)", data);
    $emit("create:property", data);
    close();
}
function createEntity(data) {
    // console.debug("Add Component : emit(create:entity)", { ...data, property: props.property });
    $emit("create:entity", { ...data, property: props.property });
    close();
}
function linkEntity(data) {
    // console.debug("Add Component : emit(link:entity)", { ...data, property: props.property });
    $emit("link:entity", { ...data, property: props.property });
    close();
}
</script>
