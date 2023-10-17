<template>
    <div :id="mapId" class="map-style"></div>
</template>

<script setup>
import "leaflet/dist/leaflet.css";
import * as Leaflet from "leaflet/dist/leaflet-src.esm.js";
import { reactive, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    entity: { type: Object },
});

const mapId = btoa(props.entity["@id"]);
let map;
let layers = [];
const data = reactive({
    properties: {},
});

onMounted(() => {
    map = new Leaflet.map(mapId, { scrollWheelZoom: false, touchZoom: false });
    init();
});
onBeforeUnmount(() => {
    map.off();
    map.remove();
});

async function init() {
    const entity = props.crateManager.getEntity({ id: props.entity["@id"] });

    // we need to give leaflet and vue and the dom a couple seconds before barreling on
    await new Promise((resolve) => setTimeout(resolve, 200));
    centerMap();
    Leaflet.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        minZoom: 1,
        maxZoom: 16,
    }).addTo(map);

    if (entity["@properties"].geojson) {
        let geojson = JSON.parse(entity["@properties"].geojson[0].value);
        removeExistingLayers();

        // we need to give leaflet and vue and the dom a couple seconds before barreling on
        await new Promise((resolve) => setTimeout(resolve, 200));
        addFeatureGroup({ geoJSON: geojson });
    }
}

function centerMap() {
    map.setView([0, 0], 0);
}

function removeExistingLayers() {
    layers.forEach((layer) => map.removeLayer(layer));
}

function addFeatureGroup({ geoJSON, type }) {
    try {
        let fg = Leaflet.featureGroup([
            Leaflet.geoJSON(geoJSON, {
                pointToLayer: function (feature, latlng) {
                    // return Leaflet.circleMarker(latlng);
                    return Leaflet.marker(latlng);
                },
            }),
        ]);
        fg.setStyle({ color: "#000000" });
        fg.addTo(map);
        layers.push(fg);

        setTimeout(() => {
            try {
                map.flyToBounds(fg.getBounds(), { maxZoom: 3, duration: 2 });
            } catch (error) {
                // swallow zoom errors as it's most likely to be because the map is no longer showing
            }
        }, 1500);
        return fg;
    } catch (error) {
        console.log(error);
    }
}
</script>

<style>
.map-style {
    width: 600px;
    height: 520px;
}
</style>
