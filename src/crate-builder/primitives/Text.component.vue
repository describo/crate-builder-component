<template>
    <div class="">
        <div class="flex flex-row space-x-2" v-if="data.isValidType">
            <el-input
                class="w-full"
                :type="type"
                v-model="data.internalValue"
                @blur="data.debouncedSave"
                @change="data.debouncedSave"
                resize="vertical"
                :rows="5"
                :placeholder="props.placeholder"
            ></el-input>
            <el-button @click="save" type="success" size="default">
                <i class="fas fa-check fa-fw"></i>
            </el-button>
        </div>
        <div v-else class="text-xs text-gray-700">
            {{ $t("invalid_type_for_text", { type: props.type }) }}
        </div>
    </div>
</template>

<script setup>
import { ElInput, ElButton } from "element-plus";
import { reactive, watch } from "vue";
import debounce from "lodash-es/debounce.js";
import isBoolean from "lodash-es/isBoolean.js";
import { $t } from "../i18n";

const props = defineProps({
    type: {
        type: String,
        default: "text",
    },
    property: {
        type: String,
        required: true,
    },
    value: {},
    placeholder: {
        type: String,
    },
});
const $emit = defineEmits(["save:property"]);
const data = reactive({
    internalValue: isBoolean(props.value) ? String(props.value) : props.value,
    currentValue: isBoolean(props.value) ? String(props.value) : props.value,
    isValidType: ["text", "textarea"].includes(props.type),
    debouncedSave: debounce(save, 200),
});
watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidType = ["text", "textarea"].includes(props.type);
    }
);
function save() {
    if (data.internalValue !== data.currentValue) {
        data.currentValue = data.internalValue;

        $emit("save:property", {
            property: props.property,
            value: data.internalValue.trim(),
        });
    }
}
</script>
