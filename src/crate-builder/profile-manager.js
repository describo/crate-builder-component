import schemaOrgTypeDefinitions from "./schema-type-definitions.json";
import isArray from "lodash-es/isArray";
import isString from "lodash-es/isString";
import isEmpty from "lodash-es/isEmpty";
import flattenDeep from "lodash-es/flattenDeep";
import cloneDeep from "lodash-es/cloneDeep";
import orderBy from "lodash-es/orderBy";
import has from "lodash-es/has";
import compact from "lodash-es/compact";
import uniq from "lodash-es/uniq";
import uniqBy from "lodash-es/uniqBy";
import difference from "lodash-es/difference";

// TODO: write some tests against this
export class ProfileManager {
    constructor({ profile }) {
        this.profile = profile;
    }
    /**
     *
     * Get the layout properties from the profile if defined
     *
     */
    getLayout({ type }) {
        if (isArray(type)) type = type.join(", ");
        return {
            layouts: this.profile?.layouts?.[type],
            hide: this.profile?.hide?.[type],
        };
    }

    /**
     *
     * Return the type hierarchy for the given entity
     *
     */
    getEntityTypeHierarchy({ entity }) {
        let types = entity["@type"];
        if (!isArray(types)) types = entity["@type"].split(",").map((t) => t.trim());
        // types = [...types, ...this.getAdditionalEntityTypes({ entity })];
        types = this.mapTypeHierarchies({ types });
        return types;
    }

    /**
     *
     * Given an entity, try to find a definition for the property in the profile or
     *  right across the hierarchy
     *
     */
    getPropertyDefinition({ property, entity }) {
        // if (isArray(type)) type = type.join(", ");
        let propertyDefinition;
        let inputs = this.getInputsFromProfile({ entity });
        // console.debug("ENTITY definition:", JSON.stringify(entityDefinition, null, 2));
        if (inputs.length) {
            // we found an entity definition in the profile - do we have a property definition?
            propertyDefinition = inputs.filter(
                (p) => p.name.toLowerCase() === property.toLowerCase()
            );
            if (propertyDefinition.length) {
                // console.debug(
                //     "PROFILE property definition:",
                //     JSON.stringify(propertyDefinition, null, 2)
                // );
                propertyDefinition = cloneDeep(propertyDefinition[0]);
                if (!has(propertyDefinition, "multiple")) propertyDefinition.multiple = true;
            }
        }
        // unable to locate a property definition in the profile - look in schema.org
        if (isEmpty(propertyDefinition)) {
            // const types = flattenDeep(this.mapTypeHierarchies(type));
            // let inputs = this.collectInputs({ types });
            let { inputs } = this.getAllInputs({ entity });
            propertyDefinition = inputs.filter(
                (p) => p.name.toLowerCase() === property.toLowerCase()
            );
            if (propertyDefinition.length) {
                // console.debug(
                //     "SCHEMA ORG property definition:",
                //     JSON.stringify(propertyDefinition, null, 2)
                // );
                propertyDefinition = cloneDeep(propertyDefinition[0]);
                if (!has(propertyDefinition, "multiple")) propertyDefinition.mutliple = true;
            }
        }

        // unable to locate a property definition in schema.org - create a default one
        if (isEmpty(propertyDefinition)) {
            // console.debug(
            //     "DEFAULT property definition:",
            //     JSON.stringify(propertyDefinition, null, 2)
            // );
            propertyDefinition = {
                type: ["Text"],
                help: "",
                multiple: true,
            };
        }

        if (!isArray(propertyDefinition.type)) {
            propertyDefinition.type = [propertyDefinition.type];
        }

        return { propertyDefinition };
    }

    /**
     *
     * Given a set of types, figure out the type hierarchy taking into account
     *  the parent types that this is a subClassOf
     */
    mapTypeHierarchies({ types }) {
        types = cloneDeep(types);
        if (isString(types)) {
            types = types.split(",");
            types = types.map((t) => t.trim());
        }
        if (!types.includes("Thing")) types.push("Thing");

        types = flattenDeep(types.map((type) => [type, this.profile?.classes?.[type]?.subClassOf]));
        types = compact(types);

        types = flattenDeep(
            types.map((type) => {
                if (schemaOrgTypeDefinitions[type]?.subClassOf.length) {
                    return [
                        type,
                        this.mapTypeHierarchies({
                            types: schemaOrgTypeDefinitions[type]?.subClassOf,
                        }),
                    ];
                } else {
                    return type;
                }
            })
        );
        return uniq(types);
    }

    /**
     *
     * Given an entity, get the inputs defined in the profile
     *
     */
    getInputsFromProfile({ entity }) {
        let types = entity["@type"];
        if (isString(types)) types = types.split(",").map((t) => t.trim());

        let inputs = [];
        for (let type of types) {
            if (this.profile?.classes?.[type]) {
                //   yes - get it
                inputs = [...inputs, ...cloneDeep(this.profile?.classes?.[type].inputs)];
            }
        }
        return uniqBy(inputs, "id");
    }

    /**
     *
     * Given an entity, get all available inputs by joining the profile with schema.org
     *
     */
    getAllInputs({ entity }) {
        getInputs = getInputs.bind(this);
        const hierarchy = this.getEntityTypeHierarchy({ entity });
        let inputs = [];
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

    /**
     *
     * try to get all types from the profile,
     * if there's an override then set to override - otherwise inherit
     * be exclusive rather than inclusive
     */
    getTypeDefinition(entity) {
        let types = entity["@type"].split(",").map((t) => t.trim());
        let directive = types.map((type) => this.profile.classes?.[type]?.definition);
        return directive.includes("override") ? "override" : "inherit";
    }
}
