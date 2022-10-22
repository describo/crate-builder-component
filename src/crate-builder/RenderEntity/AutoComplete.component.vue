<template>
    <div>
        <el-select
            class="w-full"
            v-model="data.selection"
            placeholder="select an existing entity or create a new one"
            filterable
            clearable
            default-first-option
            automatic-dropdown
            remote
            :persistent="false"
            :loading="data.loading"
            :remote-method="data.debouncedQuerySearch"
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
                    <div class="text-gray-700">
                        <div v-if="item.type === 'new'">
                            <el-button type="success" size="default" class="flex flex-row">
                                <div>Create new {{ item["@type"] }}:&nbsp;</div>
                                <div>{{ item.name }}</div>
                            </el-button>
                        </div>
                        <div v-else-if="item.type === 'datapack'" class="flex flex-row space-x-2">
                            <div>{{ item["@type"] }}:</div>
                            <div>{{ item.name }} ({{ item["@id"] }})</div>
                        </div>
                        <div v-else class="flex flex-row space-x-2">
                            <div>{{ item["@type"] }}:</div>
                            <div v-if="item.name">{{ item.name }}</div>
                            <div class="text-right" v-else>{{ item["@id"] }}</div>
                        </div>
                    </div>
                </el-option>
            </el-option-group>
        </el-select>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, inject } from "vue";
import { isArray, debounce } from "lodash";

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
const data = reactive({
    promiseTimeout: 2500,
    selection: undefined,
    loading: false,
    debouncedQuerySearch: debounce(querySearch, 500),
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
    console.debug(`Query Search: '${queryString}'`);
    data.loading = true;
    data.matches = [];
    let internal = [],
        templates = [],
        lookups = [],
        ror = [];

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
    lookups = [
        wrapPromise(
            props.crateManager.findMatchingEntities({
                limit: 5,
                type: props.type,
                query: queryString,
            }),
            data.promiseTimeout
        ),
        wrapPromise(
            props.crateManager?.lookup?.entityTemplates({
                type: props.type,
                filter: queryString,
                limit: 5,
            }),
            data.promiseTimeout
        ),
        wrapPromise(lookup({ queryString }), data.promiseTimeout, {
            reason: "External Lookup Timeout",
        }),
    ];
    if (["Organisation", "Organization"].includes(props.type)) {
        lookups.push(
            wrapPromise(lookupROR({ queryString }), data.promiseTimeout, {
                reason: "ROR Lookup Timeout",
            })
        );
    }
    [internal, templates, lookups, ror] = await Promise.all(lookups);
    console.debug({ internal, templates, lookups, ror });
    if (internal?.reason) console.error(internal.reason);
    if (templates?.reason) console.error(templates.reason);
    if (lookups?.reason) console.error(lookups.reason);
    if (ror?.reason) console.error(ror.reason);

    let matches = [];

    if (internal?.length) {
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
    if (ror?.length) {
        ror = ror.map((entity) => ({ ...entity, type: "template" }));
        matches.push({
            label: "Associate an Organization defined in the Research Organization Registry",
            entities: ror,
        });
        data.entities = [...data.entities, ...ror];
    }
    if (lookups?.length) {
        lookups = lookups.map((entity) => ({ ...entity, type: "datapack" }));
        matches.push({ label: "Associate an entity from a data pack", entities: lookups });
        data.entities = [...data.entities, ...lookups];
    }

    matches.push({
        label: "Create new entity",
        entities: queryString ? newEntity : [],
    });

    data.matches = matches;
    data.loading = false;
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

async function lookupROR({ queryString }) {
    const api = "https://api.ror.org/organizations";
    let response = await fetch(`${api}?query.advanced=${queryString}`);
    if (response.status === 200) {
        response = await response.json();
        response = response.items.slice(0, 5).map((item) => {
            return {
                "@id": item.id,
                "@type": "Organization",
                name: item.name,
            };
        });
        return response;
    }
    return [];
}

function awaitTimeout(delay, reason) {
    return new Promise((resolve, reject) =>
        setTimeout(() => (reason === undefined ? resolve() : resolve(reason)), delay)
    );
}

async function wrapPromise(promise, delay, reason = { reason: "Lookup Timeout" }) {
    return Promise.race([promise, awaitTimeout(delay, reason)]);
}
</script>
