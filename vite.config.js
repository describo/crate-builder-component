import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    clearScreen: true,
    server: {
        host: "0.0.0.0",
        port: 9000,
    },
    build: {
        outDir: "./dist/vue",
        lib: {
            entry: "./src/crate-builder/index.js",
            name: "DescriboCrateBuilder",
            fileName: "describo-crate-builder",
        },
    },
    plugins: [vue()],
    optimizeDeps: {
        include: ["ajv", "element-plus"],
    },
    resolve: {
        alias: {},
    },
    test: {
        environment: "jsdom",
        coverage: {
            provider: "istanbul",
            reporter: ["text", "json"],
            include: ["src/crate-builder/CrateManager/**/*.js"],
        },
    },
});
