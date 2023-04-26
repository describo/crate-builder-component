import "regenerator-runtime";
import { CrateManager } from "./crate-manager.bundle.js";
import Chance from "chance";
const chance = Chance();
import { range, round, compact, groupBy } from "lodash";
import { performance } from "perf_hooks";

describe.skip("Test loading large crates and see how it performs", () => {
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });

    test("n = 10, 100, 500, 1000, 2000, 4000, 8000, 16000", async () => {
        const tests = [10, 100, 500, 1000, 2000, 4000, 8000, 16000];
        // const tests = [2];
        for (const total of tests) {
            let crate = getBaseCrate();
            crate["@graph"].push({
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
            });

            let entities = crate["@graph"].map((e) => {
                return e?.about?.["@id"] === "./" ? null : e;
            });
            entities = compact(entities);
            const runtime = {};

            let t0 = performance.now();
            for (let i in range(total)) {
                let pick = chance.pickone(entities);

                let entity = {
                    "@id": chance.url(),
                    "@type": chance.pickone(["Dataset", "File", "Person", "Organisation"]),
                    name: chance.sentence(),
                    [chance.word()]: [{ "@id": pick["@id"] }],
                };
                crate["@graph"].push(entity);
                entities.push(entity);
            }

            let t1 = performance.now();
            runtime.generate = round(t1 - t0, 2);

            t0 = performance.now();
            let crateManager = new CrateManager({ crate });
            crateManager.load({ crate });
            t1 = performance.now();
            runtime.init = round(t1 - t0, 2);

            t0 = performance.now();
            let exportedCrate = crateManager.exportCrate();
            t1 = performance.now();
            runtime.export = round(t1 - t0, 2);

            console.log(
                `N items in crate: ${crate["@graph"].length}, generate: ${runtime.generate}ms, init: ${runtime.init}ms, export: ${runtime.export}ms`
            );
        }
    });
});
describe.skip("Test operations on large entity arrays", () => {
    beforeAll(() => {
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });

    test("n = 20000", async () => {
        const tests = [20000];
        for (const total of tests) {
            let crate = getBaseCrate();
            crate["@graph"].push({
                "@id": "./",
                "@type": ["Dataset"],
                name: "Dataset",
            });

            let entities = crate["@graph"].map((e) => {
                return e?.about?.["@id"] === "./" ? null : e;
            });
            entities = compact(entities);
            const runtime = {};

            let entity;
            for (let i in range(total)) {
                let pick = chance.pickone(entities);

                entity = {
                    "@id": chance.url(),
                    "@type": chance.pickone(["Dataset", "File", "Person", "Organisation"]),
                    name: chance.sentence(),
                    [chance.word()]: [{ "@id": pick["@id"] }],
                };
                crate["@graph"].push(entity);
                entities.push(entity);
            }

            let crateManager = new CrateManager({ crate });
            crateManager.load({ crate });

            let t0 = performance.now();
            groupBy(crateManager.entities, "@id");
            let t1 = performance.now();
            runtime.groupByAtId = round(t1 - t0, 2);

            t0 = performance.now();
            groupBy(crateManager.entities, "describoId");
            t1 = performance.now();
            runtime.groupByDescriboId = round(t1 - t0, 2);

            t0 = performance.now();
            entity = crateManager.entities.filter((e) => e["@id"] === entity["@id"]);
            t1 = performance.now();
            runtime.findEntityByFilter = round(t1 - t0, 2);
            console.log(`n = 20000 ${JSON.stringify(runtime)}`);
        }
    });
});

function getBaseCrate() {
    return {
        "@context": ["https://w3id.org/ro/crate/1.1/context"],
        "@graph": [
            {
                "@id": "ro-crate-metadata.json",
                "@type": "CreativeWork",
                conformsTo: {
                    "@id": "https://w3id.org/ro/crate/1.1/context",
                },
                about: {
                    "@id": "./",
                },
            },
        ],
    };
}
