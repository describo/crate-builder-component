<template>
    <div class="flex flex-col">
        <el-input
            v-if="data.isValidNumber"
            class="w-full"
            type="number"
            @input="data.debouncedSave"
            v-model="data.internalValue"
            resize="vertical"
        ></el-input>
        <div class="text-xs text-gray-700" v-else>
            The supplied number '{{ props.value }}' is invalid. The value must be a valid number
            passed in as a String or a Number.
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
    isValidNumber: isNumeric(String(props.value)),
    debouncedSave: debounce(save, 1000),
});

watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidDate = isNumeric(String(data.internalValue));
    }
);
function save() {
    $emit("save:property", {
        property: props.property,
        value: data.internalValue,
    });
}
</script>
