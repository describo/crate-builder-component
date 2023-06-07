<template>
    <div class="flex flex-row space-x-1">
        <div class="flex flex-row flex-wrap space-x-1" v-if="data.allowedTypes.length < 8">
            <div v-for="(type, idx) of data.allowedTypes" :key="idx">
                <el-button
                    @click="toggle(type)"
                    type="primary"
                    class="focus:outline-none focus:border-2 focus:border-green-600"
                >
                    <div v-show="!data.selectedType">
                        <i class="fas fa-plus"></i>
                    </div>
                    <div v-show="data.selectedType">
                        <i class="fas fa-times"></i>
                    </div>
                    &nbsp;{{ type }}
                </el-button>
            </div>
        </div>
        <div v-else>
            <el-select
                v-model="data.selectedType"
                :placeholder="$t('select_a_type_to_add')"
                @change="toggle"
                clearable
                class="w-full"
            >
                <el-option
                    v-for="(type, idx) in data.allowedTypes"
                    :key="idx"
                    :label="type"
                    :value="type"
                >
                </el-option>
            </el-select>
        </div>
    </div>
</template>

<script setup>
import { ElButton, ElSelect, ElOption } from "element-plus";
import isArray from "lodash-es/isArray";
import { reactive, onMounted, watch } from "vue";
import { $t } from "../i18n";

const props = defineProps({
    types: {
        type: [String, Array],
        required: true,
    },
});

const emit = defineEmits(["add", "close"]);
const data = reactive({
    selectedType: undefined,
    allowedTypes: [],
    typeExclusions: ["File", "Dataset"],
});
watch(
    () => props.types,
    () => {
        init();
    }
);
onMounted(() => {
    init();
});
function init() {
    let types = props.types;
    if (!isArray(types)) {
        types = [types];
    }
    let allowedTypes = types.filter((type) => !data.typeExclusions.includes(type));
    data.allowedTypes = allowedTypes;
}
function toggle(type) {
    if (data.selectedType === type) {
        emit("close");
    } else {
        emit("add", { type });
    }
    data.selectedType = undefined;
}
</script>
