<template>
    <div v-loading="data.loading">
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
            :remote-method="data.debouncedQuerySearch"
            @change="handleSelect"
        >
            <template #empty></template>
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
import { ElButton, ElSelect, ElOption, ElOptionGroup, vLoading } from "element-plus";
import { reactive, watch, inject } from "vue";
import debounce from "lodash-es/debounce";
const configuration = inject("configuration");

import { lookup as esbLookup, wrapPromise } from "./auto-complete.lib";

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

const $emit = defineEmits(["link:entity", "create:entity"]);
const data = reactive({
    promiseTimeout: 2500,
    selection: "",
    loading: false,
    // debouncedQuerySearch: (queryString) => {
    //     console.log(data.selection, "***", queryString);
    //     data.selection = queryString;
    //     debounce(() => querySearch(queryString), 800)();
    // },
    debouncedQuerySearch: debounce(
        (queryString) => {
            if (configuration.webComponent) {
                data.selection = queryString;
            }
            return querySearch(queryString);
        },
        1000,
        { leading: true }
    ),
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

    const lookup = new esbLookup({
        config: props.crateManager.profile?.lookup,
        lookup: props.crateManager.lookup,
    });

    // construct a definition for a new entity
    let newEntity = [
        {
            type: "new",
            "@id": `${queryString}`,
            "@type": props.type,
            name: `${queryString}`,
        },
    ];

    // lookup entities in the crate (internal), in templates, and in datapacks (lookups)
    const lookupMapping = {};
    let lookups = [];

    // wire up handler to find matching entities in the crate
    if (props.crateManager.findMatchingEntities) {
        lookups = [
            wrapPromise(
                props.crateManager?.findMatchingEntities({
                    limit: 5,
                    type: props.type,
                    query: queryString,
                }),
                data.promiseTimeout
            ),
        ];
        lookupMapping.internal = 0;
    }

    // wire up handler to lookup datapacks externally
    if (props.crateManager.lookup.dataPacks) {
        lookups.push(
            wrapPromise(lookup.dataPacks(props.type, queryString), data.promiseTimeout, {
                reason: "External Lookup Timeout",
            })
        );
        lookupMapping.datapacks = lookups.length - 1;
    }

    // wire up handler to lookup entityTemplates externally
    if (props.crateManager.lookup.entityTemplates) {
        lookups.push(
            wrapPromise(lookup.entityTemplates(props.type, queryString), data.promiseTimeout, {
                reason: "External Lookup Timeout",
            })
        );
        lookupMapping.templates = lookups.length - 1;
    }

    // wire up handler to lookup entities externally
    if (props.crateManager.lookup.entities) {
        lookups.push(
            wrapPromise(lookup.entities(props.type, queryString), data.promiseTimeout, {
                reason: "External Lookup Timeout",
            })
        );

        lookupMapping.entities = lookups.length - 1;
    }

    // wire up handler lookup organisations in ROR
    if (["Organisation", "Organization"].includes(props.type)) {
        lookups.push(
            wrapPromise(lookup.ror(queryString), data.promiseTimeout, {
                reason: "ROR Lookup Timeout",
            })
        );
        lookupMapping.ror = lookups.length - 1;
    }
    let responses = await Promise.all(lookups);
    let matches = [];
    for (let key of Object.keys(lookupMapping)) {
        let results = responses[lookupMapping[key]];
        if (results?.reason) {
            console.error(results.reason);
            continue;
        }
        if (!results?.length) {
            continue;
        }

        if (key === "internal" && results?.length) {
            matches.push({
                label: "Associate an entity already defined in this crate",
                entities: results.map((e) => ({ ...e, type: "internal" })).slice(0, 5),
            });
        } else if (key === "templates" && results?.length) {
            matches.push({
                label: "Associate an entity from saved templates",
                entities: results.map((template) => ({ ...template.entity, type: "template" })),
            });
        } else if (key === "ror" && results?.length) {
            matches.push({
                label: "Associate an Organization defined in the Research Organization Registry",
                entities: results.map((entity) => ({ ...entity, type: "ror" })),
            });
        } else if (key === "entities" && results?.length) {
            matches.push({
                label: "Associate a user created entity",
                entities: results.map((entity) => ({ ...entity, type: "datapack" })),
            });
        } else if (key === "datapacks" && results?.length) {
            matches.push({
                label: "Associate a verified entity from a datapack",
                entities: results.map((entity) => ({ ...entity, type: "datapack" })),
            });
        }
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
            $emit("link:entity", { json: entity });
        } else {
            $emit("create:entity", { json: entity });
        }
    }
}
</script>
