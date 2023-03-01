<template>
    <div :id="props.entity.describoId" class="map-style"></div>
</template>

<script setup>
import "leaflet/dist/leaflet.css";
import * as Leaflet from "leaflet";
import { groupBy } from "lodash";
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

async function init() {
    const entity = props.crateManager.getEntity({ describoId: props.entity.describoId });
    data.map = new Leaflet.map(props.entity.describoId);

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

    let properties = groupBy(entity.properties, "property");

    if (properties.geojson) {
        let geojson = JSON.parse(properties.geojson[0].value);
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
    let fg = Leaflet.featureGroup([
        Leaflet.geoJSON(geoJSON, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng);
            },
        }),
    ]);
    fg.setStyle({ color: "#fff000" });
    fg.addTo(data.map);
    data.layers.push(fg);
    setTimeout(() => {
        data.map.flyToBounds(fg.getBounds(), { maxZoom: 3, duration: 2 });
    }, 1500);

    return fg;
}
</script>

<style>
.map-style {
    width: 600px;
    height: 520px;
}
</style>
