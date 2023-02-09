<template>
    <div class="flex flex-col">
        <describo-crate-builder
            :crate="data.crate"
            :profile="data.profile"
            :lookup="data.lookup"
            :readonly="data.readonly"
            :enable-context-editor="data.enableContextEditor"
            :enable-crate-preview="data.enableCratePreview"
            :enable-browse-entities="data.enableBrowseEntities"
            :enable-template-save="data.enableTemplateSave"
            @ready="ready"
            @error="error"
            @save:crate="saveCrate"
            @save:crate:template="saveCrateTemplate"
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
        enableContextEditor: $this?.config?.enableContextEditor ?? true,
        enableCratePreview: $this?.config?.enableCratePreview ?? true,
        enableBrowseEntities: $this?.config?.enableBrowseEntities ?? true,
        enableTemplateSave: $this?.config?.enableTemplateSave ?? false,
        readonly: $this?.config?.readonly ?? false,
    };
}

// Emit the same events as Shell.component.vue
const emit = defineEmits(["ready", "error", "save:crate", "save:crate:template"]);

function ready() {
    emit("ready");
}

function error(args) {
    emit("error", args);
}

function saveCrate(args) {
    emit("save:crate", args);
}

function saveCrateTemplate(args) {
    emit("save:crate:template", args);

}
</script>

<!--
We import the compiled css from the vue dir, because it is already built.
For now, font-awesome must be included here and also where the web component is used,
because for some reason it doesn't load the fonts here, only the css. Loading it again
in the react component is not an overhead as it will be already cached.
-->
<style>
@import "../../dist/vue/style.css";
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css");
</style>
