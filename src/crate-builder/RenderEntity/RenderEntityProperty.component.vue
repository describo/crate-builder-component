<template>
    <div
        class="flex flex-row flex-grow p-2 describo-property-background"
        :class="[
            { 'bg-red-200': props.highlightRequired && isRequired && !isValid },
            `describo-property describo-property-name-${props.property}`,
        ]"
    >
        <div class="w-1/3 xl:w-1/5 flex flex-col describo-property-heading">
            <div>
                <display-property-name-component
                    :property="props.property"
                    :label="propertyDefinition.label"
                    class="inline-block"
                    :class="{ 'text-red-600': isRequired && !isValid }"
                />
                <el-badge is-dot class="animate-pulse -ml-1 -mt-2" v-if="isRequired && !isValid">
                </el-badge>
            </div>
            <render-property-help-component :help="propertyDefinition.help" />
            <div
                v-if="!propertyDefinition && profileWarnMissingProperty"
                class="text-red-600 text-xs"
            >
                ({{ $t("not_defined_in_profile") }})
            </div>
        </div>
        <div class="w-2/3 xl:w-4/5 flex flex-col flex-grow describo-property-value">
            <!-- render all of the simple things (text, textarea, date etc) in a column -->
            <div class="flex flex-col space-y-1" v-if="data.simpleInstances.length">
                <div v-for="instance of data.simpleInstances" :key="instance.idx">
                    <div
                        v-if="propertyDefinition.readonly"
                        class="describo-property-value-readonly"
                    >
                        {{ instance.value }}
                    </div>
                    <div v-else class="flex flex-row space-x-2">
                        <render-entity-property-instance-component
                            class="flex-grow"
                            :property="props.property"
                            :value="instance.value"
                            :idx="instance.idx"
                            :definition="propertyDefinition"
                            @save:property="saveProperty"
                            @create:entity="createEntity"
                        />
                        <delete-property-component
                            v-if="
                                isNotValue &&
                                !configuration.readonly &&
                                (instance.value || instance.value == false) &&
                                !instance.value?.['@id']
                            "
                            type="delete"
                            :property="property"
                            @delete:property="deleteProperty(instance.idx)"
                        />
                    </div>
                </div>
            </div>
            <!-- render all the links in a wrapping row -->
            <div class="mt-2" v-if="data.linkInstances.length">
                <PaginateLinkedEntitiesComponent
                    :entities="data.linkInstances"
                    :property="props.property"
                    :readonly="propertyDefinition.readonly"
                    @load:entity="loadEntity"
                    @unlink:entity="unlinkEntity"
                />
            </div>
            <add-component
                v-if="showAddControl && !configuration.readonly"
                :property="props.property"
                :definition="propertyDefinition"
                :embedded="false"
                @create:property="createProperty"
                @create:entity="createEntity"
                @link:entity="linkEntity"
            />
        </div>
    </div>
</template>

<script setup>
import { ElBadge } from "element-plus";
import RenderPropertyHelpComponent from "./RenderPropertyHelp.component.vue";
import RenderEntityPropertyInstanceComponent from "./RenderEntityPropertyInstance.component.vue";
import PaginateLinkedEntitiesComponent from "./PaginateLinkedEntities.component.vue";
import DeletePropertyComponent from "./DeleteProperty.component.vue";
import AddComponent from "./Add.component.vue";
import DisplayPropertyNameComponent from "./DisplayPropertyName.component.vue";
import { configurationKey, crateManagerKey, profileManagerKey } from "./keys.js";
import { reactive, computed, onMounted, onBeforeMount, onBeforeUnmount, watch, inject } from "vue";
import cloneDeep from "lodash-es/cloneDeep.js";
import orderBy from "lodash-es/orderBy.js";
import isPlainObject from "lodash-es/isPlainObject.js";
import { $t } from "../i18n";
const configuration = inject(configurationKey);
const pm = inject(profileManagerKey);

const props = defineProps({
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
    highlightRequired: {
        type: Boolean,
        default: false,
    },
});
const data = reactive({
    propertyDefinition: {},
    simpleInstances: [],
    linkInstances: [],
    watchers: [],
});

onBeforeMount(() => {
    sortInstances();
});
onMounted(() => {
    data.watchers[1] = watch(
        () => props.values,
        () => {
            sortInstances();
        }
    );
});
onBeforeUnmount(() => {
    data.watchers.forEach((watcher) => watcher());
});

const $emit = defineEmits([
    "load:entity",
    "create:property",
    "create:entity",
    "link:entity",
    "save:property",
    "delete:property",
    "unlink:entity",
]);
const isValid = computed(() => {
    return props.values.length ? true : false;
});
const isRequired = computed(() => {
    return propertyDefinition.value?.required;
});
const isNotValue = computed(() => {
    return propertyDefinition.value?.type !== "Value";
});
const profileWarnMissingProperty = computed(() => {
    return pm.value.profile.warnMissingProperty;
});
const showAddControl = computed(() => {
    return propertyDefinition.value?.multiple || !props?.values?.length;
});
const propertyDefinition = computed(() => {
    let { propertyDefinition } = pm.value.getPropertyDefinition({
        property: props.property,
        entity: props.entity,
    });
    return cloneDeep(propertyDefinition);
});
function sortInstances() {
    data.simpleInstances = props.values
        .map((v, i) => {
            if (!isPlainObject(v)) {
                return { idx: i, value: v };
            }
        })
        .filter((v) => v);

    data.linkInstances = orderBy(
        props.values
            .map((v, i) => {
                if (isPlainObject(v)) return { idx: i, value: v };
            })
            .filter((v) => v),
        "@id"
    );
}
function loadEntity(data) {
    $emit("load:entity", data);
}
function createProperty(data) {
    $emit("create:property", data);
}
function createEntity(data) {
    $emit("create:entity", data);
}
function linkEntity(data) {
    $emit("link:entity", data);
}
function saveProperty(data) {
    $emit("save:property", data);
}
function deleteProperty(idx) {
    $emit("delete:property", {
        property: props.property,
        idx,
    });
}
function unlinkEntity(data) {
    $emit("unlink:entity", {
        ...data,
    });
}
</script>
