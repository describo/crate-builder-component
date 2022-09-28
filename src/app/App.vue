<template>
    <div class="p-4 flex flex-col space-y-2">
        <div class="flex flex-row space-x-4">
            <el-select v-model="data.selectedCrate" placeholder="Select a crate">
                <el-option
                    v-for="item in data.crates"
                    :key="item.value"
                    :label="item.name"
                    :value="item.value"
                />
            </el-select>
            <el-select v-model="data.selectedProfile" placeholder="Select a profile">
                <el-option
                    v-for="item in data.profiles"
                    :key="item.value"
                    :label="item.name"
                    :value="item.value"
                />
            </el-select>
        </div>
        <describo-crate-builder :crate="data.selectedCrate" :profile="data.selectedProfile" />
    </div>
</template>

<script setup>
import { reactive, onMounted } from "vue";
import crateFile1 from "../examples/collection/NT5/ro-crate-metadata.json";
import crateFile2 from "../examples/item/NT1-98007/ro-crate-metadata.json";
import profile1 from "../examples/profile/test-profile-without-groups.json";
import profile2 from "../examples/profile/test-profile-with-groups.json";

const data = reactive({
    crates: [
        { name: "NT5", value: crateFile1 },
        { name: "NT1-98007", value: crateFile2 },
    ],
    profiles: [
        { name: "Profile without groups", value: profile1 },
        { name: "Profile with groups", value: profile2 },
    ],
    selectedCrate: undefined,
    selectedProfile: undefined,
});
onMounted(async () => {
    await init();
});
async function init() {}
</script>
