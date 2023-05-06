import "regenerator-runtime";
import { validateId } from "./crate-manager.bundle.js";

describe("Test @id's that should be valid", () => {
    test(`LICENCE.md should be valid`, () => {
        expect(validateId({ id: "LICENCE.md", type: "File" }).isValid).toBeTrue;
        expect(validateId({ id: "LICENCE.md", type: "File, Licence" }).isValid).toBeTrue;
        expect(validateId({ id: "LICENCE.md", type: ["File", "Licence"] }).isValid).toBeTrue;
    });
    test(`/path/to/file should be valid`, () => {
        expect(validateId({ id: "/path/to/file", type: "Dataset" }).isValid).toBeTrue;
    });
    test(`./ should be valid`, () => {
        expect(validateId({ id: "./", type: "Dataset" }).isValid).toBeTrue;
    });
    test(`../ should be valid`, () => {
        expect(validateId({ id: "../", type: "Dataset" }).isValid).toBeTrue;
    });
    test(`_:xxx should be valid`, () => {
        expect(validateId({ id: "_:xxx", type: "Dataset" }).isValid).toBeTrue;
    });
    test(`#xxx should be valid`, () => {
        expect(validateId({ id: "#xxx", type: "Dataset" }).isValid).toBeTrue;
    });
    test(`http://schema.org/name should be valid`, () => {
        expect(validateId({ id: "http://schema.org/name", type: "Dataset" }).isValid).toBeTrue;
    });
    test(`https://schema.org/name should be valid`, () => {
        expect(validateId({ id: "https://schema.org/name", type: "Dataset" }).isValid).toBeTrue;
    });
    test(`ftp://schema.org/name should be valid`, () => {
        expect(validateId({ id: "ftp://schema.org/name", type: "Dataset" }).isValid).toBeTrue;
    });
    test(`ftps://schema.org/name should be valid`, () => {
        expect(validateId({ id: "ftps://schema.org/name", type: "Dataset" }).isValid).toBeTrue;
    });
    test(`arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html`, () => {
        expect(
            validateId({
                id: "arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html",
                type: "Dataset",
            }).isValid
        ).toBeTrue;
    });
    test(`arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/`, () => {
        expect(
            validateId({
                id: "arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/",
                type: "Dataset",
            }).isValid
        ).toBeTrue;
    });
    test(`arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/`, () => {
        expect(
            validateId({
                id: "arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/",
                type: "Dataset",
            }).isValid
        ).toBeTrue;
    });
    test(`arcp://name,gallery.example.org/`, () => {
        expect(validateId({ id: "arcp://name,gallery.example.org/a", type: "Dataset" }).isValid)
            .toBeTrue;
    });
});
describe("Test @id's that should NOT be valid", () => {
    test(`aaa should not be valid`, () => {
        expect(validateId({ id: "aaa", type: "Dataset" }).message).toEqual(
            "Invalid identifier 'aaa'. See https://github.com/describo/crate-builder-component/blob/master/README.identifiers.md for more information."
        );
    });
    test(`32a423d6-52ab-47e3-a9cd-54f418a48571 should not be valid`, () => {
        expect(
            validateId({ id: "32a423d6-52ab-47e3-a9cd-54f418a48571", type: "Dataset" }).message
        ).toEqual(
            `Invalid identifier '32a423d6-52ab-47e3-a9cd-54f418a48571'. See https://github.com/describo/crate-builder-component/blob/master/README.identifiers.md for more information.`
        );
    });
});
