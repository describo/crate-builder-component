import MapComponent from "./Map.component.vue";
// import {
//     Title,
//     Subtitle,
//     Description,
//     Primary,
//     ArgsTable,
//     Stories,
//     PRIMARY_STORY,
// } from "@storybook/addon-docs";

export default {
    component: MapComponent,
    parameters: {
        docs: {
            page: () => null,
            // Can't get JSX working inside vite so this is a no go
            // page: () => (
            //     <>
            //         <Title />
            //         <Stories />
            //     </>
            // ),
        },
    },
};

const Template = (args) => ({
    components: { MapComponent },
    setup() {
        return { ...args };
    },
    template: '<MapComponent entity="entity"  />',
});

const args = {
    entity: {
        describoId: "x",
    },
};

// TODO: Write story to test box and long/lat

// export const GeoBox = Template.bind({});
// GeoBox.args = {
//     entity: {
//         describoId: "1",
//         properties: [
//             {
//                 property: "box",
//                 value: "-7.710991655433217,158.76561641693118 -47.040182144806664,109.54686641693117",
//             },
//         ],
//     },
// };

export const GeoJSONPoint = Template.bind({});
GeoJSONPoint.args = {
    entity: {
        describoId: "1",
        properties: [
            {
                property: "geojson",
                value: '{"type":"Feature","properties":{"name":"Nyaki Nyaki / Njaki Njaki"},"geometry":{"type":"Point","coordinates":["118.75508272649","-32.390945191928"]}}',
            },
        ],
    },
};

export const GeoJSONArea = Template.bind({});
GeoJSONArea.args = {
    entity: {
        describoId: "2",
        properties: [
            {
                property: "geojson",
                value: '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[158.76561641693118,-7.710991655433217],[158.76561641693118,-47.040182144806664],[109.54686641693117,-47.040182144806664],[109.54686641693117,-7.710991655433217]]]}}',
            },
        ],
    },
};
