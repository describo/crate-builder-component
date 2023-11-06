<template>
    <div class="flex flex-col">
        <el-date-picker
            v-model="data.internalValue"
            type="datetime"
            :placeholder="$t('pick_a_datetime')"
            @change="save"
            :clearable="true"
        >
        </el-date-picker>
        <div class="text-xs text-gray-700" v-if="!data.isValidDate">
            {{ $t("invalid_datetime_value", { value: props.value }) }}
        </div>
    </div>
</template>

<script setup>
import { ElDatePicker } from "element-plus";
import { reactive, watch } from "vue";
import { checkDateIsValid } from "./date-libs";
import { $t } from "../i18n";

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
    try {
        data.isValidDate = checkDateIsValid(data.internalValue);
        if (!data.isValidDate) return;
        $emit("save:property", {
            property: props.property,
            value: data.internalValue.toISOString(),
        });
    } catch (error) {
        // invalid date - do nothing
        data.isValidDate = false;
    }
}
</script>
