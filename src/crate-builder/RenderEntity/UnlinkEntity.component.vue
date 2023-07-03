<template>
    <div class="">
        <el-button @click="unlinkEntity" type="danger">
            <i class="fas fa-unlink"></i>
        </el-button>
    </div>
</template>

<script setup>
import { ElButton } from "element-plus";
const $emit = defineEmits(["unlink:entity"]);
const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
async function unlinkEntity() {
    $emit("unlink:entity", {
        entity: props.entity,
    });
}
</script>
