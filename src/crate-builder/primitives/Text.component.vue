<template>
    <div class="flex flex-col space-y-2 describo-property-type-text">
        <div class="flex flex-row space-x-2">
            <el-input
                class="w-full"
                :type="type"
                v-model="data.displayValue"
                @blur="debouncedSave"
                @change="debouncedSave"
                resize="vertical"
                :rows="5"
                :placeholder="props.placeholder"
            ></el-input>
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
import dayjs from "dayjs";
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
    },
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
    if (data.constraints.minLength !== undefined && data.constraints.minLength > value.length)
        return false;
    if (data.constraints.maxLength !== undefined && data.constraints.maxLength < value.length)
        return false;
    if (data.constraints.regex !== undefined && !new RegExp(data.constraints.regex).test(value))
        return false;
    if (
        data.constraints.dateFormat !== undefined &&
        !validateDateFormat(value, data.constraints.dateFormat)
    )
        return false;

    return true;
}

function validateDateFormat(inputString, granularity) {
    let dateString = inputString;
    if (inputString.startsWith("-")) {
        dateString = dateString.substr(1);
    }
    return (
        Array.isArray(granularity) && granularity.some((g) => dayjs(dateString, g, true).isValid())
    );
}

function getConstraintsString() {
    let message = [];
    Object.entries(data.constraints).forEach((constraint) => {
        const [name, value] = [...constraint];

        if ((name, value)) {
            message.push(`${name}: ${value}`);
        }
    });
    return message.join(", ");
}
</script>
