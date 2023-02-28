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
        createEntity: { action: "createEntity" },
    },
};

const Template = (args, { argTypes }) => ({
    components: { UrlComponent },
    props: Object.keys(argTypes),
    template: '<UrlComponent v-bind="$props" @create:entity="createEntity"/>',
});

export const UrlComponentStory = Template.bind({});
UrlComponentStory.args = {
    property: "url",
    value: "http://schema.org/name",
};
