<template>
    <div class="w-full p-2">
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
                    @input="filterConnections"
                    :placeholder="$t('search_for_connection')"
                ></el-input>
            </div>
            <div v-for="entity of connections" :key="entity.describoId">
                <RenderItemLinkComponent
                    :entity="entity"
                    @load:entity="loadEntity"
                    class="describo-render-item-link p-2 rounded bg-blue-200 hover:text-black hover:bg-blue-300"
                />
            </div>
        </div>
        <pre>

        {{ props.connections }}
       </pre
        >
    </div>
</template>

<script setup>
import { ElPagination, ElInput } from "element-plus";
import RenderItemLinkComponent from "./RenderItemLink.component.vue";
import { computed, reactive, onMounted, inject } from "vue";
import isPlainObject from "lodash-es/isPlainObject.js";
import uniqBy from "lodash-es/uniqBy.js";
import { $t } from "../i18n";
import { crateManagerKey } from "./keys.js";
const cm = inject(crateManagerKey);

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
const data = reactive({
    visible: false,
    filterInputModel: "",
    pageSize: 10,
    currentPage: 1,
    total: 0,
    query: "",
    entities: [],
});
const $emit = defineEmits(["load:entity"]);

onMounted(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    await resolveConnections();
});

let connections = computed(() => {
    let offset = (data.currentPage - 1) * data.pageSize;
    const re = new RegExp(data.query, "i");
    let entities = data.entities.filter((entity) => {
        if (
            entity["@id"].match(re) ||
            entity["@type"].join(", ").match(re) ||
            entity.name.match(re)
        ) {
            return entity;
        }
    });

    data.total = entities.length;
    return entities.slice(offset, offset + data.pageSize);
});

async function resolveConnections() {
    if (isPlainObject(props.entity)) {
        let entities = [];
        for (let property of Object.keys(props.entity["@reverse"])) {
            entities = [...entities, ...props.entity["@reverse"][property]];
        }
        entities = entities.map((entity) => cm.value.getEntity({ id: entity["@id"], stub: true }));

        const re = new RegExp(data.query, "i");
        entities = entities.filter((entity) => {
            if (!entity) return null;
            return entity["@id"].match(re) || entity["@type"].match(re) || entity.name.match(re);
        });
        entities = uniqBy(entities, "@id");
        data.visible = entities.length > 0;
        data.total = entities.length;
        data.entities = entities;
    }
}

function loadEntity(data) {
    $emit("load:entity", data);
    setTimeout(() => {
        resolveConnections();
    }, 200);
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
