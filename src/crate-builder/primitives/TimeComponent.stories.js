import TimeComponent from "./Time.component.vue";

export default {
    component: TimeComponent,
    argTypes: {
        property: {
            control: { type: "text" },
        },
        value: {
            options: ["09:30", "11:00:03", "15:58", "18:34:21", "time now"],
            control: { type: "radio" },
        },
        saveProperty: { action: "saveProperty" },
    },
};

const Template = (args, { argTypes }) => ({
    components: { TimeComponent },
    props: Object.keys(argTypes),
    template: '<TimeComponent v-bind="$props" @save:property="saveProperty" />',
});

export const TimeComponentStory = Template.bind({});
TimeComponentStory.args = {
    property: "currentTime",
    value: "09:30",
};
