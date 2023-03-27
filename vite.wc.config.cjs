import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

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
        // rollupOptions: {
        //     external: "./src/crate-builder/x.js"
        // }
    },
    plugins: [
        vue({}),
        // https://element-plus.org/en-US/guide/quickstart.html#on-demand-import
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
    ],
    define: {
        // No process.env in web component
        'process.env': {}
    }
});
