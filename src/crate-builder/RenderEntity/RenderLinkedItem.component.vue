<template>
    <div
        class="describo-render-item-link py-1 rounded bg-blue-200 hover:text-black hover:bg-blue-300 hover:rounded-r-none"
    >
        <!-- if the entity does NOT have geography -->
        <div
            v-if="!showMap"
            class="flex flex-col m-2"
            :class="{ 'm-2': entity?.associations?.length }"
        >
            <!--render the linking element  -->
            <div class="flex flex-row space-x-2 items-start">
                <RenderItemLinkComponent :entity="props.entity" @load:entity="loadEntity" />
                <UnlinkEntityComponent
                    v-if="!state.configuration.readonly && !props.readonly"
                    :entity="entity"
                    @unlink:entity="unlinkEntity"
                />
            </div>
            <!-- if this target has associations, render them -->
            <div
                v-if="associations?.length"
                class="mt-2 flex-col space-y-2 border-l-2 pl-1 border-solid border-slate-700"
            >
                <div
                    v-for="association of associations"
                    @click="loadEntity({ id: association['@id'] })"
                    :key="association['@id']"
                    class="cursor-pointer"
                >
                    <div class="flex flex-row text-base border-solid border-black">
                        <div class="bg-slate-700 w-3 h-3 rounded-lg -4 mt-4"></div>
                        <div class="bg-slate-700 w-6 h-1 mt-5 -mx-1"></div>
                        <div
                            class="bg-purple-200 hover:bg-cyan-200 flex flex-row p-2 rounded space-x-2"
                        >
                            <div class="">
                                {{ association.property }}
                            </div>
                            <div><FontAwesomeIcon :icon="faArrowRight"></FontAwesomeIcon></div>
                            <div class="flex flex-row space-x-1">
                                <div>
                                    <span v-if="association.name">{{ association.name }}</span>
                                    <span v-else>{{ association["@id"] }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- if the entity has geography then show the map -->
        <div v-if="showMap">
            <div class="flex flex-col space-y-2">
                <div class="flex flex-row p-2">
                    <div>
                        {{ props.entity.name }}
                    </div>
                    <div class="flex-grow"></div>

                    <UnlinkEntityComponent
                        v-if="!state.configuration.readonly && !props.readonly"
                        :entity="props.entity"
                        @unlink:entity="unlinkEntity"
                    />
                </div>
                <map-component :entity="props.entity" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import RenderItemLinkComponent from "./RenderItemLink.component.vue";
import UnlinkEntityComponent from "./UnlinkEntity.component.vue";
import MapComponent from "../primitives/Map.component.vue";
import { computed, inject, watch, ref } from "vue";
import { crateManagerKey, profileManagerKey } from "./keys.js";
const cm = inject(crateManagerKey);
const pm = inject(profileManagerKey);
import { useStateStore } from "../store.js";
const state = useStateStore();

const $emit = defineEmits(["load:entity", "unlink:entity"]);
const props = defineProps({
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
let associations = ref([]);
let showMap = computed(() => {
    return props.entity?.["@type"].join(", ").match(/Geo/) ? true : false;
});
resolveAssociations();

watch(
    () => pm.value.$key,
    () => {
        resolveAssociations();
    }
);

function resolveAssociations() {
    const profile = pm.value.profile;
    associations.value = cm.value.resolveLinkedEntityAssociations({
        entity: cm.value.getEntity({ id: props.entity["@id"] }),
        profile,
    });
}

function loadEntity(entity) {
    $emit("load:entity", entity);
}
function unlinkEntity({ entity }) {
    $emit("unlink:entity", { property: props.property, tgtEntityId: entity["@id"] });
}
</script>
