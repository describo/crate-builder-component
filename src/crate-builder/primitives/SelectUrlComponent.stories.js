import SelectUrlComponent from "./SelectUrl.component.vue";

export default {
    component: SelectUrlComponent,
};

const Template = (args) => ({
    components: { SelectUrlComponent },
    setup() {
        return { property: args.property, value: args.value, definition: args.definition };
    },
    template: '<SelectUrlComponent property="property" value="value" definition="definition" />',
});

export const ValidSelect = Template.bind({});
ValidSelect.args = {
    property: "select",
    value: "http://schema.org/name",
    definition: {
        values: ["http://schema.org/name", "https://schema.org/Country"],
    },
};

export const InvalidSelect1 = Template.bind({});
InvalidSelect1.args = {
    property: "select",
    value: "a",
    definition: {
        values: [{ name: "a" }, { name: "b" }, { name: "c" }],
    },
};

export const InvalidSelect2 = Template.bind({});
InvalidSelect2.args = {
    property: "select",
    value: "https://schema.org/name",
    definition: {
        values: ["a", "b"],
    },
};

export const InvalidSelect3 = Template.bind({});
InvalidSelect3.args = {
    property: "select",
    value: "a",
    definition: {
        values: ["a", "b"],
    },
};
