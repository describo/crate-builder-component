import AddComponent from "./Add.component.vue";

export default {
    component: AddComponent,
    argTypes: {
        createProperty: { action: "createProperty" },
        createEntity: { action: "createEntity" },
        linkEntity: { action: "linkEntity" },
    },
};

const Template = (args, { argTypes }) => ({
    components: { AddComponent },
    props: Object.keys(argTypes),
    template: `
        <AddComponent v-bind="$props"
            @create:property="createProperty"
            @create:entity="createEntity"
            @link:entity="linkEntity"
        />
    `,
});

const crateManager = {
    findMatchingEntities: () => [],
};
const help = "some help text";
const multiple = true;
const embedded = false;

export const TextPrimitives = Template.bind({});
TextPrimitives.args = {
    crateManager,
    property: "something",
    definition: {
        help,
        multiple,
        required: true,
        type: ["Text", "TextArea", "URL"],
    },
    embedded,
};
export const DateTimePrimitives = Template.bind({});
DateTimePrimitives.args = {
    crateManager,
    property: "something",
    definition: {
        help,
        multiple,
        required: true,
        type: ["Date", "DateTime", "Time"],
    },
    embedded,
};

export const NumberPrimitives = Template.bind({});
NumberPrimitives.args = {
    crateManager,
    property: "something",
    definition: {
        help,
        multiple,
        required: true,
        type: ["Number", "Float", "Integer"],
    },
    embedded,
};

export const SelectPrimitive = Template.bind({});
SelectPrimitive.args = {
    crateManager,
    property: "something",
    definition: {
        help,
        multiple,
        required: true,
        values: ["a", "b", "c"],
        type: ["Select"],
    },
    embedded,
};

export const SelectUrlPrimitive = Template.bind({});
SelectUrlPrimitive.args = {
    crateManager,
    property: "something",
    definition: {
        help,
        multiple,
        required: true,
        values: ["http://schema.org/name", "https://schema.org/name", "arcp://name,..."],
        type: ["SelectURL"],
    },
    embedded,
};

export const SelectObjectPrimitive = Template.bind({});
SelectObjectPrimitive.args = {
    crateManager,
    property: "something",
    definition: {
        help,
        multiple,
        required: true,
        values: [
            { "@id": "1", "@type": "Dataset", name: "1" },
            { "@id": "1", "@type": "Dataset", name: "2" },
            { "@id": "1", "@type": "Dataset", name: "3" },
        ],
        type: ["SelectObject"],
    },
    embedded,
};

export const GeoPrimitives = Template.bind({});
GeoPrimitives.args = {
    crateManager,
    property: "something",
    definition: {
        help,
        multiple,
        required: true,
        type: ["Geo", "GeoCoordinates", "GeoShape"],
    },
    embedded,
};
