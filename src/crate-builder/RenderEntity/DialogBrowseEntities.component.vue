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
                    @change="filterConnections"
                    :placeholder="$t('search_for_connection')"
                ></el-input>
            </div>
            <div v-for="entity of entities" :key="entity.describoId">
                <div
                    class="flex flex-row rounded active:bg-yellow-500 cursor-pointer"
                    :class="{
                        'bg-yellow-200 hover:bg-cyan-200': !configuration.readonly,
                        'bg-blue-200 hover:bg-yellow-300': configuration.readonly,
                    }"
                    @click="loadEntity(entity.describoId)"
                >
                    <div class="flex flex-col p-3">
                        <div class="text-sm flex flex-row space-x-1">
                            <type-icon-component
                                class="text-gray-700"
                                :type="entity['@type']"
                                v-if="entity['@type']"
                            />
                            <div>{{ entity["@type"] }}</div>
                            <div class="text-sm">({{ entity["@id"] }})</div>
                        </div>
                        <div class="text-base mt-2">
                            <span v-if="entity.name">{{ entity.name }}</span>
                            <span v-else>{{ entity["@id"] }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElInput, ElPagination } from "element-plus";
import { reactive, computed, inject } from "vue";
import TypeIconComponent from "./TypeIcon.component.vue";
import { $t } from "../i18n";
import { configurationKey } from "./keys.js";
const configuration = inject(configurationKey);

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
});
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
    if (data.query) {
        const re = new RegExp(data.query, "i");
        let entities = props.crateManager.em.entities.filter((entity) => {
            if (entity["@id"].match(re) || entity["@type"].match(re) || entity.name.match(re)) {
                return entity;
            }
        });
        data.total = entities.length;
        return entities.slice(offset, offset + data.pageSize);
    } else {
        data.total = props.crateManager.em.entities.length;
        return props.crateManager.em.entities.slice(offset, offset + data.pageSize);
    }
});

function changePage(page) {
    data.currentPage = page;
}

function filterConnections(query) {
    data.currentPage = 1;
    data.query = query;
}

function loadEntity(describoId) {
    emit("load:entity", { describoId });
}
</script>
