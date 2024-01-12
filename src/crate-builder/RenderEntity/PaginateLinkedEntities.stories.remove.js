import PaginateLinkedEntitiesComponent from "./PaginateLinkedEntities.component.vue";
import Chance from "chance";
const chance = new Chance();
import range from "lodash/range";

export default {
    component: PaginateLinkedEntitiesComponent,
    argTypes: {
        "load:entity": { action: "loadEntity" },
        "save:property": { action: "saveProperty" },
        "delete:property": { action: "deleteProperty" },
    },
};

const crateManager = {};
const Template = {
    render: (args, { argTypes }) => ({
        components: { PaginateLinkedEntitiesComponent },
        setup() {
            return { args };
        },
        template: `
            <PaginateLinkedEntitiesComponent v-bind="args" v-on="args" />
        `,
    }),
};

export const ValidEntityInputWithOneEntity = {
    ...Template,
    args: {
        readonly: false,
        property: "something",
        entities: generateEntities(1),
    },
};

export const ValidEntityInputWithOneHundredEntities = {
    ...Template,
    args: {
        readonly: false,
        property: "something",
        entities: generateEntities(100),
    },
};

function generateEntities(limit) {
    return range(0, limit).map((i) => {
        return {
            idx: i,
            tgtEntity: {
                "@id": chance.url(),
                "@type": ["File"],
                name: `/path/to/file/${chance.word()}`,
                associations: [],
            },
        };
    });
}
