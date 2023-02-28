<template>
    <div class="flex flex-col">
        <el-date-picker
            v-if="props.value && data.isValidDate"
            v-model="data.internalValue"
            type="date"
            placeholder="Pick a date"
            format="YYYY-MM-DD"
            @change="save"
            :clearable="true"
        >
        </el-date-picker>
        <div class="text-xs text-gray-700" v-else>
            The supplied date '{{ props.value }}' is invalid. Date format is: YYYY-MM-DD. e.g.
            2021-03-22
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import { startOfDay, parseISO } from "date-fns";
import isDate from "validator/lib/isDate";

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
    isValidDate: isDate(parseISO(props.value)),
});

watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidDate = isDate(data.internalValue);
    }
);
function save() {
    $emit("save:property", {
        property: props.property,
        value: startOfDay(data.internalValue).toISOString(),
    });
}
</script>
