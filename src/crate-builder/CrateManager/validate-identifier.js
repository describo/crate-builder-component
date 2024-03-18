import isArray from "lodash-es/isArray.js";
import validateIriPkg from "../lib/validate-iri";

export function validateId({ id, type }) {
    if (!id) {
        return { isValid: false };
    }

    // if it's the root descriptor - it's valid
    if (id === "ro-crate-metadata.json") {
        return { isValid: true };
    }

    if (type) {
        // if type matches File or Dataset then whatever is provided is valid
        type = isArray(type) ? type.join(", ") : type;
        if (type.match(/file/i)) return { isValid: true };
        if (type.match(/Dataset/i)) return { isValid: true };
    }

    // if there are spaces in the id - encode them
    if (id.match(/\s+/)) {
        id = id.replace(/\s+/g, "%20");
    }

    // @id is relative
    if (id.match(/^\/.*/)) return { isValid: true };

    // @id starting with . is valid
    if (id.match(/^\..*/)) return { isValid: true };

    // @id starting with # is valid
    if (id.match(/^\#.*/)) return { isValid: true };

    // @id with blank node is valid
    if (id.match(/^\_:.*/)) return { isValid: true };

    // arcp URI's are valid
    if (id.match(/arcp:\/\/name,.*/)) return { isValid: true };
    if (id.match(/arcp:\/\/uuid,.*/)) return { isValid: true };
    if (id.match(/arcp:\/\/ni,sha-256;,.*/)) return { isValid: true };
    // return { isValid: true };

    // otherwise check that the id is a valid IRI
    try {
        let result = validateIriPkg.validateIri(id, validateIriPkg.IriValidationStrategy.Strict);
        if (!result) {
            // it's valid
            return { isValid: true };
        } else if (result?.message?.match(/Invalid IRI according to RFC 3987:/)) {
            // otherwise
            const message = `${result.message.replace(
                /Invalid IRI according to RFC 3987:/,
                "Invalid identifier"
            )}. See https://describo.github.io/documentation/component/identifiers.html for more information.`;
            return { isValid: false, message };
        }
    } catch (error) {
        return { isValid: false };
    }
}
