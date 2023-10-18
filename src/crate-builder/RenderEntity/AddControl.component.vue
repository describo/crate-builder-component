<template>
    <div class="flex flex-row">
        <div v-for="(type, idx) of types" :key="idx">
            <el-button
                @click="toggle(type)"
                type="primary"
                class="focus:outline-none focus:border-2 focus:border-green-600 m-1"
            >
                <div v-show="!selectedType || selectedType !== type">
                    <i class="fas fa-plus"></i>
                </div>
                <div v-show="selectedType === type">
                    <i class="fas fa-times"></i>
                </div>
                &nbsp;{{ getTypeLabelFromProfile(type) }}
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { ElButton } from "element-plus";
import { computed } from "vue";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    types: {
        type: [String, Array],
        required: true,
    },
    selectedType: {
        required: true,
    },
});

const emit = defineEmits(["add", "close"]);
let selectedType = computed(() => props.selectedType);
let types = computed(() => props.types);

function getTypeLabelFromProfile(type) {
    return props.crateManager?.profileManager?.getTypeLabel(type);
}
function toggle(type) {
    if (props.selectedType === type) {
        emit("close");
    } else {
        emit("add", { type });
    }
}
</script>
