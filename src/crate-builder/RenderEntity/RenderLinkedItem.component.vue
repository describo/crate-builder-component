<template>
    <div>
        <!-- if the entity does NOT have geography -->
        <div
            v-if="!showMap"
            class="flex flex-row space-x-2 m-1"
            :class="{ 'my-2 mx-3': entity.tgtEntity.associations.length }"
        >
            <!--render the linking element  -->
            <div class="flex flex-row rounded bg-blue-200 describo-render-item-link">
                <RenderItemLinkComponent
                    :entity="entity.tgtEntity"
                    @load:entity="loadEntity(entity.tgtEntity.describoId)"
                />
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
                    <div class="flex flex-row -mx-3 text-base">
                        <div class="bg-slate-700 w-3 h-3 rounded-lg mt-4"></div>
                        <div class="bg-slate-700 w-6 h-1 mt-5 -mx-1"></div>
                        <div
                            class="bg-purple-200 hover:bg-cyan-200 flex flex-row p-2 rounded space-x-2"
                        >
                            <div class="">
                                {{ instance.property }}
                            </div>
                            <div><i class="fa-solid fa-arrow-right"></i></div>
                            <div class="flex flex-row space-x-1">
                                <!-- <div>{{ instance.entity["@type"].join(", ") }}:</div> -->
                                <div>
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
            <div class="flex flex-row">
                <div class="flex flex-col">
                    <div class="bg-blue-200 p-2 cursor-pointer">
                        {{ props.entity.tgtEntity.name }}
                    </div>
                    <map-component
                        :crate-manager="props.crateManager"
                        :entity="props.entity.tgtEntity"
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
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import RenderItemLinkComponent from "./RenderItemLink.component.vue";
import DeletePropertyComponent from "./DeleteProperty.component.vue";
import MapComponent from "../primitives/Map.component.vue";
import { computed, inject } from "vue";
import { configurationKey } from "./keys.js";
const configuration = inject(configurationKey);

const emit = defineEmits(["load:entity", "create:property", "save:property", "delete:property"]);
const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    entity: {
        type: Object,
        required: true,
    },
});
let showMap = computed(() => {
    return props.entity?.tgtEntity?.["@type"].join(", ").match(/Geo/) ? true : false;
});
let entity = computed(() => {
    return props.entity;
});
let type = "unlink";

function loadEntity(describoId) {
    // console.debug("Renderer Linked Item Component : emit(load:entity)", props.entity.tgtEntityId);
    emit("load:entity", { describoId });
}
function deleteProperty(target) {
    // console.debug("Renderer Linked Item Component : emit(delete:property)", target);
    emit("delete:property", target);
}
</script>
