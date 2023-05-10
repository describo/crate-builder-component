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
     * This method returns a definition object for the entity of type '@type'
     *
     *   If the entity is defined in the profile, then that definition is returned
     *   Otherwise, we look in schema.org for a definition
     *   And if that fails, we return a placeholder that inherits form schema.org thing
     *
     *   If the entity has a property matching the string `{entity name lowercased}Type`
     *    then we also look up any entities defined on that property in the profile and join
     *    their inputs into the type definition for the main entity @type.
     */
    getTypeDefinition({ entity }) {
        let type = entity["@type"];
        if (isArray(type)) type = type.join(", ");

        // let typeDefinitions = [];

        // do we have a definition in the profile?
        let typeDefinition;
        if (this.profile?.classes?.[type]) {
            //   yes - get it
            typeDefinition = cloneDeep(this.profile?.classes?.[type]);
        } else if (schemaOrgTypeDefinitions?.[type]) {
            //   no  - find it in schema.org
            typeDefinition = cloneDeep(schemaOrgTypeDefinitions?.[type]);
            typeDefinition.definition = "inherit";

            /**
             * We set the inputs to an empty array here otherwise we get
             *  all of them on the page which we don't want. By setting to inherit
             *  the user can choose to add inputs.
             */
            typeDefinition.inputs = [];
        } else {
            typeDefinition = {
                definition: "inherit",
                inputs: [],
            };
        }
        if (!typeDefinition.inputs) typeDefinition.inputs = [];

        // /**
        //  * Get the hierarchy for the type definition we're interested in
        //  *  and then go join in any inputs we find on any of those types
        //  *  in the profile.
        //  */
        // let types = this.getAdditionalEntityTypes({ entity });
        // if (types) {
        //     let inputs = types.map((type) => this.getInputsFromProfile({ type }));
        //     inputs = flattenDeep(inputs);
        //     inputs = uniqBy(inputs, "id");
        //     typeDefinition.inputs = [...typeDefinition.inputs, ...inputs];
        // }
        // typeDefinition.inputs = compact(typeDefinition.inputs);

        // return { inputs: typeDefinition.inputs };
        return typeDefinition;
    }

    /**
     *
     * If the entity has a property matching the string `{entity name lowercased}Type`
     *  then we also look up any entities defined on that property in the profile and join
     *  their inputs into the type definition for the main entity @type.
     *
     * So, for example, entity['@type'] = 'Entity'.
     * If there is a property `entityType` on the entity, then also load
     *   the inputs from that type definition
     *
     *  But only if the type is a singleton otherwise this gets too complex.
     */
    // getAdditionalEntityTypes({ entity }) {
    //     let types = entity["@type"];
    //     if (!isArray(types)) types = types.split(",").map((t) => t.trim());

    //     if (types.length === 1) {
    //         let typeProperty = `${types[0].toLowerCase()}Type`;
    //         // look it up as a property on the entity
    //         if (typeProperty in entity) {
    //             let types = isArray(entity[typeProperty])
    //                 ? entity[typeProperty]
    //                 : [entity[typeProperty]];
    //             return types;
    //         }

    //         // lookup up in the properties array
    //         if ("properties" in entity) {
    //             let properties = entity.properties[typeProperty];
    //             if (properties) return properties.map((p) => p?.tgtEntity.name);
    //         }
    //     }
    //     return [];
    // }

    /**
     *
     * Given an entity, try to find a definition for the property in the profile or
     *  right across the hierarchy
     *
     */
    getPropertyDefinition({ property, entity }) {
        // if (isArray(type)) type = type.join(", ");
        let propertyDefinition;
        let entityDefinition = this.getTypeDefinition({ entity });
        // console.debug("ENTITY definition:", JSON.stringify(entityDefinition, null, 2));
        if (entityDefinition) {
            // we found an entity definition in the profile - do we have a property definition?
            propertyDefinition = entityDefinition.inputs.filter(
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
            let { inputs } = this.getInputs({ types: this.getEntityTypeHierarchy({ entity }) });
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
     * Given a type, get the inputs defined in the profile for that type
     *
     */
    getInputsFromProfile({ type }) {
        if (this.profile?.classes?.[type]) {
            return this.profile?.classes?.[type].inputs;
        }
    }

    getInputs({ types }) {
        getInputs = getInputs.bind(this);
        const hierarchy = difference(this.mapTypeHierarchies({ types }), types);
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
