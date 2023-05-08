<template>
    <div class="w-full p-2 border border-solid bg-gray-200 rounded">
        <div class="flex flex-row">
            <div class="text-lg">Links to this entity:</div>
            <div class="flex-grow"></div>
        </div>
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
                    placeholder="Search for a connection"
                ></el-input>
            </div>
            <div v-for="entity of connections" :key="entity.describoId">
                <RenderReverseItemLinkComponent :entity="entity" @load:entity="loadEntity" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElPagination, ElInput } from "element-plus";
import RenderReverseItemLinkComponent from "./RenderReverseItemLink.component.vue";
import { computed, reactive } from "vue";
import isPlainObject from "lodash-es/isPlainObject";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    connections: {
        required: true,
    },
});
const data = reactive({
    visible: false,
    collapse: false,
    filterInputModel: "",
    pageSize: 10,
    currentPage: 1,
    total: 0,
    query: "",
});
const $emit = defineEmits(["load:entity"]);

let connections = computed(() => {
    let offset = (data.currentPage - 1) * data.pageSize;
    if (isPlainObject(props.connections)) {
        let sources = {};
        for (let property of Object.keys(props.connections)) {
            let entities = props.connections[property];
            for (let e of entities) {
                e = props.crateManager.getEntity({
                    describoId: e.srcEntityId,
                    loadProperties: false,
                });
                if (!sources[e["@id"]]) {
                    sources[e["@id"]] = {
                        "@id": e["@id"],
                        "@type": e["@type"],
                        name: e.name,
                        describoId: e.describoId,
                        properties: [property],
                    };
                } else {
                    sources[e["@id"]].properties.push(property);
                }
            }
        }

        let entities = [];
        const re = new RegExp(data.query, "i");
        for (let entityId of Object.keys(sources)) {
            const entity = sources[entityId];
            if (entity["@id"].match(re) || entity["@type"].match(re) || entity.name.match(re)) {
                entities.push({
                    ...sources[entityId],
                });
            }
        }
        data.visible = entities.length > 0;
        data.total = entities.length;
        return entities.slice(offset, offset + data.pageSize);
    }
});

function loadEntity(data) {
    $emit("load:entity", data);
}

function changePage(page) {
    data.currentPage = page;
}

function filterConnections(query) {
    data.currentPage = 1;
    data.query = query;
}
</script>

<style>
.style-panel {
    width: 500px;
}
</style>
