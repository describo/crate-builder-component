<template>
    <!-- <div class="flex flex-row space-x-1"> -->
    <div class="flex flex-row flex-wrap">
        <div v-for="(type, idx) of types" :key="idx">
            <el-button
                @click="toggle(type)"
                type="primary"
                class="focus:outline-none focus:border-2 focus:border-green-600 m-1"
            >
                <div v-show="!selectedType || selectedType !== type">
                    <i class="fas fa-plus"></i>
                </div>
                <div v-show="selectedType === type">
                    <i class="fas fa-times"></i>
                </div>
                &nbsp;{{ type }}
            </el-button>
        </div>
    </div>
    <!-- <div v-else> -->
    <!-- <el-select
        v-model="data.selectedType"
        :placeholder="$t('select_a_type_to_add')"
        @change="toggle"
        clearable
        class="w-full"
    >
        <el-option v-for="(type, idx) in data.allowedTypes" :key="idx" :label="type" :value="type">
        </el-option>
    </el-select> -->
    <!-- </div> -->
    <!-- </div> -->
</template>

<script setup>
// import { ElButton, ElSelect, ElOption } from "element-plus";
import { ElButton } from "element-plus";
import { computed } from "vue";
// import { $t } from "../i18n";

const props = defineProps({
    types: {
        type: [String, Array],
        required: true,
    },
    selectedType: {
        required: true,
    },
});

const emit = defineEmits(["add", "close"]);
let selectedType = computed(() => props.selectedType);
let types = computed(() => props.types);

function toggle(type) {
    if (props.selectedType === type) {
        emit("close");
    } else {
        emit("add", { type });
    }
}
</script>
