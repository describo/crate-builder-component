import DisplayPropertyNameComponent from "./DisplayPropertyName.component.vue";

export default {
    component: DisplayPropertyNameComponent,
    argTypes: {
        label: {
            options: [
                "name",
                "nameOfThing",
                "NameOfThing",
                "name-of-thing",
                "foaf:name",
                "dcterms:nameOfThing",
                "dcterms:name-of-thing",
            ],
            control: { type: "select" },
        },
    },
};

const Template = (args, { argTypes }) => ({
    components: { DisplayPropertyNameComponent },
    props: Object.keys(argTypes),
    template: '<DisplayPropertyNameComponent v-bind="$props" />',
});

export const DisplayPropertyNameComponentStory = Template.bind({});
DisplayPropertyNameComponentStory.args = {
    property: "something",
    label: "name",
};
