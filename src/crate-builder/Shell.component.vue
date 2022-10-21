<template>
    <div class="flex flex-col">
        <render-entity-component
            v-if="data.ready"
            :crate-manager="data.crateManager"
            :entity="data.entity"
            :mode="props.mode"
            @load:entity="setCurrentEntity"
            @save:crate="saveCrate"
            @save:crate:template="saveCrateAsTemplate"
            @save:entity:template="saveEntityAsTemplate"
        />
        <div v-if="data.error" class="bg-red-100 p-4 text-center">
            {{ data.error }}
        </div>
    </div>
</template>

<script setup>
import RenderEntityComponent from "./RenderEntity/Shell.component.vue";
import { onMounted, onBeforeMount, reactive, watch, provide, nextTick } from "vue";
import { cloneDeep, isEmpty, debounce, isFunction } from "lodash";
import { CrateManager } from "./crate-manager.js";
import { useRouter, useRoute } from "vue-router";
const $router = useRouter();
const $route = useRoute();

const props = defineProps({
    crate: {
        type: [Object, undefined],
    },
    profile: {
        type: [Object, undefined],
    },
    mode: {
        type: [String, undefined],
        default: "embedded",
        validator: (val) => ["embedded", "online"].includes(val),
    },
    lookup: {
        type: [Object, undefined],
    },
    enableContextEditor: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableCratePreview: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableBrowseEntities: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableTemplateSave: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
    readonly: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
});

const emit = defineEmits(["save:crate", "save:crate:template"]);

const data = reactive({
    ready: false,
    error: false,
    crate: [],
    profile: {},
    entity: {},
    debouncedInit: debounce(init, 400),
    crateManager: {},
});

watch([() => props.crate, () => props.profile], () => {
    data.ready = false;
    data.debouncedInit();
});
watch(
    () => $route.query.id,
    (n) => {
        if (n !== data.entity.describoId) setCurrentEntity({ describoId: $route.query.id });
    }
);
onBeforeMount(() => {
    let configuration = configure();
    provide("configuration", configuration);
});
onMounted(() => {
    data.debouncedInit();
});

function init() {
    if (!props.crate || isEmpty(props.crate)) {
        data.error = `This component requires you to pass in a crate file.`;
        return;
    }
    data.error = false;

    data.profile = isEmpty(props.profile) ? {} : cloneDeep(props.profile);
    data.crate = cloneDeep(props.crate);

    data.crateManager = new CrateManager();
    data.crateManager.lookup = props.lookup;
    try {
        data.crateManager.load({ crate: data.crate, profile: data.profile });
    } catch (error) {
        data.error = "Unable to load the crate in. See the console for the detailed error message.";
        console.error(error);
        return;
    }

    setCurrentEntity({ name: "RootDataset" });
    data.ready = true;
}
function configure() {
    const configuration = {
        enableContextEditor: props.enableContextEditor,
        enableCratePreview: props.enableCratePreview,
        enableBrowseEntities: props.enableBrowseEntities,
        enableTemplateSave: props.enableTemplateSave,
        readonly: props.readonly,
        enableTemplateLookups: false,
        enableDataPackLookups: false,
    };
    if (props.lookup) {
        if (isFunction(props.lookup.entityTemplates)) {
            configuration.enableTemplateLookups = true;
        }
        if (isFunction(props.lookup.dataPacks)) {
            configuration.enableDataPackLookups = true;
        }
    }
    return configuration;
}
async function setCurrentEntity({ describoId = undefined, name = undefined, id = undefined }) {
    if (!data.crateManager.getEntity) return;
    if (!describoId && !name && !id) return;
    let entity = {};
    if (name === "RootDataset") {
        entity = data.crateManager.getRootDataset();
    } else if (describoId) {
        entity = data.crateManager.getEntity({ describoId });
    } else if (id) {
        entity = data.crateManager.getEntity({ id });
    }
    if (entity) {
        $router.push({ query: { id: entity.describoId } });
        console.debug(`Render Entity Parent, load entity:`, { ...entity });
        data.crateManager.setCurrentEntity({ describoId: entity.describoId });
        data.entity = { ...entity };
    }
}
async function saveCrate() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const crate = data.crateManager.exportCrate();
    emit("save:crate", { crate });
}
async function saveCrateAsTemplate(template) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    emit("save:crate:template", {
        template: {
            name: template.name,
            crate: data.crateManager.exportCrate(),
        },
    });
}
function saveEntityAsTemplate(template) {
    let entity = data.crateManager.exportEntityTemplate({ describoId: data.entity.describoId });
    emit("save:entity:template", { entity });
}
</script>
