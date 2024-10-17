<template>
    <div class="flex flex-col">
        <div class="flex flex-row space-x-2 items-center">
            <div class="flex-grow">
                <el-input
                    :key="state.configuration.language"
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
            <div v-for="instance of entities" :key="instance.idx">
                <RenderLinkedItemComponent
                    class="m-1"
                    :key="instance.value['@id']"
                    :entity="instance.value"
                    :property="props.property"
                    :readonly="props.readonly"
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
import { reactive, shallowRef, watch } from "vue";
import { $t } from "../i18n";
import { useStateStore } from "../store.js";
const state = useStateStore();

const props = defineProps({
    entities: {
        type: Array,
        required: true,
    },
    property: {
        type: String,
        required: true,
    },
    readonly: {
        required: true,
        default: false,
    },
});
const $emit = defineEmits(["load:entity", "unlink:entity"]);

const entities = shallowRef([]);
const currentState = state.editorState.latest();
const data = reactive({
    filter: undefined,
    total: props.entities.length,
    pageSize: 10,
    currentPage: currentState[props.property]?.paginator?.currentPage ?? 1,
});

watch(
    () => props.entities,
    () => {
        const currentState = state.editorState.latest();
        data.total = props.entities.length;
        data.currentPage = currentState[props.property]?.paginator?.currentPage ?? 1;
        filterAndChunkEntitiesForDisplay();
    }
);

filterAndChunkEntitiesForDisplay();

function filterAndChunkEntitiesForDisplay() {
    if (data.total < data.pageSize) {
        data.currentPage = 1;
    }
    let offset = (data.currentPage - 1) * data.pageSize;
    if (data.filter) {
        const re = new RegExp(data.filter, "i");
        let es = props.entities.filter(
            (e) => e.value?.name?.match(re) || e.value?.["@id"]?.match(re)
        );
        data.total = es.length;
        entities.value = es.slice(offset, offset + data.pageSize);
    } else {
        data.total = props.entities.length;
        entities.value = props.entities.slice(offset, offset + data.pageSize);
    }

    const currentState = state.editorState.latest();
    if (data.currentPage !== currentState[props.property]?.paginator?.currentPage) {
        currentState[props.property] = {
            paginator: {
                currentPage: data.currentPage,
            },
        };
        state.editorState.update(currentState);
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
