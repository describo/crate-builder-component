<template>
    <div class="flex flex-col">
        <el-time-select
            v-if="props.value && data.isValidTime"
            v-model="data.internalValue"
            placeholder="Pick a time"
            @change="save"
            :clearable="false"
            :picker-options="{
                start: '00:00',
                step: '00:15',
                end: '23:45',
            }"
        >
        </el-time-select>
        <div class="text-xs text-gray-700" v-else>
            The supplied time '{{ props.value }}' is invalid. Time format is: HH:mm::ss.
            e.g.09:03:59
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import isTime from "validator/lib/isTime";
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
});

watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidTime = checkTimeIsValid(data.internalValue);
    }
);
function save() {
    $emit("save:property", {
        property: props.property,
        value: data.internalValue,
    });
}

function checkTimeIsValid(time) {
    try {
        if (!time) return true;
        if (time.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)) return true;
        if (time.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) return true;
    } catch (error) {}
    return false;
}
</script>
