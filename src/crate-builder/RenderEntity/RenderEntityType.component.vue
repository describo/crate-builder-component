<template>
    <div class="flex flex-row">
        <div class="w-1/3 xl:w-1/5 flex flex-col">Type</div>
        <div class="w-2/3 xl:w-4/5 flex flex-col">
            {{ type }}
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { isArray } from "lodash";

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});

let type = computed(() => {
    return isArray(props.entity["@type"])
        ? props.entity["@type"].join(", ")
        : props.entity["@type"];
});
</script>
