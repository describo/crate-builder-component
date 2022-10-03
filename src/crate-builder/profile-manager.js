import { schemaOrgTypeDefinitions } from "./schema-type-definitions.js";
import {
    isString,
    isArray,
    flattenDeep,
    isEmpty,
    orderBy,
    cloneDeep,
    has,
    compact,
    uniqBy,
    difference,
} from "lodash";

// TODO: write some tests against this
export class ProfileManager {
    constructor({ profile }) {
        this.profile = profile;
    }

    getLayout({ type }) {
        if (isArray(type)) type = type.join(", ");
        return {
            layouts: this.profile?.layouts?.[type],
            hide: this.profile?.hide?.[type],
        };
    }

    getTypeDefinition({ type }) {
        if (isArray(type)) type = type.join(", ");
        let typeDefinition;

        // do we have a definition in the profile?
        let typeDefinitionInProfile = this.profile?.classes?.[type];
        if (typeDefinitionInProfile) {
            //   yes - get it
            typeDefinition = cloneDeep(typeDefinitionInProfile);
        } else {
            //   no  - find it in schema.org
            typeDefinition = this.profile?.classes?.[type];
            if (isEmpty(typeDefinition)) {
                typeDefinition = {
                    definition: "inherit",
                    inputs: [],
                };
            }
        }

        return { ...typeDefinition };
    }

    getPropertyDefinition({ property, type }) {
        if (isArray(type)) type = type.join(", ");
        let propertyDefinition;
        let entityDefinition = this.profile?.classes?.[type];
        console.debug("ENTITY definition:", JSON.stringify(entityDefinition, null, 2));
        if (entityDefinition) {
            // we found an entity definition in the profile - do we have a property definition?
            propertyDefinition = entityDefinition.inputs.filter(
                (p) => p.name.toLowerCase() === property.toLowerCase()
            );
            if (propertyDefinition.length) {
                console.debug(
                    "PROFILE property definition:",
                    JSON.stringify(propertyDefinition, null, 2)
                );
                propertyDefinition = cloneDeep(propertyDefinition[0]);
                if (!has(propertyDefinition, "multiple")) propertyDefinition.mutliple = true;
            }
        }
        // unable to locate a property definition in the profile - look in schema.org
        if (isEmpty(propertyDefinition)) {
            // const types = flattenDeep(this.mapTypeHierarchies(type));
            // let inputs = this.collectInputs({ types });
            let { inputs } = this.getInputs({ types: type });
            propertyDefinition = inputs.filter(
                (p) => p.name.toLowerCase() === property.toLowerCase()
            );
            if (propertyDefinition.length) {
                console.debug(
                    "SCHEMA ORG property definition:",
                    JSON.stringify(propertyDefinition, null, 2)
                );
                propertyDefinition = cloneDeep(propertyDefinition[0]);
                if (!has(propertyDefinition, "multiple")) propertyDefinition.mutliple = true;
            }
        }

        // unable to locate a property definition in schema.org - create a default one
        if (isEmpty(propertyDefinition)) {
            console.debug(
                "DEFAULT property definition:",
                JSON.stringify(propertyDefinition, null, 2)
            );
            propertyDefinition = {
                type: ["Text"],
                help: "",
                multiple: true,
            };
        }

        return { propertyDefinition };
    }

    mapTypeHierarchies(types) {
        if (isString(types)) {
            types = types.split(",");
            types = types.map((t) => t.trim());
        }

        types = flattenDeep(types.map((type) => [type, this.profile?.classes?.[type]?.subClassOf]));
        types = compact(types);

        return flattenDeep(
            types.map((type) => {
                if (schemaOrgTypeDefinitions[type]?.subClassOf.length) {
                    return [
                        type,
                        this.mapTypeHierarchies(schemaOrgTypeDefinitions[type]?.subClassOf),
                    ];
                } else {
                    return type;
                }
            })
        );
    }

    getInputs({ types }) {
        getInputs = getInputs.bind(this);
        const hierarchy = difference(this.mapTypeHierarchies(types), types);
        let inputs = [];
        for (let type of types) {
            inputs.push(getInputs(type));
        }
        for (let type of hierarchy) {
            inputs.push(getInputs(type));
        }
        inputs = flattenDeep(inputs);
        inputs = compact(inputs);
        inputs = uniqBy(inputs, "id");
        inputs = orderBy(inputs, "name");
        return { inputs };

        function getInputs(type) {
            let inputs = [];
            if (this.profile?.classes?.[type]) {
                // type defined in profile - get those inputs
                inputs.push(this.profile.classes[type].inputs);
            }
            if (this.profile?.classes?.[type]?.definition === "inherit") {
                // profile type definition set to inherit - collect schema.org inputs
                inputs.push(schemaOrgTypeDefinitions[type].inputs);
            }
            if (!this.profile?.classes?.[type]) {
                // no definition in profile - collect schema.org inputs
                inputs.push(schemaOrgTypeDefinitions?.[type]?.inputs);
            }
            return inputs;
        }
    }
}
