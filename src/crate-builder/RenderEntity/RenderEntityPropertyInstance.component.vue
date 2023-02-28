<template>
    <div v-if="!configuration.readonly">
        <date-component
            v-if="isDate(data.value)"
            :property="data.property"
            :value="data.value"
            @save:property="savePropertyValue"
        />
        <date-time-component
            v-else-if="isDateTime(data.value)"
            :property="data.property"
            :value="data.value"
            @save:property="savePropertyValue"
        />
        <time-component
            v-else-if="isTime(data.value)"
            :property="data.property"
            :value="data.value"
            @save:property="savePropertyValue"
        />
        <number-component
            v-else-if="isNumber(data.value)"
            :property="data.property"
            :value="data.value"
            @save:property="savePropertyValue"
        />
        <value-component v-else-if="isValue()" :definition="props.definition" />
        <select-component
            v-else-if="isSelect()"
            :style="inputElementWidth"
            :property="data.property"
            :value="data.value"
            :definition="props.definition"
            @save:property="savePropertyValue"
        />
        <url-component
            v-else-if="isUrl(data.value)"
            :property="data.property"
            :value="data.value"
            @create:entity="createEntity"
        />
        <text-component
            v-else-if="isText(data.value)"
            :type="type"
            :property="data.property"
            :value="data.value"
            :definition="props.definition"
            @save:property="savePropertyValue"
        />
    </div>
    <div v-else>
        <div v-if="isDateTime(data.value)">{{ parseISO(data.value) }}</div>
        <div v-else>{{ data.value }}</div>
    </div>
</template>

<script setup>
import TextComponent from "../primitives/Text.component.vue";
import DateComponent from "../primitives/Date.component.vue";
import DateTimeComponent from "../primitives/DateTime.component.vue";
import TimeComponent from "../primitives/Time.component.vue";
import NumberComponent from "../primitives/Number.component.vue";
import ValueComponent from "../primitives/Value.component.vue";
import SelectComponent from "../primitives/Select.component.vue";
import UrlComponent from "../primitives/Url.component.vue";
import { parseISO, startOfDay } from "date-fns";
import { isDate as validatorIsDate, isDecimal, isInt, isFloat, isNumeric } from "validator";
import { computed, inject } from "vue";
import { isURL } from "../crate-manager.js";
const configuration = inject("configuration");

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    data: {
        type: Object,
        required: true,
    },
    definition: {
        type: Object,
        required: true,
    },
});
const $emit = defineEmits(["save:property", "create:entity"]);
let inputElementWidth = computed(() => {
    return `width: 500px;`;
});
let type = computed(() => {
    return props?.definition?.type?.[0].toLowerCase();
});
async function savePropertyValue(data) {
    if (!data.propertyId) {
        data = { ...data, property: props.data.property, propertyId: props.data.propertyId };
    }
    console.debug("Render Entity Property Instance Component : emit(save:property)", data);
    $emit("save:property", data);
}
function createEntity(data) {
    console.debug("Render Entity Property Instance Component : emit(create:entity)", data);
    $emit("create:entity", data);
}
function isDate(string) {
    const date = parseISO(string);
    return (
        validatorIsDate(date) &&
        date.toISOString() === startOfDay(date).toISOString() &&
        !isNumber(string)
    );
}
function isDateTime(string) {
    const date = parseISO(string);
    return (
        validatorIsDate(date) &&
        !isNumber(string) &&
        date.toISOString() !== startOfDay(date).toISOString()
    );
}
function isTime(string) {
    return string?.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/) ? true : false;
}
function isText(string) {
    if (
        !isDate(string) &&
        !isDateTime(string) &&
        !isTime(string) &&
        !isNumber(string) &&
        !isUrl(string) &&
        !isSelect() &&
        !isValue()
    )
        return true;
}
function isNumber(string) {
    return isDecimal(string) || isInt(string) || isFloat(string) || isNumeric(string);
}
function isValue() {
    return props?.definition?.type === "Value";
}
function isSelect() {
    return props?.definition?.values?.includes(props.data.property) ? true : false;
}
function isUrl(string) {
    let result = isURL(string);
    return result;
}
</script>
