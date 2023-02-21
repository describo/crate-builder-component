<template>
    <div class="flex flex-col">
        <div class="flex flex-row">
            <div class="flex-grow">
                <el-input
                    v-model="data.filter"
                    placeholder="Filter the entities"
                    clearable
                    @change="filterAndChunkEntitiesForDisplay"
                    @blur="filterAndChunkEntitiesForDisplay"
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
            <div
                v-for="(instance, idx) of entities"
                :key="instance.propertyId"
                class="flex flex-row m-1"
            >
                <RenderLinkedItemComponent
                    :index="idx"
                    :crate-manager="props.crateManager"
                    :entity="instance"
                    @load:entity="loadEntity"
                    @save:property="saveProperty"
                    @delete:property="deleteProperty"
                />
            </div>
            <div class="text-4xl ml-2 pt-5 text-blue-500" v-if="data.total > data.pageSize">
                <i class="fa-solid fa-ellipsis"></i>
            </div>
        </div>
    </div>
</template>

<script setup>
import RenderLinkedItemComponent from "./RenderLinkedItem.component.vue";

import { reactive, computed } from "vue";
const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    entities: {
        type: Array,
        required: true,
    },
});
const $emit = defineEmits(["load:entity", "save:property", "delete:property"]);

const data = reactive({
    filter: undefined,
    total: props.entities.length,
    pageSize: 50,
    currentPage: 1,
    entities: [],
});

let entities = computed(() => {
    let offset = (data.currentPage - 1) * data.pageSize;
    if (data.filter) {
        const re = new RegExp(data.filter, "i");
        let entities = props.entities.filter(
            (e) => e.tgtEntity.name.match(re) || e.tgtEntity["@id"].match(re)
        );
        data.total = entities.length;
        return entities.slice(offset, offset + data.pageSize);
    } else {
        data.total = props.entities.length;
        return props.entities.slice(offset, offset + data.pageSize);
    }
});

function loadEntity(data) {
    console.debug("Paginate Linked Entities component: emit(load:entity)", data);
    $emit("load:entity", data);
}
function saveProperty(data) {
    console.debug("Paginate Linked Entities component: emit(save:property)", data);
    $emit("save:property", data);
}
function deleteProperty(data) {
    console.debug("Paginate Linked Entities component: emit(delete:property)", data);
    $emit("delete:property", data);
}
</script>
