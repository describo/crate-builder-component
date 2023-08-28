import TextComponent from "./Text.component.vue";

export default {
    component: TextComponent,
    argTypes: {
        type: { options: ["text", "textarea"], control: { type: "radio" } },
        property: { control: { type: "text" } },
        value: {
            options: ["http://schema.org/name", "define something", undefined],
            control: { type: "radio" },
        },
        placeholder: { options: [undefined, "some helpful text"], control: { type: "radio" } },
        "save:property": { action: "saveProperty" },
    },
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { TextComponent },
        setup() {
            return { args };
        },
        template: '<TextComponent v-bind="args" v-on="args" />',
    }),
};

export const TextComponentStory = {
    ...Template,
    args: { type: "text", property: "text", value: "http://schema.org/name" },
};
