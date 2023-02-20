import DateTimeComponent from "./DateTime.component.vue";

export default {
    component: DateTimeComponent,
};

const Template = (args) => ({
    components: { DateTimeComponent },
    setup() {
        return { property: args.property, value: args.value };
    },
    template: '<DateTimeComponent property="property" value="value" />',
});

export const ValidDate1 = Template.bind({});
ValidDate1.args = {
    property: "currentDate",
    value: new Date().toISOString(),
};

export const ValidDate2 = Template.bind({});
ValidDate2.args = {
    property: "currentDate",
    value: "2022-03-02",
};

export const InvalidDate = Template.bind({});
InvalidDate.args = {
    property: "currentDate",
    value: "date now",
};
