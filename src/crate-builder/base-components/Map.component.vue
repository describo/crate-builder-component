<template>
    <div id="map" class="map-style"></div>
</template>

<script setup>
import "leaflet/dist/leaflet.css";
import Leaflet from "leaflet";
import { groupBy } from "lodash";
import { reactive, onMounted } from "vue";

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

async function init() {
    data.map = new Leaflet.map("map");
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
    // data.properties = (
    //     await props.crateManager.getEntityProperties({
    //         describoId: data.entity.id,
    //     })
    // ).properties.forwardProperties;
    let properties = groupBy(props.entity.properties, "property");

    let fg;
    if (properties.box) {
        const boxes = properties.box.map((box) => {
            box = box.value.split(" ");
            return {
                type: "Polygon",
                coordinates: [box.map((b) => b.split(","))],
            };
        });
        removeExistingLayers();
        fg = addFeatureGroup({ geoJSON: boxes, type: "box" });
    } else if (properties.latitude && data.properties.longitude) {
        let geojson = {
            type: "Point",
            coordinates: [properties.longitude[0].value, properties.latitude[0].value],
        };
        removeExistingLayers();
        fg = addFeatureGroup({ geoJSON: geojson, type: "point" });
    } else if (properties.geojson) {
        let geojson = JSON.parse(properties.geojson[0].value);
        removeExistingLayers();
        fg = addFeatureGroup({ geoJSON: geojson });
    }
}

function centerMap() {
    data.map.setView([0, 0], 0);
}

function removeExistingLayers() {
    data.layers.forEach((layer) => data.map.removeLayer(layer));
}

function addFeatureGroup({ geoJSON, type }) {
    let fg;
    if (type === "box") {
        fg = Leaflet.featureGroup(Leaflet.geoJSON(geoJSON));
    } else {
        fg = Leaflet.featureGroup([
            Leaflet.geoJSON(geoJSON, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng);
                },
            }),
        ]);
    }
    fg.setStyle({ color: "#37474F" });
    fg.addTo(data.map);
    data.layers.push(fg);

    return fg;
}
</script>

<style>
.map-style {
    width: 600px;
    height: 520px;
}
</style>
