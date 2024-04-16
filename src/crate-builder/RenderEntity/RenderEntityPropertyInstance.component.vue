<template>
    <div>
        <div v-if="configuration.readonly">
            <!-- Just render the value on screen (parse ISO dates for niceness though) -->
            <div v-if="isDate(props.value)">
                {{ dayjs(props.value).format("dddd, MMM DD, YYYY") }}
            </div>
            <div v-else-if="isDateTime(props.value)">
                {{ dayjs(props.value).format("dddd, MMM DD, YYYY hh:mm A") }}
            </div>
            <div v-else>{{ props.value }}</div>
        </div>
        <div v-if="!configuration.readonly">
            <!--  not readonly - try to load the relevant display component-->
            <value-component v-if="isValue()" :definition="props.definition.value" />
            <boolean-component
                v-else-if="isBoolean()"
                :property="props.property"
                :value="props.value"
                @save:property="savePropertyValue"
            />
            <date-time-component
                v-else-if="isDateTime(props.value)"
                :property="props.property"
                :value="props.value"
                @save:property="savePropertyValue"
            />
            <date-component
                v-else-if="isDate(props.value)"
                :property="props.property"
                :value="props.value"
                @save:property="savePropertyValue"
            />
            <time-component
                v-else-if="isTime(props.value)"
                :property="props.property"
                :value="props.value"
                @save:property="savePropertyValue"
            />
            <number-component
                v-else-if="isNumber(props.value)"
                :property="props.property"
                :value="props.value"
                :definition="props.definition"
                @save:property="savePropertyValue"
            />
            <select-component
                v-else-if="isSelect()"
                :property="props.property"
                :value="props.value"
                :definition="props.definition"
                @save:property="savePropertyValue"
            />
            <url-component
                v-else-if="isUrl(props.value) && configuration.enableUrlMarkup"
                :property="props.property"
                :value="props.value"
                @create:entity="createEntity"
            />
            <text-component
                v-else-if="isText(props.value) && props.definition.type.includes('TextArea')"
                type="textarea"
                :property="props.property"
                :value="props.value"
                :definition="props.definition"
                @save:property="savePropertyValue"
            />
            <text-component
                v-else="isText(props.value)"
                :property="props.property"
                :value="props.value"
                :definition="props.definition"
                @save:property="savePropertyValue"
            />
        </div>
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
import BooleanComponent from "../primitives/Boolean.component.vue";
import dayjs from "dayjs";
import isDecimal from "validator/es/lib/isDecimal";
import isInt from "validator/es/lib/isInt";
import isFloat from "validator/es/lib/isFloat";
import isNumeric from "validator/es/lib/isNumeric";
import { inject } from "vue";
import { isURL } from "../CrateManager/lib.js";
import { configurationKey } from "./keys.js";
const configuration = inject(configurationKey);

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    value: {
        type: [String, Number, Boolean, Date],
        required: true,
    },
    idx: {
        type: Number,
        required: true,
    },
    definition: {
        type: Object,
        required: true,
    },
});
const $emit = defineEmits(["save:property", "update:property", "create:entity"]);
async function savePropertyValue(data) {
    if (!data.idx) {
        data = { ...data, property: props.property, idx: props.idx };
    }
    $emit("save:property", data);
}
function createEntity(data) {
    $emit("create:entity", data);
}
function isDate(string) {
    try {
        const date = dayjs(string);
        return date.isValid() && definitionIncludes("Date");
    } catch (error) {
        return false;
    }
}
function isDateTime(string) {
    try {
        const date = dayjs(string);
        return date.isValid() && definitionIncludes("DateTime");
    } catch (error) {
        console.log(error);
    }
}
function isTime(string) {
    string = string + "";
    return (string.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/) ||
        string.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) &&
        (definitionIncludes("DateTime") || definitionIncludes("Time"))
        ? true
        : false;
}
function isText(string) {
    if (
        !isBoolean() &&
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
    string = string + "";
    let result =
        (isDecimal(string) || isInt(string) || isFloat(string) || isNumeric(string)) &&
        (definitionIncludes("Number") ||
            definitionIncludes("Float") ||
            definitionIncludes("Integer"));
    return result;
}
function isValue() {
    return props?.definition?.type === "Value";
}
function isSelect() {
    return props?.definition?.values?.includes(props.value) ? true : false;
}
function isUrl(string) {
    let result = isURL(string) && configuration.value.enableUrlMarkup;
    return result;
}
function isBoolean() {
    return props?.definition?.type == "Boolean";
}
function definitionIncludes(type) {
    return props.definition?.type?.includes(type);
}
</script>
