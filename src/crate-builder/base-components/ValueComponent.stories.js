import ValueComponent from "./Value.component.vue";

export default {
    component: ValueComponent,
};

const Template = (args) => ({
    components: { ValueComponent },
    setup() {
        return { definition: args.definition };
    },
    template: '<ValueComponent definition="definition" />',
});

export const Value1 = Template.bind({});
Value1.args = {
    definition: {
        value: "some value",
    },
};

export const Value2 = Template.bind({});
Value2.args = {
    definition: {
        value: "some other value",
    },
};
