<template>
    <div>
        <div
            class="flex flex-row space-x-1 py-2 mb-2 border-b-2 border-gray-700"
            :key="configuration.language"
        >
            <!-- navbar : controls -->
            <div class="flex flex-row space-x-1 mr-4">
                <div>
                    <!-- back -->
                    <el-button
                        @click="back"
                        type="primary"
                        v-if="configuration.mode === 'embedded'"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                        <!-- &nbsp; {{ $t("root_dataset_label") }} -->
                    </el-button>
                </div>
                <div>
                    <!-- go to root dataset -->
                    <el-button
                        @click="loadRootDataset"
                        type="primary"
                        :disabled="isRootDataset"
                        v-if="configuration.mode === 'embedded'"
                    >
                        <i class="fa-solid fa-house"></i>
                        <!-- &nbsp; {{ $t("root_dataset_label") }} -->
                    </el-button>
                </div>
                <div>
                    <!-- forward -->
                    <el-button
                        @click="forward"
                        type="primary"
                        v-if="configuration.mode === 'embedded'"
                    >
                        <i class="fa-solid fa-arrow-right"></i>
                        <!-- &nbsp; {{ $t("root_dataset_label") }} -->
                    </el-button>
                </div>
            </div>
            <div>
                <!-- add property -->
                <el-button
                    @click="toggle('addProperty')"
                    type="primary"
                    :disabled="definition !== 'inherit'"
                >
                    <i class="fas fa-code"></i>
                    &nbsp; {{ $t("add_label") }}
                </el-button>
            </div>
            <div v-if="configuration.enableContextEditor">
                <!-- edit context -->
                <el-button @click="toggle('editContext')" type="primary">
                    <i class="fa-solid fa-pen-to-square"></i>
                    &nbsp;{{ $t("edit_context_label") }}
                </el-button>
            </div>
            <div v-if="configuration.enableCratePreview">
                <!-- preview crate -->
                <el-button @click="toggle('previewCrate')" type="primary">
                    <i class="fa-solid fa-eye"></i>
                    &nbsp;{{ $t("preview_label") }}
                </el-button>
            </div>
            <div v-if="configuration.enableBrowseEntities">
                <!-- browse crate entities -->
                <el-button @click="toggle('browseEntities')" type="primary">
                    <i class="fa-solid fa-layer-group"></i>
                    &nbsp;{{ $t("browse_entities_label") }}
                </el-button>
            </div>
            <div class="flex flex-row space-x-1">
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
                            {{ $t("save_entity_template_label") }}
                        </div>
                    </el-button>
                </div>
                <div v-if="!isRootDataset">
                    <!-- delete entity -->
                    <el-popconfirm
                        :title="$t('are_you_sure_to_delete')"
                        :confirm-button-text="$t('are_you_sure_to_delete_yes')"
                        :cancel-button-text="$t('are_you_sure_to_delete_no')"
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
                                    {{ $t("delete_entity_label") }}
                                </div>
                            </el-button>
                        </template>
                    </el-popconfirm>
                </div>
            </div>
            <!-- /navbar: controls -->
        </div>

        <!-- add property drawer -->
        <el-drawer
            v-model="data.dialog.addProperty"
            direction="ltr"
            :destroy-on-close="true"
            size="50%"
            @close="data.dialog.addProperty = false"
        >
            <template #header>
                <div>{{ $t("add_properties_to_this_entity") }}</div></template
            >
            <template #default>
                <add-property-dialog
                    :crate-manager="props.crateManager"
                    :entity="props.entity"
                    @add:property:placeholder="addPropertyPlaceholder"
                />
            </template>
        </el-drawer>

        <!-- edit context drawer -->
        <el-drawer
            v-model="data.dialog.editContext"
            direction="ltr"
            size="70%"
            @close="data.dialog.editContext = false"
        >
            <template #header>
                <div>{{ $t("edit_context") }}</div></template
            >
            <template #default>
                <edit-context-dialog
                    :crate-manager="props.crateManager"
                    @update:context="updateContext"
                />
            </template>
        </el-drawer>

        <!-- preview crate drawer -->
        <el-drawer
            v-model="data.dialog.previewCrate"
            direction="ltr"
            :destroy-on-close="true"
            size="60%"
            @close="data.dialog.previewCrate = false"
        >
            <template #header>
                <div>{{ $t("preview_crate") }}</div></template
            >
            <template #default>
                <preview-crate-dialog :crate-manager="props.crateManager" />
            </template>
        </el-drawer>

        <!-- browse entities drawer -->
        <el-drawer
            v-model="data.dialog.browseEntities"
            direction="rtl"
            :destroy-on-close="true"
            size="60%"
            @close="data.dialog.browseEntities = false"
        >
            <template #header>
                <div>{{ $t("browse_entities") }}</div></template
            >
            <template #default>
                <browse-entities-dialog
                    :crate-manager="props.crateManager"
                    @load:entity="loadEntity"
                />
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { ElDrawer, ElPopconfirm, ElButton } from "element-plus";
import AddPropertyDialog from "./DialogAddProperty.component.vue";
import EditContextDialog from "./DialogEditContext.component.vue";
import PreviewCrateDialog from "./DialogPreviewCrate.component.vue";
import BrowseEntitiesDialog from "./DialogBrowseEntities.component.vue";
import { reactive, computed, inject } from "vue";
import { configurationKey } from "./keys.js";
import { $t } from "../i18n";
const configuration = inject(configurationKey);

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
    "back",
    "forward",
    "add:property:placeholder",
    "delete:entity",
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
    return props.entity["@id"] === "./";
});
let definition = computed(() => {
    if (!props.entity?.["@type"] || !props.crateManager.profileManager?.getTypeDefinition)
        return "inherit";
    return props.crateManager.profileManager.getTypeDefinition({ entity: props.entity });
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
function back() {
    history.back();
}
function forward() {
    history.forward();
}
function loadEntity(data) {
    $emit("load:entity", data);
}
function addPropertyPlaceholder(property) {
    $emit("add:property:placeholder", property);
}
function deleteEntity() {
    // otherwise it's the delete entity button that was pressed
    $emit("delete:entity", {
        id: props.entity["@id"],
    });
}
function saveEntityAsTemplate(data) {
    $emit("save:entity:template");
}
function updateContext(data) {
    $emit("update:context", data);
}
</script>
