<template>
    <div class="flex flex-col text-gray-600 describo-property-type-geo">
        <div class="flex flex-col space-y-4">
            <div v-if="data.existingEntities.length">
                <div>{{ $t("select_existing_location") }}</div>
                <el-select
                    v-model="data.selectValue"
                    :placeholder="$t('select')"
                    @change="emitSelection"
                >
                    <el-option
                        v-for="entity in data.existingEntities"
                        :key="entity['@id']"
                        :label="entity.name"
                        :value="entity['@id']"
                    />
                </el-select>
            </div>
            <div v-if="data.existingEntities.length" class="border border-gray-400"></div>
            <div class="flex flex-col space-y-2">
                <div>{{ $t("define_location") }}</div>
                <el-input
                    v-model="data.locationName"
                    :placeholder="$t('provide_name_for_location')"
                ></el-input>
                <div class="flex flex-row space-x-4">
                    <div class="flex flex-col">
                        <el-radio v-model="data.mode" label="box" @change="updateHandlers">
                            {{ $t("select_region") }}
                        </el-radio>
                        <el-radio v-model="data.mode" label="point" @change="updateHandlers">
                            {{ $t("select_point") }}
                        </el-radio>
                    </div>
                    <div v-if="data.mode === 'box'" class="pt-1 text-gray-600">
                        {{ $t("press_shift_drag_to_select") }}
                    </div>
                    <div v-if="data.mode === 'point'" class="pt-1 text-gray-600">
                        {{ $t("click_on_map_to_select_point") }}
                    </div>
                </div>
            </div>
            <div id="map" class="map-style"></div>
        </div>
    </div>
</template>

<script setup>
// import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
// import { faCrosshairs } from "@fortawesome/free-solid-svg-icons";
// https://macwright.com/lonlat/

import { ElButton, ElRadio, ElSelect, ElOption, ElForm, ElFormItem, ElInput } from "element-plus";
import "leaflet/dist/leaflet.css";
import * as Leaflet from "leaflet/dist/leaflet-src.esm.js";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = Leaflet.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
});
Leaflet.Marker.prototype.options.icon = DefaultIcon;
import AreaSelectInit from "./Map.SelectArea.js";
import { reactive, onMounted, onBeforeUnmount, inject } from "vue";
import { $t } from "../i18n";
import { crateManagerKey } from "../RenderEntity/keys.js";
const cm = inject(crateManagerKey);
import { geojsonToWKT } from "@terraformer/wkt";
import flattenDeep from "lodash-es/flattenDeep.js";

AreaSelectInit(Leaflet);

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    entity: {
        type: Object,
    },
});
const $emit = defineEmits(["create:entity", "link:entity"]);

let map;
const data = reactive({
    mode: "box",
    form: undefined,
    locationName: undefined,
    selection: undefined,
    feature: undefined,
    existingEntities: [],
    selectValue: undefined,
    error: undefined,
});

onMounted(() => {
    map = new Leaflet.map("map", {
        center: [0, 0],
        zoom: 1,
        // maxBounds: [
        //     [-90, -180],
        //     [90, 180],
        // ],
    });
    init();
});
onBeforeUnmount(() => {
    map.off();
    map.remove();
});

async function init() {
    await loadGeoDataInCrate();

    // we need to give leaflet and vue and the dom a moment before barrelling on
    await new Promise((resolve) => setTimeout(resolve, 200));
    // centerMap();

    Leaflet.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
            minZoom: 1,
            maxZoom: 16,
        }
    ).addTo(map);
    updateHandlers();
}

function loadGeoDataInCrate() {
    const geometryClasses = ["Geo", "Geomtery", "GeoShape", "GeoCoordinates"];
    let geos = geometryClasses.map((g) => {
        return [
            ...cm.value.getEntities({
                limit: 5,
                type: g,
            }),
        ];
    });
    data.existingEntities = flattenDeep(geos);
}

function centerMap() {
    map.setView([0, 0], 0);
}

function updateHandlers() {
    if (data.mode === "box") {
        map.off("click");
        map.selectArea.enable();
        map.selectArea.setShiftKey(true);
        map.on("areaselected", handleAreaSelect);
    } else {
        map.off("areaselected");
        map.on("click", handlePointSelect);
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
    const entity = {
        "@type": "GeoShape",
        geojson: geoJSON,
    };
    data.feature = entity;
    emitFeature();
}

function handlePointSelect(e) {
    const latlng = map.mouseEventToLatLng(e.originalEvent);
    const geoJSON = {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [latlng.lng, latlng.lat],
        },
    };

    const entity = {
        "@type": "GeoCoordinates",
        geojson: geoJSON,
    };
    data.feature = entity;
    emitFeature();
}

function emitFeature() {
    // get a blank node definition for the geometry
    let node = cm.value.addBlankNode("Geometry");
    let entity = {
        // ...data.feature,
        // "@id": `#${data.locationName.replace(/ /g, "_")}`,
        // "@type": "Geometry",
        ...node,
        name: data.locationName,
        geojson: JSON.stringify(data.feature.geojson),
        asWKT: geojsonToWKT(data.feature.geojson.geometry),
    };

    // we need to delete the blank node so the emit adds the actual entity
    //  technically we should be emitting a sequence of setProperty emits
    //  but this is way easier.
    cm.value.deleteEntity({ id: node["@id"] });

    // console.log(JSON.stringify(entity, null, 2));
    // console.debug("GEO Component : emit(create:entity)", entity);
    $emit("create:entity", { property: props.property, json: entity });
}

function emitSelection(selection) {
    const entity = data.existingEntities.filter((e) => e["@id"] === selection)[0];
    // console.debug("GEO Component : emit(link:entity)", entity);
    $emit("link:entity", { property: props.property, json: entity });
}
</script>

<style>
.map-style {
    width: 700px;
    height: 500px;
}
</style>
