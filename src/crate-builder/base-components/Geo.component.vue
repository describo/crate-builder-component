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
            <div>Define a location by selection on the map</div>
            <div class="flex flex-col">
                <div class="flex flex-row space-x-4 py-1">
                    <div>
                        <el-button @click="centerMap" type="primary">
                            <i class="fa-solid fa-crosshairs"></i>&nbsp; center map
                        </el-button>
                    </div>
                    <div class="flex flex-col">
                        <el-radio v-model="data.mode" label="box" @change="updateHandlers">
                            select region
                        </el-radio>
                        <el-radio v-model="data.mode" label="point" @change="updateHandlers">
                            select point
                        </el-radio>
                    </div>
                    <div v-if="data.mode === 'box'" class="pt-1 text-gray-600">
                        Press the shift key and drag the mouse to select an area
                    </div>
                    <div v-if="data.mode === 'point'" class="pt-1 text-gray-600">
                        Click on the map to select a point
                    </div>
                </div>
                <el-form
                    class="mt-1"
                    v-if="props.mode === 'entity'"
                    :model="data.form"
                    @submit.prevent.native="emitFeature"
                >
                    <el-form-item label="Location Name">
                        <el-input
                            v-model="data.locationName"
                            placeholder="Please provide a name for this location"
                        ></el-input>
                        <div v-if="data.error" class="text-sm text-red-700">{{ data.error }}</div>
                    </el-form-item>
                </el-form>
            </div>
            <div id="map" class="map-style"></div>
        </div>
        <div class="w-1/3 p-4" v-if="props.mode === 'entity' && data.existingEntities.length">
            <div class="flex flex-col p-2">
                <div>Select existing location defined in the crate</div>
                <el-select
                    v-model="data.selectValue"
                    class="m-2"
                    placeholder="Select"
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
import "leaflet/dist/leaflet.css";
import * as Leaflet from "leaflet";
import * as SelectArea from "leaflet-area-select";
import { reactive, onMounted, inject } from "vue";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
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

async function init() {
    await loadGeoDataInCrate();
    await loadPropertyData();
    try {
        data.map = new Leaflet.map("map");
    } catch (error) {
        data.map.off();
        data.map.remove();
        data.map = new Leaflet.map("map");
    }
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
        data.geojsonProperty = props.entity.properties.filter((p) => p.property === "geojson")[0];
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
        data.error = `You need to provide a name for this location`;
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
        emit("create:entity", entity);
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
    emit("link:entity", { entity });
}
</script>

<style>
.map-style {
    width: 700px;
    height: 500px;
}
</style>
