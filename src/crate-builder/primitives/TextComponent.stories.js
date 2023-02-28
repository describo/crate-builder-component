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
    },
};

const Template = (args, { argTypes }) => ({
    components: { TextComponent },
    props: Object.keys(argTypes),
    template: '<TextComponent v-bind="$props" @save:property="saveProperty" />',
});

export const TextComponentStory = Template.bind({});
TextComponentStory.args = { type: "text", property: "text", value: "http://schema.org/name" };
