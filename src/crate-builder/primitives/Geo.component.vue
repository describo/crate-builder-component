<template>
    <div class="flex flex-row text-gray-600">
        <div
            class="flex flex-col p-4"
            :class="{
                'w-full': props.mode === 'feature',
                'w-full': props.mode === 'entity' && !data.existingEntities.length,
                'w-2/3': props.mode === 'entity' && data.existingEntities.length,
            }"
        >
            <div>{{ $t('define_location')}}</div>
            <div class="flex flex-col">
                <div class="flex flex-row space-x-4 py-1">
                    <div>
                        <el-button @click="centerMap" type="primary">
                            <i class="fa-solid fa-crosshairs"></i>&nbsp; {{ $t('center_map') }}
                        </el-button>
                    </div>
                    <div class="flex flex-col">
                        <el-radio v-model="data.mode" label="box" @change="updateHandlers">
                            {{ $t('select_region') }}
                        </el-radio>
                        <el-radio v-model="data.mode" label="point" @change="updateHandlers">
                            {{ $t('select_point') }}
                        </el-radio>
                    </div>
                    <div v-if="data.mode === 'box'" class="pt-1 text-gray-600">
                        {{ $t('press_shift_drag_to_select') }}
                    </div>
                    <div v-if="data.mode === 'point'" class="pt-1 text-gray-600">
                        {{ $t('click_on_map_to_select_point') }}
                    </div>
                </div>
                <el-form
                    class="mt-1"
                    v-if="props.mode === 'entity'"
                    :model="data.form"
                    @submit.prevent.native="emitFeature"
                >
                    <el-form-item :label="$t('location_name')">
                        <el-input
                            v-model="data.locationName"
                            :placeholder="$t('provide_name_for_location')"
                        ></el-input>
                        <div v-if="data.error" class="text-sm text-red-700">{{ data.error }}</div>
                    </el-form-item>
                </el-form>
            </div>
            <div id="map" class="map-style"></div>
        </div>
        <div class="w-1/3 p-4" v-if="props.mode === 'entity' && data.existingEntities.length">
            <div class="flex flex-col p-2">
                <div>{{ $t('select_existing_location') }}</div>
                <el-select
                    v-model="data.selectValue"
                    class="m-2"
                    :placeholder="$t('select')"
                    size="large"
                    @change="emitSelection"
                >
                    <el-option
                        v-for="entity in data.existingEntities"
                        :key="entity.describoId"
                        :label="entity.name"
                        :value="entity.describoId"
                    />
                </el-select>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElButton, ElRadio, ElSelect, ElOption, ElForm, ElFormItem, ElInput } from "element-plus";
import "leaflet/dist/leaflet.css";
import * as Leaflet from "leaflet/dist/leaflet-src.esm.js";
import AreaSelectInit from "./Map.SelectArea.js";
import { reactive, onMounted, onBeforeUnmount, inject } from "vue";
import {$t} from '../i18n'

AreaSelectInit(Leaflet);

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    property: {
        type: String,
        required: true,
    },
    // setting mode to
    //   * entity means the component will emit a complete entity
    //   * feature means the component will emit patch to the geojson property
    mode: {
        type: String,
        default: "entity",
        validator(value) {
            return ["entity", "feature"].includes(value);
        },
    },
    entity: {
        type: Object,
    },
});
const emit = defineEmits(["create:entity", "link:entity", "save:property"]);

const data = reactive({
    mode: "box",
    form: undefined,
    locationName: undefined,
    map: undefined,
    showLocationSearchBox: false,
    selection: undefined,
    locations: [],
    layers: [],
    feature: undefined,
    existingEntities: [],
    selectValue: undefined,
    geojsonProperty: undefined,
    error: undefined,
});

onMounted(() => {
    init();
});
onBeforeUnmount(() => {
    data.map.off();
    data.map.remove();
});

async function init() {
    await loadGeoDataInCrate();
    await loadPropertyData();
    data.map = new Leaflet.map("map");

    // we need to give leaflet and vue and the dom a couple seconds before barreling on
    await new Promise((resolve) => setTimeout(resolve, 200));
    centerMap();
    Leaflet.tileLayer("https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}", {
        attribution:
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: "abcd",
        minZoom: 1,
        maxZoom: 16,
        ext: "jpg",
        noWrap: true,
    }).addTo(data.map);

    updateHandlers();
}

async function loadGeoDataInCrate() {
    let geoShape = await props.crateManager.findMatchingEntities({
        limit: 5,
        type: "GeoShape",
    });
    let geoCoordinates = await props.crateManager.findMatchingEntities({
        limit: 5,
        type: "GeoCoordinates",
    });
    data.existingEntities = [...geoShape, ...geoCoordinates];
}

async function loadPropertyData() {
    if (props.entity?.describoId) {
        let entity = props.crateManager.getEntity({ describoId: props.entity.describoId });
        data.geojsonProperty = entity.properties.filter((p) => p.property === "geojson")[0];
    }
}

function centerMap() {
    data.map.setView([0, 0], 0);
}

function querySearch(queryString, cb) {
    if (queryString.length < 4) return [];
    const re = new RegExp(queryString, "i");
    const matches = data.locations.filter((l) => l.properties.name.match(re));
    return cb(matches);
}

function removeExistingLayers() {
    data.layers.forEach((layer) => data.map.removeLayer(layer));
}

function addFeatureGroup(geoJSON) {
    const fg = Leaflet.featureGroup([Leaflet.geoJSON(geoJSON)]);
    fg.addTo(data.map);
    data.layers.push(fg);
    return fg;
}

function updateHandlers() {
    if (data.mode === "box") {
        data.map.off("click");
        data.map.selectArea.enable();
        data.map.selectArea.setShiftKey(true);
        data.map.on("areaselected", handleAreaSelect);
    } else {
        data.map.off("areaselected");
        data.map.on("click", handlePointSelect);
    }
}

function handleAreaSelect(e) {
    const bounds = e.bounds;
    const geoJSON = {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [
                [
                    [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
                    [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
                    [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
                    [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
                ],
            ],
        },
    };
    removeExistingLayers();
    const entity = {
        "@type": "GeoShape",
        geojson: geoJSON,
    };
    data.feature = entity;
    emitFeature();
}

function handlePointSelect(e) {
    const latlng = data.map.mouseEventToLatLng(e.originalEvent);
    const geoJSON = {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [latlng.lng, latlng.lat],
        },
    };
    removeExistingLayers();

    const entity = {
        "@type": "GeoCoordinates",
        geojson: geoJSON,
    };
    data.feature = entity;
    emitFeature();
}

function emitFeature() {
    if (props.mode === "entity" && (!data.locationName || !data.feature.geojson)) {
        data.error = $t('provide_name_for_location_error');
        return;
    }
    data.error = undefined;

    if (props.mode === "entity" && data.locationName && data.feature?.geojson) {
        let entity = {
            ...data.feature,
            "@id": `#${data.locationName.replace(/ /g, "_")}`,
            name: data.locationName,
            geojson: JSON.stringify(data.feature.geojson),
        };
        console.debug("GEO Component : emit(create:entity)", entity);
        emit("create:entity", { property: props.property, json: entity });
    } else if (props.mode === "feature" && data.feature?.geojson) {
        let property = {
            propertyId: data.geojsonProperty.propertyId,
            value: JSON.stringify(data.feature.geojson),
        };
        console.debug("GEO Component : emit(save:property)", property);
        emit("save:property", property);
    }
}

function emitSelection(selection) {
    const entity = data.existingEntities.filter((e) => e.describoId === selection)[0];
    console.debug("GEO Component : emit(link:entity)", entity);
    emit("link:entity", { property: props.property, json: entity });
}
</script>

<style>
.map-style {
    width: 700px;
    height: 500px;
}
</style>
