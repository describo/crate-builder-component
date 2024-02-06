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
import { isNavigationFailure } from "vue-router";
import { isNaN } from "lodash";
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
        dateFormat: props.definition?.dateFormat,
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
            value: normalizeDate(data.displayValue).trim(),
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
        data.constraints.dateFormat !== undefined &&
        !validateDateFormat(value, data.constraints.dateFormat)
    ) return false;

    return true;
}

function validateDateFormat(inputString, granularity) {
    const datePatterns = {
        'YYYY': /^-?\d{1,4}$/,
        'YYYY-MM': /^-?\d{1,4}-(0[1-9]|1[0-2])$/,
        'YYYY-MM-DD': /^-?\d{1,4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[01])$/,
        'hh': /^(0[0-9]|1[0-9]|2[0-3])$/,
        'hh:mm': /^(0[0-9]|1[0-9]|2[0-3])\:(0[0-5]|[1-5][0-9])$/,
        'hh:mm:ss': /^(0[0-9]|1[0-9]|2[0-3])\:(0[0-5]|[1-5][0-9])\:(0[0-5]|[1-5][0-9])$/,
        'YYYY-MM-DD hh:mm:ss': /^-?\d{1,4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[01]) (0[0-9]|1[0-9]|2[0-3])\:(0[0-5]|[1-5][0-9])\:(0[0-5]|[1-5][0-9])$/,
        'YYYY-MM-DD hh:mm': /^-?\d{1,4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[01]) (0[0-9]|1[0-9]|2[0-3])\:(0[0-5]|[1-5][0-9])$/,
        'YYYY-MM-DD hh': /^-?\d{1,4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[01]) (0[0-9]|1[0-9]|2[0-3])$/,
    };

    const normalizedDate = normalizeDate(inputString)
    return Array.isArray(granularity) && granularity.some(g => datePatterns[g].test(normalizedDate) && isValidDate(normalizedDate));
}

function isValidDate(dateStr) {
    const dateParts = dateStr.split(" ")

    let negativeSign = "";
    let yearPart = dateParts[0];
    if (yearPart.startsWith('-')) {
        negativeSign = "-";
        yearPart = yearPart.substring(1);
    }

    const dateComponents = yearPart.split("-");
    const year = parseInt(negativeSign + dateComponents[0]);
    const month = parseInt(dateComponents[1]) - 1;
    const day = parseInt(dateComponents[2]);

    const isFullDate = dateComponents.length === 3 && !dateComponents.includes(NaN)
    const date = new Date(year, month, day);
    if (isFullDate) {
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
    }

    return true
}

function normalizeDate(dateStr) {
    const dateParts = dateStr.split(" ");
    
    let negativeSign = "";
    let yearPart = dateParts[0];
    if (yearPart.startsWith('-')) {
        negativeSign = "-";
        yearPart = yearPart.substring(1);
    }

    const dateComponents = yearPart.split("-");
    const year = negativeSign + dateComponents[0];
    let month = parseInt(dateComponents[1]);
    let day = parseInt(dateComponents[2]);

    if (day < 10) {
        day = '0' + day;
    }

    if (month < 10) {
        month = `0${month}`;
    }

    let normalizedDate = `${year}${!isNaN(month) ? "-" + month : ""}${!isNaN(day) ? "-" + day : ""}`;

    if (dateParts.length > 1) {
        const timeComponents = dateParts[1].split(":");
        const hours = timeComponents[0];
        const minutes = timeComponents[1];
        const seconds = timeComponents[2];

        normalizedDate += ` ${hours}:${minutes}${seconds ? `:${seconds}` : ""}`;
    }

    return normalizedDate;
}

function getConstraintsString() {
    let message = []
    Object.entries(data.constraints).forEach(constraint => {
        const [name, value] = [...constraint]

        if (name, value) {
            message.push(`${name}: ${value}`);
        }
    });
    return message.join(', ');
}

</script>
