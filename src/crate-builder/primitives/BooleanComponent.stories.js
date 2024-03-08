import BooleanComponent from "./Boolean.component.vue";

export default {
    component: BooleanComponent,
    argTypes: {
        value: {
            options: [true, false],
            control: { type: "radio" },
        },
        "save:property": { action: "saveProperty" },
    },
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { BooleanComponent },
        setup() {
            return { args };
        },
        template: '<BooleanComponent v-bind="args" v-on="args" />',
    }),
};

export const BooleanComponentStory = {
    ...Template,
    args: {
        property: "boolean",
        value: false,
    },
};