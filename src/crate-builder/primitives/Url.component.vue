<template>
    <div class="flex flex-col">
        <div class="flex flex-row flex-grow space-x-2">
            <el-input
                class="w-full"
                type="text"
                v-model="data.internalValue"
                @blur="save"
                @change="save"
                resize="vertical"
            ></el-input>
            <el-button @click="save" type="success" :disabled="!data.isValidUrl">
                <i class="fas fa-check fa-fw"></i>
            </el-button>
        </div>
        <div class="text-xs" v-if="!data.isValidUrl">
            The entry needs to be a valid url. The accepted protocols are: http, https, ftp, ftps
            and arcp.
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import { isURL } from "../crate-manager.js";
const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    value: {
        type: String,
    },
});
const $emit = defineEmits(["create:entity"]);
const data = reactive({
    internalValue: props.value,
    isValidUrl: props.value ? isURL(props.value) : true,
});

watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidUrl = props.value ? isURL(props.value) : true;
    }
);
function save() {
    data.isValidUrl = isURL(data.internalValue);
    if (data.isValidUrl) {
        $emit("create:entity", {
            property: props.property,
            json: {
                "@id": data.internalValue,
                "@type": "URL",
                name: data.internalValue,
            },
        });
    }
}
</script>
