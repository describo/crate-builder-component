<template>
    <div>
        <div class="flex flex-row space-x-1" :key="configuration.language">
            <!-- navbar : controls -->
            <div class="flex flex-row space-x-1">
                <div>
                    <!-- back -->
                    <el-button @click="back" type="primary">
                        <FontAwesomeIcon :icon="faArrowLeft"></FontAwesomeIcon>
                        <!-- &nbsp; {{ $t("root_dataset_label") }} -->
                    </el-button>
                </div>
                <div>
                    <!-- go to root dataset -->
                    <el-button @click="loadRootDataset" type="primary" :disabled="isRootDataset">
                        <FontAwesomeIcon :icon="faHouse"></FontAwesomeIcon>
                        <!-- &nbsp; {{ $t("root_dataset_label") }} -->
                    </el-button>
                </div>
                <div>
                    <!-- forward -->
                    <el-button @click="forward" type="primary">
                        <FontAwesomeIcon :icon="faArrowRight"></FontAwesomeIcon>
                        <!-- &nbsp; {{ $t("root_dataset_label") }} -->
                    </el-button>
                </div>
            </div>
            <div v-if="!configuration.readonly">
                <!-- add property -->
                <el-button
                    @click="toggle('addProperty')"
                    type="primary"
                    :disabled="definition !== 'inherit'"
                >
                    <FontAwesomeIcon :icon="faCode"></FontAwesomeIcon>
                    &nbsp; {{ $t("add_label") }}
                </el-button>
            </div>
            <div v-if="configuration.enableContextEditor && !configuration.readonly">
                <!-- edit context -->
                <el-button @click="toggle('editContext')" type="primary">
                    <FontAwesomeIcon :icon="faPenToSquare"></FontAwesomeIcon>
                    &nbsp;{{ $t("edit_context_label") }}
                </el-button>
            </div>
            <div v-if="configuration.enableCratePreview">
                <!-- preview crate -->
                <el-button @click="toggle('previewCrate')" type="primary">
                    <FontAwesomeIcon :icon="faEye"></FontAwesomeIcon>
                    &nbsp;{{ $t("preview_label") }}
                </el-button>
            </div>
            <div v-if="configuration.enableBrowseEntities">
                <!-- browse crate entities -->
                <el-button @click="toggle('browseEntities')" type="primary">
                    <FontAwesomeIcon :icon="faLayerGroup"></FontAwesomeIcon>
                    &nbsp;{{ $t("browse_entities_label") }}
                </el-button>
            </div>
            <div class="flex flex-row space-x-1">
                <div v-if="configuration.enableTemplateSave && !isRootDataset && !isRootDescriptor">
                    <!-- save entity as template -->
                    <el-button
                        @click="
                            data.dialog.saveEntityAsTemplate = !data.dialog.saveEntityAsTemplate
                        "
                        type="primary"
                    >
                        <div class="inline-block">
                            <FontAwesomeIcon :icon="faSave"></FontAwesomeIcon>
                        </div>
                        <div
                            class="inline-block ml-1 xl:inline-block xl:ml-1"
                            :class="{ hidden: entity.etype === 'File' }"
                        >
                            {{ $t("save_entity_template_label") }}
                        </div>
                    </el-button>
                </div>
                <div v-if="!isRootDataset && !isRootDescriptor">
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
                                    <FontAwesomeIcon :icon="faTrash"></FontAwesomeIcon>
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
            destroy-on-close
            size="40%"
            @close="data.dialog.addProperty = false"
        >
            <template #header>
                <div>{{ $t("add_properties_to_this_entity") }}</div></template
            >
            <template #default>
                <add-property-dialog
                    :entity="props.entity"
                    @add:property:placeholder="addPropertyPlaceholder"
                />
            </template>
        </el-drawer>

        <!-- edit context drawer -->
        <el-drawer
            v-model="data.dialog.editContext"
            direction="ltr"
            destroy-on-close
            size="40%"
            @close="data.dialog.editContext = false"
        >
            <template #header>
                <div>{{ $t("edit_context") }}</div></template
            >
            <template #default>
                <edit-context-dialog @update:context="updateContext" />
            </template>
        </el-drawer>

        <!-- preview crate drawer -->
        <el-drawer
            v-model="data.dialog.previewCrate"
            direction="ltr"
            destroy-on-close
            size="40%"
            @close="data.dialog.previewCrate = false"
        >
            <template #header>
                <div>{{ $t("preview_crate") }}</div></template
            >
            <template #default>
                <preview-crate-dialog />
            </template>
        </el-drawer>

        <!-- browse entities drawer -->
        <el-drawer
            v-model="data.dialog.browseEntities"
            direction="rtl"
            :destroy-on-close="true"
            size="40%"
            @close="data.dialog.browseEntities = false"
        >
            <template #header>
                <div>{{ $t("browse_entities") }}</div></template
            >
            <template #default>
                <browse-entities-dialog
                    @load:entity="loadEntity"
                    @close="data.dialog.browseEntities = false"
                />
            </template>
        </el-drawer>

        <!-- save entity template drawer  -->
        <el-drawer
            v-model="data.dialog.saveEntityAsTemplate"
            direction="rtl"
            :destroy-on-close="true"
            size="60%"
            @close="data.dialog.saveEntityAsTemplate = false"
        >
            <template #header>
                <div>Save entity template</div>
            </template>
            <template #default>
                <SaveEntityAsTemplateDialog
                    :entity="props.entity"
                    @save:entity:template="saveEntityAsTemplate"
            /></template>
        </el-drawer>
    </div>
</template>

<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
    faArrowLeft,
    faHouse,
    faArrowRight,
    faCode,
    faPenToSquare,
    faEye,
    faLayerGroup,
    faSave,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { ElDrawer, ElPopconfirm, ElButton } from "element-plus";
import AddPropertyDialog from "./DialogAddProperty.component.vue";
import EditContextDialog from "./DialogEditContext.component.vue";
import PreviewCrateDialog from "./DialogPreviewCrate.component.vue";
import BrowseEntitiesDialog from "./DialogBrowseEntities.component.vue";
import SaveEntityAsTemplateDialog from "./DialogSaveEntityTemplate.component.vue";
import { reactive, computed, inject, shallowRef, watch } from "vue";
import { configurationKey, profileManagerKey } from "./keys.js";
import { $t } from "../i18n";
const configuration = inject(configurationKey);
const pm = inject(profileManagerKey);

const props = defineProps({
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
    dialog: {
        previewCrate: false,
        editContext: false,
        addProperty: false,
        browseEntities: false,
        saveEntityAsTemplate: false,
    },
});
let isRootDataset = computed(() => {
    return props.entity["@id"] === "./";
});
let isRootDescriptor = computed(() => {
    return (
        props.entity["@id"] === "ro-crate-metadata.json" &&
        props.entity["@type"].includes("CreativeWork")
    );
});
let definition = shallowRef({});
loadEntityDefinition();

watch(
    () => pm.value.$key,
    () => {
        loadEntityDefinition();
    }
);
function loadEntityDefinition() {
    if (!props.entity?.["@type"] || !pm.value?.getTypeDefinition) {
        definition.value = "inherit";
    } else {
        definition.value = pm.value.getTypeDefinition({ entity: props.entity });
    }
}

function toggle(dialog) {
    data.dialog[dialog] = !data.dialog[dialog];
    Object.keys(data.dialog).forEach((d) => {
        if (d !== dialog) {
            data.dialog[d] = false;
        }
    });
}
function loadRootDataset() {
    $emit("load:entity", { id: "./" });
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
    $emit("save:entity:template", data);
}
function updateContext(data) {
    $emit("update:context", data);
}
</script>
