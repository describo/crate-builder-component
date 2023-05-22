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

/**
 *
 * Linked entity structure
 *
 */
// const entity = {
//     propertyId: "1140b749-d1b3-4afb-b915-3890fd8762eb",
//     srcEntityId: "ed91f36f-6ad4-49fd-91f1-6a44938c6cda",
//     property: "hasPart",
//     tgtEntityId: "1f281182-5d90-44c2-b4cc-9f06e052e36c",
//     tgtEntity: {
//         describoId: "1f281182-5d90-44c2-b4cc-9f06e052e36c",
//         "@id": ".completed-resources.json",
//         "@type": "File",
//         "@reverse": { hasPart: { "@id": "./" } },
//         name: ".completed-resources.json",
//     },
// };
const crateManager = {};

export const ValidEntityInputWithOneEntity = Template.bind({});
ValidEntityInputWithOneEntity.args = {
    crateManager,
    entities: generateEntities(1),
};

export const ValidEntityInputWithOneHundredEntities = Template.bind({});
ValidEntityInputWithOneHundredEntities.args = {
    crateManager,
    entities: generateEntities(100),
};

function generateEntities(limit) {
    return range(0, limit).map((i) => {
        const tgtEntityId = chance.natural() + i;
        return {
            propertyId: `propertyId-${i}`,
            srcEntityId: `entity-${i}`,
            property: "hasPart",
            tgtEntityId,
            tgtEntity: {
                describoId: tgtEntityId,
                "@id": chance.url(),
                "@type": "File",
                "@reverse": { hasPart: { "@id": "./" } },
                name: `/path/to/file/${chance.word()}`,
                associations: [],
            },
        };
    });
}
