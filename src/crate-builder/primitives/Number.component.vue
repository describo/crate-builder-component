<template>
    <div class="flex flex-col">
        <el-input
            class="w-full"
            type="number"
            @input="data.debouncedSave"
            v-model="data.internalValue"
            resize="vertical"
        ></el-input>
        <div class="text-xs text-gray-700" v-if="!data.isValidNumber">
            The supplied number '{{ data.internalValue }}' is invalid. The value must be a valid
            number passed in as a String or a Number.
        </div>
    </div>
</template>

<script setup>
import debounce from "lodash/debounce";
import { reactive, watch } from "vue";
import isNumeric from "validator/lib/isNumeric";

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
    debouncedSave: debounce(save, 1000),
});

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
    return isNumeric(String(value));
}
</script>
