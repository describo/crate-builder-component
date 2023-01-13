<template>
    <div class="flex flex-col space-y-2">
        <div class="flex flex-row">
            <div>Add a property to this entity</div>
            <div class="flex-grow"></div>
            <div>
                <el-button @click="close" type="primary"><i class="fas fa-times"></i></el-button>
            </div>
        </div>
        <div>
            <el-input
                v-model="data.filter"
                placeholder="filter the attribute set"
                clearable
            ></el-input>
        </div>
        <div class="flex flex-row space-x-2">
            <div class="flex-grow">
                <div class="h-48 overflow-scroll border p-4 bg-white flex flex-col space-y-1">
                    <div
                        v-for="(item, idx) in inputs"
                        :key="idx"
                        class="cursor-pointer p-1 hover:bg-gray-100"
                        @click="handlePropertySelection(item)"
                    >
                        <div class="flex flex-row">
                            <div class="w-64 text-gray-600" v-if="item.label">
                                {{ item.label }}
                            </div>
                            <div class="w-64 text-gray-600" v-else>
                                {{ item.name }}
                            </div>
                            <div class="text-gray-500 w-full">
                                {{ item.help }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import AddComponent from "./Add.component.ce.vue";
import { reactive, computed, watch } from "vue";
import { ProfileManager } from "../profile-manager";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    entity: {
        type: [Object, undefined],
        required: true,
    },
});
const data = reactive({
    selectedProperty: undefined,
    addType: undefined,
    filter: undefined,
});
const emit = defineEmits(["close", "add:property:placeholder"]);
watch(
    () => props.entity,
    () => (data.filter = undefined)
);

let inputs = computed(() => {
    if (!props.entity["@type"]) return [];
    const profileManager = new ProfileManager({ profile: props.crateManager.profile });
    let { inputs } = profileManager.getInputs({ types: props.entity["@type"] });
    if (!data.filter) return inputs;
    return inputs.filter((i) => {
        let re = new RegExp(data.filter, "i");
        return i.name.match(re) || i.help.match(re);
    });
});

function close() {
    data.selectedProperty = undefined;
    emit("close");
}
function handlePropertySelection(item) {
    emit("add:property:placeholder", { property: item.name });
}
</script>
