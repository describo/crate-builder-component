<template>
    <div class="flex flex-row">
        <div class="flex flex-col pr-4 w-full">
            <!-- render controls -->
            <render-controls-component
                v-if="!configuration.readonly && configuration.showControls"
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
                        class="flex-grow describo-property describo-property-name-id"
                        :class="{
                            'bg-green-200 rounded p-1 my-1': data.savedProperty === '@id',
                        }"
                        :entity="contextEntity"
                        @update:entity="saveProperty"
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
                                    !configuration.readonly && data.savedProperty !== property,
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
                :tab-position="configuration.tabLocation"
                v-model="data.activeTab"
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
                            class="flex flex-col"
                            :class="{
                                'items-end': configuration.tabLocation === 'left',
                                'items-start': configuration.tabLocation !== 'left',
                            }"
                        >
                            <div class="flex flex-row text-right items-center space-x-2">
                                <div
                                    class="flex flex-col whitespace-normal text-lg text-gray-600 text-right"
                                >
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
                            <div
                                class="text-gray-600 font-light text-xs pr-1 pb-4 describo-tab-description"
                            >
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
                                        !configuration.readonly &&
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
                    </span>
                </el-tab-pane>
            </el-tabs>
        </div>
        <!--show reverse links panel  -->
        <div
            v-if="configuration.enableReverseLinkBrowser && !data.reverseSidebarVisible"
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
                    :entity="contextEntity"
                    @load:entity="loadEntity"
                />
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { configurationKey, crateManagerKey, profileManagerKey } from "./keys.js";
import { reactive, shallowRef, onMounted, onBeforeUnmount, watch, inject } from "vue";
import { ElTabs, ElTabPane, ElDrawer, ElButton } from "element-plus";
import RenderEntityIdComponent from "./RenderEntityId.component.vue";
import RenderEntityTypeComponent from "./RenderEntityType.component.vue";
import RenderEntityNameComponent from "./RenderEntityName.component.vue";
import RenderEntityPropertyComponent from "./RenderEntityProperty.component.vue";
import RenderReverseConnectionsComponent from "./RenderReverseConnections.component.vue";
import RenderControlsComponent from "./RenderControls.component.vue";
import difference from "lodash-es/difference.js";
import orderBy from "lodash-es/orderBy.js";
import isString from "lodash-es/isString.js";
import { isURL } from "../CrateManager/lib.js";

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});

const contextEntity = shallowRef({});
const configuration = inject(configurationKey);
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
});

onMounted(() => {
    init({ entity: props.entity });
    watchers[0] = watch(
        () => props.entity,
        (n, o) => {
            if (n["@id"] !== o["@id"]) {
                data.extraProperties = [];
                if (configuration.value.resetTabOnEntityChange) {
                    // if true - always reset tab on entity change
                    data.activeTab = "about";
                } else {
                    // ... otherwise only change to "about" if the newly set entity doesn't have a layout with the same name as
                    // the currently selected one. If there is such layout, keep that (no change to data.activeTab).
                    const layouts = pm.value.getLayout({ entity: props.entity });
                    if (layouts == null || !layouts[data.activeTab]) {
                        data.activeTab = "about";
                    }
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
            if (configuration.value.resetTabOnProfileChange) {
                // if true - always reset tab on profile change
                data.activeTab = "about";
            } else {
                // ... otherwise only change to "about" if the newly set profile doesn't have a layout with the same name as
                // the currently selected one. If there is such layout, keep that (no change to data.activeTab).
                const layouts = pm.value.getLayout({ entity: props.entity });
                if (layouts == null || !layouts[data.activeTab]) {
                    data.activeTab = "about";
                }
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

    const inputs = pm.value.getInputsFromProfile({ entity });
    data.missingRequiredData = false;

    for (let input of inputs) {
        if (input.name === "name") continue;
        if (!input.id) {
            console.error(`Excluding invalid input - missing id: ${input}`);
            continue;
        }
        if (!entity[input.name] && !configuration.value.readonly) {
            entity[input.name] = [];
        }

        if (input.required && !entity[input.name].length) {
            data.missingRequiredData = true;
        }
    }
    if (data.extraProperties.length) {
        data.extraProperties.forEach((property) => {
            if (!entity[property]) entity[property] = [];
        });
    }
    let properties = {};
    let propertyNames = [];
    Object.keys(entity).forEach((k) => (propertyNames[k.toLowerCase()] = k));
    Object.keys(entity)
        .map((k) => k.toLowerCase())
        .sort()
        .forEach((k) => (properties[propertyNames[k]] = entity[propertyNames[k]]));

    contextEntity.value = entity;
    let layout = pm.value.getLayout({ entity });
    if (!layout) {
        data.renderTabs = false;
    } else {
        data.renderTabs = true;
        tabs.value = applyTabDataIndicators({
            tabs: applyLayout({ layout, inputs, entity }),
            entity,
        });
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
        if (!entity[input.name]) continue;
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
    let entityProperties = Object.keys(entity);
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
        if (configuration.readonly) {
            tab.hasData = false;
            tab.missingRequiredData = false;
        } else {
            tab.missingRequiredData = false;
            tab.hasData = false;
            for (let input of tab.inputs) {
                if (input.required && !entity[input.name].length) {
                    tab.missingRequiredData = true;
                }
                if (entity[input.name].length) {
                    tab.hasData = true;
                }
            }
        }
    }
    return tabs;
}
function refresh() {
    const entity = cm.value.getEntity({ id: props.entity["@id"] });
    init({ entity });
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

    let entity = cm.value.updateProperty({ id: contextEntity.value["@id"], ...patch });
    if (entity["@id"] !== props.entity["@id"]) {
        loadEntity(entity);
    } else {
        refresh();
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
