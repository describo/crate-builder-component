import isArray from "lodash-es/isArray.js";
import isNumber from "lodash-es/isNumber.js";
import isBoolean from "lodash-es/isBoolean.js";
import isString from "lodash-es/isString.js";
import isUndefined from "lodash-es/isUndefined.js";
import isNull from "lodash-es/isNull.js";
import { isURL as validatorIsURL } from "validator";
import { validateId } from "./validate-identifier";
import type {
    UnverifiedEntityDefinition,
    PartiallyVerifiedEntityDefinition,
    NormalisedEntityDefinition,
} from "../../types.js";

export const urlProtocols = ["http", "https", "ftp", "ftps"];

/**
 *
 * @param {string} value - string to check as a URL: checks 'http','https','ftp', 'arcp'
 */
export function isURL(value: string | number | boolean | undefined | null) {
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
 *
 * @param {Object} entity - an entity to normalise
 * @param {string} i - if an id is not defined, then it will be set to #e${i}
 * @descripton
 *  This method normalises an entity. It checks that the '@type' is sensible, '@id' is valid and sets the name to the '@id' if not set
 * @returns the entity ready for use
 */
export function normalise(
    entity: UnverifiedEntityDefinition,
    i: number
): NormalisedEntityDefinition {
    if (!isString(entity["@type"]) && !isArray(entity["@type"]) && !isUndefined(entity["@type"])) {
        throw new Error(`'@type' property must be a string or an array or not defined at all`);
    }
    if (isUndefined(entity["@id"]) || isNull(entity["@id"])) {
        // set it to the generated id
        entity["@id"] = `#e${i}`;
    } else if (!isString(entity["@id"])) {
        throw new Error(`'@id' property must be a string`);
    }

    //  normalise the entity['@type']
    entity = normaliseEntityType({ entity });

    // if it's a dataset, ensure the @id ends with /
    if (entity["@type"].includes("Dataset") && entity["@id"].slice(-1) !== "/") {
        entity["@id"] = `${entity["@id"]}/`;
    }

    // there is an @id - is it valid?
    // @ts-ignore
    let { isValid } = validateId({ id: entity["@id"], type: entity["@type"] });
    // @ts-ignore
    if (!isValid) entity["@id"] = `#${encodeURI(entity["@id"])}`;

    // is there a name?
    // @ts-ignore
    if (!entity.name) entity.name = entity["@id"].replace(/^#/, "");

    // if the name is an array join it back into a string
    if (isArray(entity.name)) entity.name = entity.name.join(" ");

    // @ts-ignore
    return entity;
}

export function normaliseEntityType({
    entity,
}: {
    entity: UnverifiedEntityDefinition;
}): PartiallyVerifiedEntityDefinition {
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

    return {
        ...entity,
        "@type": type,
    };
}

/**
 *
 * Mint an empty RO-Crate that conforms to the spec
 *
 * @returns a skeleton crate ready to be used
 */
export function mintNewCrate() {
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
