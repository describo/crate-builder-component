<template>
    <div>
        <div class="flex flex-row space-x-4">
            <div>
                <el-radio-group v-model="data.resolveDepth">
                    <el-radio label="0">Depth: 0</el-radio>
                    <el-radio label="1">Depth: 1</el-radio>
                </el-radio-group>
            </div>
            <div>
                <el-button
                    type="primary"
                    @click="$emit('save:entity:template', { resolveDepth: data.resolveDepth })"
                    >Save Entity Template</el-button
                >
            </div>
        </div>
        <div class="p-4 border-t my-2 border-slate-200">
            <pre>{{ entity }}</pre>
        </div>
    </div>
</template>

<script setup>
import { ElButton, ElRadio, ElRadioGroup } from "element-plus";
import { reactive, computed, inject } from "vue";
import compact from "lodash-es/compact";
import { $t } from "../i18n";
import { crateManagerKey } from "./keys.js";
const cm = inject(crateManagerKey);

const props = defineProps({
    entity: { type: Object, required: true },
});
const data = reactive({
    resolveDepth: "0",
});
const emit = defineEmits(["save:entity:template"]);

let entity = computed(() => {
    return cm.value.exportEntityTemplate({
        id: props.entity["@id"],
        resolveDepth: parseInt(data.resolveDepth),
    });
});
</script>
