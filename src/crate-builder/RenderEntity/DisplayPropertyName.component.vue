<template>
    <div>{{ labelDisplay }}</div>
</template>

<script setup>
import startCase from "lodash-es/startCase";
import { computed } from "vue";

const props = defineProps({
    property: { type: String },
    label: { type: String },
});
const labelDisplay = computed(() => {
    // if we have a label then use it as is
    if (props?.label) return props.label;

    // otherwise sort out the property
    if (props?.property?.match(/:/)) {
        let [namespace, label] = props.property.split(":");
        return `${namespace}:${startCase(label)}`;
    } else {
        return startCase(props.property);
    }
});
</script>
