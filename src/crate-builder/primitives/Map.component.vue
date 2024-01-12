<template>
    <div :id="mapId" class="map-style describo-property-type-map"></div>
</template>

<script setup>
import "leaflet/dist/leaflet.css";
import * as Leaflet from "leaflet/dist/leaflet-src.esm.js";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = Leaflet.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
});
Leaflet.Marker.prototype.options.icon = DefaultIcon;
import { reactive, onMounted, onBeforeUnmount, inject } from "vue";
import { crateManagerKey } from "../RenderEntity/keys.js";
const cm = inject(crateManagerKey);

const props = defineProps({
    entity: { type: Object },
});

const mapId = btoa(props.entity["@id"]);
let map;
let layers = [];
const data = reactive({
    properties: {},
});

onMounted(() => {
    map = new Leaflet.map(mapId, {
        center: [0, 0],
        zoom: 1,
        scrollWheelZoom: false,
        touchZoom: false,
    });
    init();
});
onBeforeUnmount(() => {
    map.off();
    map.remove();
});

async function init() {
    const entity = cm.value.getEntity({ id: props.entity["@id"] });

    // we need to give leaflet and vue and the dom a couple seconds before barreling on
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

    if (entity.geojson) {
        let geojson = JSON.parse(entity.geojson[0]);
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
