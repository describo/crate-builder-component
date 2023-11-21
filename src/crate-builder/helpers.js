import Ajv from "ajv";
import profileSchema from "./profile-schema.json";

export function validateProfile(profile) {
    const ajv = new Ajv();
    const validate = ajv.compile(profileSchema);
    let valid = validate(profile);
    if (!valid) {
        return {
            valid,
            description: `Structural issues have been found in the profile.`,
            data: validate.errors,
        };
    }
    return { valid };
}
