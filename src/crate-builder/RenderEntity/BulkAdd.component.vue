<template>
    <div class="flex flex-col space-y-2 m-1">
        <div class="my-1 text-lg text-center">
            Note beforehand: This does not lookup existing entities.
        </div>
        <div>
            @type
            <el-select v-model="selectedType" placeholder="Select a type" clearable>
                <el-option
                    v-for="type of props.types.filter(
                        (t) => !props.simpleTypes.includes(t) && t !== 'ANY'
                    )"
                    :key="type"
                    :label="type"
                    :value="type"
                ></el-option>
            </el-select>
        </div>
        <div class="flex flex-row space-x-1">
            <div class="w-1/2">@id</div>
            <div class="w-1/2">name</div>
            <div class="w-12"></div>
        </div>
        <div v-for="(row, idx) of data" class="flex flex-row space-x-1">
            <el-input v-model="row.id"></el-input>
            <el-input v-model="row.name"></el-input>
            <div>
                <el-button type="danger" @click="deleteRow(idx)">
                    <FontAwesomeIcon :icon="faTrash"></FontAwesomeIcon>
                </el-button>
            </div>
        </div>
        <div class="flex flex-row place-content-between">
            <div>
                <el-button type="primary" @click="addRow">
                    <FontAwesomeIcon :icon="faPlus"> </FontAwesomeIcon>&nbsp; Add row
                </el-button>
            </div>
            <div>
                <el-button type="primary" @click="createEntities" :disabled="!selectedType">
                    Create these entities</el-button
                >
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { ElButton, ElInput, ElSelect, ElOption } from "element-plus";
import { ref } from "vue";

const props = defineProps({
    types: {
        type: [String, Array],
        required: true,
    },
    simpleTypes: {
        type: Array,
        required: true,
    },
});
const $emit = defineEmits(["create:entity"]);

type DataRow = {
    id: string;
    name: string;
};
const selectedType = ref();
const data = ref<DataRow[]>([
    { id: "", name: "" },
    { id: "", name: "" },
    { id: "", name: "" },
    { id: "", name: "" },
    { id: "", name: "" },
]);

function addRow() {
    data.value.push({ id: "", name: "" });
}

function deleteRow(n: number) {
    data.value.splice(n, 1);
}

function createEntities() {
    for (let entity of data.value) {
        if (entity.id && entity.name)
            $emit("create:entity", {
                json: {
                    "@id": entity.id,
                    "@type": selectedType.value,
                    name: entity.name,
                },
            });
    }
}
</script>
