<template>
    <div class="flex flex-col space-y-4">
        <div>
            <el-input
                v-model="data.filter"
                :placeholder="$t('filter_attribute_set')"
                clearable
            ></el-input>
        </div>
        <div
            v-for="(item, idx) in inputs"
            :key="idx"
            class="cursor-pointer p-2 hover:bg-blue-100 hover:rounded active:bg-blue-400"
            @click="handlePropertySelection(item)"
        >
            <div class="flex flex-col text-black">
                <div class="flex flex-row space-x-1 border-b border-gray-700">
                    <div v-if="item.label">
                        {{ item.label }}
                    </div>
                    <div v-else class="text-black">
                        {{ item.name }}
                    </div>
                    <div><i class="fa-solid fa-arrow-right"></i></div>
                    <div>{{ item.type.map((t) => `"${t}"`).join(", ") }}</div>
                </div>
                <div class="text-gray-600 w-full">
                    {{ item.help }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElInput } from "element-plus";
import { reactive, computed, watch } from "vue";
import { ProfileManager } from "../profile-manager";
import { $t } from "../i18n";

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
    let { inputs } = profileManager.getAllInputs({ entity: props.entity });
    if (!data.filter) return inputs;
    return inputs.filter((i) => {
        let re = new RegExp(data.filter, "i");
        return i.name.match(re) || i.help.match(re);
    });
});

function handlePropertySelection(item) {
    emit("add:property:placeholder", { property: item.name });
}
</script>
