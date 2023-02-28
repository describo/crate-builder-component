import SelectComponent from "./Select.component.vue";

export default {
    component: SelectComponent,
    argTypes: {
        property: {
            control: { type: "text" },
        },
        value: {
            options: ["a", "b", "c"],
            control: { type: "select" },
        },
        saveProperty: { action: "saveProperty" },
    },
};

const Template = (args, { argTypes }) => ({
    components: { SelectComponent },
    props: Object.keys(argTypes),
    template: '<SelectComponent v-bind="$props" @save:property="saveProperty" />',
});

export const SelectComponentStory = Template.bind({});
SelectComponentStory.args = {
    property: "select",
    value: "a",
    definition: {
        values: ["a", "b", "c"],
    },
};

export const InvalidSelect = Template.bind({});
InvalidSelect.args = {
    property: "select",
    value: "a",
    definition: {
        values: [{ name: "a" }, { name: "b" }, { name: "c" }],
    },
};
