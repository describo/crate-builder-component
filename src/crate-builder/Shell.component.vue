<template>
    <div class="flex flex-col">
        <render-entity-component
            v-if="data.ready && !data.error"
            :crate-manager="data.crateManager"
            :entity="data.entity"
            :configuration="data.configuration"
            @load:entity="data.debouncedSetCurrentEntity"
            @ready="ready"
            @save:crate="saveCrate"
            @save:crate:template="saveCrateAsTemplate"
            @save:entity:template="saveEntityAsTemplate"
        />

        <div v-if="data.error && data.errors.length">
            There are errors in the data.
            <pre
                >{{ data.errors }}
            </pre>
        </div>
    </div>
</template>

<script setup>
import RenderEntityComponent from "./RenderEntity/Shell.component.vue";
import { onMounted, onBeforeMount, reactive, watch } from "vue";
import { cloneDeep, isEmpty, debounce, isFunction } from "lodash";
import { CrateManager } from "./crate-manager.js";
import { useRouter, useRoute } from "vue-router";
let $router = useRouter();
let $route = useRoute();

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
    enableInternalRouting: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    readonly: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
});

const $emit = defineEmits(["ready", "error", "navigation", "save:crate", "save:crate:template"]);

const data = reactive({
    ready: false,
    error: false,
    errors: [],
    crate: [],
    profile: {},
    entity: {},
    debouncedInit: debounce(init, 400),
    debouncedSetCurrentEntity: debounce(setCurrentEntity, 500),
    crateManager: {},
});

watch([() => props.crate, () => props.profile], () => {
    data.ready = false;
    data.debouncedInit();
});
watch(
    () => $route?.query?.id,
    (n) => {
        if (n !== data.entity.describoId)
            data.debouncedSetCurrentEntity({ describoId: $route?.query?.id });
    }
);
onBeforeMount(() => {
    $router?.replace({ query: "" });
    data.configuration = configure();
});
onMounted(() => {
    data.debouncedInit();
});

function init() {
    // $router?.replace({ query: "" });
    updateRoute({ describoId: "" });
    if (!props.crate || isEmpty(props.crate)) {
        return;
    }
    data.error = false;

    data.profile = isEmpty(props.profile) ? {} : cloneDeep(props.profile);
    data.crate = cloneDeep(props.crate);

    // does the profile have a context defined? yes - disable the context editor
    if (data.profile?.context) {
        data.configuration.enableContextEditor = false;
    }

    data.crateManager = new CrateManager();
    data.crateManager.lookup = props.lookup;
    try {
        data.crateManager.load({ crate: data.crate, profile: data.profile });
    } catch (error) {
        $emit("error", {
            errors: data.crateManager.errors,
        });
        data.error = true;
        data.errors = data.crateManager.errors;
        ready();
        return;
    }

    setCurrentEntity({ name: "RootDataset" });
    ready();
}
function configure() {
    const configuration = {
        mode: props.mode,
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
        // if (isEmpty($route?.query)) {
        //     $router?.replace({ query: { id: entity.describoId } });
        // } else {
        //     $router?.push({ query: { id: entity.describoId } });
        // }
        updateRoute({ describoId: entity.describoId });
        console.debug(`Render Entity Parent, load entity:`, { ...entity });
        data.crateManager.setCurrentEntity({ describoId: entity.describoId });
        data.entity = { ...entity };
    }
}
function updateRoute({ describoId }) {
    if (!$router || !$route || !props.enableInternalRouting) return;
    if (isEmpty($route?.query)) {
        $router?.replace({ query: { id: describoId } });
    } else {
        $router?.push({ query: { id: describoId } });
    }
    $emit("navigation", { id: describoId });
}
function ready() {
    data.ready = true;
    $emit("ready");
}
async function saveCrate() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const crate = data.crateManager.exportCrate();
    $emit("save:crate", { crate });
}
async function saveCrateAsTemplate(template) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    $emit("save:crate:template", {
        template: {
            name: template.name,
            crate: data.crateManager.exportCrate(),
        },
    });
}
function saveEntityAsTemplate(template) {
    let entity = data.crateManager.exportEntityTemplate({ describoId: data.entity.describoId });
    $emit("save:entity:template", { entity });
}
</script>
