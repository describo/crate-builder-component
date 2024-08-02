import { describe, expect, test } from "vitest";
import { validateId } from "./validate-identifier";

describe("Test @id's that should be valid", () => {
    test(`LICENCE.md should be valid`, () => {
        expect(validateId({ id: "LICENCE.md", type: "File" }).isValid).toBeTruthy;
        expect(validateId({ id: "LICENCE.md", type: "File, Licence" }).isValid).toBeTruthy;
        expect(validateId({ id: "LICENCE.md", type: ["File", "Licence"] }).isValid).toBeTruthy;
    });
    test(`/path/to/file should be valid`, () => {
        expect(validateId({ id: "/path/to/file", type: "Dataset" }).isValid).toBeTruthy;
    });
    test(`./ should be valid`, () => {
        expect(validateId({ id: "./", type: "Dataset" }).isValid).toBeTruthy;
    });
    test(`../ should be valid`, () => {
        expect(validateId({ id: "../", type: "Dataset" }).isValid).toBeTruthy;
    });
    test(`_:xxx should be valid`, () => {
        expect(validateId({ id: "_:xxx", type: "Dataset" }).isValid).toBeTruthy;
    });
    test(`#xxx should be valid`, () => {
        expect(validateId({ id: "#xxx", type: "Dataset" }).isValid).toBeTruthy;
    });
    test(`http://schema.org/name should be valid`, () => {
        expect(validateId({ id: "http://schema.org/name", type: "Dataset" }).isValid).toBeTruthy;
    });
    test(`https://schema.org/name should be valid`, () => {
        expect(validateId({ id: "https://schema.org/name", type: "Dataset" }).isValid).toBeTruthy;
    });
    test(`ftp://schema.org/name should be valid`, () => {
        expect(validateId({ id: "ftp://schema.org/name", type: "Dataset" }).isValid).toBeTruthy;
    });
    test(`ftps://schema.org/name should be valid`, () => {
        expect(validateId({ id: "ftps://schema.org/name", type: "Dataset" }).isValid).toBeTruthy;
    });
    test(`arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html`, () => {
        expect(
            validateId({
                id: "arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html",
                type: "Dataset",
            }).isValid
        ).toBeTruthy;
    });
    test(`arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/`, () => {
        expect(
            validateId({
                id: "arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/",
                type: "Dataset",
            }).isValid
        ).toBeTruthy;
    });
    test(`arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/`, () => {
        expect(
            validateId({
                id: "arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/",
                type: "Dataset",
            }).isValid
        ).toBeTruthy;
    });
    test(`arcp://name,gallery.example.org/`, () => {
        expect(validateId({ id: "arcp://name,gallery.example.org/a", type: "Dataset" }).isValid)
            .toBeTruthy;
    });
});
describe("Test @id's that should NOT be valid", () => {
    test(`no id passed`, () => {
        expect(validateId({})).toEqual({ isValid: false, message: "No identifier was provided." });
    });
    test(`aaa should not be valid`, () => {
        expect(validateId({ id: "aaa", type: "Person" }).message).toEqual(
            "The identifier is not valid according to the RO Crate spec nor is it a valid IRI."
        );
    });
    test(`32a423d6-52ab-47e3-a9cd-54f418a48571 should not be valid`, () => {
        expect(
            validateId({ id: "32a423d6-52ab-47e3-a9cd-54f418a48571", type: "Person" }).message
        ).toEqual(
            `The identifier is not valid according to the RO Crate spec nor is it a valid IRI.`
        );
    });
});
