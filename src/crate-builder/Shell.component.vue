<template>
    <div class="flex flex-col">
        <render-entity-component
            v-if="data.ready"
            :crate-manager="data.crateManager"
            :entity="data.entity"
            :mode="props.mode"
            @load:entity="setCurrentEntity"
            @save:crate="saveCrate"
            @save:crate:template="saveCrateAsTemplate"
            @save:entity:template="saveEntityAsTemplate"
        />
        <div v-if="data.error" class="bg-red-100 p-4 text-center">
            This component requires you to pass in a crate file.
        </div>
    </div>
</template>

<script setup>
import RenderEntityComponent from "./RenderEntity/Shell.component.vue";
import { onMounted, onBeforeMount, reactive, watch, provide } from "vue";
import { cloneDeep, isEmpty, debounce, isFunction } from "lodash";
import { CrateManager } from "./crate-manager.js";
import { useRouter, useRoute } from "vue-router";
const $router = useRouter();
const $route = useRoute();

const props = defineProps({
    crate: {
        type: [Object, undefined],
    },
    profile: {
        type: [Object, undefined],
    },
    mode: {
        type: [String, undefined],
        default: "embedded",
        validator: (val) => ["embedded", "online"].includes(val),
    },
    lookup: {
        type: Object,
    },
    enableContextEditor: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableCratePreview: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableBrowseEntities: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
});

const emit = defineEmits(["save:crate", "save:crate:template"]);

const data = reactive({
    ready: false,
    error: false,
    crate: [],
    profile: {},
    entity: {},
    debouncedInit: debounce(init, 400),
    crateManager: {},
});

watch([() => props.crate, () => props.profile], () => {
    data.ready = false;
    data.debouncedInit();
});
watch(
    () => $route.query.id,
    (n) => {
        if (n !== data.entity.describoId) setCurrentEntity({ describoId: $route.query.id });
    }
);
onBeforeMount(() => {
    const configuration = {
        enableContextEditor: props.enableContextEditor,
        enableCratePreview: props.enableCratePreview,
        enableBrowseEntities: props.enableBrowseEntities,
    };
    provide("configuration", configuration);
});
onMounted(() => {
    data.debouncedInit();
});

function init() {
    if (!props.crate || isEmpty(props.crate)) {
        data.error = true;
        return;
    }
    data.error = false;

    data.profile = isEmpty(props.profile) ? {} : cloneDeep(props.profile);
    data.crate = cloneDeep(props.crate);

    data.crateManager = new CrateManager({ crate: data.crate, profile: data.profile });

    if (props.lookup) {
        if (isFunction(props.lookup.entityTemplates) && isFunction(props.lookup.crateTemplates)) {
            data.crateManager.lookup = props.lookup;
        } else {
            console.error(
                `The lookup class must have functions 'entityTemplates' and 'crateTemplates'`
            );
        }
    } else {
        data.crateManager.lookup = undefined;
    }
    setCurrentEntity({ name: "RootDataset" });
    data.ready = true;
}
async function setCurrentEntity({ describoId = undefined, name = undefined, id = undefined }) {
    if (!data.crateManager.getEntity) return;
    if (!describoId && !name && !id) return;
    let entity = {};
    if (name === "RootDataset") {
        entity = data.crateManager.getRootDataset();
    } else if (describoId) {
        entity = data.crateManager.getEntity({ describoId });
    } else if (id) {
        entity = data.crateManager.getEntity({ id });
    }
    if (entity) {
        $router.push({ query: { id: entity.describoId } });
        console.debug(`Render Entity Parent, load entity:`, { ...entity });
        data.crateManager.setCurrentEntity({ describoId: entity.describoId });
        data.entity = { ...entity };
    }
}
function saveCrate() {
    emit("save:crate", { crate: data.crateManager.exportCrate() });
}
function saveCrateAsTemplate(template) {
    emit("save:crate:template", {
        template: {
            name: template.name,
            crate: data.crateManager.exportCrate(),
        },
    });
}
function saveEntityAsTemplate(template) {
    let entity = data.crateManager.exportEntityTemplate({ describoId: data.entity.describoId });
    emit("save:entity:template", { entity });
}
</script>
