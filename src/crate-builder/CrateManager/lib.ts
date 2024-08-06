import isArray from "lodash-es/isArray.js";
import isNumber from "lodash-es/isNumber.js";
import isBoolean from "lodash-es/isBoolean.js";
import isString from "lodash-es/isString.js";
import isUndefined from "lodash-es/isUndefined.js";
import isNull from "lodash-es/isNull.js";
import { isURL as validatorIsURL } from "validator";
import { validateId } from "./validate-identifier";
import type { UnverifiedEntityDefinition, NormalisedEntityDefinition } from "../types.js";
import { isEmpty } from "lodash";

export const urlProtocols = ["http", "https", "ftp", "ftps"];

/**
 *
 * @param {string} value - string to check as a URL: checks 'http','https','ftp', 'arcp'
 */
export function isURL(value: string | number | boolean | undefined | null): boolean {
    if (!value) return false;
    if (isNumber(value)) return false;
    if (isBoolean(value)) return false;
    if (value.match(/arcp:\/\/name,.*/)) return true;
    if (value.match(/arcp:\/\/uuid,.*/)) return true;
    if (value.match(/arcp:\/\/ni,sha-256;,.*/)) return true;
    return validatorIsURL(value, {
        require_protocol: true,
        protocols: urlProtocols,
    });
}

/**
 *  This method normalises an entity. It checks that the '@type' is sensible, '@id' is valid and sets the name to the '@id' if not set
 *
 * @param {Object} entity - an entity to normalise
 * @param {string} i - if an id is not defined, then it will be set to #e${i}
 *
 * @returns the entity ready for use
 */
export function normalise(
    entity: UnverifiedEntityDefinition,
    i: number
): NormalisedEntityDefinition {
    if (!isString(entity["@type"]) && !isArray(entity["@type"]) && !isUndefined(entity["@type"])) {
        throw new Error(`'@type' property must be a string or an array or not defined at all`);
    }
    if (!isString(entity["@id"]) && !isUndefined(entity["@id"] && !isNull(entity["@id"]))) {
        throw new Error(`'@id' property must be a string or not defined at all`);
    }

    const normalisedEntity: NormalisedEntityDefinition = {
        "@id": "",
        "@type": "",
        name: "",
    };

    if (isUndefined(entity["@id"]) || isNull(entity["@id"])) {
        // set it to the generated id
        normalisedEntity["@id"] = `#e${i}`;
    } else {
        normalisedEntity["@id"] = isEncoded(entity["@id"])
            ? entity["@id"]
            : encodeURI(entity["@id"]);
    }

    //  normalise the entity['@type']
    normalisedEntity["@type"] = normaliseEntityType({ entity });

    // if it's a dataset, ensure the @id ends with /
    if (
        normalisedEntity["@type"].includes("Dataset") &&
        normalisedEntity["@id"].slice(-1) !== "/"
    ) {
        normalisedEntity["@id"] = `${normalisedEntity["@id"]}/`;
    }

    // there is an @id - is it valid?
    let { isValid, message } = validateId({
        id: normalisedEntity["@id"],
        type: normalisedEntity["@type"],
    });
    if (
        !isValid &&
        message ===
            "The identifier is not valid according to the RO Crate spec nor is it a valid IRI."
    ) {
        // set the id to an internal reference
        normalisedEntity["@id"] = `#${normalisedEntity["@id"]}`;
    }

    // is there a name?
    normalisedEntity.name = entity.name ? entity.name : normalisedEntity["@id"].replace(/^#/, "");

    // if the name is an array join it back into a string
    if (isArray(normalisedEntity.name)) normalisedEntity.name = normalisedEntity.name.join(" ");

    // set all properties other than core prop's to array
    //  and remove any rubbish: undefined, null and empty
    for (let property of Object.keys(entity)) {
        if (["@id", "@type", "name", "@reverse"].includes(property)) continue;

        // set property data as array
        let propertyData = Array.isArray(entity[property]) ? entity[property] : [entity[property]];

        // iterate over the property data
        normalisedEntity[property] = propertyData.filter((entry) => {
            // remove rubbish
            return !isUndefined(entry) && !isNull(entry) && !isEmpty(entry);
        });
        if (!normalisedEntity[property].length) delete normalisedEntity[property];
    }

    return normalisedEntity;
}

export function normaliseEntityType({ entity }: { entity: UnverifiedEntityDefinition }): string[] {
    let type: string[];

    if (!entity["@type"]) {
        type = isURL(entity["@id"]) ? ["URL"] : ["Thing"];
    } else if (isArray(entity["@type"])) {
        type = entity["@type"].map((t) => "" + t);
    } else if (isBoolean(entity["@type"]) || isNumber(entity["@type"])) {
        type = ["" + entity["@type"]];
    } else if (isString(entity["@type"])) {
        type = entity["@type"].split(",").map((t) => t.trim());
    } else {
        // Handle any other unexpected cases
        type = ["Thing"];
    }

    return type;
}

/**
 *
 * Mint an empty RO-Crate that conforms to the spec
 *
 * @returns a skeleton crate ready to be used
 */
export function mintNewCrate(): {} {
    return {
        "@context": "https://w3id.org/ro/crate/1.1/context",
        "@graph": [
            {
                "@type": "CreativeWork",
                "@id": "ro-crate-metadata.json",
                about: { "@id": "./" },
                conformsTo: { "@id": "https://w3id.org/ro/crate/1.1" },
            },

            {
                "@id": "./",
                "@type": "Dataset",
                name: "My Research Object Crate",
            },
        ],
    };
}

function isEncoded(uri: string) {
    uri = uri || "";

    return uri !== decodeURIComponent(uri);
}
