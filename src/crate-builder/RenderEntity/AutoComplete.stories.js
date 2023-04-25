import AutoCompleteComponent from "./AutoComplete.component.vue";

export default {
    component: AutoCompleteComponent,
    argTypes: {
        createEntity: { action: "createEntity" },
        linkEntity: { action: "linkEntity" },
    },
};

const Template = (args, { argTypes }) => ({
    components: { AutoCompleteComponent },
    props: Object.keys(argTypes),
    template: `
        <AutoCompleteComponent v-bind="$props"
            @create:entity="createEntity"
            @link:entity="linkEntity"
        />
    `,
});

const crateManager = {
    findMatchingEntities: () => [],
};

export const PersonAutoComplete = Template.bind({});
PersonAutoComplete.args = {
    crateManager,
    type: "Person",
};
