<template>
    <div class="flex flex-col">
        <el-date-picker
            v-if="props.value && data.isValidDate"
            v-model="data.internalValue"
            type="datetime"
            placeholder="Pick a date and time"
            @change="save"
            :clearable="true"
        >
        </el-date-picker>
        <div class="text-xs text-gray-700" v-else>
            The supplied date/time '{{ props.value }}' is invalid. Date/Time format is: YYYY-MM-DD
            HH:mm:ss. e.g. 2021-03-22 03:23:00
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import { parseISO } from "date-fns";
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
        value: data.internalValue.toISOString(),
    });
}
</script>
