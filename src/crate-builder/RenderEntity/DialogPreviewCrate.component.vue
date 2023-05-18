<template>
    <div class="text-sm">
        <pre v-if="data.crate['@graph']">{{ data.crate }}</pre>
        <div v-else>loading...</div>
    </div>
</template>

<script setup>
import { vLoading } from "element-plus";
import { reactive, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["close"]);
const data = reactive({
    crate: {},
    loading: false,
});
onMounted(async () => {
    data.loading = true;
    await new Promise((resolve) => setTimeout(resolve, 400));
    data.crate = props.crateManager.exportCrate({});
    data.loading = false;
});
onBeforeUnmount(() => {
    data.visible = false;
});
</script>
