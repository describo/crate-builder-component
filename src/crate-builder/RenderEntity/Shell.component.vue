<template>
    <div class="flex flex-row">
        <div class="flex flex-col w-full">
            <div
                class="flex flex-row place-content-between pb-1 border-b border-slate-700"
                v-if="state.configuration.showControls"
            >
                <!-- render controls -->
                <render-controls-component
                    ref="renderControlsComponent"
                    class="w-full"
                    :entity="contextEntity"
                    @load:entity="loadEntity"
                    @add:property:placeholder="addPropertyPlaceholder"
                    @delete:entity="deleteEntity"
                    @save:entity:template="saveEntityAsTemplate"
                    @update:context="updateContext"
                />
                <div class="flex-grow"></div>

                <!--show reverse links panel  -->
                <el-button
                    type="primary"
                    @click="data.reverseSidebarVisible = !data.reverseSidebarVisible"
                >
                    <FontAwesomeIcon
                        :icon="data.reverseSidebarVisible ? faChevronRight : faChevronLeft"
                    ></FontAwesomeIcon>
                </el-button>
            </div>

            <!-- <pre>{{ data.entity }}</pre> -->

            <!-- Untabbed layout  -->
            <div v-if="!data.renderTabs">
                <!-- render entity id -->
                <div class="flex flex-row space-x-2 my-2 p-2">
                    <render-entity-id-component
                        class="flex-grow describo-property describo-property-name-id"
                        :class="{
                            'bg-green-200 rounded p-1 my-1': data.savedProperty === '@id',
                        }"
                        :entity="contextEntity"
                        @update:entity="saveProperty"
                    />
                    <!-- highlight required properties -->
                    <div v-if="!state.configuration.readonly && data.missingRequiredData">
                        <el-button
                            type="danger"
                            @click="
                                data.highlightRequiredProperties = !data.highlightRequiredProperties
                            "
                        >
                            <FontAwesomeIcon
                                :icon="faTriangleExclamation"
                                size="lg"
                            ></FontAwesomeIcon>
                        </el-button>
                    </div>
                </div>

                <!-- render entity type -->
                <render-entity-type-component
                    class="my-2 p-2 describo-property describo-property-name-type"
                    :entity="contextEntity"
                    @update:entity="saveProperty"
                />

                <!-- render entity name -->
                <render-entity-name-component
                    class="my-2 p-2 describo-property describo-property-name-name"
                    :class="{
                        'bg-green-200 rounded p-1 my-1': data.savedProperty === 'name',
                    }"
                    :entity="contextEntity"
                    @update:entity="saveProperty"
                />

                <!-- render entity properties -->
                <div v-for="property of Object.keys(contextEntity).sort()" :key="property">
                    <div v-if="!['@id', '@type', 'name', '@reverse'].includes(property)">
                        <render-entity-property-component
                            :class="{
                                'hover:bg-sky-100':
                                    !state.configuration.readonly &&
                                    data.savedProperty !== property,
                                'bg-green-200 hover:bg-green-200': data.savedProperty === property,
                            }"
                            class="my-2"
                            :entity="contextEntity"
                            :property="property"
                            :values="contextEntity[property]"
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
                :tab-position="state.configuration.tabLocation"
                v-model="data.activeTab"
                @tab-click="saveTabToState"
                v-if="data.renderTabs"
            >
                <el-tab-pane
                    :label="tab.name"
                    :name="tab.name"
                    v-for="(tab, idx) of tabs"
                    :key="tab.name + tab.hasData + tab.missingRequiredData"
                >
                    <template #label>
                        <div
                            class="flex flex-col min-w-32 max-w-40"
                            :class="{
                                'items-end': state.configuration.tabLocation === 'left',
                                'items-start': state.configuration.tabLocation !== 'left',
                            }"
                        >
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
                                    <FontAwesomeIcon
                                        :icon="faCircleXmark"
                                        size="lg"
                                    ></FontAwesomeIcon>
                                </div>
                                <div
                                    v-if="tab.hasData && !tab.missingRequiredData"
                                    class="text-green-600"
                                >
                                    <FontAwesomeIcon
                                        :icon="faCircleCheck"
                                        size="lg"
                                    ></FontAwesomeIcon>
                                </div>
                            </div>
                            <div
                                class="text-gray-600 font-light text-xs pb-4 text-wrap describo-tab-description"
                            >
                                {{ tab.description }}
                            </div>
                        </div>
                    </template>

                    <div
                        class="text-red-600 float-right"
                        v-if="!state.configuration.readonly && tab.missingRequiredData"
                    >
                        <el-button
                            type="danger"
                            @click="
                                data.highlightRequiredProperties = !data.highlightRequiredProperties
                            "
                        >
                            <FontAwesomeIcon
                                :icon="faTriangleExclamation"
                                size="lg"
                            ></FontAwesomeIcon>
                        </el-button>
                    </div>
                    <div v-if="tab.name === 'about'">
                        <render-entity-id-component
                            class="my-2 p-2 describo-property describo-property-name-id"
                            :class="{
                                'bg-green-200 rounded p-1 my-1': data.savedProperty === '@id',
                            }"
                            :entity="contextEntity"
                            @update:entity="saveProperty"
                        />
                        <render-entity-type-component
                            class="my-2 p-2 describo-property describo-property-name-type"
                            :entity="contextEntity"
                            @update:entity="saveProperty"
                        />
                        <render-entity-name-component
                            class="my-2 p-2 describo-property describo-property-name-name"
                            :class="{
                                'bg-green-200 rounded p-1 my-1': data.savedProperty === 'name',
                            }"
                            :entity="contextEntity"
                            @update:entity="saveProperty"
                        />
                    </div>

                    <!-- render the entity properties in this tab definition -->
                    <div v-for="input of tab.inputs">
                        <div
                            :class="{
                                'hover:bg-sky-100':
                                    !state.configuration.readonly &&
                                    data.savedProperty !== input.name,
                                'bg-green-200 hover:bg-green-200':
                                    data.savedProperty === input.name,
                            }"
                            v-if="
                                tab.name === data.activeTab &&
                                !['@id', '@type', 'name', '@reverse'].includes(input.name)
                            "
                        >
                            <render-entity-property-component
                                class="my-2"
                                :entity="contextEntity"
                                :property="input.name"
                                :values="contextEntity[input.name]"
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
                </el-tab-pane>
            </el-tabs>
        </div>

        <!--show reverse links panel  -->
        <div
            v-if="state.configuration.enableReverseLinkBrowser && !data.reverseSidebarVisible"
            class="p-2 h-12 rounded text-2xl bg-gray-200 text-blue-600 cursor-pointer"
            @click="data.reverseSidebarVisible = !data.reverseSidebarVisible"
        >
            <div v-show="!data.reverseSidebarVisible">
                <FontAwesomeIcon :icon="faChevronLeft"></FontAwesomeIcon>
            </div>
            <div v-show="data.reverseSidebarVisible">
                <FontAwesomeIcon :icon="faChevronRight"></FontAwesomeIcon>
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
                    :entity="contextEntity"
                    @load:entity="loadEntity"
                />
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
    faTriangleExclamation,
    faChevronLeft,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { crateManagerKey, profileManagerKey } from "./keys.js";
import { reactive, shallowRef, onMounted, onBeforeUnmount, watch, inject } from "vue";
import { ElTabs, ElTabPane, ElDrawer, ElButton } from "element-plus";
import RenderEntityIdComponent from "./RenderEntityId.component.vue";
import RenderEntityTypeComponent from "./RenderEntityType.component.vue";
import RenderEntityNameComponent from "./RenderEntityName.component.vue";
import RenderEntityPropertyComponent from "./RenderEntityProperty.component.vue";
import RenderReverseConnectionsComponent from "./RenderReverseConnections.component.vue";
import RenderControlsComponent from "./RenderControls.component.vue";
import { isURL } from "../CrateManager/lib";
import { applyLayout } from "./layout";
import { useStateStore } from "../store.js";
const state = useStateStore();

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});

const contextEntity = shallowRef({});
const cm = inject(crateManagerKey);
const pm = inject(profileManagerKey);
const tabs = shallowRef([]);
let watchers = [];

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
defineExpose({
    setTab: (tabName) => (data.activeTab = tabName),
    toggleReverseLinkBrowser: () => (data.reverseSidebarVisible = !data.reverseSidebarVisible),
});

onMounted(() => {
    init({ entity: props.entity });
    watchers[0] = watch(
        () => props.entity,
        (n, o) => {
            if (n["@id"] !== o["@id"]) {
                data.extraProperties = [];
                // get profile layouts
                const layouts = pm.value.getLayout({ entity: props.entity });
                if (state.editorState.latest().tab && layouts?.[state.editorState.latest().tab]) {
                    // set activeTab stored in state if it exists in the layouts
                    data.activeTab = state.editorState.latest().tab;
                } else if (layouts == null || !layouts[data.activeTab]) {
                    // if no tab stored in state, or no layouts, or current tab not in layouts
                    //  nav to about tab
                    data.activeTab = "about";
                }
            }
            const entity = cm.value.getEntity({ id: props.entity["@id"] });
            init({ entity });
        }
    );
    watchers[1] = watch(
        () => pm.value.$key,
        () => {
            data.extraProperties = [];
            // get profile layouts
            const layouts = pm.value.getLayout({ entity: props.entity });
            if (state.editorState.latest().tab && layouts?.[state.editorState.latest().tab]) {
                // set activeTab stored in state if it exists in the layouts
                data.activeTab = state.editorState.latest().tab;
            } else if (layouts == null || !layouts[data.activeTab]) {
                // if no tab stored in state, or no layouts, or current tab not in layouts
                //  nav to about tab
                data.activeTab = "about";
            }
            const entity = cm.value.getEntity({ id: props.entity["@id"] });
            init({ entity });
        }
    );
});
onBeforeUnmount(() => {
    watchers.forEach((watcher) => watcher());
    watchers = [];
});

function init({ entity }) {
    if (!entity["@id"]) return;
    if (entity["@id"] !== contextEntity.value["@id"]) {
        window.scrollTo(0, 0);
    }

    const layout = applyLayout({
        configuration: state.configuration,
        profileManager: pm.value,
        entity,
        extraProperties: data.extraProperties,
    });
    contextEntity.value = layout.entity;
    data.renderTabs = layout.renderTabs;
    data.missingRequiredData = layout.missingRequiredData;
    tabs.value = layout.tabs;
    if (data.renderTabs) {
        state.editorState.update({ tab: data.activeTab });
    } else {
        state.editorState.deleteFromState({ property: "tab" });
    }
    $emit("ready");
}
function refresh() {
    const entity = cm.value.getEntity({ id: props.entity["@id"] });
    init({ entity });
}
function saveTabToState(tab) {
    state.editorState.update({ tab: tab.paneName });
}
function addPropertyPlaceholder({ property }) {
    data.extraProperties.push(property);
    const entity = cm.value.getEntity({ id: props.entity["@id"] });
    init({ entity });
}
function loadEntity(entity) {
    $emit("load:entity", { id: entity["@id"], ...entity });
}
function createEntity(patch) {
    delete patch.json.type;
    console.debug("Render Entity component: emit(create:entity)", {
        id: contextEntity.value["@id"],
        ...patch,
    });

    // console.log("ingest and link", JSON.stringify(patch.json, null, 2));
    cm.value.ingestAndLink({
        id: contextEntity.value["@id"],
        property: patch.property,
        propertyId: patch.propertyId,
        json: patch.json,
    });
    refresh();
    saveCrate();
}
function linkEntity(patch) {
    console.debug("Render Entity component: emit(link:entity)", {
        id: contextEntity.value["@id"],
        ...patch,
    });
    cm.value.linkEntity({
        id: contextEntity.value["@id"],
        property: patch.property,
        propertyId: patch.propertyId,
        value: { "@id": patch.json["@id"] },
    });
    refresh();
    saveCrate();
}
function unlinkEntity(patch) {
    console.debug("Render Entity component: emit(unlink:entity)", {
        id: contextEntity.value["@id"],
        ...patch,
    });

    cm.value.unlinkEntity({
        id: contextEntity.value["@id"],
        property: patch.property,
        value: { "@id": patch.tgtEntityId },
    });
    refresh();
    saveCrate();
}
function deleteEntity(patch) {
    console.debug("Render Entity component: emit(delete:entity)", patch);
    cm.value.deleteEntity({ id: patch.id });
    $emit("load:entity", { id: "./" });
    saveCrate();
}
function createProperty(patch) {
    console.debug("Render Entity component: emit(create:property)", {
        id: contextEntity.value["@id"],
        ...patch,
    });
    if (isURL(patch.value) && state.configuration.value.enableUrlMarkup) {
        createEntity({
            property: patch.property,
            json: {
                "@id": patch.value,
                "@type": "URL",
                name: patch.value,
            },
        });
    } else {
        cm.value.setProperty({ id: contextEntity.value["@id"], ...patch });
    }
    refresh();
    saveCrate();
    notifySave(patch.property);
}
function saveProperty(patch) {
    console.debug("Render Entity component: emit(save:property)", {
        id: contextEntity.value["@id"],
        ...patch,
    });

    // don't do anything to core prop's if no change in data
    if (["@id", "@type", "name"].includes(patch.property)) {
        if (contextEntity.value[patch.property] === patch.value) return;
    }

    // otherwise, run the update
    let entity = cm.value.updateProperty({ id: contextEntity.value["@id"], ...patch });
    if (entity["@id"] !== props.entity["@id"]) {
        loadEntity(entity);
    } else {
        refresh();
    }

    // update the id in the state if required
    if (patch.property === "@id" && entity?.["@id"]) {
        state.editorState.replaceId({ id: contextEntity.value["@id"], newId: entity["@id"] });
    }
    saveCrate();
    notifySave(patch.property);
}
function deleteProperty(patch) {
    console.debug("Render Entity component: emit(delete:property)", {
        id: props.entity["@id"],
        ...patch,
    });
    cm.value.deleteProperty({
        id: contextEntity.value["@id"],
        property: patch.property,
        idx: patch.idx,
    });
    refresh();
    saveCrate();
}
function saveCrate() {
    $emit("save:crate");
}
function saveEntityAsTemplate(data) {
    console.debug("Render Entity component: emit(save:entity:template)");
    $emit("save:entity:template", data);
}
function updateContext(data) {
    cm.value.setContext(data);
    saveCrate();
}
function notifySave(property) {
    data.savedProperty = property;
    setTimeout(() => (data.savedProperty = undefined), data.savedPropertyTimeout);
}
</script>
