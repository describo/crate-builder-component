<template>
    <div class="flex flex-col">
        <describo-crate-builder
            :crate="data.crate"
            :profile="data.profile"
            :lookup="data.lookup"
            :entityId="data.entityId"
            :enable-context-editor="data.enableContextEditor"
            :enable-crate-preview="data.enableCratePreview"
            :enable-browse-entities="data.enableBrowseEntities"
            :enable-template-save="data.enableTemplateSave"
            :enable-internal-routing="data.enableInternalRouting"
            :enable-reverse-link-browser="data.enableReverseLinkBrowser"
            :purge-unlinked-entities="data.purgeUnlinkedEntities"
            :readonly="data.readonly"
            :web-component="data.webComponent"
            :tab-location="data.tabLocation"
            :reset-tab-on-entity-change="data.resetTabOnEntityChange"
            :show-controls="data.showControls"
            :language="data.language"
            @ready="ready"
            @error="error"
            @save:crate="saveCrate"
            @save:crate:template="saveCrateTemplate"
            @save:entity:template="saveEntityTemplate"
            @navigation="navigation"
        />
    </div>
</template>

<script setup>
import { computed, watch, reactive } from "vue";
import DescriboCrateBuilder from "./Shell.component.vue";

const props = defineProps({
    config: {
        type: String,
        required: true,
    },
    // WC props are all lowercase
    configversion: {
        type: String,
        required: true,
    },
});

const $emit = defineEmits([
    "ready",
    "error",
    "save:crate",
    "save:crate:template",
    "save:entity:template",
    "navigation",
]);

let data = reactive(init());

watch(
    () => props.configversion,
    () => (data = { ...init() })
);

function init() {
    let $this = globalThis[props.config];

    return {
        crate: $this.crate,
        profile: $this.profile,
        lookup: $this.lookup,
        entityId: $this.entityId,
        enableContextEditor: $this?.config?.enableContextEditor ?? true,
        enableCratePreview: $this?.config?.enableCratePreview ?? true,
        enableBrowseEntities: $this?.config?.enableBrowseEntities ?? true,
        enableTemplateSave: $this?.config?.enableTemplateSave ?? false,
        enableInternalRouting: $this?.config?.enableInternalRouting ?? false,
        enableReverseLinkBrowser: $this?.config?.enableReverseLinkBrowser ?? true,
        purgeUnlinkedEntities: $this?.config?.purgeUnlinkedEntities ?? true,
        readonly: $this?.config?.readonly ?? false,
        webComponent: $this?.config?.webComponent ?? true,
        tabLocation: $this?.config?.tabLocation ?? "left",
        resetTabOnEntityChange: $this?.config?.resetTabOnEntityChange ?? true,
        showControls: $this?.config?.showControls ?? true,
        language: $this?.config?.language ?? "en",
    };
}

function ready() {
    $emit("ready");
}

function error(args) {
    $emit("error", args);
}

function saveCrate(args) {
    $emit("save:crate", args);
}

function saveCrateTemplate(args) {
    $emit("save:crate:template", args);
}
function saveEntityTemplate(args) {
    $emit("save:entity:template", args);
}

function navigation(args) {
    $emit("navigation", args);
}
</script>
