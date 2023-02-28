import DateTimeComponent from "./DateTime.component.vue";

export default {
    component: DateTimeComponent,
    argTypes: {
        property: {
            control: { type: "text" },
        },
        value: {
            options: ["2022-03-02", "2022-09-28T02:20:56.521", "date now"],
            control: { type: "radio" },
        },
        saveProperty: { action: "saveProperty" },
    },
};

const Template = (args, { argTypes }) => ({
    components: { DateTimeComponent },
    props: Object.keys(argTypes),
    template: '<DateTimeComponent v-bind="$props" @save:property="saveProperty" />',
});

export const DateTimeComponentStory = Template.bind({});
DateTimeComponentStory.args = {
    property: "date",
    value: "2022-03-02",
};
