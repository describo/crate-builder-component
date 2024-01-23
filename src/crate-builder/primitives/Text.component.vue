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
        !validateDateFormat(value, [data.constraints.dateGranularity, data.constraints.timeGranularity], "datetime")
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
    const datePatterns = {
        'year': /^-?\d{4}$/,
        'month': /^-?\d{4}-\d{2}$/,
        'day': /^-?\d{4}-\d{2}-\d{2}$/
    };

    const timePatterns = {
        'hour': /^(0[0-9]|1[0-9]|2[0-3])$/,
        'minute': /^(0[0-9]|1[0-9]|2[0-3])\.(0[0-5]|[1-5][0-9])$/,
        'second': /^(0[0-9]|1[0-9]|2[0-3])\.(0[0-5]|[1-5][0-9])\.(0[0-5]|[1-5][0-9])$/
    }

    if (granularityType === "date") return Array.isArray(granularity) && granularity.some(g => datePatterns[g].test(inputString))
    if (granularityType === "time") return Array.isArray(granularity) && granularity.some(g => timePatterns[g].test(inputString))
    if (inputString && granularityType === "datetime") {
        const [date, time] = inputString.split(" ")
        const [dateGranularity, timeGranularity] = [...granularity]
        return Array.isArray(dateGranularity) && dateGranularity.some(g => datePatterns[g].test(date))
            && Array.isArray(timeGranularity) && timeGranularity.some(g => timePatterns[g].test(time))
    }
}

function getConstraintsString() {
    let message = []
    Object.entries(data.constraints).forEach(constraint => {
        const [name, value] = [...constraint]

        if (name, value) {
            const formattedValue = ["granularity", "dateGranularity", "timeGranularity"].includes(name)
                ? getDateFormatString(value)
                : value;
            message.push(`${name}: ${formattedValue}`);
        }
    });
    return message.join(', ');
}

function getDateFormatString(granularity) {
    const formats = {
        'year': 'YYYY',
        'month': 'YYYY-MM',
        'day': 'YYYY-MM-DD',
        'hour': 'hh',
        'minute': 'hh.mm',
        'second': 'hh.mm.ss'
    };

    return granularity.map(g => " " + formats[g]);
}
</script>
