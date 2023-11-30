<template>
    <div class="flex flex-col describo-property-type-time">
        <el-input
            class="w-full"
            type="text"
            v-model="data.internalValue"
            @blur="data.throttledSave"
            @change="data.throttledSave"
            resize="vertical"
            :placeholder="$t('provide_time')"
        ></el-input>
        <div class="text-xs text-gray-700" v-if="!data.isValidTime">
            {{ $t('invalid_time_value') }}
        </div>
    </div>
</template>

<script setup>
import { ElInput } from "element-plus";
import { reactive, watch } from "vue";
import throttle from "lodash-es/throttle.js";
import {$t} from '../i18n'

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
