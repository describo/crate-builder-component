<template>
    <div class="flex flex-col describo-property-type-date">
        <el-date-picker
            v-model="data.internalValue"
            type="date"
            :placeholder="$t('pick_a_date')"
            format="YYYY-MM-DD"
            @change="save"
            :clearable="true"
        >
        </el-date-picker>
        <div class="text-xs text-gray-700" v-if="!data.isValidDate">
            {{ $t("invalid_date_value", { value: props.value }) }}
        </div>
    </div>
</template>

<script setup>
import { ElDatePicker } from "element-plus";
import { reactive, watch } from "vue";
import startOfDay from "date-fns/esm/startOfDay";
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
            value: startOfDay(data.internalValue).toISOString(),
        });
    } catch (error) {
        // invalid date - do nothing
        data.isValidDate = false;
    }
}
</script>
