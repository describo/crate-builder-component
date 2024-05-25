<template>
    <div class="flex flex-col">
        <RenderEntity
            ref="renderEntity"
            v-if="ready && !error"
            :entity="contextEntity"
            @load:entity="setCurrentEntity"
            @save:crate="saveCrate"
            @save:entity:template="saveEntityAsTemplate"
        />
    </div>
</template>

<script setup>
import { propertyDefinitions } from "./property-definitions.js";
import RenderEntity from "./RenderEntity/Shell.component.vue";
import {
    ref,
    onMounted,
    onBeforeMount,
    onBeforeUnmount,
    watch,
    getCurrentInstance,
    shallowRef,
    toRaw,
    provide,
    computed,
} from "vue";
import {
    configurationKey,
    crateManagerKey,
    profileManagerKey,
    lookupsKey,
} from "./RenderEntity/keys.js";
import isEmpty from "lodash-es/isEmpty.js";
import debounce from "lodash-es/debounce.js";
import isFunction from "lodash-es/isFunction.js";
import { CrateManager } from "./CrateManager/crate-manager.js";
import { ProfileManager } from "./CrateManager/profile-manager.js";
import { useRouter, useRoute } from "vue-router";
import { $t, i18next } from "./i18n";
const debouncedEmitNavigation = debounce(emitNavigation, 500, { leading: true, trailing: false });

let $route, $router;
let watchers = [];
let warnings = {};
let errors = {};
const cm = shallowRef({});
const pm = shallowRef({});
const configuration = shallowRef({});
const lookups = shallowRef({});
const contextEntity = shallowRef({});
let ready = ref(false);
let error = ref(false);
let renderEntity = ref();

// Property definitions are now in the file: ./property-definitions.js
const props = defineProps(propertyDefinitions);

const $emit = defineEmits([
    "ready",
    "error",
    "warning",
    "navigation",
    "save:crate",
    "save:entity:template",
]);
defineExpose({
    cm,
    pm,
    setCurrentEntity,
    setTab: (tabName) => renderEntity.value.setTab(tabName),
    refresh: () => (contextEntity.value = { ...contextEntity.value }),
});

const $key = {
    pm: 0,
    cm: 0,
    conf: 0,
    lookups: 0,
};

provide(
    configurationKey,
    computed(() => configuration.value)
);
provide(
    crateManagerKey,
    computed(() => cm.value)
);
provide(
    profileManagerKey,
    computed(() => pm.value)
);
provide(
    lookupsKey,
    computed(() => lookups.value)
);

if (props.enableInternalRouting) {
    if (getCurrentInstance().appContext.config.globalProperties.$router) {
        $router = useRouter();
        $route = useRoute();
    }
}

onBeforeMount(() => {
    $router?.replace({ query: "" });
    configuration.value = configure();
    configuration.value.$key = $key.conf;
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
                // does the profile have a context defined? yes - disable the context editor
                if (props.profile?.context) {
                    configuration.value.enableContextEditor = false;
                } else {
                    configuration.value.enableContextEditor = props.enableContextEditor;
                }
                pm.value = new ProfileManager({
                    profile: structuredClone(toRaw(props.profile)) ?? {},
                });

                cm.value.setProfileManager(pm.value);
                if (pm.value.context) cm.value.setContext(pm.value.context);
                cm.value.$key = $key.cm += 1;
                pm.value.$key = $key.pm += 1;
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
                () => props.enableUrlMarkup,
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
                configuration.value.$key = $key.conf += 1;
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
        ready.value = false;
        contextEntity.value = {};
        warnings = {};
        errors = {};
        return;
    }
    error.value = false;

    // update the crate and profile managers
    cm.value = new CrateManager({
        crate: structuredClone(toRaw(props.crate)),
        entityTimestamps: props.enableEntityTimestamps,
    });
    pm.value = new ProfileManager({ profile: structuredClone(toRaw(props.profile)) ?? {} });
    if (pm.value.content) cm.value.setContext(pm.value.context);
    cm.value.setProfileManager(pm.value);

    // then bounce the $key which will trigger the watchers to
    //   run their local setups if required
    cm.value.$key = $key.cm += 1;
    pm.value.$key = $key.pm += 1;

    if (props.lookup) {
        lookups.value = props.lookup;
        lookups.value.$key = $key.lookups += 1;
    }

    errors = cm.value.getErrors();
    if (errors.hasError) {
        $emit("error", { errors });
        ready.value = false;
        error.value = true;
        return;
    }

    if (warnings.hasWarning) {
        warnings = cm.value.getWarnings();
        $emit("warning", { warnings });
    }

    if (props.entityId) {
        setCurrentEntity({ id: props.entityId });
    } else {
        contextEntity.value = {};
        setCurrentEntity({ id: "./" });
    }

    ready.value = true;
    $emit("ready");
    const t1 = performance.now();
    console.log(`Crate load time: ${t1 - t0}ms`);
}
function configure() {
    const configuration = {
        enableContextEditor: props.enableContextEditor,
        enableCratePreview: props.enableCratePreview,
        enableBrowseEntities: props.enableBrowseEntities,
        enableTemplateSave: props.enableTemplateSave,
        enableReverseLinkBrowser: props.enableReverseLinkBrowser,
        enableUrlMarkup: props.enableUrlMarkup,
        enableEntityTimestamps: props.enableEntityTimestamps,
        purgeUnlinkedEntities: props.purgeUnlinkedEntities,
        readonly: props.readonly,
        webComponent: props.webComponent,
        tabLocation: props.tabLocation,
        resetTabOnEntityChange: props.resetTabOnEntityChange,
        resetTabOnProfileChange: props.resetTabOnProfileChange,
        showControls: props.showControls,
        language: props.language,
        enableTemplateLookups: false,
        enableDataPackLookups: false,
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
async function setCurrentEntity({ id = undefined }) {
    // return if nothing requested
    if (!id) return;

    let entity = cm.value.getEntity({
        id,
    });

    if (!isEmpty(entity)) {
        updateRoute({ entity });
        contextEntity.value = entity;
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
async function saveCrate() {
    // await new Promise((resolve) => setTimeout(resolve, 100));
    if (props.purgeUnlinkedEntities) {
        cm.value.purgeUnlinkedEntities();
    }
    let crate = cm.value.exportCrate();
    console.debug("export crate", crate);
    // console.log(crate["@graph"].length, crate["@graph"]);
    $emit("save:crate", { crate });
}
function saveEntityAsTemplate(data) {
    let entity = cm.value.exportEntityTemplate({
        id: contextEntity.value["@id"],
        resolveDepth: parseInt(data.resolveDepth),
    });
    $emit("save:entity:template", { entity });
}
</script>
