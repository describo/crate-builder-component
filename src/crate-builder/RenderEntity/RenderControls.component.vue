<template>
    <div>
        <div class="flex flex-row space-x-1 py-2 mb-2 border-b-2 border-gray-700">
            <!-- navbar : controls -->
            <div>
                <!-- go to root dataset -->
                <el-button
                    @click="loadRootDataset"
                    type="primary"
                    :disabled="isRootDataset"
                    v-if="configuration.mode === 'embedded'"
                >
                    <i class="fa-solid fa-house"></i>
                    &nbsp; Root Dataset
                </el-button>
            </div>
            <div>
                <!-- add property -->
                <el-button
                    @click="toggle('addProperty')"
                    type="primary"
                    :disabled="definition !== 'inherit'"
                >
                    <i class="fas fa-code"></i>
                    &nbsp; Add
                </el-button>
            </div>
            <div v-if="configuration.enableContextEditor">
                <!-- edit context -->
                <el-button @click="toggle('editContext')" type="primary">
                    <i class="fa-solid fa-pen-to-square"></i>
                    &nbsp;Edit Context
                </el-button>
            </div>
            <div v-if="configuration.enableCratePreview">
                <!-- preview crate -->
                <el-button @click="toggle('previewCrate')" type="primary">
                    <i class="fa-solid fa-eye"></i>
                    &nbsp;Preview
                </el-button>
            </div>
            <div v-if="configuration.enableBrowseEntities">
                <!-- browse crate entities -->
                <el-button @click="toggle('browseEntities')" type="primary">
                    <i class="fa-solid fa-layer-group"></i>
                    &nbsp;Browse Entities
                </el-button>
            </div>
            <div class="flex flex-row space-x-1">
                <div v-if="configuration.enableTemplateSave && isRootDataset">
                    <!-- save crate as template -->
                    <el-button
                        @click="toggle('saveCrateAsTemplate')"
                        type="primary"
                        :disabled="!isRootDataset"
                    >
                        <div class="inline-block">
                            <i class="fas fa-save"></i>
                        </div>
                        <div
                            class="inline-block ml-1 xl:inline-block xl:ml-1"
                            :class="{ hidden: entity.etype === 'File' }"
                        >
                            Save Crate as Template
                        </div>
                    </el-button>
                </div>
                <div v-if="configuration.enableTemplateSave && !isRootDataset">
                    <!-- save entity as template -->
                    <el-button
                        @click="saveEntityAsTemplate"
                        type="primary"
                        :disabled="isRootDataset"
                    >
                        <div class="inline-block">
                            <i class="fas fa-save"></i>
                        </div>
                        <div
                            class="inline-block ml-1 xl:inline-block xl:ml-1"
                            :class="{ hidden: entity.etype === 'File' }"
                        >
                            Save Entity Template
                        </div>
                    </el-button>
                </div>
                <div v-if="!isRootDataset">
                    <!-- delete entity -->
                    <el-popconfirm
                        title="Are you sure you want to delete this entity?"
                        @confirm="deleteEntity"
                        width="400px"
                    >
                        <template #reference>
                            <el-button type="danger">
                                <div class="inline-block">
                                    <i class="fas fa-trash"></i>
                                </div>
                                <div
                                    class="inline-block ml-1 xl:inline-block xl:ml-1"
                                    :class="{ hidden: entity.etype === 'File' }"
                                >
                                    Delete Entity
                                </div>
                            </el-button>
                        </template>
                    </el-popconfirm>
                </div>
            </div>
            <!-- /navbar: controls -->
        </div>
        <el-drawer
            v-model="data.dialog.addProperty"
            direction="ltr"
            :destroy-on-close="true"
            size="50%"
            @close="data.dialog.addProperty = false"
        >
            <template #header> <div>Add properties to this entity</div></template>
            <template #default>
                <add-property-dialog
                    :crate-manager="props.crateManager"
                    :entity="props.entity"
                    @add:property:placeholder="addPropertyPlaceholder"
                />
            </template>
        </el-drawer>

        <el-drawer
            v-model="data.dialog.editContext"
            direction="ltr"
            size="70%"
            @close="data.dialog.editContext = false"
        >
            <template #header> <div>Edit Context</div></template>
            <template #default>
                <edit-context-dialog
                    :crate-manager="props.crateManager"
                    @update:context="updateContext"
                />
            </template>
        </el-drawer>

        <el-drawer
            v-model="data.dialog.previewCrate"
            direction="ltr"
            :destroy-on-close="true"
            size="60%"
            @close="data.dialog.previewCrate = false"
        >
            <template #header> <div>Preview Crate</div></template>
            <template #default>
                <preview-crate-dialog :crate-manager="props.crateManager" />
            </template>
        </el-drawer>

        <save-crate-as-template-dialog
            class="bg-indigo-200 p-6 rounded"
            v-if="data.dialog.saveCrateAsTemplate"
            :entity="entity"
            @close="data.dialog.saveCrateAsTemplate = false"
            @save:crate:template="saveCrateAsTemplate"
        />

        <el-drawer
            v-model="data.dialog.browseEntities"
            direction="ltr"
            :destroy-on-close="true"
            size="60%"
            @close="data.dialog.browseEntities = false"
        >
            <template #header> <div>Browse entities</div></template>
            <template #default>
                <browse-entities-dialog
                    :crate-manager="props.crateManager"
                    @load:entity="loadEntity"
                    @delete:entity="deleteEntity"
                />
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { ElDrawer, ElPopconfirm, ElButton } from "element-plus";
import AddPropertyDialog from "./DialogAddProperty.component.vue";
import SaveCrateAsTemplateDialog from "./DialogSaveCrateAsTemplate.component.vue";
import EditContextDialog from "./DialogEditContext.component.vue";
import PreviewCrateDialog from "./DialogPreviewCrate.component.vue";
import BrowseEntitiesDialog from "./DialogBrowseEntities.component.vue";
import { reactive, computed, inject } from "vue";
import isArray from "lodash-es/isArray";
const configuration = inject("configuration");

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    entity: {
        type: Object,
        required: true,
    },
});
const $emit = defineEmits([
    "load:entity",
    "add:property:placeholder",
    "delete:entity",
    "save:crate:template",
    "save:entity:template",
    "update:context",
]);

const data = reactive({
    loading: false,
    dataService: undefined,
    error: undefined,
    dialog: {
        previewCrate: false,
        editContext: false,
        addProperty: false,
        saveCrateAsTemplate: false,
        browseEntities: false,
    },
});
let isRootDataset = computed(() => {
    return props.entity.describoId === "RootDataset";
});
let definition = computed(() => {
    let type = isArray(props.entity["@type"])
        ? props.entity["@type"].join(", ")
        : props.entity["@type"];
    let classDefinition = props.crateManager?.profile?.classes?.[type];
    if (!classDefinition) classDefinition = { definition: "inherit" };
    return classDefinition?.definition;
});
function toggle(dialog) {
    data.dialog[dialog] = !data.dialog[dialog];
    Object.keys(data.dialog).forEach((d) => {
        if (d !== dialog) {
            data.dialog[d] = false;
        }
    });
}
function loadRootDataset() {
    $emit("load:entity", { name: "RootDataset" });
}
function loadEntity(data) {
    $emit("load:entity", data);
}
function addPropertyPlaceholder(property) {
    $emit("add:property:placeholder", property);
}
function deleteEntity({ describoId }) {
    if (data.dialog.browseEntities) {
        // if the browse dialog is showing
        $emit("delete:entity", { describoId });
    } else {
        // otherwise it's the delete entity button that was pressed
        $emit("delete:entity", {
            describoId: props.entity.describoId,
        });
    }
}
function saveCrateAsTemplate(data) {
    $emit("save:crate:template", data);
}
function saveEntityAsTemplate(data) {
    $emit("save:entity:template");
}
function updateContext(data) {
    $emit("update:context", data);
}
</script>
