import PaginateLinkedEntitiesComponent from "./PaginateLinkedEntities.component.vue";
import Chance from "chance";
const chance = new Chance();
import range from "lodash/range";

export default {
    component: PaginateLinkedEntitiesComponent,
    argTypes: {
        loadEntity: { action: "loadEntity" },
        saveProperty: { action: "saveProperty" },
        deleteProperty: { action: "deleteProperty" },
    },
    parameters: {
        docs: () => null,
    },
};

const Template = (args, { argTypes }) => ({
    components: { PaginateLinkedEntitiesComponent },
    props: Object.keys(argTypes),
    template: `
        <PaginateLinkedEntitiesComponent
            v-bind="$props"
            @load:entity="loadEntity"
            @save:property="saveProperty"
            @delete:property="deleteProperty" />
    `,
});

const crateManager = {};

export const ValidEntityInputWithOneEntity = Template.bind({});
ValidEntityInputWithOneEntity.args = {
    crateManager,
    property: "something",
    entities: generateEntities(1),
};

export const ValidEntityInputWithOneHundredEntities = Template.bind({});
ValidEntityInputWithOneHundredEntities.args = {
    crateManager,
    property: "something",
    entities: generateEntities(100),
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
