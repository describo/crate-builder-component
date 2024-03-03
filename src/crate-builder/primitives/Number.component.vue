<template>
    <div class="flex flex-col describo-property-type-number">
        <div class="flex flex-row space-x-2">
            <el-input class="w-full" type="number" @change="debouncedSave" v-model="data.internalValue"
                resize="vertical"></el-input>
            <el-button @click="save" type="success" size="default" :disabled="!isValidNumber">
                <i class="fas fa-check fa-fw"></i>
            </el-button>
        </div>
        <div class="text-xs text-gray-700" v-if="!isValidNumber">
            {{ $t("invalid_number_value", { value: data.internalValue }) }}
        </div>
        <div class="text-xs" v-if="!isValidNumberConstraints">
            {{ $t("number_constraints_error_message", { value: getConstraintsString() }) }}
        </div>
    </div>
</template>

<script setup>
import { ElInput, ElButton } from "element-plus";
import { reactive, watch, computed } from "vue";
import isNumeric from "validator/es/lib/isNumeric";
import debounce from "lodash-es/debounce.js";
import { $t } from "../i18n";

const debouncedSave = debounce(save, 200);

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    definition: {
        type: Object,
    },
    value: {
        type: [String, Number],
    },
});
const $emit = defineEmits(["save:property"]);
const data = reactive({
    internalValue: props.value,
    isValidNumber: checkIsNumeric(props.value),
    constraints: {
        minValue: props.definition?.minValue,
        maxValue: props.definition?.maxValue,
        numberType: props.definition?.numberType
    }
});

let isValidNumber = computed(() => checkIsNumeric(data.internalValue));
let isValidNumberConstraints = computed(() => validateNumberConstraints(Number(data.internalValue)));
watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidNumber = checkIsNumeric(props.value);
    }
);
function save() {
    data.isValidNumber = checkIsNumeric(data.internalValue);
    if (data.isValidNumber && isValidNumberConstraints.value) {
        $emit("save:property", {
            property: props.property,
            value: Number(data.internalValue),
        });
    }
}

function checkIsNumeric(value) {
    value = value + "";
    return isNumeric(String(value));
}

function validateNumberConstraints(value) {
    if (
        data.constraints.minValue !== undefined &&
        data.constraints.minValue > value
    ) return false;
    if (
        data.constraints.maxValue !== undefined &&
        data.constraints.maxValue < value
    ) return false;
    if (
        data.constraints.numberType &&
        !isNumberType(value, data.constraints.numberType)
    ) return false;
    return true;
}

function isNumberType(value, numberTypes) {
    const stringValue = String(value).toLowerCase();

    const typeMap = {
        'any': true,
        'long': Number.isSafeInteger(value),
        'int': Number.isInteger(value),
        'float': stringValue.includes('.') && !Number.isNaN(parseFloat(value)),
        'double': !Number.isNaN(parseFloat(value))
    };

    return (
        Array.isArray(numberTypes) &&
        numberTypes.some(type => typeMap[type.toLowerCase()])
    );
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
