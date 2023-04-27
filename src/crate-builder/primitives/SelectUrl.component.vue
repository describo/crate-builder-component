<template>
    <div>
        <el-select
            v-if="data.hasValidValues && data.isValidValue"
            class="w-full"
            v-model="data.internalValue"
            placeholder="Select"
            filterable
            :filter-method="filter"
            @change="save"
            @blur="reset"
        >
            <el-option v-for="(item, idx) in data.items" :key="idx" :label="item" :value="item">
            </el-option>
        </el-select>
        <div v-if="!data.isValidValue" class="text-xs text-gray-700">
            The value '{{ props.value }}' provided to this component is of the wrong from. It can
            only be a valid URL.
        </div>
        <div v-if="!data.hasValidValues" class="text-xs text-gray-700">
            The definition provided to this component has values of the wrong from. It can only be
            an array of strings which are each valid URLs.
        </div>
    </div>
</template>

<script setup>
import { ElSelect, ElOption } from "element-plus";
import { reactive, watch } from "vue";
import isArray from "lodash-es/isArray";
import isString from "lodash-es/isString";
import uniq from "lodash-es/uniq";
import { isURL } from "../crate-manager.js";

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    value: {
        type: String,
    },
    definition: {
        type: Object,
        required: true,
    },
});
const $emit = defineEmits(["create:entity"]);
const data = reactive({
    items: [...props.definition.values],
    internalValue: props.value,
    isValidValue: props.value ? isURL(props.value) : true,
    hasValidValues: verifySelectValuesAreUrls(props.definition.values),
});

watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
        data.isValidValue = props.value ? isURL(props.value) : true;
    }
);
watch(
    () => props.definition.values,
    () => {
        data.items = [...props.definition.values];
        data.hasValidValues = verifySelectValuesAreUrls(props.definition.values);
    }
);

function save() {
    $emit("create:entity", {
        property: props.property,
        json: {
            "@id": data.internalValue,
            "@type": "URL",
            name: data.internalValue,
        },
    });
}
function filter(d) {
    data.options = props.definition.values.filter((v) => {
        let match = false;
        const re = new RegExp(d);
        if (v.toLowerCase().match(re)) match = true;
        if (match) return v;
    });
}
function reset() {
    data.options = [...props.definition.values];
}
function verifySelectValuesAreUrls(values) {
    if (!isArray(values)) return false;
    values = values.map((v) => isString(v) && isURL(v));
    values = uniq(values);
    return values.length === 1 && values[0] === true ? true : false;
}
</script>
