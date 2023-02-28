import TimeComponent from "./Time.component.vue";

export default {
    component: TimeComponent,
};

const Template = (args) => ({
    components: { TimeComponent },
    setup() {
        return { property: args.property, value: args.value };
    },
    template: '<TimeComponent property="property" value="value" />',
});

export const ValidTime = Template.bind({});
ValidTime.args = {
    property: "currentTime",
    value: "09:30",
};

export const InvalidTime = Template.bind({});
InvalidTime.args = {
    property: "currentTime",
    value: "time now",
};

export const NoTimeSupplied = Template.bind({});
NoTimeSupplied.args = {
    property: "currentTime",
};
