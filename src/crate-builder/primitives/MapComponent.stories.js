import MapComponent from "./Map.component.vue";

export default {
    component: MapComponent,
    argTypes: {},
};

const Template = (args, { argTypes }) => ({
    components: { MapComponent },
    props: Object.keys(argTypes),
    template: '<MapComponent v-bind="$props" />',
});

const entities = [
    {
        "@id": "#geo",
        "@type": ["GeoCoordinates"],
        name: "geocoordinates",
        "@properties": {
            geojson: [
                {
                    idx: 0,
                    property: "geojson",
                    value: '{"type":"Feature","properties":{"name":"Nyaki Nyaki / Njaki Njaki"},"geometry":{"type":"Point","coordinates":["118.75508272649","-32.390945191928"]}}',
                },
            ],
        },
    },
    {
        "@id": "#geo",
        "@type": ["GeoShape"],
        name: "geoshape",
        "@properties": {
            geojson: [
                {
                    idx: 0,
                    property: "geojson",
                    value: '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[158.76561641693118,-7.710991655433217],[158.76561641693118,-47.040182144806664],[109.54686641693117,-47.040182144806664],[109.54686641693117,-7.710991655433217]]]}}',
                },
            ],
        },
    },
];

export const GeoJSONPoint = Template.bind({});
GeoJSONPoint.args = {
    entity: entities[0],
    crateManager: {
        getEntity({ id }) {
            return entities[0];
        },
    },
};

export const GeoJSONArea = Template.bind({});
GeoJSONArea.args = {
    entity: entities[1],
    crateManager: {
        getEntity({ id }) {
            return entities[1];
        },
    },
};
