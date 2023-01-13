<template>
        <describo-crate-builder
        :crate="crate"
        :profile="profile"
        :lookup="lookup"
        :enable-context-editor="true"
        :enable-crate-preview="true"
        :enable-browse-entities="true"
        :purge-unlinked-entities-before-save="true"
        @save:crate="saveCrate"
        @save:crate:template="saveTemplate"
        @save:entity:template="saveTemplate"
        @route-change="handleRouteChange">
    </describo-crate-builder>
</template>

<script>
import { defineComponent } from 'vue';
import router from "../main.js";
import DescriboCrateBuilder from "../../../crate-builder/index.js";

export default defineComponent({
    name: "CrateBuilder",
    props: {
        crate: Object,
        profile: Object
    },
    methods: {
        saveCrate(updatedCrate) {
            let crate;
            if (updatedCrate.detail) {
                crate = updatedCrate.detail[0]
            } else {
                crate = updatedCrate
            }
            this.$emit("save-crate", crate)
        },
        handleRouteChange(event) {
            const entity = event.detail[0];
            router.replace(`?id=${entity.describoId}`);
        }
    }
})
</script>
