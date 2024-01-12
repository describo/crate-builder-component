<template>
    <div class="overflow-scroll pr-2">
        <div class="flex flex-col space-y-2">
            <el-pagination
                layout="prev, pager, next, total"
                :page-size="data.pageSize"
                :total="data.total"
                v-model:current-page="data.currentPage"
                @current-change="changePage"
            />
            <div class="flex-grow">
                <el-input
                    v-model="data.filterInputModel"
                    @input="filterConnections"
                    :placeholder="$t('search_for_connection')"
                ></el-input>
            </div>
            <div v-for="entity of entities" :key="entity['@id']">
                <RenderItemLinkComponent
                    :entity="entity"
                    @load:entity="loadEntity(entity)"
                    class="describo-render-item-link p-2 rounded bg-blue-200 hover:text-black hover:bg-blue-300"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElInput, ElPagination } from "element-plus";
import { reactive, computed, inject } from "vue";
import compact from "lodash-es/compact";
import RenderItemLinkComponent from "./RenderItemLink.component.vue";
import { $t } from "../i18n";
import { crateManagerKey } from "./keys.js";
const cm = inject(crateManagerKey);

const data = reactive({
    collapse: false,
    filterInputModel: "",
    pageSize: 10,
    currentPage: 1,
    total: 0,
    query: "",
    entities: [],
});
const emit = defineEmits(["load:entity"]);

let entities = computed(() => {
    let offset = (data.currentPage - 1) * data.pageSize;
    let entities;
    if (data.query) {
        entities = [...cm.value.getEntities({ query: data.query, limit: data.pageSize })];
    } else {
        entities = [...cm.value.getEntities()];
    }
    entities = compact(entities);
    data.total = entities.length;
    return entities.slice(offset, offset + data.pageSize);
});

function changePage(page) {
    data.currentPage = page;
}

function filterConnections(query) {
    data.currentPage = 1;
    data.query = query;
}

function loadEntity(entity) {
    emit("load:entity", entity);
}
</script>
