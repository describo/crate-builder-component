<template>
    <div class="flex flex-col">
        <el-date-picker
            v-model="data.internalValue"
            type="date"
            placeholder="Pick a date"
            format="YYYY-MM-DD"
            @change="save"
            :clearable="true"
        >
        </el-date-picker>
        <div class="text-xs text-gray-700" v-if="!data.isValidDate">
            The supplied date '{{ props.value }}' is invalid. Date format is: YYYY-MM-DD or an ISO
            String. e.g. 2021-03-22 or 2022-09-28T02:20:56.521Z.
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import startOfDay from "date-fns/esm/startOfDay";
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
        data.isValidDate = checkDateIsValid(props.value);
    }
);
function save() {
    data.isValidDate = checkDateIsValid(data.internalValue);
    if (!data.isValidDate) return;
    $emit("save:property", {
        property: props.property,
        value: startOfDay(data.internalValue).toISOString(),
    });
}
</script>
