import UrlComponent from "./Url.component.vue";

export default {
    component: UrlComponent,
};

const Template = (args) => ({
    components: { UrlComponent },
    setup() {
        return { property: args.property, value: args.value };
    },
    template: '<UrlComponent property="property" value="value" />',
});

const args = { property: "url" };
export const HttpUrl = Template.bind({});
HttpUrl.args = { ...args, value: "http://schema.org/name" };

export const HttpsUrl = Template.bind({});
HttpsUrl.args = { ...args, value: "https://schema.org/name" };

export const ArcpUrl1 = Template.bind({});
ArcpUrl1.args = { ...args, value: "arcp://name,cooee-corpus/item/1-001" };

export const ArcpUrl2 = Template.bind({});
ArcpUrl2.args = { ...args, value: "arcp://uuid,c6179148-3cde-4435-8e66-304453f89d59" };

export const InvalidUrl = Template.bind({});
InvalidUrl.args = { ...args, value: "a" };
