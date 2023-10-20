<template>
    <el-tabs v-model="data.activeTab" class="p-2">
        <el-tab-pane label="Embedded Component" name="component">
            <EmbeddedComponent v-if="data.activeTab === 'component'" />
        </el-tab-pane>
        <el-tab-pane label="Render Entity" name="entity">
            <RenderEntityComponent v-if="data.activeTab === 'entity'" />
        </el-tab-pane>
    </el-tabs>
</template>

<script setup>
import { ElTabs, ElTabPane } from "element-plus";
import EmbeddedComponent from "./EmbeddedComponent.component.vue";
import RenderEntityComponent from "./RenderEntity.component.vue";
import { reactive } from "vue";

const data = reactive({
    activeTab: "component",
});
</script>
