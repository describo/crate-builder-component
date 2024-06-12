<template>
    <div
        class="flex flex-col my-2 p-1 rounded"
        :class="{
            'bg-indigo-200': data.addType,
            'max-w-[715px]': data.addType?.match(/geo/gi),
        }"
    >
        <add-control-component
            :crate-manager="props.crateManager"
            :types="types"
            :selected-type="data.addType"
            @add="add"
            @close="close"
        />

        <div v-if="addSimpleType" class="p-1">
            <text-component
                v-if="data.addType === 'Text'"
                :property="props.property"
                type="text"
                :definition="props.definition"
                @save:property="createProperty"
                :placeholder="$t('add_text')"
            />
            <text-component
                v-if="data.addType === 'TextArea'"
                :property="props.property"
                type="textarea"
                :definition="props.definition"
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
                :definition="props.definition"
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
                v-if="['Geo', 'Geometry', 'GeoCoordinates', 'GeoShape'].includes(data.addType)"
                :crate-manager="props.crateManager"
                :property="props.property"
                @create:entity="createEntity"
                @link:entity="linkEntity"
            />
            <boolean-component
                v-if="data.addType === 'Boolean'"
                :property="props.property"
                @save:property="createProperty"
            />
        </div>
        <div v-else class="describo-property-type-entity">
            <div
                class="p-1 flex flex-row space-x-2 divide-y divide-gray-300 text-gray-600"
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
import BooleanComponent from "../primitives/Boolean.component.vue";
import { reactive, computed, inject } from "vue";
import { profileManagerKey } from "./keys.js";
import { $t } from "../i18n";
const pm = inject(profileManagerKey);

const props = defineProps({
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
        "Geometry",
        "GeoCoordinates",
        "GeoShape",
        "Boolean",
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
    data.localisedAddType = pm.value?.getTypeLabel(type);
}
function createProperty(data) {
    // console.debug("Add Component : emit(create:property)", data);
    $emit("create:property", { ...data, propertyId: props.definition.id });
    close();
}
function createEntity(data) {
    // console.debug("Add Component : emit(create:entity)", { ...data, property: props.property });
    $emit("create:entity", { ...data, property: props.property, propertyId: props.definition.id });
    close();
}
function linkEntity(data) {
    // console.debug("Add Component : emit(link:entity)", { ...data, property: props.property });
    $emit("link:entity", { ...data, property: props.property, propertyId: props.definition.id });
    close();
}
</script>
