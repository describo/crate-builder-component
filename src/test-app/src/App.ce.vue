<template>
  <div class="flex flex-row">
    <CrateBuilder 
      :crate="data.crate"
      :profile="data.profile"
      @save-crate="saveCrate"
    />

    <Preview :metadataJSON="savedCrate"/>
  </div>
</template>

<script>
import { defineComponent} from 'vue';

import CrateBuilder from './components/CrateBuilder.ce.vue';
import TestJSON from './data/ro-crate-metadata.json';
import Preview from "./components/Preview.ce.vue";

export default defineComponent({
  name: 'App',
  components: {
    Preview,
    CrateBuilder
  },
  data() {
    return {
      data: {
        crate: TestJSON,
        profile: {}
      },
      savedCrate: TestJSON,
      shadow: this.shadowRoot
    }
  },
  methods: {
    saveCrate(updatedCrate) {
      this.savedCrate = updatedCrate.crate
      console.log("Updated Crate")
    }
  }
})
</script>
<style>
@import url("./style/style.css");
</style>


