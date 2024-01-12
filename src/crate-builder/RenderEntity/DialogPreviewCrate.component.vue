<template>
    <div class="text-sm">
        <pre v-if="data.crate['@graph']">{{ data.crate }}</pre>
        <div v-else>{{ $t("preview_loading") }}</div>
    </div>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount, inject } from "vue";
import { $t } from "../i18n";
import { crateManagerKey } from "./keys.js";
const cm = inject(crateManagerKey);

const emit = defineEmits(["close"]);
const data = reactive({
    crate: {},
    loading: false,
});
onMounted(async () => {
    data.loading = true;
    await new Promise((resolve) => setTimeout(resolve, 400));
    data.crate = cm.value.exportCrate();
    data.loading = false;
});
onBeforeUnmount(() => {
    data.visible = false;
});
</script>
