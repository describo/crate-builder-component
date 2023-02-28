import SelectUrlComponent from "./SelectUrl.component.vue";

export default {
    component: SelectUrlComponent,
    argTypes: {
        property: {
            control: { type: "text" },
        },
        createEntity: { action: "createEntity" },
    },
};

const Template = (args, { argTypes }) => ({
    components: { SelectUrlComponent },
    props: Object.keys(argTypes),
    template: '<SelectUrlComponent v-bind="$props" @create:entity="createEntity" />',
});

export const SelectUrlComponentStory = Template.bind({});
SelectUrlComponentStory.args = {
    property: "select",
    value: "http://schema.org/name",
    definition: {
        values: ["http://schema.org/name", "https://schema.org/Country"],
    },
};
