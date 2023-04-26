import "regenerator-runtime";
import { validateId } from "./crate-manager.bundle.js";

describe("Test @id's that should be valid", () => {
    test(`LICENCE.md should be valid`, () => {
        expect(validateId("LICENCE.md", "File")).toBeTrue;
        expect(validateId("LICENCE.md", "File, Licence")).toBeTrue;
        expect(validateId("LICENCE.md", ["File", "Licence"])).toBeTrue;
    });
    test(`/path/to/file should be valid`, () => {
        expect(validateId("/path/to/file", "Dataset")).toBeTrue;
    });
    test(`./ should be valid`, () => {
        expect(validateId("./", "Dataset")).toBeTrue;
    });
    test(`../ should be valid`, () => {
        expect(validateId("../", "Dataset")).toBeTrue;
    });
    test(`_:xxx should be valid`, () => {
        expect(validateId("_:xxx", "Dataset")).toBeTrue;
    });
    test(`#xxx should be valid`, () => {
        expect(validateId("#xxx", "Dataset")).toBeTrue;
    });
    test(`http://schema.org/name should be valid`, () => {
        expect(validateId("http://schema.org/name", "Dataset")).toBeTrue;
    });
    test(`https://schema.org/name should be valid`, () => {
        expect(validateId("https://schema.org/name", "Dataset")).toBeTrue;
    });
    test(`ftp://schema.org/name should be valid`, () => {
        expect(validateId("ftp://schema.org/name", "Dataset")).toBeTrue;
    });
    test(`ftps://schema.org/name should be valid`, () => {
        expect(validateId("ftps://schema.org/name", "Dataset")).toBeTrue;
    });
    test(`arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html`, () => {
        expect(validateId("arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html", "Dataset"))
            .toBeTrue;
    });
    test(`arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/`, () => {
        expect(validateId("arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/", "Dataset"))
            .toBeTrue;
    });
    test(`arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/`, () => {
        expect(
            validateId("arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/", "Dataset")
        ).toBeTrue;
    });
    test(`arcp://name,gallery.example.org/`, () => {
        expect(validateId("arcp://name,gallery.example.org/a", "Dataset")).toBeTrue;
    });
});
describe("Test @id's that should NOT be valid", () => {
    test(`aaa should not be valid`, () => {
        expect(validateId("aaa", "Dataset").message).toEqual(
            "Invalid identifier 'aaa'. See https://github.com/describo/crate-builder-component/blob/master/README.identifiers.md for more information."
        );
    });
    test(`32a423d6-52ab-47e3-a9cd-54f418a48571 should not be valid`, () => {
        expect(validateId("32a423d6-52ab-47e3-a9cd-54f418a48571", "Dataset").message).toEqual(
            `Invalid identifier '32a423d6-52ab-47e3-a9cd-54f418a48571'. See https://github.com/describo/crate-builder-component/blob/master/README.identifiers.md for more information.`
        );
    });
});
