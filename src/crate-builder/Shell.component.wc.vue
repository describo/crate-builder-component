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
</script>
