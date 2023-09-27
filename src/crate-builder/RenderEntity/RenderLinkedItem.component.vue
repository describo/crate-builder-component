<template>
    <div
        class="describo-render-item-link py-2 rounded bg-blue-200 hover:text-black hover:bg-blue-300 hover:rounded-r-none"
    >
        <!-- if the entity does NOT have geography -->
        <div
            v-if="!showMap"
            class="flex flex-col m-2"
            :class="{ 'm-2': entity?.tgtEntity?.associations.length }"
        >
            <!--render the linking element  -->
            <div class="flex flex-row">
                <RenderItemLinkComponent :entity="entity.tgtEntity" @load:entity="loadEntity" />
                <UnlinkEntityComponent
                    v-if="!configuration.readonly && !props.readonly"
                    :entity="entity.tgtEntity"
                    @unlink:entity="unlinkEntity"
                />
            </div>
            <!-- if this target has associations, render them -->
            <div
                v-if="entity?.tgtEntity?.associations.length"
                class="mt-2 flex-col space-y-2 border-l-2 pl-1 border-solid border-slate-700"
            >
                <div
                    v-for="instance of entity.tgtEntity.associations"
                    @click="loadEntity({ id: instance.entity['@id'] })"
                    :key="instance.entity['@id']"
                    class="cursor-pointer"
                >
                    <div class="flex flex-row text-base border-solid border-black">
                        <div class="bg-slate-700 w-3 h-3 rounded-lg -4 mt-4"></div>
                        <div class="bg-slate-700 w-6 h-1 mt-5 -mx-1"></div>
                        <div
                            class="bg-purple-200 hover:bg-cyan-200 flex flex-row p-2 rounded space-x-2"
                        >
                            <div class="">
                                {{ instance.property }}
                            </div>
                            <div><i class="fa-solid fa-arrow-right"></i></div>
                            <div class="flex flex-row space-x-1">
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
            <div class="flex flex-row space-x-2">
                <div class="flex flex-col">
                    <div>
                        {{ props.entity.tgtEntity.name }}
                    </div>
                    <map-component
                        :crate-manager="props.crateManager"
                        :entity="props.entity.tgtEntity"
                    />
                </div>
                <UnlinkEntityComponent
                    v-if="!configuration.readonly && !props.readonly"
                    :entity="props.entity.tgtEntity"
                    @unlink:entity="unlinkEntity"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import RenderItemLinkComponent from "./RenderItemLink.component.vue";
import UnlinkEntityComponent from "./UnlinkEntity.component.vue";
import MapComponent from "../primitives/Map.component.vue";
import { computed, inject } from "vue";
import { configurationKey } from "./keys.js";
const configuration = inject(configurationKey);

const $emit = defineEmits(["load:entity", "unlink:entity"]);
const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    entity: {
        type: Object,
        required: true,
    },
    property: {
        type: String,
        required: true,
    },
    readonly: {
        required: true,
    },
});
let showMap = computed(() => {
    return props.entity?.tgtEntity?.["@type"].join(", ").match(/Geo/) ? true : false;
});
let entity = computed(() => {
    return props.entity;
});

function loadEntity(entity) {
    $emit("load:entity", entity);
}
function unlinkEntity({ entity }) {
    $emit("unlink:entity", { property: props.property, tgtEntityId: entity["@id"] });
}
</script>
