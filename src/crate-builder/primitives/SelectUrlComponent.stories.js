import SelectUrlComponent from "./SelectUrl.component.vue";

export default {
    component: SelectUrlComponent,
    argTypes: {
        property: {
            control: { type: "text" },
        },
        "create:entity": { action: "createEntity" },
    },
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { SelectUrlComponent },
        setup() {
            return { args };
        },
        template: '<SelectUrlComponent v-bind="args" v-on="args" />',
    }),
};

export const SelectUrlComponentStory = {
    ...Template,
    args: {
        property: "select",
        value: "http://schema.org/name",
        definition: {
            values: ["http://schema.org/name", "https://schema.org/Country"],
        },
    },
};
