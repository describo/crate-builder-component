<template>
    <div v-loading="data.loading">
        <el-select
            class="w-full"
            v-model="data.selection"
            :placeholder="$t('select_existing_or_create_new')"
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
                    :key="item['@id']"
                    :label="item.name"
                    :value="item"
                    :value-key="item['@id']"
                >
                    <div class="text-gray-700">
                        <div v-if="item.type === 'new'">
                            <el-button type="success" size="default" class="flex flex-row">
                                <div>
                                    {{ $t("create_new_of_type", { type: item["@type"] }) }}:&nbsp;
                                </div>
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
import { $t } from "../i18n";
import { configurationKey, crateManagerKey, lookupsKey } from "./keys.js";
const configuration = inject(configurationKey);
const cm = inject(crateManagerKey);
const lookupHandler = inject(lookupsKey);

import { Lookup, wrapPromise } from "./auto-complete.lib";

const props = defineProps({
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
            if (configuration.value.webComponent) {
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
    // console.debug(`Query Search: '${queryString}'`);
    data.loading = true;

    const lookup = new Lookup({
        config: cm.value.profile?.lookup,
        lookup: lookupHandler.value,
        crateManager: cm.value,
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

    let lookups = [];

    // wire up handler to find matching entities in the crate
    if (cm.value?.getEntities) {
        lookups.push(wrapPromise(lookup.getEntities(props.type, queryString), data.promiseTimeout));
    }

    // wire up handler to lookup datapacks externally
    if (lookupHandler.value.dataPacks) {
        lookups.push(
            wrapPromise(lookup.dataPacks(props.type, queryString), data.promiseTimeout, {
                reason: "External Lookup Timeout",
            })
        );
    }

    // wire up handler to lookup entityTemplates externally
    if (lookupHandler.value.entityTemplates) {
        lookups.push(
            wrapPromise(lookup.entityTemplates(props.type, queryString), data.promiseTimeout, {
                reason: "External Lookup Timeout",
            })
        );
    }

    // wire up handler to lookup entities externally
    if (lookupHandler.value.entities) {
        lookups.push(
            wrapPromise(lookup.entities(props.type, queryString), data.promiseTimeout, {
                reason: "External Lookup Timeout",
            })
        );
    }

    // wire up handler to lookup organisations in ROR
    if (["Organisation", "Organization"].includes(props.type) || props.type === "ANY") {
        lookups.push(
            wrapPromise(lookup.ror(queryString), data.promiseTimeout, {
                reason: "ROR Lookup Timeout",
            })
        );
    }
    let responses = await Promise.all(lookups);
    let matches = [];
    for (let response of responses) {
        if (response.endpoint === "internal" && response.documents?.length) {
            matches.push({
                label: $t("associate_existing_entity"),
                entities: response.documents.map((e) => ({ ...e, type: "internal" })).slice(0, 5),
            });
        } else if (response.endpoint === "templates" && response.documents?.length) {
            matches.push({
                label: $t("associate_entity_from_template"),
                entities: response.documents.map((template) => ({
                    ...template.entity,
                    type: "template",
                })),
            });
        } else if (response.endpoint === "ror" && response.documents?.length) {
            matches.push({
                label: $t("associate_organization_from_ror"),
                entities: response.documents.map((entity) => ({ ...entity, type: "ror" })),
            });
        } else if (response.endpoint === "entities" && response.documents?.length) {
            matches.push({
                label: $t("associate_user_created_entity"),
                entities: response.documents.map((entity) => ({ ...entity, type: "datapack" })),
            });
        } else if (response.endpoint === "datapacks" && response.documents?.length) {
            matches.push({
                label: $t("associate_from_datapack"),
                entities: response.documents.map((entity) => ({ ...entity, type: "datapack" })),
            });
        }
    }

    if (props.type !== "ANY") {
        matches.push({
            label: "Create new entity",
            entities: queryString ? newEntity : [],
        });
    }

    data.matches = matches;
    data.loading = false;
}
function handleSelect(entity) {
    if (entity) {
        entity["@type"] = entity["@type"].split(", ").map((t) => t.trim());
        if (entity?.type === "internal") {
            $emit("link:entity", { json: entity });
        } else {
            $emit("create:entity", { json: entity });
        }
    }
}
</script>
