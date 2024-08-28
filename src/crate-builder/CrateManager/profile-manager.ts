import schemaOrgTypeDefinitions from "./schema-type-definitions.json";
import isArray from "lodash-es/isArray";
import isEmpty from "lodash-es/isEmpty";
import flattenDeep from "lodash-es/flattenDeep";
import cloneDeep from "lodash-es/cloneDeep";
import orderBy from "lodash-es/orderBy";
import has from "lodash-es/has";
import compact from "lodash-es/compact";
import uniq from "lodash-es/uniq";
import uniqBy from "lodash-es/uniqBy";
import intersection from "lodash-es/intersection";
import type {
    NormalisedProfile,
    NormalisedEntityDefinition,
    ProfileLayout,
    ProfileInput,
    EntityReference,
} from "../types";

/**
 * @class
 *
 * ProfileManager
 *
 * A class to work with Describo Profiles
 *
 * @param {profile} - profile to handle
 */
export class ProfileManager {
    profile?: NormalisedProfile;
    constructor({ profile }: { profile?: NormalisedProfile }) {
        if (profile) this.profile = profile;
    }
    /**
     *
     * Get the layout for an entity from the profile
     *
     * Returns the first matching layout from the profile
     *
     * @param { Object } options
     * @param { Object } options.entity - the entity whose layout is required
     *
     */
    getLayout({
        entity,
    }: {
        entity: NormalisedEntityDefinition | EntityReference;
    }): ProfileLayout | null {
        // no layout defined in profile
        if (!this.profile?.layouts || !this.profile.layouts.length) return null;
        let layouts = this.profile.layouts;
        let layout = layouts.filter((layout) => {
            return intersection(layout.appliesTo, (entity as any)["@type"]).length;
        });

        // no matching layout found
        if (!layout.length) return null;

        // match found - make sure it has about and overflow placeholders
        let firstMatchingLayout = layout[0];
        if (!firstMatchingLayout.about) {
            firstMatchingLayout.about = {
                name: "about",
                label: "About",
                inputs: [],
                order: 0,
            };
        }
        if (!firstMatchingLayout.overflow) {
            firstMatchingLayout.overflow = {
                name: "overflow",
                label: "...",
                inputs: [],
                order: Object.keys(layout).length,
            };
        }

        // return it
        return firstMatchingLayout;
    }

    /**
     * Get inverse associations from the profile if any are defined
     */
    getPropertyAssociations(): { [key: string]: { property: string; propertyId: string } } {
        if (!this.profile?.propertyAssociations) return {};

        // create the associations both ways and return
        const associations: { [key: string]: { property: string; propertyId: string } } = {};
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
     *
     * Returns the classes defined in the profile if one is applied
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
    getEntityTypeHierarchy({ entity }: { entity: NormalisedEntityDefinition }) {
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
    getPropertyDefinition({
        property,
        entity,
    }: {
        property: string;
        entity: NormalisedEntityDefinition;
    }) {
        let propertyDefinition = {} as ProfileInput;
        let inputs = this.getInputsFromProfile({ entity });
        if (inputs.length) {
            // we found an entity definition in the profile - do we have a property definition?
            let definition = inputs.filter((p) => p.name.toLowerCase() === property.toLowerCase());
            if (definition.length) {
                // console.debug(
                //     "PROFILE property definition:",
                //     JSON.stringify(propertyDefinition, null, 2)
                // );
                propertyDefinition = cloneDeep(definition[0]);
            }
        }
        // unable to locate a property definition in the profile - look in schema.org
        if (isEmpty(propertyDefinition)) {
            let { inputs } = this.getAllInputs({ entity });
            let definition = inputs.filter((p) => p.name.toLowerCase() === property.toLowerCase());
            if (definition.length) {
                // console.debug(
                //     "SCHEMA ORG property definition:",
                //     JSON.stringify(propertyDefinition, null, 2)
                // );
                propertyDefinition = cloneDeep(definition[0]);
            }
        }

        // unable to locate a property definition in schema.org - create a default one
        if (isEmpty(propertyDefinition)) {
            // console.debug(
            //     "DEFAULT property definition:",
            //     JSON.stringify(propertyDefinition, null, 2)
            // );
            propertyDefinition = {
                id: "",
                name: "",
                type: ["Text"],
                help: "",
                multiple: true,
            };
        }

        if (!isArray(propertyDefinition.type)) {
            propertyDefinition.type = [propertyDefinition.type];
        }
        if (!has(propertyDefinition, "multiple")) propertyDefinition.multiple = true;

        return { propertyDefinition };
    }

    /**
     *
     * Given a set of types, figure out the type hierarchy taking into account
     *  the parent types that this is a subClassOf
     */
    mapTypeHierarchies({ types }: { types: string[] }) {
        types = cloneDeep(types);
        if (!types.includes("Thing")) types.push("Thing");

        types = flattenDeep(
            types.map((type) => [type, this.profile?.classes?.[type]?.subClassOf ?? []])
        );
        types = compact(types);

        types = flattenDeep(
            types.map((type) => {
                return [
                    type,
                    (schemaOrgTypeDefinitions as { [key: string]: { hierarchy: string[] } })[type]
                        ?.hierarchy ?? ["Thing"],
                ];
            })
        );
        types = uniq(types);
        return types;
    }

    /**
     *
     * Given an entity, get the inputs defined in the profile
     *
     * @param { Object } options
     * @param { Object } options.entity - the entity
     *
     */
    getInputsFromProfile({ entity }: { entity: NormalisedEntityDefinition }): ProfileInput[] {
        let types = entity["@type"];

        let inputs: ProfileInput[] = [];
        for (let type of types) {
            if (this.profile?.classes?.[type]) {
                //   yes - get it
                inputs = [...inputs, ...cloneDeep(this.profile?.classes?.[type].inputs)];
            }

            // if this class is a subclass of others, and they have a definition in the profile
            //   go and get those inputs as well
            if (this.profile?.classes?.[type]?.subClassOf) {
                for (let parentClass of this.profile?.classes?.[type]?.subClassOf) {
                    inputs = [
                        ...inputs,
                        ...cloneDeep(this.profile?.classes?.[parentClass]?.inputs ?? []),
                    ];
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
    getAllInputs({ entity }: { entity: NormalisedEntityDefinition }): { inputs: ProfileInput[] } {
        // let getInputsFunction = getInputs.bind(this);
        const hierarchy = this.getEntityTypeHierarchy({ entity });
        let inputs = [];

        const getInputs = (type: string) => {
            let inputs = [];
            if (this.profile?.classes?.[type]) {
                // type defined in profile - get those inputs
                inputs.push(this.profile.classes[type].inputs);
            }
            if (this.profile?.classes?.[type]?.definition === "inherit") {
                // profile type definition set to inherit - collect schema.org inputs
                inputs.push((schemaOrgTypeDefinitions as any)[type].inputs);
            }
            if (!this.profile?.classes?.[type]) {
                // no definition in profile - collect schema.org inputs
                inputs.push((schemaOrgTypeDefinitions as any)?.[type]?.inputs);
            }
            return inputs;
        };

        for (let type of hierarchy) {
            inputs.push(getInputs(type));
        }
        inputs = flattenDeep(inputs);
        inputs = compact(inputs);
        inputs = uniqBy(inputs, "id");
        inputs = orderBy(inputs, "name");
        return { inputs };
    }

    /**
     *
     * Try to get a definition from the profile and see if it's override or inherit
     *
     * If there's an override then return override - otherwise inherit. Exclusive rather than inclusive.
     *
     * @param { Object } options
     * @param { Object } options.entity - the entity
     * if there's an override then set to override - otherwise inherit
     * be exclusive rather than inclusive
     */
    getTypeDefinition({ entity }: { entity: NormalisedEntityDefinition }) {
        let types = entity["@type"];
        let directive = types.map((type) => this.profile.classes?.[type]?.definition);
        return directive.includes("override") ? "override" : "inherit";
    }

    /**
     * Get an entity label if defined
     *
     * @property the type name to localise
     */
    getTypeLabel(type: string) {
        return this.profile?.localisation?.[type] ?? type;
    }
}
