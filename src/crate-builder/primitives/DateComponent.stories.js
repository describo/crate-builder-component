import DateComponent from "./Date.component.vue";

export default {
    component: DateComponent,
    argTypes: {
        value: {
            options: ["2022-03-02", "2022-09-28T02:20:56.521", "date now"],
            control: { type: "radio" },
        },
        "save:property": { action: "saveProperty" },
    },
};

const Template = {
    render: (args, { argTypes }) => ({
        components: { DateComponent },
        setup() {
            return { args };
        },
        template: '<DateComponent v-bind="args" v-on="args" />',
    }),
};

export const DateComponentStory = {
    ...Template,
    args: {
        property: "date",
        value: "2022-03-02",
    },
};
