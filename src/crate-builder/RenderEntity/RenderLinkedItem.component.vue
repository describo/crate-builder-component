<template>
    <div>
        <div
            v-if="!showMap"
            class="flex flex-row"
            :class="{
                'bg-yellow-200 hover:bg-cyan-200': !configuration.readonly,
                'bg-blue-200 hover:bg-yellow-300 rounded': configuration.readonly,
            }"
        >
            <div
                class="flex flex-col p-3 cursor-pointer rounded-l"
                @click="loadEntity"
                v-if="!showMap"
            >
                <div class="text-sm flex flex-row space-x-1">
                    <type-icon-component
                        class="mr-2 text-gray-700"
                        :type="data.entity['@type']"
                        v-if="data.entity['@type']"
                    />
                    <div>{{ data.entity["@type"] }}:</div>
                    <span v-if="data.entity.name">{{ data.entity.name }}</span>
                    <span v-else>{{ data.entity["@id"] }}</span>
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
        <div v-if="showMap">
            <div class="flex flex-row" v-if="!data.editLocation">
                <div class="flex flex-col">
                    <div class="bg-blue-200 p-2 cursor-pointer">
                        {{ data.entity.name }}
                    </div>
                    <map-component :crate-manager="props.crateManager" :entity="data.entity" />
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
                    :entity="data.entity"
                    mode="feature"
                    @save:property="saveProperty"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import GeoComponent from "../base-components/Geo.component.vue";
import TypeIconComponent from "./TypeIcon.component.vue";
import DeletePropertyComponent from "./DeleteProperty.component.vue";
import MapComponent from "../base-components/Map.component.vue";
import { computed, reactive, onMounted, inject } from "vue";
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
    entity: {},
    editLocation: false,
});
let showMap = computed(() => (data.entity?.["@type"]?.match("Geo") ? true : false));
let type = "unlink";

onMounted(() => {
    loadEntityData();
});

async function loadEntityData() {
    await new Promise((resolve) => setTimeout(resolve, props.index * 4));
    let entity = props.crateManager.getEntity({ describoId: props.entity.tgtEntityId });
    data.entity = { ...entity };
}
function loadEntity() {
    console.debug("Renderer Linked Item Component : emit(load:entity)", props.entity.tgtEntityId);
    emit("load:entity", { describoId: props.entity.tgtEntityId });
}
function editLocation() {
    data.editLocation = true;
}
function saveProperty(property) {
    console.debug("Renderer Linked Item Component : emit(save:property)", property);
    emit("save:property", property);
    data.editLocation = false;
    console.debug("data.editLocation", data.editLocation);
    loadEntityData();
}
function deleteProperty(target) {
    console.debug("Renderer Linked Item Component : emit(delete:property)", target);
    emit("delete:property", target);
}
</script>
