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
import intersection from "lodash-es/intersection";

/**
 * @class
 *
 * @name ProfileManager
 * @param {profile} - profile to handle
 * @description A class to work with Describo Profiles
 */
export class ProfileManager {
    constructor({ profile }) {
        this.profile = profile;
    }
    /**
     *
     * Get the layout for an entity from the profile
     *
     * @description Returns the first matching layout from the profile
     * @param { Object } options
     * @param { Object } options.entity - the entity whose layout is required
     *
     */
    getLayout({ entity }) {
        // no layout defined in profile
        if (!this.profile.layouts || !this.profile.layouts.length) return null;
        let layouts = this.profile.layouts;
        let layout = layouts.filter((layout) => {
            return intersection(layout.appliesTo, entity["@type"]).length;
        });

        // no matching layout found
        if (!layout.length) return null;

        // match found - make sure it has about and overflow placeholders
        layout = layout[0];
        if (!layout.about) {
            layout.about = {
                name: "about",
                label: "About",
                inputs: [],
                order: 0,
            };
        }
        if (!layout.overflow) {
            layout.overflow = {
                name: "overflow",
                label: "...",
                inputs: [],
                order: Object.keys(layout).length,
            };
        }

        // return it
        return layout;
    }

    /**
     * Get inverse associations from the profile if any are defined
     */
    getPropertyAssociations() {
        if (!this.profile?.propertyAssociations) return {};

        // create the associations both ways and return
        const associations = {};
        this.profile.propertyAssociations.forEach((a) => {
            associations[a.property] = a.inverse;
            associations[a.inverse.property] = { property: a.property, propertyId: a.propertyId };
        });
        return associations;
    }

    /**
     *
     * Get the available classes
     *   if a profile is defined, get those
     * @description Returns the classes defined in the profile if one is applied
     *   or all of the classes built into the base, schema.org profile
     *
     */
    getClasses() {
        if (this.profile?.classes) {
            return Object.keys(this.profile?.classes).sort();
        } else {
            return Object.keys(schemaOrgTypeDefinitions).sort();
        }
    }

    /**
     *
     * Return the type hierarchy for the given entity
     *
     * @param { Object } options
     * @param { Object } options.entity - the entity whose hierarchy is required
     *
     *
     */
    getEntityTypeHierarchy({ entity }) {
        let types = entity["@type"];
        types = this.mapTypeHierarchies({ types });
        return types;
    }

    /**
     *
     * Given an entity, try to find a definition for the property in the profile or
     *  right across the hierarchy
     *
     * @param { Object } options
     * @param { Object } options.property - the property to define
     * @param { Object } options.entity - the entity this property is a part of
     *
     */
    getPropertyDefinition({ property, entity }) {
        let propertyDefinition;
        let inputs = this.getInputsFromProfile({ entity });
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
            }
        }
        // unable to locate a property definition in the profile - look in schema.org
        if (isEmpty(propertyDefinition)) {
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
        if (!has(propertyDefinition, "multiple")) propertyDefinition.mutliple = true;

        return { propertyDefinition };
    }

    /**
     *
     * Given a set of types, figure out the type hierarchy taking into account
     *  the parent types that this is a subClassOf
     */
    mapTypeHierarchies({ types }) {
        types = cloneDeep(types);
        if (!types.includes("Thing")) types.push("Thing");

        types = flattenDeep(types.map((type) => [type, this.profile?.classes?.[type]?.subClassOf]));
        types = compact(types);

        types = flattenDeep(
            types.map((type) => {
                return schemaOrgTypeDefinitions[type]?.hierarchy ?? ["Thing"];
            })
        );
        types = uniq(types);
        return types;
        // types = flattenDeep(
        //     types.map((type) => {
        //         if (schemaOrgTypeDefinitions[type]?.subClassOf.length) {
        //             return [
        //                 type,
        //                 this.mapTypeHierarchies({
        //                     types: schemaOrgTypeDefinitions[type]?.subClassOf,
        //                 }),
        //             ];
        //         } else {
        //             return type;
        //         }
        //     })
        // );
        // return uniq(types);
    }

    /**
     *
     * Given an entity, get the inputs defined in the profile
     *
     * @param { Object } options
     * @param { Object } options.entity - the entity
     *
     */
    getInputsFromProfile({ entity }) {
        let types = entity["@type"];

        let inputs = [];
        for (let type of types) {
            if (this.profile?.classes?.[type]) {
                //   yes - get it
                inputs = [...inputs, ...cloneDeep(this.profile?.classes?.[type].inputs)];
            }

            // if this class is a subclass of others, and they have a definition in the profile
            //   go and get those inputs as well
            if (this.profile?.classes?.[type]?.subClassOf) {
                for (let parentClass of this.profile?.classes?.[type]?.subClassOf) {
                    inputs = [...inputs, ...cloneDeep(this.profile?.classes?.[parentClass].inputs)];
                }
            }
        }
        return uniqBy(inputs, "id");
    }

    /**
     *
     * Given an entity, get all available inputs by joining the profile with schema.org
     *
     * @param { Object } options
     * @param { Object } options.entity - the entity
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
     * Try to get a definition from the profile and see if it's override or inherit
     *
     * @description If there's an override then return override - otherwise inherit. Exclusive rather than inclusive.
     *
     * @param { Object } options
     * @param { Object } options.entity - the entity
     * if there's an override then set to override - otherwise inherit
     * be exclusive rather than inclusive
     */
    getTypeDefinition({ entity }) {
        let types = entity["@type"];
        let directive = types.map((type) => this.profile.classes?.[type]?.definition);
        return directive.includes("override") ? "override" : "inherit";
    }

    /**
     * Get an entity label if defined
     *
     * @property the type name to localise
     */
    getTypeLabel(type) {
        return this.profile?.localisation?.[type] ?? type;
    }
}
