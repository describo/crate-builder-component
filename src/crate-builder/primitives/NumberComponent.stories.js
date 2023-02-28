import NumberComponent from "./Number.component.vue";

export default {
    component: NumberComponent,
    argTypes: {
        property: { control: { type: "text" } },
        value: {
            options: [1, "2", "not a number"],
            control: { type: "select" },
        },
        saveProperty: { action: "saveProperty" },
    },
};

const Template = (args, { argTypes }) => ({
    components: { NumberComponent },
    props: Object.keys(argTypes),
    template: '<NumberComponent v-bind="$props" @save:property="saveProperty" />',
});

export const NumberComponentStory = Template.bind({});
NumberComponentStory.args = {
    property: "number",
    value: 1,
};
