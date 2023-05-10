<template>
    <div v-loading="data.loading">
        <!-- if the entity does NOT have geography -->
        <div
            v-if="!showMap"
            class="flex flex-row space-x-2 m-1"
            :class="{ 'my-2 mx-3': entity.tgtEntity.associations.length }"
        >
            <!--render the linking element  -->
            <div
                class="flex flex-row rounded"
                :class="{
                    'bg-yellow-200 hover:bg-cyan-200': !configuration.readonly,
                    'bg-blue-200 hover:bg-yellow-300': configuration.readonly,
                }"
            >
                <div
                    class="flex flex-col p-3 cursor-pointer"
                    @click="loadEntity(entity.tgtEntity.describoId)"
                    v-if="entity.tgtEntity"
                >
                    <div class="text-sm flex flex-row space-x-1">
                        <type-icon-component
                            class="text-gray-700"
                            :type="entity.tgtEntity['@type']"
                            v-if="entity.tgtEntity['@type']"
                        />
                        <div>{{ entity.tgtEntity["@type"] }}</div>
                    </div>
                    <div class="text-base">
                        <span v-if="entity.tgtEntity.name">{{ entity.tgtEntity.name }}</span>
                        <span v-else>{{ entity.tgtEntity["@id"] }}</span>
                    </div>
                </div>
                <delete-property-component
                    v-if="!configuration.readonly"
                    class="cursor-pointer rounded-r p-2"
                    :type="type"
                    :property="props.entity"
                    @delete:property="deleteProperty"
                />
            </div>
            <!-- if this target has associations, render them -->
            <div
                v-if="entity.tgtEntity.associations && entity.tgtEntity.associations.length"
                class="flex-col space-y-2"
            >
                <div
                    v-for="instance of entity.tgtEntity.associations"
                    @click="loadEntity(instance.entity.describoId)"
                    :key="instance.property"
                    class="cursor-pointer"
                >
                    <div class="flex flex-row -mx-3">
                        <div class="bg-slate-700 w-3 h-3 rounded-lg mt-4"></div>
                        <div class="bg-slate-700 w-6 h-1 mt-5 -mx-1"></div>
                        <div
                            class="bg-purple-200 hover:bg-cyan-200 flex flex-row p-2 rounded space-x-2"
                        >
                            <div class="">
                                {{ instance.property }}
                            </div>
                            <div><i class="fa-solid fa-arrow-right"></i></div>
                            <div class="flex flex-row space-x-2">
                                <div class="flex flex-row space-x-1">
                                    <type-icon-component
                                        class="text-gray-700"
                                        :type="instance.entity['@type']"
                                        v-if="instance.entity['@type']"
                                    />
                                    <div>{{ instance.entity["@type"] }}:</div>
                                </div>
                                <div class="">
                                    <span v-if="instance.entity.name">{{
                                        instance.entity.name
                                    }}</span>
                                    <span v-else>{{ instance.entity["@id"] }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- if the entity has geography then show the map -->
        <div v-if="showMap">
            <div class="flex flex-row" v-if="!data.editLocation">
                <div class="flex flex-col">
                    <div class="bg-blue-200 p-2 cursor-pointer">
                        {{ data.entity.tgtEntity.name }}
                    </div>
                    <map-component
                        :crate-manager="props.crateManager"
                        :entity="data.entity.tgtEntity"
                    />
                </div>
                <div
                    class="flex flex-col space-y-6 bg-yellow-200 cursor-pointer rounded-r p-2"
                    v-if="!configuration.readonly"
                >
                    <delete-property-component
                        :type="type"
                        :property="props.entity"
                        @delete:property="deleteProperty"
                    />
                    <div>
                        <el-button type="primary" @click="editLocation" class="inline-block">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </el-button>
                    </div>
                </div>
            </div>
            <div v-if="data.editLocation">
                <geo-component
                    class="bg-blue-200"
                    :crate-manager="props.crateManager"
                    :property="data.entity.property"
                    :entity="data.entity.tgtEntity"
                    mode="feature"
                    @save:property="saveProperty"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElButton, vLoading } from "element-plus";
import GeoComponent from "../primitives/Geo.component.vue";
import TypeIconComponent from "./TypeIcon.component.vue";
import DeletePropertyComponent from "./DeleteProperty.component.vue";
import MapComponent from "../primitives/Map.component.vue";
import { computed, reactive, inject, watch, onMounted } from "vue";
const configuration = inject("configuration");

const emit = defineEmits(["load:entity", "create:property", "save:property", "delete:property"]);
const props = defineProps({
    index: {
        type: Number,
        required: true,
    },
    crateManager: {
        type: Object,
        required: true,
    },
    entity: {
        type: Object,
        required: true,
    },
});
const data = reactive({
    loading: false,
    editLocation: false,
    resolvedEntities: [],
});
let showMap = computed(() => (data.entity?.tgtEntity?.["@type"]?.match(/Geo/) ? true : false));
let entity = computed(() => props.entity);
let type = "unlink";

function loadEntity(describoId) {
    data.loading = true;
    // console.debug("Renderer Linked Item Component : emit(load:entity)", props.entity.tgtEntityId);
    emit("load:entity", { describoId });
    setTimeout(() => {
        data.loading = false;
    }, 500);
}
function editLocation() {
    data.editLocation = true;
}
function saveProperty(property) {
    // console.debug("Renderer Linked Item Component : emit(save:property)", property);
    emit("save:property", property);
    data.editLocation = false;
    // console.debug("data.editLocation", data.editLocation);
}
function deleteProperty(target) {
    data.loading = true;
    // console.debug("Renderer Linked Item Component : emit(delete:property)", target);
    setTimeout(() => emit("delete:property", target), 200);
}
</script>
