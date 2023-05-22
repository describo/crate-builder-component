<template>
    <div class="flex flex-col">
        <el-input
            class="w-full"
            type="text"
            v-model="data.internalValue"
            @blur="data.throttledSave"
            @change="data.throttledSave"
            resize="vertical"
            placeholder="Please provide a time."
        ></el-input>
        <div class="text-xs text-gray-700" v-if="!data.isValidTime">
            The supplied time '{{ data.internalValue }}' is invalid. Time format is: HH:mm::ss.
            e.g.09:03:59
        </div>
    </div>
</template>

<script setup>
import { ElInput } from "element-plus";
import { reactive, watch } from "vue";
import throttle from "lodash-es/throttle.js";

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    value: {
        type: String,
    },
});
const $emit = defineEmits(["save:property"]);
const data = reactive({
    internalValue: props.value,
    isValidTime: checkTimeIsValid(props.value),
    throttledSave: throttle(save, 1000),
});

watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidTime = checkTimeIsValid(data.internalValue);
    }
);
function save() {
    data.isValidTime = checkTimeIsValid(data.internalValue);
    if (!data.isValidTime) return;
    $emit("save:property", {
        property: props.property,
        value: data.internalValue,
    });
}

function checkTimeIsValid(string) {
    try {
        if (!string) return true;
        if (string.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)) return true;
        if (string.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) return true;
    } catch (error) {}
    return false;
}
</script>
