<template>
    <div>{{ labelDisplay }}</div>
</template>

<script setup>
import { startCase } from "lodash";
import { computed } from "vue";

const props = defineProps({
    label: { type: String, required: true },
});
const labelDisplay = computed(() => {
    if (props.label.match(/:/)) {
        let [namespace, label] = props.label.split(":");
        return `${namespace}:${startCase(label)}`;
    } else {
        return startCase(props.label);
    }
});
</script>
