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

const data = reactive({
    map: undefined,
    properties: {},
    layers: [],
});

onMounted(() => {
    init();
});
onBeforeUnmount(() => {
    data.map.off();
    data.map.remove();
});
const mapId = btoa(props.entity["@id"]);

async function init() {
    const entity = props.crateManager.getEntity({ id: props.entity["@id"] });
    data.map = new Leaflet.map(mapId, { scrollWheelZoom: false, touchZoom: false });

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

    if (entity["@properties"].geojson) {
        let geojson = JSON.parse(entity["@properties"].geojson[0].value);
        removeExistingLayers();

        // we need to give leaflet and vue and the dom a couple seconds before barreling on
        await new Promise((resolve) => setTimeout(resolve, 200));
        addFeatureGroup({ geoJSON: geojson });
    }
}

function centerMap() {
    data.map.setView([0, 0], 0);
}

function removeExistingLayers() {
    data.layers.forEach((layer) => data.map.removeLayer(layer));
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
        fg.addTo(data.map);
        data.layers.push(fg);

        setTimeout(() => {
            try {
                data.map.flyToBounds(fg.getBounds(), { maxZoom: 3, duration: 2 });
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
