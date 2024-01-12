import { describe, expect, test } from "vitest";
import { isURL, normaliseEntityType, normalise } from "./lib.js";

describe("Test urls are correctly identified", () => {
    test(`expect fail- ''`, () => {
        expect(isURL()).toBeFalsy;
    });

    test(`expect fail - 3`, () => {
        expect(isURL(3)).toBeFalsy;
    });
    test(`expect fail - true`, () => {
        expect(isURL(true)).toBeFalsy;
    });
    test(`expect fail - data://server.name`, () => {
        expect(isURL("data://server.name")).toBeFalsy;
    });
    test(`expect pass - http://schema.org/person`, () => {
        expect(isURL("http://schema.org/person")).toBeTruthy;
    });
    test(`expect pass - https://schema.org/person`, () => {
        expect(isURL("https://schema.org/person")).toBeTruthy;
    });
    test(`expect pass - ftp://server.name`, () => {
        expect(isURL("ftp://server.name")).toBeTruthy;
    });
    test(`expect pass - ftps://server.name`, () => {
        expect(isURL("ftps://server.name")).toBeTruthy;
    });
    test(`arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html`, () => {
        expect(isURL("arcp://uuid,32a423d6-52ab-47e3-a9cd-54f418a48571/doc.html")).toBeTruthy;
    });
    test(`arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/`, () => {
        expect(isURL("arcp://uuid,b7749d0b-0e47-5fc4-999d-f154abe68065/pics/")).toBeTruthy;
    });
    test(`arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/`, () => {
        expect(isURL("arcp://ni,sha-256;F-34D4TUeOfG0selz7REKRDo4XePkewPeQYtjL3vQs0/")).toBeTruthy;
    });
    test(`arcp://name,gallery.example.org/`, () => {
        expect(isURL("arcp://name,gallery.example.org/")).toBeTruthy;
    });
});

describe("Test normalising an entity type", () => {
    test(`no type defined - @id = ./`, () => {
        let entity = { "@id": "./" };
        expect(normaliseEntityType({ entity })).toMatchObject({ "@type": ["Thing"] });
    });
    test(`no type defined - @id = http://schema.org/person`, () => {
        let entity = { "@id": "http://schema.org/person" };
        expect(normaliseEntityType({ entity })).toMatchObject({ "@type": ["URL"] });
    });
    test(`type is boolean`, () => {
        let entity = { "@id": "http://schema.org/person", "@type": true };
        expect(normaliseEntityType({ entity })).toMatchObject({ "@type": ["true"] });
    });
    test(`type is number`, () => {
        let entity = { "@id": "http://schema.org/person", "@type": 3 };
        expect(normaliseEntityType({ entity })).toMatchObject({ "@type": ["3"] });
    });
    test(`type is string - 'Dataset'`, () => {
        let entity = { "@id": "http://schema.org/person", "@type": "Dataset" };
        expect(normaliseEntityType({ entity })).toMatchObject({ "@type": ["Dataset"] });
    });
    test(`type is string - 'Dataset, Collection'`, () => {
        let entity = { "@id": "http://schema.org/person", "@type": "Dataset,Collection" };
        expect(normaliseEntityType({ entity })).toMatchObject({
            "@type": ["Dataset", "Collection"],
        });
    });
});

describe("Test normalising an entity", () => {
    test(`reject bad @type`, () => {
        try {
            normalise({ "@type": {} }, 1);
        } catch (error) {
            expect(error.message).toEqual(
                `'@type' property must be a string or an array or not defined at all`
            );
        }
    });
    test(`reject bad @id`, () => {
        try {
            normalise({ "@id": {} }, 1);
        } catch (error) {
            expect(error.message).toEqual(`'@id' property must be a string`);
        }

        try {
            normalise({ "@id": 3 }, 1);
        } catch (error) {
            expect(error.message).toEqual(`'@id' property must be a string`);
        }
    });
    test(`reject if @type not defined`, () => {
        let entity = { "@id": "./" };
        expect(normalise(entity, 1)).toBeFalsy;
    });

    test(`no @id set`, () => {
        let entity = { "@type": "Dataset" };
        // console.log(normalise(entity, 1));
        expect(normalise(entity, 1)).toEqual({ "@type": ["Dataset"], "@id": "#e1/", name: "e1/" });
    });

    test(`Dataset entity`, () => {
        let entity = { "@id": "somewhere", "@type": "Dataset" };
        // console.log(normalise(entity, 1));
        expect(normalise(entity, 1)).toEqual({
            "@type": ["Dataset"],
            "@id": "somewhere/",
            name: "somewhere/",
        });
    });
});
