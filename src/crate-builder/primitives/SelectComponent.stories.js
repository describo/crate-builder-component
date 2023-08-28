import SelectComponent from "./Select.component.vue";

export default {
    component: SelectComponent,
    argTypes: {
        value: {
            options: ["a", "b", "c"],
            control: { type: "select" },
        },
        "save:property": { action: "saveProperty" },
    },
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { SelectComponent },
        setup() {
            return { args };
        },
        template: '<SelectComponent v-bind="args" v-on="args" />',
    }),
};

export const SelectComponentStory = {
    ...Template,
    args: {
        property: "select",
        value: "a",
        definition: {
            values: ["a", "b", "c"],
        },
    },
};

export const InvalidSelect = {
    ...Template,
    args: {
        property: "select",
        value: "a",
        definition: {
            values: [{ name: "a" }, { name: "b" }, { name: "c" }],
        },
    },
};
