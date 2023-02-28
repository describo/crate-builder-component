import ValueComponent from "./Value.component.vue";

export default {
    component: ValueComponent,
    argTypes: {
        property: {
            control: { type: "text" },
        },
        value: {
            options: ["1", "http://schema.org/name", { key: "value" }],
            control: { type: "select" },
        },
    },
};

const Template = (args, { argTypes }) => ({
    components: { ValueComponent },
    props: Object.keys(argTypes),
    template: '<ValueComponent v-bind="$props" />',
});

export const ValueComponentStory = Template.bind({});
ValueComponentStory.args = {
    property: "value",
    value: "1",
};
