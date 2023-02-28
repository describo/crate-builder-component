<template>
    <div class="flex flex-col">
        <div v-if="isValidString">{{ props.value }}</div>
        <div v-if="!isValidString">
            The supplied value '{{ props.value }}' is invalid. It can only be a string.
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import isString from "lodash/isString";

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
});

let isValidString = computed(() => isString(props.value));
</script>
