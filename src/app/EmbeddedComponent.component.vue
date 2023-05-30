<template>
    <div class="flex flex-col space-y-2">
        <div class="flex flex-row space-x-4">
            <el-select
                v-model="data.select.crate"
                @change="setCrate"
                placeholder="Select a crate"
                clearable
            >
                <el-option
                    v-for="item in data.crates"
                    :key="item.name"
                    :label="item.name"
                    :value="item.name"
                />
            </el-select>
            <el-select
                v-model="data.select.profile"
                @change="setProfile"
                placeholder="Select a profile"
                clearable
            >
                <el-option
                    v-for="item in data.profiles"
                    :key="item.name"
                    :label="item.name"
                    :value="item.name"
                />
            </el-select>
            <el-select
                v-model="data.select.language"
                @change="setLanguage"
                placeholder="Select a language"
                clearable
            >
                <el-option
                    v-for="item in data.languages"
                    :key="item.name"
                    :label="item.name"
                    :value="item.name"
                />
            </el-select>

        </div>
        <describo-crate-builder
            @ready="data.loading = false"
            :crate="data.selectedCrate"
            :profile="data.selectedProfile"
            :lookup="lookup"
            :readonly="false"
            :enable-context-editor="true"
            :enable-crate-preview="true"
            :enable-browse-entities="true"
            :enable-template-save="true"
            :enable-internal-routing="true"
            :enable-reverse-link-browser="true"
            :purge-unlinked-entities="true"
            :web-component="false"
            :language="data.selectedLanguage"
        />
    </div>
</template>

<script setup>
import { reactive } from "vue";
import { Lookup } from "./lookup.js";
import crateFile1 from "../examples/item/empty/ro-crate-metadata.json";
import crateFile2 from "../examples/item/complex-collection/ro-crate-metadata.json";
import crateFile3 from "../examples/item/complex-item/ro-crate-metadata.json";
import crateFile4 from "../examples/item/large-crate/ro-crate-metadata.json";
import crateFile5 from "../examples/item/ridiculously-big-collection/ro-crate-metadata.json";
import crateFile6 from "../examples/item/item-with-relationship-and-action/ro-crate-metadata.json";
import crateFile7 from "../examples/item/multiple-types/ro-crate-metadata.json";
import profile1 from "../examples/profile/test-profile-without-groups.json";
import profile2 from "../examples/profile/test-profile-with-groups.json";
import profile3 from "../examples/profile/test-profile-with-datapacks-and-without-groups.json";
import profile4 from "../examples/profile/nyingarn-item-profile.json";
import profile5 from "../examples/profile/profile-with-all-primitives.json";
import profile6 from "../examples/profile/test-profile-with-resolve.json";
import profile7 from "../examples/profile/profile-with-all-primitives-groups-no-about.json";
import profile8 from "../examples/profile/profile-to-test-multiple-types.json";
const lookup = new Lookup();

const data = reactive({
    loading: false,
    select: {
        crate: undefined,
        profile: undefined,
        language: undefined,
    },
    crates: [
        { name: "blank", value: crateFile1 },
        { name: "Multiple Types", value: crateFile7 },
        { name: "Complex Collection", value: crateFile2 },
        { name: "Complex Item", value: crateFile3 },
        { name: "Large Crate", value: crateFile4 },
        { name: "Ridiculously Big Crate", value: crateFile5 },
        { name: "Item with Relationship and Action", value: crateFile6 },
    ],
    profiles: [
        { name: "All primitives", value: profile5 },
        { name: "Profile with multiple types", value: profile8 },
        { name: "Profile without groups", value: profile1 },
        { name: "Profile with groups", value: profile2 },
        { name: "Profile with datapacks and without groups", value: profile3 },
        { name: "Test profile with resolve", value: profile6 },
        { name: "Primitives and bad group definition", value: profile7 },
        { name: "Profile Nyingarn Item", value: profile4 },
    ],
    languages: [
        { name: "English", value: "en" },
        { name: "Magyar", value: "hu" },
    ],

    selectedCrate: undefined,
    selectedProfile: undefined,
    selectedLanguage: "en"
});

function setCrate(name) {
    data.loading = true;
    data.selectedCrate = name ? data.crates.filter((c) => c.name === name)[0].value : undefined;
    if (!data.selectedCrate) data.loading = false;
}
function setProfile(name) {
    data.selectedProfile = name ? data.profiles.filter((p) => p.name === name)[0].value : undefined;
}
function setLanguage(name) {
    data.selectedLanguage = name ? data.languages.filter((p) => p.name === name)[0].value : undefined;
}

</script>
