<template>
    <div class="flex flex-col">
        <!-- <pre>{{ data.entity }}</pre> -->
        <div v-if="data.entity.describoId">
            <!-- render controls -->
            <render-controls-component
                :crate-manager="props.crateManager"
                :entity="data.entity"
                @load:entity="loadEntity"
                @add:property:placeholder="addPropertyPlaceholder"
                @delete:entity="deleteEntity"
                @save:crate:template="saveCrateAsTemplate"
                @save:entity:template="saveEntityAsTemplate"
                @update:context="updateContext"
            />

            <!-- render entity id -->
            <render-entity-id-component
                class="my-2"
                :class="{
                    'bg-green-200 rounded p-1 my-1': data.savedProperty === '@id',
                }"
                :entity="data.entity"
                @update:entity="updateEntity"
            />

            <!-- render entity type -->
            <render-entity-type-component :entity="data.entity" class="my-2" />

            <!-- render entity name -->
            <render-entity-name-component
                class="my-2"
                :class="{
                    'bg-green-200 rounded p-1 my-1': data.savedProperty === 'name',
                }"
                :entity="data.entity"
                @update:entity="updateEntity"
            />

            <!-- render entity properties -->
            <div v-for="(values, property) of data.entity.properties" :key="property">
                <div
                    v-if="showProperty(property)"
                    :class="{
                        'bg-green-200 rounded p-1 my-1': data.savedProperty === property,
                    }"
                >
                    <render-entity-property-component
                        class="my-2"
                        :crate-manager="props.crateManager"
                        :entity="props.entity"
                        :property="property"
                        :values="values"
                        @load:entity="loadEntity"
                        @create:property="createProperty"
                        @save:property="saveProperty"
                        @delete:property="deleteProperty"
                        @create:entity="createEntity"
                        @link:entity="linkEntity"
                        @add:template="addTemplate"
                    />
                </div>
            </div>

            <!--render entities it links to  -->
            <div class="flex flex-row space-x-2 flex-wrap">
                <div v-for="(entities, property) of data.entity.reverseConnections" :key="property">
                    <div v-for="entity of entities" :key="entity.tgtEntityId">
                        <render-entity-reverse-item-link-component
                            :crate-manager="props.crateManager"
                            :property="property"
                            :entity="entity"
                            @load:entity="loadEntity"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="data.tabs.length">
            <!-- grouped profile -->
            <div class="flex flex-col flex-grow" v-if="data.tabs.length">
                <!-- render controls -->
                <render-controls-component
                    :crate-manager="props.crateManager"
                    :entity="data.tabs[0].entity"
                    @load:entity="loadEntity"
                    @add:property:placeholder="addPropertyPlaceholder"
                    @delete:entity="deleteEntity"
                    @save:crate:template="saveCrateAsTemplate"
                    @save:entity:template="saveEntityAsTemplate"
                    @update:context="updateContext"
                />
                <el-tabs tab-position="left" v-model="data.activeTab">
                    <el-tab-pane label="About" name="about">
                        <template #label>
                            <span class="cursor-pointerspace text-gray-600 text-lg"> About </span>
                        </template>

                        <!-- render entity id -->
                        <render-entity-id-component
                            class="my-2"
                            :class="{
                                'bg-green-200 rounded p-1 my-1': data.savedProperty === '@id',
                            }"
                            :entity="data.tabs[0].entity"
                            @update:entity="updateEntity"
                        />

                        <!-- render entity type -->
                        <render-entity-type-component class="my-2" :entity="data.tabs[0].entity" />

                        <!-- render entity name -->
                        <render-entity-name-component
                            class="my-2"
                            :class="{
                                'bg-green-200 rounded p-1 my-1': data.savedProperty === 'name',
                            }"
                            :entity="data.tabs[0].entity"
                            @save:property="saveProperty"
                            @update:entity="updateEntity"
                        />

                        <!--render entities it links to  -->
                        <div class="flex flex-row space-x-2 flex-wrap">
                            <div
                                v-for="(entities, property) of data.entity.reverseConnections"
                                :key="property"
                            >
                                <div v-for="entity of entities" :key="entity.tgtEntityId">
                                    <render-entity-reverse-item-link-component
                                        :crate-manager="props.crateManager"
                                        :property="property"
                                        :entity="entity"
                                        @load:entity="loadEntity"
                                    />
                                </div>
                            </div>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane
                        :label="tab.name"
                        :name="tab.name"
                        v-for="(tab, idx) of data.tabs.slice(1)"
                        :key="idx"
                    >
                        <template #label>
                            <span class="cursor-pointer text-gray-600 text-lg">{{ tab.name }}</span>
                        </template>
                        <!-- render entity properties -->
                        <div v-for="(values, property) of tab.entity.properties" :key="property">
                            <div
                                v-if="showProperty(property)"
                                :class="{
                                    'bg-green-200 rounded p-1 my-1':
                                        data.savedProperty === property,
                                }"
                            >
                                <render-entity-property-component
                                    class="my-2"
                                    :crate-manager="props.crateManager"
                                    :entity="tab.entity"
                                    :property="property"
                                    :values="values"
                                    @load:entity="loadEntity"
                                    @create:property="createProperty"
                                    @save:property="saveProperty"
                                    @delete:property="deleteProperty"
                                    @create:entity="createEntity"
                                    @link:entity="linkEntity"
                                    @add:template="addTemplate"
                                />
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>
        </div>
    </div>
</template>

<script setup>
import GeoComponent from "../base-components/Geo.component.vue";
import RenderEntityIdComponent from "./RenderEntityId.component.vue";
import RenderEntityTypeComponent from "./RenderEntityType.component.vue";
import RenderEntityNameComponent from "./RenderEntityName.component.vue";
import RenderEntityPropertyComponent from "./RenderEntityProperty.component.vue";
import RenderEntityReverseItemLinkComponent from "./RenderReverseItemLink.component.vue";
import RenderControlsComponent from "./RenderControls.component.vue";
import { reactive, onMounted, watch } from "vue";
import { debounce, cloneDeep, flattenDeep } from "lodash";
import { ProfileManager } from "../profile-manager.js";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    entity: {
        type: Object,
        required: true,
    },
    mode: {
        type: String,
        required: true,
    },
});

const data = reactive({
    hideProperty: ["describoId"],
    classDefinition: undefined,
    entity: {},
    activeTab: "about",
    tabs: [],
    debouncedInit: debounce(init, 400),
    extraProperties: [],
    savedProperty: undefined,
    savedPropertyTimeout: 1000,
});

const emit = defineEmits([
    "load:entity",
    "save:crate",
    "save:crate:template",
    "save:entity:template",
]);

watch(
    () => props.entity,
    () => {
        data.extraProperties = [];
        data.entity = {};
        data.debouncedInit();
    }
);
onMounted(() => {
    data.debouncedInit();
});

function init() {
    const profileManager = new ProfileManager({ profile: props.crateManager.profile });

    let entity = {
        ...props.entity,
        properties: props.crateManager.getEntityProperties({
            describoId: props.entity.describoId,
            grouped: true,
        }),
        reverseConnections: props.crateManager.getEntityReverseConnections({
            describoId: props.entity.describoId,
            grouped: true,
        }),
    };

    const typeDefinition = profileManager.getTypeDefinition({
        type: entity["@type"],
        profile: props.crateManager.profile,
    });

    typeDefinition?.inputs.forEach((input) => {
        if (input.name === "name") return;
        if (entity.properties[input.name]) {
            entity.properties[input.name] = entity.properties[input.name];
        } else {
            entity.properties[input.name] = [];
        }
    });
    if (data.extraProperties.length) {
        data.extraProperties.forEach((property) => {
            if (!entity.properties[property]) entity.properties[property] = [];
        });
    }
    let properties = {};
    let propertyNames = [];
    Object.keys(entity.properties).map((k) => (propertyNames[k.toLowerCase()] = k));
    Object.keys(entity.properties)
        .map((k) => k.toLowerCase())
        .sort()
        .forEach((k) => (properties[propertyNames[k]] = entity.properties[propertyNames[k]]));
    entity.properties = properties;

    const { layouts, hide } = profileManager.getLayout({
        type: entity["@type"],
        profile: props.crateManager.profile,
    });
    let layout = applyLayout({ layouts, hide, entity });
    if (layout.entity) {
        data.entity = { ...entity, ...layout.entity };
    } else if (layout.tabs) {
        data.tabs = cloneDeep(layout.tabs);
    }
}
function applyLayout({ layouts, hide = [], entity }) {
    if (!layouts?.length) return { entity };

    let tabs = [];
    tabs.push({ name: "About", entity: cloneDeep(entity) });

    let mappedInputs = [];
    layouts.forEach((section) => {
        let sectionEntity = cloneDeep(entity);
        sectionEntity.properties = {};
        tabs.push({
            name: section.name,
            description: section?.description,
            entity: sectionEntity,
        });
        section.inputs.forEach((input) => {
            let property = Object.keys(entity.properties).filter((property) => property === input);
            if (property.length && !hide.includes(input)) {
                mappedInputs.push(input);
                sectionEntity.properties[input] = entity.properties[input];
            }
        });
    });

    let unmappedInputs = Object.keys(entity.properties).filter((p) => !mappedInputs.includes(p));
    if (unmappedInputs.length) {
        let sectionEntity = cloneDeep(entity);
        sectionEntity.properties = {};
        unmappedInputs.forEach((p) => {
            if (!hide.includes(p)) {
                sectionEntity.properties[p] = entity.properties[p];
            }
        });
        tabs.push({ name: "...", description: "", entity: sectionEntity });
    }

    return { tabs };
}
function updateEntityId(data) {}
function addPropertyPlaceholder({ property }) {
    data.extraProperties.push(property);
    init();
}
function showProperty(property) {
    return !data.hideProperty.includes(property);
}
function loadEntity(data) {
    emit("load:entity", data);
}
function saveCrate() {
    emit("save:crate");
}
function createProperty(patch) {
    console.debug("Render Entity component: emit(create:property)", patch);
    if (props.mode === "embedded") {
        props.crateManager.addProperty({ ...patch });
        saveCrate();
        data.savedProperty = patch.property;
        setTimeout(() => (data.savedProperty = undefined), data.savedPropertyTimeout);
    } else {
    }
    init();
}
function saveProperty(patch) {
    console.debug("Render Entity component: emit(save:property)", patch);
    if (props.mode === "embedded") {
        props.crateManager.updateProperty({ ...patch });
        saveCrate();
        data.savedProperty = patch.property;
        setTimeout(() => (data.savedProperty = undefined), data.savedPropertyTimeout);
    } else {
    }
    init();
}
function deleteProperty(data) {
    console.debug("Render Entity component: emit(delete:property)", data);
    if (props.mode === "embedded") {
        props.crateManager.deleteProperty({ propertyId: data.propertyId });
        saveCrate();
    } else {
    }
    init();
}
function createEntity(data) {
    const property = data.property;
    delete data.property;
    console.debug("Render Entity component: emit(create:entity)", data);
    if (props.mode === "embedded") {
        let entity = props.crateManager.addEntity({ entity: data });
        props.crateManager.linkEntity({ property, tgtEntityId: entity.describoId });
        saveCrate();
    } else {
    }
    init();
}
function updateEntity(patch) {
    console.debug("Render Entity component: emit(update:entity)", patch);
    props.crateManager.updateEntity({ ...patch });
    if (props.mode === "embedded") {
        saveCrate();
        data.savedProperty = patch.property;
        setTimeout(() => (data.savedProperty = undefined), data.savedPropertyTimeout);
    } else {
    }
    init();
}
function linkEntity(data) {
    console.debug("Render Entity component: emit(link:entity)", data);
    if (props.mode === "embedded") {
        props.crateManager.linkEntity({ property: data.property, tgtEntityId: data.describoId });
        saveCrate();
    } else {
    }
    init();
}
function deleteEntity(data) {
    console.debug("Render Entity component: emit(delete:entity)", data);
    props.crateManager.deleteEntity(data);
    emit("load:entity", { name: "RootDataset" });
}
function saveCrateAsTemplate(data) {
    console.debug("Render Entity component: emit(save:crate:template)", data);
    emit("save:crate:template", data);
}
function saveEntityAsTemplate() {
    console.debug("Render Entity component: emit(save:entity:template)");
    emit("save:entity:template");
}
function updateContext(data) {
    props.crateManager.context = data;
}
function addTemplate() {}
</script>
