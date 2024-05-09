<template>
    <div class="">
        <el-button @click="unlinkEntity" type="danger">
            <FontAwesomeIcon :icon="faUnlink"></FontAwesomeIcon>
        </el-button>
    </div>
</template>

<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faUnlink } from "@fortawesome/free-solid-svg-icons";
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
