import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const path = require("path");

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir: "./dist/web-component",
        lib: {
            entry: "./src/crate-builder/index.wc.js",
            name: "DescriboCrateBuilderWC",
            fileName: "describo-crate-builder-wc",
        },
        // Don't minify so there's a chance to debug problems while experimenting
        minify: false,
        minifySyntax: false,
    },
    plugins: [vue()],
});
