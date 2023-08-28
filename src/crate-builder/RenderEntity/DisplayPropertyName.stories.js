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

const Template = {
    render: (args, { argTypes }) => {
        return {
            components: { DisplayPropertyNameComponent },
            setup() {
                return { args };
            },
            template: '<DisplayPropertyNameComponent v-bind="args" />',
        };
    },
};

export const DisplayPropertyNameComponentStory = {
    ...Template,
    args: {
        property: "something",
        label: "name",
    },
};
