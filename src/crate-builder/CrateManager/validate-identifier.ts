import validateIriPkg from "../lib/validate-iri";

type ValidateIdParams = {
    id: string | undefined;
    type: string | string[];
};

type ValidateIdResponse = { isValid: boolean; message?: string };

export function validateId({ id, type }: ValidateIdParams): ValidateIdResponse {
    if (!id) {
        return { isValid: false, message: "No identifier was provided." };
    }

    // if it's the root descriptor - it's valid
    if (id === "ro-crate-metadata.json") {
        return { isValid: true };
    }

    if (type) {
        // if type matches File or Dataset then whatever is provided is valid
        type = Array.isArray(type) ? type.join(", ") : type;
        if (type.match(/file/i)) return { isValid: true };
        if (type.match(/Dataset/i)) return { isValid: true };
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
        }
    } catch (error) {
        return {
            isValid: false,
            message:
                "The identifier is not valid according to the RO Crate spec nor is it a valid IRI.",
        };
    }

    return {
        isValid: false,
        message:
            "The identifier is not valid according to the RO Crate spec nor is it a valid IRI.",
    };
}
