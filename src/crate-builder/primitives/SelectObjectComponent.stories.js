import SelectObjectComponent from "./SelectObject.component.vue";

export default {
    component: SelectObjectComponent,
    argTypes: {
        property: {
            control: { type: "text" },
        },
        "create:entity": { action: "createEntity" },
    },
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { SelectObjectComponent },
        setup() {
            return { args };
        },
        template: '<SelectObjectComponent v-bind="args" v-on="args" />',
    }),
};

export const SelectObjectComponentStory = {
    ...Template,
    args: {
        property: "select",
        definition: {
            values: [
                { "@id": "#a", "@type": "Thing", name: "a" },
                { "@id": "#b", "@type": "Thing", name: "b" },
                { "@id": "#c", "@type": "Thing", name: "c" },
                { "@id": "#d", "@type": "Thing", name: "d" },
            ],
        },
    },
};
