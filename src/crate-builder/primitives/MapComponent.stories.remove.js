import MapComponent from "./Map.component.vue";

export default {
    component: MapComponent,
    argTypes: {},
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { MapComponent },
        setup() {
            return { args };
        },
        template: '<MapComponent v-bind="args" />',
    }),
};

const entities = [
    {
        "@id": "#geo_1",
        "@type": ["GeoCoordinates"],
        name: "geocoordinates",
        geojson: [
            {
                idx: 0,
                property: "geojson",
                value: '{"type":"Feature","properties":{"name":"Nyaki Nyaki / Njaki Njaki"},"geometry":{"type":"Point","coordinates":["118.75508272649","-32.390945191928"]}}',
            },
        ],
    },
    {
        "@id": "#geo_2",
        "@type": ["GeoShape"],
        name: "geoshape",
        geojson: [
            {
                idx: 0,
                property: "geojson",
                value: '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[158.76561641693118,-7.710991655433217],[158.76561641693118,-47.040182144806664],[109.54686641693117,-47.040182144806664],[109.54686641693117,-7.710991655433217]]]}}',
            },
        ],
    },
];

export const GeoJSONPoint = {
    ...Template,
    args: {
        entity: entities[0],
        crateManager: {
            getEntity({ id }) {
                return entities[0];
            },
        },
    },
};

export const GeoJSONArea = {
    ...Template,
    args: {
        entity: entities[1],
        crateManager: {
            getEntity({ id }) {
                return entities[1];
            },
        },
    },
};
