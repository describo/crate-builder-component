import NumberComponent from "./Number.component.vue";

export default {
    component: NumberComponent,
};

const Template = (args) => ({
    components: { NumberComponent },
    setup() {
        return { property: args.property, value: args.value };
    },
    template: '<NumberComponent property="property" value="value" />',
});

export const ValidNumber1 = Template.bind({});
ValidNumber1.args = {
    property: "number",
    value: "1",
};

export const ValidNumber2 = Template.bind({});
ValidNumber2.args = {
    property: "number",
    value: 1,
};

export const InvalidNumber = Template.bind({});
InvalidNumber.args = {
    property: "number",
    value: "something not a number",
};
