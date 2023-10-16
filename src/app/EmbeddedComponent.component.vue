<template>
    <div class="flex flex-row space-x-2">
        <div class="flex flex-col space-y-2 w-4/6">
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
            </div>
            <describo-crate-builder
                :crate="data.selectedCrate"
                :profile="data.selectedProfile"
                :lookup="lookup"
                :readonly="data.configuration.readonly"
                :enable-context-editor="data.configuration.enableContextEditor"
                :enable-crate-preview="data.configuration.enableCratePreview"
                :enable-browse-entities="data.configuration.enableBrowseEntities"
                :enable-template-save="data.configuration.enableTemplateSave"
                :enable-internal-routing="true"
                :enable-reverse-link-browser="data.configuration.enableReverseLinkBrowser"
                :enable-profile-validation="data.configuration.enableProfileValidation"
                :purge-unlinked-entities="data.configuration.purgeUnlinkedEntities"
                :web-component="false"
                :language="data.configuration.language"
                :tab-location="data.configuration.tabLocation"
                :show-controls="data.configuration.showControls"
                @error="logErrors"
                @warning="logWarnings"
            />
        </div>

        <div class="flex flex-col space-y-2 w-2/6 p-4 border-slate-200 border-2">
            <div>Component Controls</div>
            <el-form label-width="250px">
                <el-form-item label="Language">
                    <el-select
                        v-model="data.configuration.language"
                        placeholder="Select a language"
                    >
                        <el-option
                            v-for="item in data.languages"
                            :key="item.name"
                            :label="item.name"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="Tab Location">
                    <el-select v-model="data.configuration.tabLocation">
                        <el-option label="Tabs: left" value="left" />
                        <el-option label="Tabs: top" value="top" />
                        <el-option label="Tabs: right" value="right" />
                        <el-option label="Tabs: bottom" value="bottom" />
                    </el-select>
                </el-form-item>
                <el-form-item label="Set to readonly">
                    <el-switch v-model="data.configuration.readonly" />
                </el-form-item>
                <el-form-item label="Enable component controls">
                    <el-switch v-model="data.configuration.showControls" />
                </el-form-item>
                <el-form-item label="Enable Context Editor">
                    <el-switch v-model="data.configuration.enableContextEditor" />
                </el-form-item>
                <el-form-item label="Enable Crate Preview">
                    <el-switch v-model="data.configuration.enableCratePreview" />
                </el-form-item>
                <el-form-item label="Enable Browse Entities">
                    <el-switch v-model="data.configuration.enableBrowseEntities" />
                </el-form-item>
                <el-form-item label="Enable Reverse Link Browser">
                    <el-switch v-model="data.configuration.enableReverseLinkBrowser" />
                </el-form-item>
                <el-form-item label="Enable Profile Validation">
                    <el-switch v-model="data.configuration.enableProfileValidation" />
                </el-form-item>
                <el-form-item label="Enable Template Save">
                    <el-switch v-model="data.configuration.enableTemplateSave" />
                </el-form-item>
                <el-form-item label="Purge Unlinked Entities">
                    <el-switch v-model="data.configuration.purgeUnlinkedEntities" />
                </el-form-item>
                <el-form-item label="Reset Tab on Entity Change">
                    <el-switch v-model="data.configuration.resetTabOnEntityChange" />
                </el-form-item>
                <el-form-item label="Reset Tab on Profile Change">
                    <el-switch v-model="data.configuration.resetTabOnProfileChange" />
                </el-form-item>
            </el-form>
        </div>
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
import profile1 from "../examples/profile/profile-with-all-primitives.json";
import profile2 from "../examples/profile/profile-with-all-primitives-and-groups.json";
import profile3 from "../examples/profile/profile-to-test-multiple-types.json";
import profile4 from "../examples/profile/profile-with-resolve.json";
import profile5 from "../examples/profile/nyingarn-item-profile.json";
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
        { value: profile1, name: profile1.metadata.name },
        { value: profile2, name: profile2.metadata.name },
        { value: profile3, name: profile3.metadata.name },
        { value: profile4, name: profile4.metadata.name },
        { value: profile5, name: profile5.metadata.name },
    ],
    languages: [
        { name: "English", value: "en" },
        { name: "Magyar", value: "hu" },
    ],

    selectedCrate: undefined,
    selectedProfile: undefined,
    configuration: {
        language: "en",
        enableContextEditor: true,
        enableCratePreview: true,
        enableBrowseEntities: true,
        enableTemplateSave: true,
        enableReverseLinkBrowser: true,
        enableProfileValidation: true,
        purgeUnlinkedEntities: true,
        readonly: false,
        language: "en",
        tabLocation: "left",
        resetTabOnEntityChange: true,
        resetTabOnProfileChange: true,
        showControls: true,
    },
});

function setCrate(name) {
    let crate = name ? data.crates.filter((c) => c.name === name)[0].value : undefined;
    setTimeout(() => {
        data.selectedCrate = crate;
    }, 5);
}
function setProfile(name) {
    data.selectedProfile = name ? data.profiles.filter((p) => p.name === name)[0].value : undefined;
}
function logErrors({ errors }) {
    console.log(`errors:`, { ...errors });
}
function logWarnings({ warnings }) {
    console.log(`warnings:`, { ...warnings });
}
</script>
