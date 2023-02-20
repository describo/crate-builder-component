import TextComponent from "./Text.component.vue";

export default {
    component: TextComponent,
};

const Template = (args) => ({
    components: { TextComponent },
    setup() {
        return { ...args };
    },
    template: '<TextComponent property="property" value="value" />',
});

const args = { type: "text", property: "url", placeholder: "Please input something" };
export const Text1 = Template.bind({});
Text1.args = { ...args, value: "http://schema.org/name" };

export const Text2 = Template.bind({});
Text2.args = { ...args, value: "", placeholder: "Define something" };

export const TextArea1 = Template.bind({});
TextArea1.args = { ...args, type: "textarea", value: "http://schema.org/name" };

export const InvalidType1 = Template.bind({});
InvalidType1.args = { ...args, type: "date", value: "http://schema.org/name" };
