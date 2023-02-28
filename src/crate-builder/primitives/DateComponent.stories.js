import DateComponent from "./Date.component.vue";

export default {
    component: DateComponent,
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
    components: { DateComponent },
    props: Object.keys(argTypes),
    template: '<DateComponent v-bind="$props" @save:property="saveProperty" />',
});

export const DateComponentStory = Template.bind({});
DateComponentStory.args = {
    property: "date",
    value: "2022-03-02",
};
