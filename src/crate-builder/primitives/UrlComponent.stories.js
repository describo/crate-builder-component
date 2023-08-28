import UrlComponent from "./Url.component.vue";

export default {
    component: UrlComponent,
    argTypes: {
        property: {
            control: { type: "text" },
        },
        value: {
            options: [
                "http://schema.org/name",
                "https://schema.org/name",
                "arcp://name,cooee-corpus/item/1-001",
                "arcp://uuid,c6179148-3cde-4435-8e66-304453f89d59",
                "something not url",
            ],
            control: { type: "radio" },
        },
        "create:entity": { action: "createEntity" },
    },
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { UrlComponent },
        setup() {
            return { args };
        },
        template: '<UrlComponent v-bind="args" v-on="args" />',
    }),
};

export const UrlComponentStory = {
    ...Template,
    args: {
        property: "url",
        value: "http://schema.org/name",
    },
};
