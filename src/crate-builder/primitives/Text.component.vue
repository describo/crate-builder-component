<template>
    <div class="">
        <div class="flex flex-row space-x-2" v-if="data.isValidType">
            <el-input
                class="w-full"
                :type="type"
                v-model="data.internalValue"
                @blur="data.throttledSave"
                @change="data.throttledSave"
                resize="vertical"
                :rows="5"
                :placeholder="props.placeholder"
            ></el-input>
            <el-button @click="save" type="success" size="default">
                <i class="fas fa-check fa-fw"></i>
            </el-button>
        </div>
        <div v-else class="text-xs text-gray-700">
            The type '{{ props.type }}' is not valid for this component. It can only be 'text' or
            'textarea'
        </div>
    </div>
</template>

<script setup>
import { ElInput, ElButton } from "element-plus";
import { reactive, watch } from "vue";
import throttle from "lodash-es/throttle.js";

const props = defineProps({
    type: {
        type: String,
        default: "textarea",
        // We can't really validate this as text is the catchall regardless of what
        //   the data type is supposed to be for any given field
        // validator: (value) => {
        //     return ["text", "textarea", "url"].includes(value.toLowerCase());
        // },
    },
    property: {
        type: String,
        required: true,
    },
    value: {
        type: String,
    },
    placeholder: {
        type: String,
    },
});
const $emit = defineEmits(["save:property"]);
const data = reactive({
    internalValue: props.value,
    currentValue: props.value,
    isValidType: ["text", "textarea"].includes(props.type),
    throttledSave: throttle(save, 1000),
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
