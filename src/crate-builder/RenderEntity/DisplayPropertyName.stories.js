import DisplayPropertyNameComponent from "./DisplayPropertyName.component.vue";

export default {
    component: DisplayPropertyNameComponent,
    argTypes: {},
};

const Template = (args, { argTypes }) => ({
    components: { DisplayPropertyNameComponent },
    props: Object.keys(argTypes),
    template: '<DisplayPropertyNameComponent v-bind="$props" />',
});

export const SimpleNameNoNamespace = Template.bind({});
SimpleNameNoNamespace.args = {
    label: "name",
};

export const SimpleNameNoNamespaceCamelCase = Template.bind({});
SimpleNameNoNamespaceCamelCase.args = {
    label: "nameOfThing",
};

export const SimpleNameNoNamespaceStartCase = Template.bind({});
SimpleNameNoNamespaceStartCase.args = {
    label: "NameOfThing",
};

export const SimpleNameNoNamespaceSnakeCase = Template.bind({});
SimpleNameNoNamespaceSnakeCase.args = {
    label: "name-of-thing",
};

export const SimpleNameWithNamespace = Template.bind({});
SimpleNameWithNamespace.args = {
    label: "foaf:name",
};

export const SimpleNameWithNamespaceCamelCase = Template.bind({});
SimpleNameWithNamespaceCamelCase.args = {
    label: "dcterms:nameOfThing",
};

export const SimpleNameWithNamespaceStartCase = Template.bind({});
SimpleNameWithNamespaceStartCase.args = {
    label: "foaf:NameOfThing",
};

export const SimpleNameWithNamespaceSnakeCase = Template.bind({});
SimpleNameWithNamespaceSnakeCase.args = {
    label: "dcterms:name-of-thing",
};
