<template>
    <div class="flex flex-row">
        <div class="flex flex-col pr-4 w-full">
            <!-- <pre>{{ data.entity }}</pre> -->
            <div v-if="!data.renderTabs">
                <!-- render controls -->
                <render-controls-component
                    v-if="!configuration.readonly && configuration.showControls"
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
                    class="my-2 p-2"
                    :class="{
                        'bg-green-200 rounded p-1 my-1': data.savedProperty === '@id',
                    }"
                    :entity="data.entity"
                    @update:entity="updateEntity"
                />

                <!-- render entity type -->
                <render-entity-type-component
                    class="my-2 p-2"
                    :crate-manager="props.crateManager"
                    :entity="data.entity"
                    @update:entity="updateEntity"
                />

                <!-- render entity name -->
                <render-entity-name-component
                    class="my-2 p-2"
                    :class="{
                        'bg-green-200 rounded p-1 my-1': data.savedProperty === 'name',
                    }"
                    :entity="data.entity"
                    @update:entity="updateEntity"
                />

                <!-- render entity properties -->
                <div v-for="(values, property) of data.entity['@properties']" :key="property">
                    <div>
                        <render-entity-property-component
                            :class="{
                                'hover:bg-sky-100':
                                    !configuration.readonly && data.savedProperty !== property,
                                'bg-green-200 hover:bg-green-200': data.savedProperty === property,
                            }"
                            class="my-2"
                            :crate-manager="props.crateManager"
                            :entity="data.entity"
                            :property="property"
                            :values="values"
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
            <div v-if="data.renderTabs">
                <!-- grouped profile -->
                <div class="flex flex-col flex-grow">
                    <!-- render controls -->
                    <render-controls-component
                        v-if="!configuration.readonly && configuration.showControls"
                        :crate-manager="props.crateManager"
                        :entity="data.entity"
                        @load:entity="loadEntity"
                        @add:property:placeholder="addPropertyPlaceholder"
                        @delete:entity="deleteEntity"
                        @save:crate:template="saveCrateAsTemplate"
                        @save:entity:template="saveEntityAsTemplate"
                        @update:context="updateContext"
                    />
                    <el-tabs :tab-position="configuration.tabLocation" v-model="data.activeTab">
                        <el-tab-pane
                            :label="tab.name"
                            :name="tab.name"
                            v-for="(tab, idx) of data.tabs"
                            :key="idx"
                        >
                            <template #label>
                                <div class="flex flex-col whitespace-normal text-gray-600">
                                    <div
                                        class="cursor-pointer text-lg hover:text-yellow-600"
                                        v-if="tab.label"
                                    >
                                        {{ tab.label }}
                                    </div>
                                    <div
                                        class="cursor-pointer text-lg hover:text-yellow-600"
                                        v-else-if="tab.name"
                                    >
                                        {{ tab.name }}
                                    </div>
                                    <div class="text-gray-600 font-light text-xs pr-1 pb-4">
                                        {{ tab.description }}
                                    </div>
                                </div>
                            </template>

                            <span>
                                <div v-if="tab.name === 'about'">
                                    <render-entity-id-component
                                        class="my-2 p-2"
                                        :class="{
                                            'bg-green-200 rounded p-1 my-1':
                                                data.savedProperty === '@id',
                                        }"
                                        :entity="data.entity"
                                        @update:entity="updateEntity"
                                    />
                                    <render-entity-type-component
                                        class="my-2 p-2"
                                        :crate-manager="props.crateManager"
                                        :entity="data.entity"
                                        @update:entity="updateEntity"
                                    />
                                    <render-entity-name-component
                                        class="my-2 p-2"
                                        :class="{
                                            'bg-green-200 rounded p-1 my-1':
                                                data.savedProperty === 'name',
                                        }"
                                        :entity="data.entity"
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
                                            :entity="data.entity"
                                            :property="input.name"
                                            :values="data.entity['@properties'][input.name]"
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
            </div>
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
                    :key="data.entity['@id']"
                    :crate-manager="props.crateManager"
                    :connections="data.entity['@reverse']"
                    @load:entity="loadEntity"
                />
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { ElTabs, ElTabPane, ElDrawer } from "element-plus";
import RenderEntityIdComponent from "./RenderEntityId.component.vue";
import RenderEntityTypeComponent from "./RenderEntityType.component.vue";
import RenderEntityNameComponent from "./RenderEntityName.component.vue";
import RenderEntityPropertyComponent from "./RenderEntityProperty.component.vue";
import RenderReverseConnectionsComponent from "./RenderReverseConnections.component.vue";
import RenderControlsComponent from "./RenderControls.component.vue";
import { configurationKey } from "./keys.js";
import { reactive, computed, onMounted, onBeforeMount, onBeforeUnmount, watch, provide } from "vue";
import isEmpty from "lodash-es/isEmpty.js";
import difference from "lodash-es/difference.js";
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

const data = reactive({
    profileManager: {},
    reverseSidebarVisible: false,
    classDefinition: undefined,
    activeTab: "about",
    renderTabs: false,
    entity: {},
    tabs: [],
    extraProperties: [],
    savedProperty: undefined,
    savedPropertyTimeout: 1500,
    watchers: [],
});

const $emit = defineEmits([
    "ready",
    "load:entity",
    "save:crate",
    "save:crate:template",
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
    initProfile();
});
onMounted(() => {
    init({ entity: props.entity });
    data.watchers[0] = watch(
        () => props.entity,
        (n, o) => {
            if (n["@id"] !== o["@id"]) {
                data.extraProperties = [];
            }
            init({ entity: props.entity });
        }
    );
    data.watchers[1] = watch(
        () => props.profile,
        () => {
            initProfile();
            data.extraProperties = [];
            data.activeTab = "about";
            const entity = props.crateManager.getEntity({ id: props.entity["@id"] });
            init({ entity });
        }
    );
});
onBeforeUnmount(() => {
    data.watchers.forEach((watcher) => watcher());
});

function initProfile() {
    data.profileManager = new ProfileManager({ profile: props.profile });
    props.crateManager.profileManager = data.profileManager;
}
function init({ entity }) {
    if (!entity["@id"]) return;
    if (entity["@id"] !== data.entity["@id"]) {
        window.scrollTo(0, 0);
    }

    const inputs = data.profileManager.getInputsFromProfile({ entity });

    for (let input of inputs) {
        if (input.name === "name") continue;
        if (!input.id) {
            console.error(`Excluding invalid input - missing id: ${input}`);
            continue;
        }
        if (!entity["@properties"][input.name] && !props.configuration.readonly) {
            entity["@properties"][input.name] = [];
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

    data.entity = entity;
    let layout = data.profileManager.getLayout();
    if (isEmpty(layout)) {
        data.renderTabs = false;
    } else {
        data.renderTabs = true;
        data.tabs = applyLayout({ layout, inputs, entity });
    }
    $emit("ready");
}
function applyLayout({ layout, inputs, entity }) {
    for (let name of Object.keys(layout)) {
        layout[name].name = name;
        layout[name].inputs = [];
    }
    if (!layout.overflow) {
        layout.overflow = {
            name: "overflow",
            label: "...",
            inputs: [],
        };
    }
    // sort the inputs into their groups
    for (let input of inputs) {
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

    return Object.keys(layout).map((k) => layout[k]);
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
        id: props.entity["@id"],
        property,
        json: patch.json,
    });
    if (props.configuration.mode === "embedded") {
        props.crateManager.ingestAndLink({
            id: props.entity["@id"],
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
        id: data.entity["@id"] ?? data.tabs[0].entity["@id"],
        ...patch,
    });
    if (props.configuration.mode === "embedded") {
        props.crateManager.updateEntity({
            id: data.entity["@id"] ?? data.tabs[0].entity["@id"],
            ...patch,
        });
        refresh();
        saveCrate();
    } else {
        $emit("update:entity", { ...patch, id: data.entity["@id"] });
    }
    data.savedProperty = patch.property;
    setTimeout(() => (data.savedProperty = undefined), data.savedPropertyTimeout);
}
function linkEntity(patch) {
    console.debug("Render Entity component: emit(link:entity)", {
        id: data.entity["@id"],
        property: patch.property,
        tgtEntityId: patch.json["@id"],
    });
    if (props.configuration.mode === "embedded") {
        props.crateManager.linkEntity({
            id: data.entity["@id"],
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
        id: data.entity["@id"],
        property: patch.property,
        tgtEntityId: patch.tgtEntityId,
    });
    if (props.configuration.mode === "embedded") {
        props.crateManager.unlinkEntity({
            id: data.entity["@id"],
            property: patch.property,
            tgtEntityId: patch.tgtEntityId,
        });
        refresh();
        saveCrate();
    } else {
        $emit("unlink:entity", {
            id: data.entity["@id"],
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
        id: data.entity["@id"],
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
            props.crateManager.setProperty({ id: data.entity["@id"], ...patch });
            data.savedProperty = patch.property;
            setTimeout(() => (data.savedProperty = undefined), data.savedPropertyTimeout);
        }
        refresh();
        saveCrate();
    } else {
        $emit("create:property", { id: data.entity["@id"], ...patch });
    }
}
function saveProperty(patch) {
    console.debug("Render Entity component: emit(save:property)", {
        id: data.entity["@id"],
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
            deleteProperty({ id: data.entity["@id"], property: patch.property, idx: patch.idx });
        } else {
            props.crateManager.updateProperty({ id: data.entity["@id"], ...patch });
        }
        refresh();
        saveCrate();
    } else {
        $emit("save:property", { id: data.entity["@id"], ...patch });
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
function saveCrateAsTemplate(data) {
    console.debug("Render Entity component: emit(save:crate:template)", data);
    $emit("save:crate:template", data);
}
function saveEntityAsTemplate() {
    console.debug("Render Entity component: emit(save:entity:template)");
    $emit("save:entity:template");
}
function updateContext(data) {
    props.crateManager.context = data;
    saveCrate();
}
function addTemplate() {}
</script>
