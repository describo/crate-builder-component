<template>
    <div class="flex flex-col">
        <div class="flex flex-row" v-if="data.total > data.pageSize">
            <div class="flex-grow">
                <el-input
                    :key="configuration.language"
                    v-model="data.filter"
                    :placeholder="$t('filter_the_entities')"
                    clearable
                    @input="filterAndChunkEntitiesForDisplay"
                />
            </div>
            <el-pagination
                layout="prev, pager, next, total"
                :page-size="data.pageSize"
                :total="data.total"
                v-model:current-page="data.currentPage"
                @current-change="filterAndChunkEntitiesForDisplay"
            />
        </div>
        <div class="flex flex-row flex-wrap mt-2">
            <div v-for="instance of data.entities" :key="instance.idx">
                <RenderLinkedItemComponent
                    class="m-1"
                    :key="instance.tgtEntity['@id']"
                    :crate-manager="props.crateManager"
                    :entity="instance"
                    :property="props.property"
                    @load:entity="loadEntity"
                    @unlink:entity="unlinkEntity"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElInput, ElPagination } from "element-plus";
import RenderLinkedItemComponent from "./RenderLinkedItem.component.vue";
import { reactive, watch, inject } from "vue";
import { $t } from "../i18n";
import { configurationKey } from "./keys";
const configuration = inject(configurationKey);

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    entities: {
        type: Array,
        required: true,
    },
    property: {
        type: String,
        required: true,
    },
});
const $emit = defineEmits(["load:entity", "unlink:entity"]);

const data = reactive({
    filter: undefined,
    total: props.entities.length,
    pageSize: 10,
    currentPage: 1,
    entities: [],
});
watch(
    () => props.entities,
    () => {
        filterAndChunkEntitiesForDisplay();
    }
);

filterAndChunkEntitiesForDisplay();

function filterAndChunkEntitiesForDisplay() {
    let offset = (data.currentPage - 1) * data.pageSize;
    if (data.filter) {
        const re = new RegExp(data.filter, "i");
        let entities = props.entities.filter(
            (e) => e.tgtEntity.name.match(re) || e.tgtEntity["@id"].match(re)
        );
        data.total = entities.length;
        data.entities = entities.slice(offset, offset + data.pageSize);
    } else {
        data.total = props.entities.length;
        data.entities = props.entities.slice(offset, offset + data.pageSize);
    }
}

function loadEntity(data) {
    // console.debug("Paginate Linked Entities component: emit(load:entity)", data);
    $emit("load:entity", data);
}
function unlinkEntity(data) {
    // console.debug("Paginate Linked Entities component: emit(delete:property)", data);
    $emit("unlink:entity", data);
}
</script>
