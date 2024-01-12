import { describe, test, expect, beforeAll, vi } from "vitest";

import { Bench } from "tinybench";
import { CrateManager } from "./crate-manager.js";
import { readJSON } from "fs-extra";

describe.skip("Benchmarking", () => {
    beforeAll(() => {
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });
    test(`test operations on a massive crate - cooee corpus`, async () => {
        const bench = new Bench({ time: 100, iterations: 20 });
        let crate = await readJSON(
            `./src/examples/item/ridiculously-big-collection/ro-crate-metadata.json`
        );
        let cm = new CrateManager({ crate });
        bench
            .add("crate loading", async () => {
                let cm = new CrateManager({ crate });
            })
            .add("crate export", async () => {
                let exportedCrate = cm.exportCrate();
            })
            .add("get root dataset", async () => {
                let rd = cm.getRootDataset();
            });
        await bench.warmup();
        await bench.run();
        console.table(bench.table());
    });
});
