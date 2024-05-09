<template>
    <div class="flex flex-col space-y-2 describo-property-type-text">
        <div class="flex flex-row space-x-2">
            <!--if type === 'text' - display an input component -->
            <el-input
                v-if="props.type !== 'textarea'"
                class="w-full"
                :type="type"
                v-model="data.displayValue"
                @blur="debouncedSave"
                @input="validateTextConstraints()"
                :placeholder="props.placeholder"
            ></el-input>

            <!-- whereas if type === 'textarea' - display an editable div
                which expands to the size of the text it contains

                > because textarea's don't
            -->
            <div
                v-else
                ref="editableTextarea"
                contenteditable
                @blur="debouncedSave"
                @input="validateTextConstraints()"
                class="whitespace-pre-wrap bg-white text-slate-800 border border-solid border-slate-200 p-2 w-full"
            >
                {{ data.displayValue }}
            </div>

            <!-- save button -->
            <el-button
                @click="debouncedSave"
                type="success"
                size="default"
                :disabled="!isValidTextValue"
            >
                <FontAwesomeIcon :icon="faCheck" fixed-width></FontAwesomeIcon>
            </el-button>
        </div>
        <div class="text-xs" v-if="!isValidTextValue && getConstraintsString()">
            {{ $t("text_constraints_error_message", { value: getConstraintsString() }) }}
        </div>
    </div>
</template>

<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { ElInput, ElButton } from "element-plus";
import { reactive, watch, ref } from "vue";
import debounce from "lodash-es/debounce.js";
import isBoolean from "lodash-es/isBoolean.js";
import { $t } from "../i18n";
import dayjs from "dayjs";
const debouncedSave = debounce(save, 200, { leading: false, trailing: true });

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

let editableTextarea = ref();
let isValidTextValue = ref(true);

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

function save() {
    if (props.type !== "textarea" && isValidTextValue.value) {
        $emit("save:property", {
            property: props.property,
            value: data.displayValue.trim(),
        });
    } else {
        if (editableTextarea.value?.innerText) {
            $emit("save:property", {
                property: props.property,
                value: editableTextarea.value.innerText,
            });
        }
    }
}

function decodeValue(value) {
    if (isBoolean(value)) {
        return String(value);
    } else {
        return decodeURI(value) === "undefined" ? "" : decodeURI(value);
    }
}

function validateTextConstraints() {
    let value = props.type === "textarea" ? editableTextarea?.value?.innerText : data.displayValue;
    value = value ?? "";
    if (data.constraints.minLength !== undefined && data.constraints.minLength > value.length) {
        isValidTextValue.value = false;
    } else if (
        data.constraints.maxLength !== undefined &&
        data.constraints.maxLength < value.length
    ) {
        isValidTextValue.value = false;
    } else if (
        data.constraints.regex !== undefined &&
        !new RegExp(data.constraints.regex).test(value)
    ) {
        isValidTextValue.value = false;
    } else if (
        data.constraints.dateFormat !== undefined &&
        !validateDateFormat(value, data.constraints.dateFormat)
    ) {
        isValidTextValue.value = false;
    } else {
        isValidTextValue.value = true;
    }
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
