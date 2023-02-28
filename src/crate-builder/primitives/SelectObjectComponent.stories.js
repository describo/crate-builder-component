import SelectObjectComponent from "./SelectObject.component.vue";

export default {
    component: SelectObjectComponent,
    argTypes: {
        property: {
            control: { type: "text" },
        },
        createEntity: { action: "createEntity" },
    },
};

const Template = (args, { argTypes }) => ({
    components: { SelectObjectComponent },
    props: Object.keys(argTypes),
    template: '<SelectObjectComponent v-bind="$props" @create:entity="createEntity" />',
});

export const SelectObjectComponentStory = Template.bind({});
SelectObjectComponentStory.args = {
    property: "select",
    definition: {
        values: [
            { "@id": "id: a", "@type": "Thing", name: "a" },
            { "@id": "id: b", "@type": "Thing", name: "b" },
            { "@id": "id: c", "@type": "Thing", name: "c" },
            { "@id": "id: d", "@type": "Thing", name: "d" },
        ],
    },
};
