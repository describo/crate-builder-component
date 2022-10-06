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
                    <div class="text-gray-600 text-sm">
                        <div v-if="item.type === 'new'">
                            <el-button type="success" size="default" class="flex flex-row">
                                <div class="text-sm">Create new {{ item["@type"] }}:&nbsp;</div>
                                <div class="text-sm">{{ item.name }}</div>
                            </el-button>
                        </div>
                        <div v-else-if="item.type === 'datapack'" class="flex flex-row space-x-2">
                            <div class="text-sm">{{ item["@type"] }}:</div>
                            <div class="text-sm">{{ item.name }} ({{ item["@id"] }})</div>
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
import { ref, reactive, onMounted, watch, inject } from "vue";
import { isArray } from "lodash";

import { Query, BoolQuery } from "@coedl/elastic-query-builder";
import { wildcardQuery, matchQuery } from "@coedl/elastic-query-builder/queries";
const configuration = inject("configuration");

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
watch(
    () => props.type,
    () => {
        querySearch();
    }
);

async function querySearch(queryString) {
    selection.value = undefined;
    data.matches = [];
    let internal = [],
        templates = [],
        lookups = [];

    // construct a definition for a new entity
    let newEntity = [
        {
            type: "new",
            "@id": queryString,
            "@type": props.type,
            name: `${queryString}`,
        },
    ];

    // lookup entities in the crate (internal), in templates, and in datapacks (lookups)
    [internal, templates, lookups] = await Promise.all([
        await props.crateManager.findMatchingEntities({
            limit: 5,
            type: props.type,
            query: queryString,
        }),
        await props.crateManager?.lookup?.entityTemplates({
            type: props.type,
            filter: queryString,
            limit: 5,
        }),
        await lookup({ queryString }),
    ]);
    // console.log(internal, templates, lookups);

    let matches = [
        {
            label: "Create new entity",
            entities: queryString ? newEntity : [],
        },
    ];

    if (internal.length) {
        internal = internal.map((e) => ({ ...e, type: "internal" })).slice(0, 5);
        matches.push({
            label: "Associate an entity already defined in this crate",
            entities: internal,
        });
        data.entities = [...data.entities, ...internal];
    }

    if (templates?.length) {
        templates = templates.map((template) => ({ ...template.entity, type: "template" }));
        matches.push({
            label: "Associate an entity from saved templates",
            entities: templates,
        });
        data.entities = [...data.entities, ...templates];
    }

    if (lookups?.length) {
        lookups = lookups.map((entity) => ({ ...entity, type: "datapack" }));
        matches.push({ label: "Associate an entity from a data pack", entities: lookups });
        data.entities = [...data.entities, ...lookups];
    }
    data.matches = matches;
}
function handleSelect(entity) {
    if (entity) {
        if (entity?.type === "internal") {
            emit("link:entity", { entity });
        } else {
            emit("create:entity", entity);
        }
    }
}

async function lookup({ queryString }) {
    let documents = [];
    if (!configuration.enableDataPackLookups) return documents;
    if (!props.crateManager?.profile?.lookup) return documents;

    let type = isArray(props.type) ? props.type.join(", ") : props.type;
    if (!type || !props.crateManager?.profile?.lookup?.[type]) return documents;

    let { fields, datapack } = props.crateManager?.profile?.lookup?.[type];
    let query = new Query({ size: 10 });
    query.append(
        new BoolQuery().must([
            matchQuery({ field: "@type.keyword", value: type }),
            new BoolQuery().should(
                fields.map((field) => wildcardQuery({ field, value: `*${queryString}*` }))
            ),
        ])
    );
    ({ documents } = await props.crateManager.lookup.dataPacks({
        type: props.type,
        elasticQuery: query,
        fields,
        datapack,
        queryString,
        limit: 10,
    }));
    return documents;
}
</script>
