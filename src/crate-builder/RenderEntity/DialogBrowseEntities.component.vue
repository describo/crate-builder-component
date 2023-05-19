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
        <div class="crate-entity-display overflow-scroll pr-2">
            <el-pagination
                v-model:currentPage="data.currentPage"
                layout="total, prev, pager, next, jumper"
                :total="data.entities.length"
                @current-change="update"
            />
            <el-table :data="data.page" @sort-change="sort">
                <el-table-column prop="@id" label="@id" width="400" sortable />
                <el-table-column prop="@type" label="@type" width="250" sortable />
                <el-table-column prop="name" label="Name" sortable />
                <el-table-column prop="isConnected" label="Linked" width="100" align="center">
                    <template #default="scope">
                        <div v-show="scope.row.isConnected" class="text-green-600">
                            <i class="fas fa-check"></i>
                        </div>
                        <div v-show="!scope.row.isConnected" class="text-red-600">
                            <i class="fas fa-times"></i>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="Actions" width="100" align="center">
                    <template #default="scope">
                        <div class="flex flex-row space-x-2">
                            <div>
                                <el-button @click="loadEntity(scope.row.describoId)" size="small">
                                    <i class="fas fa-edit"></i>
                                </el-button>
                            </div>
                            <div v-if="scope.row.describoLabel !== 'RootDataset'">
                                <el-popconfirm
                                    title="Are you sure? This can't be undone."
                                    width="300px"
                                    @confirm="deleteEntity(scope.row.describoId)"
                                >
                                    <template #reference>
                                        <el-button size="small" type="danger">
                                            <i class="fas fa-trash"></i>
                                        </el-button>
                                    </template>
                                </el-popconfirm>
                            </div>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </el-dialog>
</template>

<script setup>
import {
    ElButton,
    ElDialog,
    ElTable,
    ElTableColumn,
    ElPopconfirm,
    ElPagination,
} from "element-plus";
import { reactive, onMounted, onBeforeUnmount } from "vue";
import orderBy from "lodash-es/orderBy";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
});
const data = reactive({
    entities: [],
    currentPage: 1,
    page: [],
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
    update(1);
}
function update(page) {
    data.page = data.entities.slice((page - 1) * 10, (page - 1) * 10 + 10);
}
function sort({ prop, order }) {
    if (!order || order === "ascending") {
        order = "asc";
    } else {
        order = "desc";
    }
    data.entities = orderBy(data.entities, [prop], [order]);
    update(1);
}
function close() {
    if (!props.crateManager.getEntity({ describoId: props.crateManager.currentEntity })) {
        loadEntity(props.crateManager.getRootDataset().describoId);
    } else {
        emit("load:entity", { describoId: props.crateManager.currentEntity });
    }
    emit("close");
}
function loadEntity(describoId) {
    emit("load:entity", { describoId });
}
function deleteEntity(describoId) {
    emit("delete:entity", { describoId });
    load();
}
</script>

<style scoped>
.crate-entity-display {
    height: 70vh;
}
</style>
