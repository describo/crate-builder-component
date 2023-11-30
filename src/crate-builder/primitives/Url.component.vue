<template>
    <div class="flex flex-col describo-property-type-url">
        <div class="flex flex-row flex-grow space-x-2">
            <el-input
                class="w-full"
                type="text"
                v-model="data.internalValue"
                @blur="save"
                @change="save"
                resize="vertical"
            ></el-input>
            <el-button @click="save" type="success" :disabled="!isValidUrl">
                <i class="fas fa-check fa-fw"></i>
            </el-button>
        </div>
        <div class="text-xs" v-if="!isValidUrl">
            {{ $t("invalid_url_value") }}
        </div>
    </div>
</template>

<script setup>
import { ElButton, ElInput } from "element-plus";
import { reactive, watch, computed } from "vue";
import { isURL } from "../crate-manager.js";
import throttle from "lodash-es/throttle.js";
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
const $emit = defineEmits(["create:entity"]);
const data = reactive({
    internalValue: props.value,
    throttledSave: throttle(save, 1000),
});
let isValidUrl = computed(() => isURL(data.internalValue));

watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidUrl = props.value ? isURL(props.value) : true;
    }
);
function save() {
    if (isValidUrl.value) {
        console.log("url component create:entity", props.property, data.internalValue);
        $emit("create:entity", {
            property: props.property,
            json: {
                "@id": data.internalValue.trim(),
                "@type": "URL",
                name: data.internalValue.trim(),
            },
        });
    }
}
</script>
