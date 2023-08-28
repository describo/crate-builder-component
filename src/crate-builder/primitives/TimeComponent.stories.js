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
        "save:property": { action: "saveProperty" },
    },
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { TimeComponent },
        setup() {
            return { args };
        },
        template: '<TimeComponent v-bind="args" v-on="args" />',
    }),
};

export const TimeComponentStory = {
    ...Template,
    args: {
        property: "currentTime",
        value: "09:30",
    },
};
