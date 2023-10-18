<template>
    <div class="flex flex-row">
        <div class="flex flex-col pr-4 w-full">
            <!-- render controls -->
            <render-controls-component
                v-if="!configuration.readonly && configuration.showControls"
                :crate-manager="props.crateManager"
                :entity="contextEntity"
                @load:entity="loadEntity"
                @add:property:placeholder="addPropertyPlaceholder"
                @delete:entity="deleteEntity"
                @save:entity:template="saveEntityAsTemplate"
                @update:context="updateContext"
            />

            <!-- <pre>{{ data.entity }}</pre> -->

            <!-- Untabbed layout  -->
            <div v-if="!data.renderTabs">
                <!-- render entity id -->
                <div class="flex flex-row space-x-2 my-2 p-2">
                    <render-entity-id-component
                        class="flex-grow"
                        :class="{
                            'bg-green-200 rounded p-1 my-1': data.savedProperty === '@id',
                        }"
                        :entity="contextEntity"
                        @update:entity="updateEntity"
                    />
                    <!-- highlight required properties -->
                    <div v-if="!configuration.readonly && data.missingRequiredData">
                        <el-button
                            type="danger"
                            @click="
                                data.highlightRequiredProperties = !data.highlightRequiredProperties
                            "
                        >
                            <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                        </el-button>
                    </div>
                </div>

                <!-- render entity type -->
                <render-entity-type-component
                    class="my-2 p-2"
                    :crate-manager="props.crateManager"
                    :entity="contextEntity"
                    @update:entity="updateEntity"
                />

                <!-- render entity name -->
                <render-entity-name-component
                    class="my-2 p-2"
                    :class="{
                        'bg-green-200 rounded p-1 my-1': data.savedProperty === 'name',
                    }"
                    :entity="contextEntity"
                    @update:entity="updateEntity"
                />

                <!-- render entity properties -->
                <div v-for="(values, property) of contextEntity['@properties']" :key="property">
                    <div>
                        <render-entity-property-component
                            :class="{
                                'hover:bg-sky-100':
                                    !configuration.readonly && data.savedProperty !== property,
                                'bg-green-200 hover:bg-green-200': data.savedProperty === property,
                            }"
                            class="my-2"
                            :crate-manager="props.crateManager"
                            :entity="contextEntity"
                            :property="property"
                            :values="values"
                            :highlight-required="data.highlightRequiredProperties"
                            @load:entity="loadEntity"
                            @create:entity="createEntity"
                            @link:entity="linkEntity"
                            @unlink:entity="unlinkEntity"
                            @create:property="createProperty"
                            @save:property="saveProperty"
                            @delete:property="deleteProperty"
                        />
                    </div>
                </div>
            </div>

            <!-- tabbed layout -->
            <el-tabs
                :tab-position="configuration.tabLocation"
                v-model="data.activeTab"
                v-if="data.renderTabs"
            >
                <el-tab-pane
                    :label="tab.name"
                    :name="tab.name"
                    v-for="(tab, idx) of tabs"
                    :key="idx"
                >
                    <template #label>
                        <div class="flex flex-col">
                            <div class="flex flex-row items-center space-x-2">
                                <div class="flex flex-col whitespace-normal text-lg text-gray-600">
                                    <div
                                        class="cursor-pointer hover:text-yellow-600 describo-tab-label"
                                        v-if="tab.label"
                                    >
                                        {{ tab.label }}
                                    </div>
                                    <div
                                        class="cursor-pointer hover:text-yellow-600 describo-tab-label"
                                        v-else-if="tab.name"
                                    >
                                        {{ tab.name }}
                                    </div>
                                </div>
                                <div v-if="tab.missingRequiredData" class="text-red-600">
                                    <i class="fa-regular fa-circle-xmark fa-lg"></i>
                                </div>
                                <div
                                    v-if="tab.hasData && !tab.missingRequiredData"
                                    class="text-green-600"
                                >
                                    <i class="fa-regular fa-circle-check fa-lg"></i>
                                </div>
                            </div>
                            <div class="text-gray-600 text-left font-light text-xs pr-1 pb-4">
                                {{ tab.description }}
                            </div>
                        </div>
                    </template>

                    <span v-if="data.activeTab === tab.name">
                        <div
                            class="text-red-600 float-right"
                            v-if="!configuration.readonly && tab.missingRequiredData"
                        >
                            <el-button
                                type="danger"
                                @click="
                                    data.highlightRequiredProperties =
                                        !data.highlightRequiredProperties
                                "
                            >
                                <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                            </el-button>
                        </div>
                        <div v-if="tab.name === 'about'">
                            <render-entity-id-component
                                class="my-2 p-2"
                                :class="{
                                    'bg-green-200 rounded p-1 my-1': data.savedProperty === '@id',
                                }"
                                :entity="contextEntity"
                                @update:entity="updateEntity"
                            />
                            <render-entity-type-component
                                class="my-2 p-2"
                                :crate-manager="props.crateManager"
                                :entity="contextEntity"
                                @update:entity="updateEntity"
                            />
                            <render-entity-name-component
                                class="my-2 p-2"
                                :class="{
                                    'bg-green-200 rounded p-1 my-1': data.savedProperty === 'name',
                                }"
                                :entity="contextEntity"
                                @update:entity="updateEntity"
                            />
                        </div>

                        <!-- render the entity properties in this tab definition -->
                        <div v-for="input of tab.inputs">
                            <div
                                :class="{
                                    'hover:bg-sky-100':
                                        !configuration.readonly &&
                                        data.savedProperty !== input.name,
                                    'bg-green-200 hover:bg-green-200':
                                        data.savedProperty === input.name,
                                }"
                                v-if="
                                    tab.name === data.activeTab &&
                                    !['@id', '@type', 'name'].includes(input.name)
                                "
                            >
                                <render-entity-property-component
                                    class="my-2"
                                    :crate-manager="props.crateManager"
                                    :entity="contextEntity"
                                    :property="input.name"
                                    :values="contextEntity['@properties'][input.name]"
                                    :highlight-required="data.highlightRequiredProperties"
                                    @load:entity="loadEntity"
                                    @create:entity="createEntity"
                                    @link:entity="linkEntity"
                                    @unlink:entity="unlinkEntity"
                                    @create:property="createProperty"
                                    @save:property="saveProperty"
                                    @delete:property="deleteProperty"
                                />
                            </div>
                        </div>
                    </span>
                </el-tab-pane>
            </el-tabs>
        </div>
        <!--show reverse links panel  -->
        <div
            v-if="props.configuration.enableReverseLinkBrowser && !data.reverseSidebarVisible"
            class="p-2 h-12 rounded text-2xl bg-gray-200 text-blue-600 cursor-pointer"
            @click="data.reverseSidebarVisible = !data.reverseSidebarVisible"
        >
            <div v-show="!data.reverseSidebarVisible">
                <i class="fa-solid fa-chevron-left"></i>
                <!-- <i class="fa-solid fa-link"></i> -->
            </div>
            <div v-show="data.reverseSidebarVisible">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        </div>
        <!-- reverse links panel as a drawer-->
        <el-drawer
            v-model="data.reverseSidebarVisible"
            direction="rtl"
            size="40%"
            destroy-on-close
            @close="data.reverseSidebarVisible = false"
        >
            <template #default>
                <RenderReverseConnectionsComponent
                    :key="contextEntity['@id']"
                    :crate-manager="props.crateManager"
                    :connections="contextEntity['@reverse']"
                    @load:entity="loadEntity"
                />
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { configurationKey } from "./keys.js";
import {
    reactive,
    shallowRef,
    triggerRef,
    computed,
    onMounted,
    onBeforeMount,
    onBeforeUnmount,
    watch,
    provide,
} from "vue";
import { ElTabs, ElTabPane, ElDrawer, ElButton } from "element-plus";
import RenderEntityIdComponent from "./RenderEntityId.component.vue";
import RenderEntityTypeComponent from "./RenderEntityType.component.vue";
import RenderEntityNameComponent from "./RenderEntityName.component.vue";
import RenderEntityPropertyComponent from "./RenderEntityProperty.component.vue";
import RenderReverseConnectionsComponent from "./RenderReverseConnections.component.vue";
import RenderControlsComponent from "./RenderControls.component.vue";
import difference from "lodash-es/difference.js";
import orderBy from "lodash-es/orderBy.js";
import { isURL } from "../crate-manager.js";
import { ProfileManager } from "../profile-manager.js";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    profile: {
        type: Object,
        required: true,
    },
    entity: {
        type: Object,
        required: true,
    },
    configuration: {
        type: Object,
        required: true,
    },
});

const contextEntity = shallowRef({});
const profileManager = shallowRef({});
const tabs = shallowRef({});
const watchers = [];

const data = reactive({
    reverseSidebarVisible: false,
    highlightRequiredProperties: false,
    missingRequiredData: false,
    activeTab: "about",
    renderTabs: false,
    extraProperties: [],
    savedProperty: undefined,
    savedPropertyTimeout: 1500,
});

const $emit = defineEmits([
    "ready",
    "load:entity",
    "save:crate",
    "save:entity:template",
    "create:property",
    "update:property",
    "delete:property",
    "ingest:entity",
    "link:entity",
    "unlink:entity",
    "update:entity",
    "delete:entity",
]);

onBeforeMount(() => {
    provide(
        configurationKey,
        computed(() => props.configuration)
    );
});
onMounted(() => {
    init({ entity: props.entity });
    watchers[0] = watch(
        () => props.entity,
        (n, o) => {
            if (n["@id"] !== o["@id"]) {
                data.extraProperties = [];
                if (props.configuration.resetTabOnEntityChange) {
                    // if true - always reset tab on entity change
                    data.activeTab = "about";
                } else {
                    // ... otherwise only change to "about" if the newly set entity doesn't have a layout with the same name as
                    // the currently selected one. If there is such layout, keep that (no change to data.activeTab).
                    const layouts = profileManager.value.getLayouts({ entity: props.entity });
                    if (layouts == null || !layouts[data.activeTab]) {
                        data.activeTab = "about";
                    }
                }
            }
            init({ entity: props.entity });
        }
    );
    watchers[1] = watch(
        () => props.profile,
        () => {
            initProfile();
            data.extraProperties = [];
            if (props.configuration.resetTabOnProfileChange) {
                // if true - always reset tab on profile change
                data.activeTab = "about";
            } else {
                // ... otherwise only change to "about" if the newly set profile doesn't have a layout with the same name as
                // the currently selected one. If there is such layout, keep that (no change to data.activeTab).
                const layouts = profileManager.value.getLayouts({ entity: props.entity });
                if (layouts == null || !layouts[data.activeTab]) {
                    data.activeTab = "about";
                }
            }
            const entity = props.crateManager.getEntity({ id: props.entity["@id"] });
            init({ entity });
        }
    );
});
onBeforeUnmount(() => {
    watchers.forEach((watcher) => watcher());
});

function initProfile() {
    profileManager.value = new ProfileManager({ profile: props.profile });
    props.crateManager.profileManager = profileManager.value;
}
function init({ entity }) {
    initProfile();
    if (!entity["@id"]) return;
    if (entity["@id"] !== contextEntity.value["@id"]) {
        window.scrollTo(0, 0);
    }

    const inputs = profileManager.value.getInputsFromProfile({ entity });
    data.missingRequiredData = false;

    for (let input of inputs) {
        if (input.name === "name") continue;
        if (!input.id) {
            console.error(`Excluding invalid input - missing id: ${input}`);
            continue;
        }
        if (!entity["@properties"][input.name] && !props.configuration.readonly) {
            entity["@properties"][input.name] = [];
        }

        if (input.required && !entity["@properties"][input.name].length) {
            data.missingRequiredData = true;
        }
    }
    if (data.extraProperties.length) {
        data.extraProperties.forEach((property) => {
            if (!entity["@properties"][property]) entity["@properties"][property] = [];
        });
    }
    let properties = {};
    let propertyNames = [];
    Object.keys(entity["@properties"]).forEach((k) => (propertyNames[k.toLowerCase()] = k));
    Object.keys(entity["@properties"])
        .map((k) => k.toLowerCase())
        .sort()
        .forEach((k) => (properties[propertyNames[k]] = entity["@properties"][propertyNames[k]]));
    entity["@properties"] = properties;

    contextEntity.value = entity;
    let layout = profileManager.value.getLayouts({ entity });
    if (!layout) {
        data.renderTabs = false;
    } else {
        data.renderTabs = true;
        tabs.value = applyTabDataIndicators({
            tabs: applyLayout({ layout, inputs, entity }),
            entity,
        });
        triggerRef(tabs);
    }
    $emit("ready");
}
function applyLayout({ layout, inputs, entity }) {
    let sort = false;
    for (let name of Object.keys(layout)) {
        layout[name].name = name;
        layout[name].inputs = [];
        if (layout[name].order) sort = true;
    }
    if (!layout.about) {
        layout.about = {
            name: "about",
            label: "About",
            inputs: [],
            order: 0,
        };
    }
    if (!layout.overflow) {
        layout.overflow = {
            name: "overflow",
            label: "...",
            inputs: [],
            order: Object.keys(layout).length,
        };
    }
    // sort the inputs into their groups
    for (let input of inputs) {
        if (!entity["@properties"][input.name]) continue;
        if (input.hide) {
            continue;
        } else if (input.group && layout[input.group]) {
            layout[input.group].inputs.push(input);
        } else {
            layout.overflow.inputs.push(input);
        }
    }

    // get a list of the properties defined on the input
    //   but which have no input definition and pop them
    //   into the overflow group with a default Text configuration
    let profileInputs = inputs.map((i) => i.name);
    let entityProperties = Object.keys(entity["@properties"]);
    let missingInputs = difference(entityProperties, profileInputs);
    for (let input of missingInputs) {
        layout.overflow.inputs.push({
            name: input,
            multiple: true,
            values: ["Text"],
        });
    }

    let tabs = Object.keys(layout)
        .map((k) => layout[k])
        .filter((t) => t.name !== "appliesTo");
    if (sort) tabs = orderBy(tabs, "order");
    return tabs;
}
function applyTabDataIndicators({ tabs, entity }) {
    for (let tab of tabs) {
        if (props.configuration.readonly) {
            tab.hasData = false;
            tab.missingRequiredData = false;
        } else {
            tab.missingRequiredData = false;
            tab.hasData = false;
            for (let input of tab.inputs) {
                if (input.required && !entity["@properties"][input.name].length) {
                    tab.missingRequiredData = true;
                }
                if (entity["@properties"][input.name].length) {
                    tab.hasData = true;
                }
            }
        }
    }
    return tabs;
}
function refresh() {
    const entity = props.crateManager.getEntity({ id: props.entity["@id"] });
    init({ entity });
}
function addPropertyPlaceholder({ property }) {
    data.extraProperties.push(property);
    const entity = props.crateManager.getEntity({ id: props.entity["@id"] });
    init({ entity });
}
function loadEntity(entity) {
    $emit("load:entity", { id: entity["@id"], ...entity });
}
function createEntity(patch) {
    const property = patch.property;
    delete patch.json.type;
    console.debug("Render Entity component: emit(create:entity)", {
        id: contextEntity.value["@id"],
        property,
        json: patch.json,
    });

    if (props.configuration.mode === "embedded") {
        props.crateManager.ingestAndLink({
            id: contextEntity.value["@id"],
            property,
            json: patch.json,
        });
        refresh();
        saveCrate();
    } else {
        $emit("ingest:entity", { property, id: props.entity["@id"], json: patch.json });
    }
}
function updateEntity(patch) {
    console.debug("Render Entity component: emit(update:entity)", {
        id: contextEntity.value["@id"],
        ...patch,
    });
    if (props.configuration.mode === "embedded") {
        props.crateManager.updateEntity({
            id: contextEntity.value["@id"],
            ...patch,
        });
        refresh();
        saveCrate();
    } else {
        $emit("update:entity", { ...patch, id: contextEntity.value["@id"] });
    }
    data.savedProperty = patch.property;
    setTimeout(() => (data.savedProperty = undefined), data.savedPropertyTimeout);
}
function linkEntity(patch) {
    console.debug("Render Entity component: emit(link:entity)", {
        id: contextEntity.value["@id"],
        property: patch.property,
        tgtEntityId: patch.json["@id"],
    });
    if (props.configuration.mode === "embedded") {
        props.crateManager.linkEntity({
            id: contextEntity.value["@id"],
            property: patch.property,
            tgtEntityId: patch.json["@id"],
        });
        refresh();
        saveCrate();
    } else {
        $emit("link:entity", { property: patch.property, tgtEntityId: patch.json["@id"] });
    }
}
function unlinkEntity(patch) {
    console.debug("Render Entity component: emit(unlink:entity)", {
        id: contextEntity.value["@id"],
        property: patch.property,
        tgtEntityId: patch.tgtEntityId,
    });
    if (props.configuration.mode === "embedded") {
        props.crateManager.unlinkEntity({
            id: contextEntity.value["@id"],
            property: patch.property,
            tgtEntityId: patch.tgtEntityId,
        });
        refresh();
        saveCrate();
    } else {
        $emit("unlink:entity", {
            id: contextEntity.value["@id"],
            property: patch.property,
            tgtEntityId: patch.tgtEntityId,
        });
    }
}
function deleteEntity(patch) {
    console.debug("Render Entity component: emit(delete:entity)", patch);
    if (props.configuration.mode === "embedded") {
        props.crateManager.deleteEntity(patch);
        $emit("load:entity", { name: "RootDataset" });
        saveCrate();
    } else {
        $emit("delete:entity", patch);
    }
}
function createProperty(patch) {
    console.debug("Render Entity component: emit(create:property)", {
        id: contextEntity.value["@id"],
        ...patch,
    });
    if (props.configuration.mode === "embedded") {
        if (isURL(patch.value)) {
            createEntity({
                property: patch.property,
                json: {
                    "@id": patch.value,
                    "@type": "URL",
                    name: patch.value,
                },
            });
        } else {
            props.crateManager.setProperty({ id: contextEntity.value["@id"], ...patch });
            data.savedProperty = patch.property;
            setTimeout(() => (data.savedProperty = undefined), data.savedPropertyTimeout);
        }
        refresh();
        saveCrate();
    } else {
        $emit("create:property", { id: contextEntity.value["@id"], ...patch });
    }
}
function saveProperty(patch) {
    console.debug("Render Entity component: emit(save:property)", {
        id: contextEntity.value["@id"],
        ...patch,
    });
    if (props.configuration.mode === "embedded") {
        if (isURL(patch.value)) {
            createEntity({
                property: patch.property,
                json: {
                    "@id": patch.value,
                    "@type": "URL",
                    name: patch.value,
                },
            });
            deleteProperty({
                id: contextEntity.value["@id"],
                property: patch.property,
                idx: patch.idx,
            });
        } else {
            props.crateManager.updateProperty({ id: contextEntity.value["@id"], ...patch });
        }
        refresh();
        saveCrate();
    } else {
        $emit("save:property", { id: contextEntity.value["@id"], ...patch });
    }
    data.savedProperty = patch.property;
    setTimeout(() => (data.savedProperty = undefined), data.savedPropertyTimeout);
}
function deleteProperty(patch) {
    console.debug("Render Entity component: emit(delete:property)", {
        id: props.entity["@id"],
        property: patch.property,
        propertyIdx: patch.idx,
    });
    if (props.configuration.mode === "embedded") {
        props.crateManager.deleteProperty({
            id: props.entity["@id"],
            property: patch.property,
            propertyIdx: patch.idx,
        });
        refresh();
        saveCrate();
    } else {
        $emit("delete:property", { id: patch.idx });
    }
}
function saveCrate() {
    $emit("save:crate");
}
function saveEntityAsTemplate() {
    console.debug("Render Entity component: emit(save:entity:template)");
    $emit("save:entity:template");
}
function updateContext(data) {
    props.crateManager.context = data;
    saveCrate();
}
</script>
