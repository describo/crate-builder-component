import SelectComponent from "./Select.component.vue";

export default {
    component: SelectComponent,
};

const Template = (args) => ({
    components: { SelectComponent },
    setup() {
        return { property: args.property, value: args.value, definition: args.definition };
    },
    template: '<SelectComponent property="property" value="value" definition="definition" />',
});

export const ValidSelect = Template.bind({});
ValidSelect.args = {
    property: "select",
    value: "a",
    definition: {
        values: ["a", "b", "c"],
    },
};

export const InvalidSelect = Template.bind({});
InvalidSelect.args = {
    property: "select",
    value: "a",
    definition: {
        values: [{ name: "a" }, { name: "b" }, { name: "c" }],
    },
};
