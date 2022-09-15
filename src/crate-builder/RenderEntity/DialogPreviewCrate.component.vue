<template>
    <el-dialog
        v-model="data.visible"
        title="Manage Collection Entities"
        width="95%"
        top="5vh"
        :before-close="close"
        :show-close="false"
    >
        <template #header>
            <div class="flex flex-row">
                <div>Preview Crate</div>
                <div class="flex-grow"></div>
                <div>
                    <el-button @click="close" type="primary">
                        <i class="fas fa-times"></i>
                    </el-button>
                </div>
            </div>
        </template>
        <div class="crate-preview overflow-scroll text-sm">
            <pre>{{ data.crate }}</pre>
        </div>
    </el-dialog>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["close"]);
const data = reactive({
    crate: props.crateManager.exportCrate(),
    visible: false,
});
onMounted(() => {
    data.visible = true;
});
onBeforeUnmount(() => {
    data.visible = false;
});

function close() {
    emit("close");
}
</script>

<style scoped>
.crate-preview {
    height: 70vh;
}
</style>
