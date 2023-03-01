<template>
    <div class="flex flex-col">
        <el-select
            v-if="data.hasValidValues"
            class="w-full"
            v-model="data.internalValue"
            placeholder="Select"
            filterable
            :filter-method="filter"
            @change="save"
            @blur="reset"
        >
            <el-option
                v-for="(item, idx) in data.items"
                :key="idx"
                :value="item"
                :value-key="item['@id']"
            >
                <span>{{ item.name }} ({{ item["@id"] }})</span>
            </el-option>
        </el-select>
        <div v-if="!data.hasValidValues" class="text-xs text-gray-700">
            The definition provided to this component has values of the wrong from. It can only be
            an array of JSON-LD objects and each object, at a minimum, must have '@id', '@type' and
            'name' defined.
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import isPlainObject from "lodash/isPlainObject";

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    definition: {
        type: Object,
        required: true,
    },
});
const $emit = defineEmits(["create:entity"]);
const data = reactive({
    items: [...props.definition.values],
    internalValue: undefined,
    hasValidValues: verifySelectValuesAreValidPlainObjects(props.definition.values),
});

watch(
    () => props.definition.values,
    () => {
        data.items = [...props.definition.values];
        data.hasValidValues = verifySelectValuesAreValidPlainObjects(props.definition.values);
    }
);

function save() {
    $emit("create:entity", { property: props.property, json: data.internalValue });
}
function filter(d) {
    data.items = props.definition.values.filter((v) => {
        let match = false;
        const re = new RegExp(d);
        if (v["@id"].match(re)) match = true;
        if (v["@type"].match(re)) match = true;
        if (v["name"].match(re)) match = true;
        if (match) return v;
    });
}
function reset() {
    data.items = [...props.definition.values];
}
function verifySelectValuesAreValidPlainObjects(values) {
    let valid = true;
    values.forEach((v) => {
        if (!isPlainObject(v)) valid = false;
        if (!"@id" in v) valid = false;
        if (!"@type" in v) valid = false;
        if (!"name" in v) valid = false;
        console.log({ ...v }, valid);
    });
    return valid;
}
</script>
