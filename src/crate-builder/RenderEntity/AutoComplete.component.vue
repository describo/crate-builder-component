<template>
    <div>
        <el-select
            class="w-full"
            v-model="selection"
            placeholder="select an existing entity or create a new one"
            filterable
            clearable
            default-first-option
            automatic-dropdown
            remote
            :remote-method="querySearch"
            @change="handleSelect"
        >
            <el-option-group v-for="group in data.matches" :key="group.label" :label="group.label">
                <el-option
                    v-for="item in group.entities"
                    :key="item['@type']"
                    :label="item.name"
                    :value="item"
                    :value-key="item['@id']"
                >
                    <div class="text-gray-500 text-sm">
                        <div v-if="item.type === 'new'">
                            <el-button type="success" size="default" class="flex flex-row">
                                <div class="text-sm">Create new {{ item["@type"] }}:&nbsp;</div>
                                <div class="text-sm">{{ item.name }}</div>
                            </el-button>
                        </div>
                        <div v-else class="flex flex-row space-x-2">
                            <div class="text-sm">{{ item["@type"] }}:</div>
                            <div class="text-sm" v-if="item.name">{{ item.name }}</div>
                            <div class="text-sm text-right" v-else>{{ item["@id"] }}</div>
                        </div>
                    </div>
                </el-option>
            </el-option-group>
        </el-select>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
});

const emit = defineEmits(["link:entity", "add:template", "create:entity"]);
let selection = ref(undefined);
const data = reactive({
    matches: [],
    entities: [],
});
onMounted(() => {
    // querySearch();
});
watch(
    () => props.type,
    () => {
        querySearch();
    }
);

async function querySearch(queryString) {
    selection.value = undefined;
    data.matches = [];
    let query = {};
    let entities = await props.crateManager.findMatchingEntities({
        limit: 5,
        type: props.type,
        query: queryString,
    });

    let newEntity = [
        {
            type: "new",
            "@id": queryString,
            "@type": props.type,
            name: `${queryString}`,
        },
    ];
    entities = entities.map((e) => ({ ...e, type: "internal" })).slice(0, 5);
    let matches = [
        {
            label: "Create new entity",
            entities: queryString ? newEntity : [],
        },
        {
            label: "Associate an entity already defined in this crate",
            entities,
        },
    ];

    let templates = await props.crateManager?.lookup?.entityTemplates({
        type: props.type,
        filter: queryString,
        limit: 5,
    });
    if (templates) {
        templates = templates.map((template) => template.entity);
        // templates = templates.map((e) => ({ ...e, type: "template" })).slice(0, 5);
        matches.push({
            label: "Associate an entity from saved templates",
            entities: templates,
        });
    }
    data.matches = matches;
    // data.entities = [...entities, templates];
    data.entities = [...entities];
}
function handleSelect(value) {
    if (value) {
        const entity = data.entities.filter((e) => e.id === value)[0];

        if (entity?.type === "internal") {
            emit("link:entity", { entity });
            // } else if (entity?.type === "template") {
            //     emit("add:template", { entity });
        } else {
            let entity = {
                "@id": value["@id"],
                "@type": value["@type"],
                name: value.name,
            };
            emit("create:entity", entity);
        }
    }
}
</script>
