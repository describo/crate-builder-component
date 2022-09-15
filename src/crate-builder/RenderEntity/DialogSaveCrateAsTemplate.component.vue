<template>
    <div class="flex flex-row space-x-2 flex-grow">
        <div class="text-sm pt-1">Save this crate as a template for re-use</div>
        <div class="flex-grow">
            <el-input
                class="w-full"
                v-model="data.crateName"
                placeholder="provide a name for the crate template"
            />
        </div>
        <div>
            <el-button @click="save" :disabled="!data.crateName">
                <div class="mr-1">
                    <i class="fa-solid fa-save"></i>
                </div>
                Save
            </el-button>
            <el-button @click="close">
                <div>
                    <i class="fa-solid fa-times"></i>
                </div>
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { reactive } from "vue";
const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["close", "save:crate:template"]);
const data = reactive({
    entityCount: 0,
    crateName: undefined,
});

function close() {
    emit("close");
}
function save() {
    emit("save:crate:template", { name: data.crateName });
    data.crateName = undefined;
    close();
}
</script>
