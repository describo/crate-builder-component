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
            <el-select v-model="data.selectedLanguage" placeholder="Select a language">
                <el-option
                    v-for="item in data.languages"
                    :key="item.name"
                    :label="item.name"
                    :value="item.value"
                />
            </el-select>
            <el-select v-model="data.tabLocation" placeholder="Select a language">
                <el-option label="left" value="left" />
                <el-option label="top" value="top" />
                <el-option label="right" value="right" />
                <el-option label="bottom" value="bottom" />
            </el-select>
            <el-select v-model="data.readonly" placeholder="Select a language">
                <el-option :key="true" label="Readonly: True" :value="true" />
                <el-option :key="false" label="Readonly: False" :value="false" />
            </el-select>
        </div>
        <describo-crate-builder
            :crate="data.selectedCrate"
            :profile="data.selectedProfile"
            :lookup="lookup"
            :readonly="data.readonly"
            :enable-context-editor="true"
            :enable-crate-preview="true"
            :enable-browse-entities="true"
            :enable-template-save="true"
            :enable-internal-routing="true"
            :enable-reverse-link-browser="true"
            :purge-unlinked-entities="true"
            :web-component="false"
            :language="data.selectedLanguage"
            :tab-location="data.tabLocation"
        />
    </div>
</template>

<script setup>
import { reactive, nextTick } from "vue";
import { Lookup } from "./lookup.js";
import crateFile1 from "../examples/item/empty/ro-crate-metadata.json";
import crateFile2 from "../examples/item/complex-collection/ro-crate-metadata.json";
import crateFile3 from "../examples/item/complex-item/ro-crate-metadata.json";
import crateFile4 from "../examples/item/large-crate/ro-crate-metadata.json";
import crateFile5 from "../examples/item/ridiculously-big-collection/ro-crate-metadata.json";
import crateFile6 from "../examples/item/item-with-relationship-and-action/ro-crate-metadata.json";
import crateFile7 from "../examples/item/multiple-types/ro-crate-metadata.json";
import profile2 from "../examples/profile/profile-with-all-primitives-and-groups.json";
import profile4 from "../examples/profile/nyingarn-item-profile.json";
import profile5 from "../examples/profile/profile-with-all-primitives.json";
import profile6 from "../examples/profile/profile-with-resolve.json";
import profile8 from "../examples/profile/profile-to-test-multiple-types.json";
const lookup = new Lookup();

const data = reactive({
    loading: false,
    select: {
        crate: undefined,
        profile: undefined,
    },
    readonly: false,
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
        { value: profile5, name: profile5.metadata.name },
        { value: profile2, name: profile2.metadata.name },
        { value: profile8, name: profile8.metadata.name },
        { value: profile4, name: profile4.metadata.name },
        { value: profile6, name: profile6.metadata.name },
    ],
    languages: [
        { name: "English", value: "en" },
        { name: "Magyar", value: "hu" },
    ],

    selectedCrate: undefined,
    selectedProfile: undefined,
    selectedLanguage: "en",
    tabLocation: "left",
});

function setCrate(name) {
    let crate = name ? data.crates.filter((c) => c.name === name)[0].value : undefined;
    setTimeout(() => {
        data.selectedCrate = crate;
    }, 10);
}
function setProfile(name) {
    data.selectedProfile = name ? data.profiles.filter((p) => p.name === name)[0].value : undefined;
}
function setLanguage(value) {
    data.selectedLanguage = value
        ? data.languages.filter((p) => p.name === value)[0].value
        : undefined;
}
</script>
