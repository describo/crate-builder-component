<template>
    <div class="flex flex-col">
        <render-entity-component
            v-if="data.ready && !data.error"
            :crate-manager="crateManager"
            :profile="profile"
            :entity="contextEntity"
            :configuration="configuration"
            @load:entity="setCurrentEntity"
            @ready="ready"
            @save:crate="saveCrate"
            @save:entity:template="saveEntityAsTemplate"
        />
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
    shallowRef,
} from "vue";
import flattenDeep from "lodash-es/flattenDeep";
import cloneDeep from "lodash-es/cloneDeep";
import isEmpty from "lodash-es/isEmpty";
import debounce from "lodash-es/debounce";
import isFunction from "lodash-es/isFunction";
import { CrateManager } from "./crate-manager.js";
import { useRouter, useRoute } from "vue-router";
import { $t, i18next } from "./i18n";
const debouncedEmitNavigation = debounce(emitNavigation, 1000, { leading: true, trailing: false });

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
    resetTabOnProfileChange: {
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
    "warning",
    "navigation",
    "save:crate",
    "save:entity:template",
]);

if (props.enableInternalRouting) {
    if (getCurrentInstance().appContext.config.globalProperties.$router) {
        $router = useRouter();
        $route = useRoute();
    }
}

let warnings = {};
let errors = {};
const crateManager = shallowRef({});
const crate = shallowRef({});
const profile = shallowRef({});
const configuration = shallowRef({});
const contextEntity = shallowRef({});
let watchers = [];

const data = reactive({
    ready: false,
    error: false,
});

onBeforeMount(() => {
    $router?.replace({ query: "" });
    configuration.value = configure();
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
                profile.value = isEmpty(props.profile) ? {} : cloneDeep(props.profile);
                crateManager.value.profile = profile.value;

                // does the profile have a context defined? yes - disable the context editor
                if (profile?.context) {
                    configuration.value.enableContextEditor = false;
                } else {
                    configuration.value.enableContextEditor = props.enableContextEditor;
                }
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
                () => props.resetTabOnProfileChange,
                () => props.showControls,
            ],
            () => {
                configuration.value = configure();
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
    const t0 = performance.now();
    if (!props.crate || isEmpty(props.crate)) {
        data.ready = false;
        crate.value = {};
        contextEntity.value = {};
        warnings = {};
        errors = {};
        return;
    }
    data.error = false;

    profile.value = isEmpty(props.profile) ? {} : cloneDeep(props.profile);
    crate.value = cloneDeep(props.crate);

    crateManager.value = new CrateManager();
    crateManager.value.lookup = props.lookup;
    let outcome = await crateManager.value.load({ crate: crate.value, profile: profile.value });
    errors = { ...errors, ...outcome.errors };
    warnings = { ...warnings, ...outcome.warnings };
    $emit("warning", { warnings });
    $emit("error", { errors });

    data.error =
        flattenDeep(Object.keys(errors).map((errorType) => errors[errorType].data)).length > 0;
    if (data.error) {
        return;
    }

    if (props.entityId) {
        setCurrentEntity({ id: props.entityId });
    } else {
        contextEntity.value = {};
        setCurrentEntity({ name: "RootDataset" });
    }

    ready();
    const t1 = performance.now();
    console.log(`Crate load time: ${t1 - t0}ms`);
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
        resetTabOnProfileChange: props.resetTabOnProfileChange,
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

    let entity = {};
    if (name === "RootDataset") {
        entity = crateManager.value.getRootDataset();
    } else if (id) {
        entity = crateManager.value.getEntity({
            id,
        });
    }

    if (!isEmpty(entity)) {
        updateRoute({ entity });
        contextEntity.value = { ...entity };
    }
}
function updateRoute({ entity }) {
    debouncedEmitNavigation({ entity });

    if (!$router || !$route || !props.enableInternalRouting) return;
    const encodedId = btoa(entity["@id"]);

    if (isEmpty($route?.query)) {
        $router?.replace({ query: { id: encodedId } });
    } else {
        $router?.push({ query: { id: encodedId } });
    }
}
function emitNavigation({ entity }) {
    $emit("navigation", { "@id": entity["@id"], "@type": entity["@type"], name: entity.name });
}
function ready() {
    data.ready = true;
    $emit("ready");
}
async function saveCrate() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (props.purgeUnlinkedEntities) {
        crateManager.value.purgeUnlinkedEntities();
    }
    let crate = crateManager.value.exportCrate();
    console.debug("export crate", crate);
    // console.log(crate["@graph"].length, crate["@graph"]);
    $emit("save:crate", { crate });
}
function saveEntityAsTemplate(template) {
    let entity = crateManager.value.exportEntityTemplate({ id: contextEntity.value["@id"] });
    $emit("save:entity:template", { entity });
}
</script>
