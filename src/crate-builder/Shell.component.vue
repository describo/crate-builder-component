<template>
    <div class="flex flex-col">
        <render-entity-component
            v-if="data.ready && !data.error"
            :crate-manager="data.crateManager"
            :profile="data.profile"
            :entity="data.entity"
            :configuration="data.configuration"
            @load:entity="setCurrentEntity"
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
import {
    onMounted,
    onBeforeMount,
    onBeforeUnmount,
    reactive,
    watch,
    getCurrentInstance,
} from "vue";
import cloneDeep from "lodash-es/cloneDeep";
import isEmpty from "lodash-es/isEmpty";
import isFunction from "lodash-es/isFunction";
import debounce from "lodash-es/debounce";
import { CrateManager } from "./crate-manager.js";
import { useRouter, useRoute } from "vue-router";
import { $t, i18next } from "./i18n";

let $route, $router;

const props = defineProps({
    crate: {
        type: [Object, undefined],
    },
    profile: {
        type: [Object, undefined],
    },
    entityId: {
        type: [String, undefined],
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
    enableReverseLinkBrowser: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    purgeUnlinkedEntities: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    readonly: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
    webComponent: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
    tabLocation: {
        type: String,
        default: "left",
        validator: (val) => ["top", "bottom", "left", "right"].includes(val),
    },
    resetTabOnEntityChange: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    showControls: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    language: {
        type: String,
        default: "en",
    },
});

const $emit = defineEmits([
    "load",
    "ready",
    "error",
    "navigation",
    "save:crate",
    "save:crate:template",
]);

if (props.enableInternalRouting) {
    if (getCurrentInstance().appContext.config.globalProperties.$router) {
        $router = useRouter();
        $route = useRoute();
    }
}

const data = reactive({
    ready: false,
    error: false,
    errors: [],
    crate: {},
    profile: {},
    entity: {},
    debouncedInit: debounce(init, 200),
    crateManager: {},
    profile: {},
    progress: {
        percent: 0,
    },
});
let watchers = [];

onBeforeMount(() => {
    $router?.replace({ query: "" });
    data.configuration = configure();
});
onMounted(async () => {
    await init();

    if (props.enableInternalRouting) {
        watchers.push(
            watch(
                () => $route?.query?.id,
                (n, o) => {
                    if (n && n !== o) {
                        setCurrentEntity({ id: atob($route?.query?.id) });
                    }
                }
            )
        );
    }
    watchers.push(
        watch(
            () => props.crate,
            () => {
                init();
            }
        )
    );
    watchers.push(
        watch(
            () => props.profile,
            () => {
                data.profile = isEmpty(props.profile) ? {} : cloneDeep(props.profile);
                data.crateManager.profile = data.profile;
            }
        )
    );
    watchers.push(
        watch(
            () => props.entityId,
            (n) => {
                setCurrentEntity({ id: props.entityId });
            }
        )
    );
    watchers.push(
        watch(
            [
                () => props.enableContextEditor,
                () => props.enableCratePreview,
                () => props.enableBrowseEntities,
                () => props.enableTemplateSave,
                () => props.enableReverseLinkBrowser,
                () => props.purgeUnlinkedEntities,
                () => props.readonly,
                () => props.language,
                () => props.tabLocation,
                () => props.resetTabOnEntityChange,
                () => props.showControls,
            ],
            () => {
                data.configuration = configure();
                i18next.changeLanguage(props.language);
            }
        )
    );
});
onBeforeUnmount(() => {
    watchers.forEach((unWatch) => unWatch());
    watchers = [];
});

async function init() {
    if (!props.crate || isEmpty(props.crate)) {
        data.ready = false;
        data.crate = {};
        data.entity = {};
        return;
    }
    data.error = false;

    let profile = isEmpty(props.profile) ? {} : cloneDeep(props.profile);
    let crate = cloneDeep(props.crate);

    // does the profile have a context defined? yes - disable the context editor
    if (profile?.context) {
        data.configuration.enableContextEditor = false;
    } else {
        data.configuration.enableContextEditor = props.enableContextEditor;
    }

    data.crateManager = new CrateManager();
    data.crateManager.lookup = props.lookup;
    try {
        await data.crateManager.load({ crate, profile });
    } catch (error) {
        $emit("error", {
            errors: data.crateManager.errors,
        });
        data.error = true;
        ready();
        return;
    }

    if (props.entityId) {
        setCurrentEntity({ id: props.entityId });
    } else {
        data.entity = {};
        setCurrentEntity({ name: "RootDataset" });
    }

    ready();
}
function configure() {
    const configuration = {
        mode: props.mode,
        enableContextEditor: props.enableContextEditor,
        enableCratePreview: props.enableCratePreview,
        enableBrowseEntities: props.enableBrowseEntities,
        enableTemplateSave: props.enableTemplateSave,
        enableReverseLinkBrowser: props.enableReverseLinkBrowser,
        readonly: props.readonly,
        webComponent: props.webComponent,
        purgeUnlinkedEntities: props.purgeUnlinkedEntities,
        enableTemplateLookups: false,
        enableDataPackLookups: false,
        language: props.language,
        tabLocation: props.tabLocation,
        resetTabOnEntityChange: props.resetTabOnEntityChange,
        showControls: props.showControls,
    };

    i18next.changeLanguage(configuration.language);

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
async function setCurrentEntity({ id = undefined, name = undefined }) {
    // return if nothing requested
    if (!id && !name) return;

    // return if we're already on that entity
    if ((id || data.entity["@id"]) && id === data.entity["@id"]) return;

    let entity = {};
    if (name === "RootDataset") {
        entity = data.crateManager.getRootDataset();
    } else if (id) {
        entity = data.crateManager.getEntity({
            id,
        });
    }

    if (!isEmpty(entity) && entity["@id"] !== data.entity["@id"]) {
        updateRoute({ entity });
        // console.debug(`Render Entity Parent, load entity:`, { ...entity });
        data.entity = { ...entity };
    }
}
function updateRoute({ entity }) {
    $emit("navigation", { "@id": entity["@id"] });
    if (!$router || !$route || !props.enableInternalRouting) return;
    const encodedId = btoa(entity["@id"]);

    if (isEmpty($route?.query)) {
        $router?.replace({ query: { id: encodedId } });
    } else {
        $router?.push({ query: { id: encodedId } });
    }
}
function ready() {
    data.ready = true;
    $emit("ready");
}
async function saveCrate() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (props.purgeUnlinkedEntities) {
        data.crateManager.purgeUnlinkedEntities();
    }
    let crate = data.crateManager.exportCrate();
    console.debug("export crate", crate);
    // console.log(crate["@graph"].length, crate["@graph"]);
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
