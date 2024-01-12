import AddComponent from "./Add.component.vue";
import { ProfileManager } from "../CrateManager/profile-manager.js";
const profileManager = new ProfileManager({});

const crateManager = {
    getEntities: () => [],
    profileManager,
};
const help = "some help text";
const multiple = true;
const embedded = false;

export default {
    component: AddComponent,
};
// export default {
//     component: AddComponent,
//     argTypes: {
//         embedded: {
//             control: { control: "boolean" },
//         },
//         "create:property": { action: "createProperty" },
//         "create:entity": { action: "createEntity" },
//         "link:entity": { action: "linkEntity" },
//     },
// };

// const Template = {
//     render: (args, { argTypes }) => {
//         return {
//             components: { AddComponent },
//             setup() {
//                 return { args };
//             },
//             template: `<AddComponent v-bind="args" v-on="args" />`,
//         };
//     },
// };

// export const TextPrimitives = {
//     ...Template,
//     args: {
//         crateManager,
//         property: "something",
//         definition: {
//             help,
//             multiple,
//             required: true,
//             type: ["Text", "TextArea", "URL"],
//         },
//         embedded,
//     },
// };
// export const DateTimePrimitives = {
//     ...Template,
//     args: {
//         crateManager,
//         property: "something",
//         definition: {
//             help,
//             multiple,
//             required: true,
//             type: ["Date", "DateTime", "Time"],
//         },
//         embedded,
//     },
// };

// export const NumberPrimitives = {
//     ...Template,
//     args: {
//         crateManager,
//         property: "something",
//         definition: {
//             help,
//             multiple,
//             required: true,
//             type: ["Number", "Float", "Integer"],
//         },
//         embedded,
//     },
// };

// export const SelectPrimitive = {
//     ...Template,
//     args: {
//         crateManager,
//         property: "something",
//         definition: {
//             help,
//             multiple,
//             required: true,
//             values: ["a", "b", "c"],
//             type: ["Select"],
//         },
//         embedded,
//     },
// };

// export const SelectUrlPrimitive = {
//     ...Template,
//     args: {
//         crateManager,
//         property: "something",
//         definition: {
//             help,
//             multiple,
//             required: true,
//             values: ["http://schema.org/name", "https://schema.org/name", "arcp://name,..."],
//             type: ["SelectURL"],
//         },
//         embedded,
//     },
// };

// export const SelectObjectPrimitive = {
//     ...Template,
//     args: {
//         crateManager,
//         property: "something",
//         definition: {
//             help,
//             multiple,
//             required: true,
//             values: [
//                 { "@id": "#1", "@type": "Dataset", name: "1" },
//                 { "@id": "#2", "@type": "Dataset", name: "2" },
//                 { "@id": "#3", "@type": "Dataset", name: "3" },
//             ],
//             type: ["SelectObject"],
//         },
//         embedded,
//     },
// };

// export const GeoPrimitives = {
//     ...Template,
//     args: {
//         crateManager,
//         property: "something",
//         definition: {
//             help,
//             multiple,
//             required: true,
//             type: ["Geo", "GeoCoordinates", "GeoShape"],
//         },
//         embedded,
//     },
// };
