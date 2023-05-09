<template>
    <div v-loading="data.loading">
        <!-- if the entity does NOT have geography -->
        <div
            v-if="!showMap"
            class="flex flex-row space-x-2"
            :class="{ 'p-2 hover:bg-slate-200 hover:rounded': data.resolvedEntities.length }"
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
                    @click="loadEntity(data.entity.tgtEntity.describoId)"
                    v-if="data.entity.tgtEntity"
                >
                    <div class="text-sm flex flex-row space-x-1">
                        <type-icon-component
                            class="text-gray-700"
                            :type="data.entity.tgtEntity['@type']"
                            v-if="data.entity.tgtEntity['@type']"
                        />
                        <div>{{ data.entity.tgtEntity["@type"] }}</div>
                    </div>
                    <div class="text-lg">
                        <span v-if="data.entity.tgtEntity.name">{{
                            data.entity.tgtEntity.name
                        }}</span>
                        <span v-else>{{ data.entity.tgtEntity["@id"] }}</span>
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

            <!-- if this is a complex entity, render the resolved entity links-->
            <div v-if="data.resolvedEntities.length" class="border-l pl-2 flex-col space-y-2">
                <div
                    v-for="instance of data.resolvedEntities"
                    @click="loadEntity(instance.entity.describoId)"
                    :key="instance.property"
                    class="bg-purple-200 rounded cursor-pointer hover:bg-cyan-200"
                >
                    <div class="flex flex-row space-x-2 rounded p-2">
                        <div class="">
                            {{ instance.property }}&nbsp;<i class="fa-solid fa-arrow-right"></i>
                        </div>
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
                                <span v-if="instance.entity.name">{{ instance.entity.name }}</span>
                                <span v-else>{{ instance.entity["@id"] }}</span>
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
import intersection from "lodash-es/intersection";
import isArray from "lodash-es/isArray";
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
    entity: { ...props.entity },
    editLocation: false,
    resolvedEntities: [],
});
let showMap = computed(() => (data.entity?.tgtEntity?.["@type"]?.match(/Geo/) ? true : false));
let type = "unlink";
resolveComplexEntities();

onMounted(() => {
    watch(
        () => props.crateManager.profile,
        () => {
            resolveComplexEntities();
        }
    );
});
function loadEntity(describoId) {
    data.loading = true;
    // console.debug("Renderer Linked Item Component : emit(load:entity)", props.entity.tgtEntityId);
    emit("load:entity", { describoId });
    setTimeout(() => {
        data.loading = false;
    }, 500);
}

/**
 * This method resolves the links from complex entities.
 *
 * If the primary entity being displayed has a type listed in the resolve section of a profile,
 *  then the properties defined in that resolves will be used to as entry points to find the
 *  entities linked from here.
 */
function resolveComplexEntities() {
    data.resolvedEntities = [];
    let profile = props.crateManager.profile;
    if (profile && profile?.resolve) {
        const typesToResolve = Object.keys(profile.resolve);
        const type = !isArray(data.entity.tgtEntity["@type"])
            ? [data.entity.tgtEntity["@type"]]
            : data.entity.tgtEntity["@type"];

        const specificTypesToResolve = intersection(typesToResolve, type);
        for (let type of specificTypesToResolve) {
            const propertiesToResolve = profile.resolve[type];
            let complexEntity = props.crateManager.getEntity({
                describoId: data.entity.tgtEntity.describoId,
            });

            for (let resolveEntityProperty of complexEntity.properties) {
                if (propertiesToResolve.includes(resolveEntityProperty.property)) {
                    if (resolveEntityProperty.tgtEntityId) {
                        let resolvedEntity = props.crateManager.getEntity({
                            describoId: resolveEntityProperty.tgtEntityId,
                            loadEntityProperties: false,
                        });
                        data.resolvedEntities.push({
                            property: resolveEntityProperty.property,
                            entity: resolvedEntity,
                        });
                    }
                }
            }
        }
    }
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
