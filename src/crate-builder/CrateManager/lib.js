import isArray from "lodash-es/isArray.js";
import isNumber from "lodash-es/isNumber.js";
import isBoolean from "lodash-es/isBoolean.js";
import isString from "lodash-es/isString.js";
import isUndefined from "lodash-es/isUndefined.js";
import isNull from "lodash-es/isNull.js";
import validatorIsURL from "validator/es/lib/isURL.js";
import { validateId } from "./validate-identifier.js";

export const urlProtocols = ["http", "https", "ftp", "ftps"];

/**
 *
 * @param {string} value - string to check as a URL: checks 'http','https','ftp', 'arcp'
 */
export function isURL(value) {
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
export function normalise(entity, i) {
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
    let { isValid } = validateId({ id: entity["@id"], type: entity["@type"] });
    if (!isValid) entity["@id"] = `#${encodeURI(entity["@id"])}`;

    // is there a name?
    if (!entity.name) entity.name = entity["@id"].replace(/^#/, "");

    // if the name is an array join it back into a string
    if (isArray(entity.name)) entity.name = entity.name.join(" ");

    return entity;
}

/**
 *
 * @param {Object} entity - the entity whose type should be normalised
 * @description
 *  Use this method to normalise the @type of an entity.
 *
 * @returns the entity ready for use
 */
export function normaliseEntityType({ entity }) {
    if (!entity["@type"]) entity["@type"] = isURL(entity["@id"]) ? ["URL"] : ["Thing"];

    if (isArray(entity["@type"])) return entity;
    if (isBoolean(entity["@type"]) || isNumber(entity["@type"])) {
        entity["@type"] = ["" + entity["@type"]];
    }
    if (isString(entity["@type"]))
        entity["@type"] = entity["@type"].split(",").map((t) => t.trim());
    return entity;
}
