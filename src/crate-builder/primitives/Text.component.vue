<template>
    <div class="flex flex-col space-y-2 describo-property-type-text">
        <div class="flex flex-row space-x-2">
            <el-input class="w-full" :type="type" v-model="data.displayValue" @blur="debouncedSave" @change="debouncedSave"
                resize="vertical" :rows="5" :placeholder="props.placeholder"></el-input>
            <el-button @click="save" type="success" size="default" :disabled="!isValidTextValue">
                <i class="fas fa-check fa-fw"></i>
            </el-button>
        </div>
        <div class="text-xs" v-if="!isValidTextValue">
            {{ $t("text_constraints_error_message", { value: getConstraintsString() }) }}
        </div>
    </div>
</template>

<script setup>
import { ElInput, ElButton } from "element-plus";
import { reactive, watch, computed } from "vue";
import debounce from "lodash-es/debounce.js";
import isBoolean from "lodash-es/isBoolean.js";
import { $t } from "../i18n";
const debouncedSave = debounce(save, 200);

const props = defineProps({
    type: {
        type: String,
        default: "text",
        validator: (val) => ["text", "textarea", "url"].includes(val),
    },
    property: {
        type: String,
        required: true,
    },
    definition: {
        type: Object,
    },
    value: {},
    placeholder: {
        type: String,
    },
});
const $emit = defineEmits(["save:property"]);
const data = reactive({
    displayValue: decodeValue(props.value),
    constraints: {
        minLength: props.definition?.minLength,
        maxLength: props.definition?.maxLength,
        regex: props.definition?.regex,
        granularity: props.definition?.granularity,
        dateGranularity: props.definition?.dateGranularity,
        timeGranularity: props.definition?.timeGranularity
    }
});
watch(
    () => props.value,
    () => {
        data.displayValue = decodeValue(props.value);
    }
);

let isValidTextValue = computed(() => validateTextConstraints(data.displayValue));
function save() {
    if (isValidTextValue) {
        $emit("save:property", {
            property: props.property,
            value: data.displayValue.trim(),
        });
    }
}

function decodeValue(value) {
    if (isBoolean(value)) {
        return String(value);
    } else {
        return decodeURI(value) === "undefined" ? "" : decodeURI(value);
    }
}

function validateTextConstraints(value) {
    if (
        data.constraints.minLength !== undefined &&
        data.constraints.minLength > value.length
    ) return false;
    if (
        data.constraints.maxLength !== undefined &&
        data.constraints.maxLength < value.length
    ) return false;
    if (
        data.constraints.regex !== undefined &&
        !new RegExp(data.constraints.regex).test(value)
    ) return false;
    if (
        data.constraints.granularity &&
        !validateDateFormat(value, data.constraints.granularity, "date")
    ) return false;
    if (
        data.constraints.dateGranularity &&
        data.constraints.timeGranularity &&
        !validateDateFormat(value, data.constraints.dateGranularity + " " + data.constraints.timeGranularity, "datetime")
    ) return false;
    if (
        data.constraints.dateGranularity && 
        !data.constraints.timeGranularity &&
        !validateDateFormat(value, data.constraints.dateGranularity, "date")
    ) return false;
    if (
        data.constraints.timeGranularity &&
        !data.constraints.dateGranularity && 
        !validateDateFormat(value, data.constraints.timeGranularity, "time")
    ) return false;
    return true;
}

function validateDateFormat(inputString, granularity, granularityType) {
    console.log(inputString, granularity)
    const datePatterns = {
        'YYYY': /^-?\d{4}$/,
        'YYYY-MM': /^-?\d{4}-\d{2}$/,
        'YYYY-MM-DD': /^-?\d{4}-\d{2}-\d{2}$/
    };

    const timePatterns = {
        'hh': /^(0[0-9]|1[0-9]|2[0-3])$/,
        'hh.mm': /^(0[0-9]|1[0-9]|2[0-3])\.(0[0-5]|[1-5][0-9])$/,
        'hh.mm.ss': /^(0[0-9]|1[0-9]|2[0-3])\.(0[0-5]|[1-5][0-9])\.(0[0-5]|[1-5][0-9])$/
    }

    if (granularityType === "date") return datePatterns[granularity].test(inputString)
    if (granularityType === "time") return timePatterns[granularity].test(inputString)
    if (inputString && granularityType === "datetime") {
        const [date, time] = inputString.split(" ")
        const [dateGranularity, timeGranularity] = granularity.split(" ")
        console.log(date, time)
        return datePatterns[dateGranularity].test(date) && timePatterns[timeGranularity].test(time)
    }
}

function getConstraintsString() {
    let message = []
    Object.entries(data.constraints).forEach(constraint => {
        if (constraint[0], constraint[1]) {
            message.push(`${constraint[0]}: ${constraint[1]}`)
        }
    });
    return message.join(', ')
}
</script>
