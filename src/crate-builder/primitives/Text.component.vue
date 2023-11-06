<template>
    <div class="flex flex-col space-y-2">
        <div class="flex flex-row space-x-2">
            <el-input
                class="w-full"
                :type="type"
                v-model="data.displayValue"
                @blur="debouncedSave"
                @change="debouncedSave"
                resize="vertical"
                :rows="5"
                :placeholder="props.placeholder"
            ></el-input>
            <el-button @click="save" type="success" size="default">
                <i class="fas fa-check fa-fw"></i>
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { ElInput, ElButton } from "element-plus";
import { reactive, watch } from "vue";
import debounce from "lodash-es/debounce.js";
import isBoolean from "lodash-es/isBoolean.js";
const debouncedSave = debounce(save, 200);

const props = defineProps({
    type: {
        type: String,
        default: "text",
        validator: (val) => ["text", "textarea", "url"].includes(val),
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
    displayValue: decodeValue(props.value),
});
watch(
    () => props.value,
    () => {
        data.displayValue = decodeValue(props.value);
    }
);
function save() {
    $emit("save:property", {
        property: props.property,
        value: data.displayValue.trim(),
    });
}

function decodeValue(value) {
    if (isBoolean(value)) {
        return String(value);
    } else {
        return decodeURI(value) === "undefined" ? "" : decodeURI(value);
    }
}
</script>
