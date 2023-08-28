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

const Template = {
    render: (args, { argTypes }) => ({
        components: { ValueComponent },
        setup() {
            return { args };
        },
        template: '<ValueComponent v-bind="args" />',
    }),
};

export const ValueComponentStory = {
    ...Template,
    args: {
        property: "value",
        value: "1",
    },
};
