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
    return startCase(props.label);
});
</script>
