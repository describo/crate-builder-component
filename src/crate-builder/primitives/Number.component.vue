<template>
    <div class="flex flex-col describo-property-type-number">
        <el-input
            class="w-full"
            type="number"
            @change="save()"
            v-model="data.internalValue"
            resize="vertical"
        ></el-input>
        <div class="text-xs text-gray-700" v-if="!isValidNumber">
            {{ $t("invalid_number_value", { value: data.internalValue }) }}
        </div>
    </div>
</template>

<script setup>
import { ElInput } from "element-plus";
import { reactive, watch, computed } from "vue";
import isNumeric from "validator/es/lib/isNumeric";
import { $t } from "../i18n";

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    value: {
        type: [String, Number],
    },
});
const $emit = defineEmits(["save:property"]);
const data = reactive({
    internalValue: props.value,
    isValidNumber: checkIsNumeric(props.value),
});

let isValidNumber = computed(() => checkIsNumeric(data.internalValue));
watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidNumber = checkIsNumeric(props.value);
    }
);
function save() {
    data.isValidNumber = checkIsNumeric(data.internalValue);
    if (!data.isValidNumber) return;
    $emit("save:property", {
        property: props.property,
        value: data.internalValue,
    });
}

function checkIsNumeric(value) {
    value = value + "";
    return isNumeric(String(value));
}
</script>
