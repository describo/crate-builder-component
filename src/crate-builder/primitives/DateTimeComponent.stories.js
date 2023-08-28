import DateTimeComponent from "./DateTime.component.vue";

export default {
    component: DateTimeComponent,
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
        components: { DateTimeComponent },
        setup() {
            return { args };
        },
        template: '<DateTimeComponent v-bind="args" v-on="args" />',
    }),
};

export const DateTimeComponentStory = {
    ...Template,
    args: {
        property: "date",
        value: "2022-03-02",
    },
};
