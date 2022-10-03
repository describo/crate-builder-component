<template>
    <div class="p-4 flex flex-col space-y-2">
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
        />
    </div>
</template>

<script setup>
import { reactive } from "vue";
import { Lookup } from "./lookup.js";
import crateFile1 from "../examples/blank-ro-crate-metadata.json";
import crateFile2 from "../examples/collection/NT5/ro-crate-metadata.json";
import crateFile3 from "../examples/item/NT1-98007/ro-crate-metadata.json";
import profile1 from "../examples/profile/test-profile-without-groups.json";
import profile2 from "../examples/profile/test-profile-with-groups.json";
import profile3 from "../examples/profile/test-profile-with-datapacks-and-without-groups.json";
const lookup = new Lookup();

const data = reactive({
    select: {
        crate: undefined,
        profile: undefined,
    },
    crates: [
        { name: "blank", value: crateFile1 },
        { name: "NT5", value: crateFile2 },
        { name: "NT1-98007", value: crateFile3 },
    ],
    profiles: [
        { name: "Profile -groups", value: profile1 },
        { name: "Profile +groups", value: profile2 },
        { name: "Profile +datapacks, -groups", value: profile3 },
    ],
    selectedCrate: undefined,
    selectedProfile: undefined,
});

function setCrate(name) {
    data.selectedCrate = name ? data.crates.filter((c) => c.name === name)[0].value : undefined;
}
function setProfile(name) {
    data.selectedProfile = name ? data.profiles.filter((p) => p.name === name)[0].value : undefined;
}
</script>
