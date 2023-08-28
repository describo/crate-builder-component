import NumberComponent from "./Number.component.vue";

export default {
    component: NumberComponent,
    argTypes: {
        value: {
            options: [1, "2", "not a number"],
            control: { type: "select" },
        },
        "save:property": { action: "saveProperty" },
    },
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { NumberComponent },
        setup() {
            return { args };
        },
        template: '<NumberComponent v-bind="args" v-on="args" />',
    }),
};

export const NumberComponentStory = {
    ...Template,
    args: {
        property: "number",
        value: 1,
    },
};
