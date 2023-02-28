<template>
    <div class="flex flex-col">
        <el-date-picker
            v-model="data.internalValue"
            type="datetime"
            placeholder="Pick a date and time"
            @change="save"
            :clearable="true"
        >
        </el-date-picker>
        <div class="text-xs text-gray-700" v-if="!data.isValidDate">
            The supplied date/time '{{ props.value }}' is invalid. Date/Time format is: YYYY-MM-DD
            HH:mm:ss or an ISO String. e.g. 2021-03-22 03:23:00 or 2022-09-28T02:20:56.521Z.
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import { checkDateIsValid } from "./date-libs";

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
    isValidDate: checkDateIsValid(props.value),
});

watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidDate = checkDateIsValid(data.internalValue);
    }
);
function save() {
    $emit("save:property", {
        property: props.property,
        value: data.internalValue.toISOString(),
    });
}
</script>
