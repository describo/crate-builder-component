<template>
    <div class="flex flex-row flex-grow p-2 hover:bg-blue-100">
        <div class="w-1/3 xl:w-1/5 flex flex-col">
            <div>
                <display-property-name-component
                    :label="props.property"
                    class="inline-block"
                    :class="{ 'text-red-600': isRequired && !isValid }"
                />
                <el-badge is-dot class="animate-pulse -ml-1 -mt-2" v-if="isRequired && !isValid">
                </el-badge>
            </div>
            <div class="text-gray-600 font-light text-xs pr-1">{{ data.help }}</div>
            <div
                v-if="!data.propertyDefinition && profileWarnMissingProperty"
                class="text-red-600 text-xs"
            >
                (not defined in profile)
            </div>
        </div>
        <div class="w-2/3 xl:w-4/5 flex flex-col flex-grow">
            <add-component
                class="mx-1"
                v-if="showAddControl && !configuration.readonly"
                :property="props.property"
                :definition="data.propertyDefinition"
                :embedded="false"
                :crate-manager="props.crateManager"
                @create:property="createProperty"
                @create:entity="createEntity"
                @link:entity="linkEntity"
            />

            <!-- render all of the simple things (text, textarea, date etc) in a column -->
            <div class="flex flex-col space-y-1" v-if="data.simpleInstances.length">
                <div
                    v-for="instance of data.simpleInstances"
                    :key="instance.propertyId"
                    class="flex flex-row"
                >
                    <render-entity-property-instance-component
                        class="flex-grow"
                        :crate-manager="props.crateManager"
                        :data="instance"
                        :definition="data.propertyDefinition"
                        @save:property="saveProperty"
                        @delete:property="deleteProperty"
                        @load:entity="loadEntity"
                        @refresh="refresh"
                    />
                    <delete-property-component
                        v-if="
                            isNotValue &&
                            instance.value &&
                            !instance.tgtEntityId &&
                            !configuration.readonly
                        "
                        class="pl-2"
                        type="delete"
                        :property="instance"
                        @delete:property="deleteProperty"
                    />
                </div>
            </div>
            <!-- render all the links in a wrapping row -->
            <div class="flex flex-row flex-wrap items-center mt-2" v-if="data.linkInstances.length">
                <div
                    v-for="(instance, idx) of data.linkInstances"
                    :key="instance.propertyId"
                    class="flex flex-row m-1"
                >
                    <render-linked-item-component
                        :index="idx"
                        :crate-manager="props.crateManager"
                        :entity="instance"
                        @load:entity="loadEntity"
                        @save:property="saveProperty"
                        @delete:property="deleteProperty"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import RenderEntityPropertyInstanceComponent from "./RenderEntityPropertyInstance.component.vue";
import RenderLinkedItemComponent from "./RenderLinkedItem.component.vue";
import DeletePropertyComponent from "./DeleteProperty.component.vue";
import AddComponent from "./Add.component.vue";
import DisplayPropertyNameComponent from "./DisplayPropertyName.component.vue";
import { ref, reactive, computed, onMounted, onBeforeMount, watch, inject } from "vue";
import { cloneDeep } from "lodash";
import { ProfileManager } from "../profile-manager.js";
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
    property: {
        type: String,
        required: true,
    },
    values: {
        type: Array,
        required: true,
    },
});

const data = reactive({
    propertyDefinition: {},
    simpleInstances: [],
    linkInstances: [],
});

watch(
    () => props.property,
    () => {
        getProfileDefinitionForProperty();
    }
);
watch(
    () => props.values.length,
    () => {
        sortInstances();
    }
);
onBeforeMount(() => {
    sortInstances();
});
onMounted(() => {
    getProfileDefinitionForProperty();
});

function getProfileDefinitionForProperty() {
    const profileManager = new ProfileManager({ profile: props.crateManager.profile });
    let { propertyDefinition } = profileManager.getPropertyDefinition({
        property: props.property,
        type: props.entity["@type"],
    });
    data.propertyDefinition = cloneDeep(propertyDefinition);
    data.help = propertyDefinition.help;
}
const emit = defineEmits([
    "refresh",
    "load:entity",
    "create:property",
    "create:entity",
    "create:object",
    "link:entity",
    "add:template",
    "save:property",
    "delete:property",
]);
const showHelp = ref(false);
const isValid = computed(() => {
    return props.values.length ? true : false;
});
const isRequired = computed(() => {
    return data.propertyDefinition?.required;
});
const isNotValue = computed(() => {
    return data.propertyDefinition?.type !== "Value";
});
const profileWarnMissingProperty = computed(() => {
    return props.crateManager.profile.warnMissingProperty;
});
const showAddControl = computed(() => {
    return data?.propertyDefinition?.multiple || !props?.values?.length;
});

function sortInstances() {
    data.simpleInstances = props.values.filter((v) => v.value);
    data.linkInstances = props.values.filter((v) => !v.value);
}
function refresh() {
    console.debug("Render Entity Property component: emit(refresh)");
    emit("refresh");
}
function loadEntity(data) {
    console.debug("Render Entity Property component: emit(load:entity)", data);
    emit("load:entity", data);
}
function createProperty(data) {
    console.debug("Render Entity Property component: emit(create:property)", data);
    emit("create:property", data);
}
function createEntity(data) {
    console.debug("Render Entity Property component: emit(create:entity)", data);
    emit("create:entity", data);
}
function linkEntity(data) {
    console.debug("Render Entity Property component: emit(link:entity)", data);
    emit("link:entity", data);
}
function saveProperty(data) {
    console.debug("Render Entity Property component: emit(save:property)", data);
    emit("save:property", data);
}
function deleteProperty(data) {
    console.debug("Render Entity Property component: emit(delete:property)", data);
    emit("delete:property", data);
}
</script>
