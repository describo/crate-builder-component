<template>
    <el-dialog
        v-model="data.visible"
        title="Manage Collection Entities"
        width="95%"
        top="5vh"
        :before-close="close"
        :show-close="false"
    >
        <template #header>
            <div class="flex flex-row">
                <div>Manage Collection Entities</div>
                <div class="flex-grow"></div>
                <div>
                    <el-button @click="close" type="primary">
                        <i class="fas fa-times"></i>
                    </el-button>
                </div>
            </div>
        </template>
        <el-table :data="data.entities" class="w-full">
            <el-table-column prop="@id" label="@id" width="400" />
            <el-table-column prop="@type" label="@type" width="250" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="isConnected" label="Connected" width="180">
                <template #default="scope">
                    <div v-show="scope.row.isConnected" class="text-green-600">
                        <i class="fas fa-check"></i>
                    </div>
                    <div v-show="!scope.row.isConnected" class="text-red-600">
                        <i class="fas fa-times"></i>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="Actions" width="100">
                <template #default="scope">
                    <div class="flex flex-row space-x-2">
                        <div>
                            <el-button @click="loadEntity(scope.row.describoId)" size="small">
                                <i class="fas fa-edit"></i>
                            </el-button>
                        </div>
                        <div>
                            <el-popconfirm
                                title="Are you sure? This can't be undone."
                                width="300px"
                                @confirm="deleteEntity(scope.row.describoId)"
                            >
                                <template #reference>
                                    <el-button
                                        size="small"
                                        type="danger"
                                        v-if="scope.row.describoLabel !== 'RootDataset'"
                                    >
                                        <i class="fas fa-trash"></i>
                                    </el-button>
                                </template>
                            </el-popconfirm>
                        </div>
                    </div>
                </template>
            </el-table-column>
        </el-table>
    </el-dialog>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
});
const data = reactive({
    entities: [],
    visible: true,
});
const emit = defineEmits(["close", "load:entity", "delete:entity"]);
onMounted(() => {
    load();
    data.visible = true;
});
onBeforeUnmount(() => {
    data.visible = false;
});

function load() {
    data.entities = props.crateManager.getEntitiesBrowseList();
}

function close() {
    emit("close");
}
function loadEntity(describoId) {
    emit("load:entity", { describoId });
}
function deleteEntity(describoId) {
    emit("delete:entity", { describoId });
}
</script>