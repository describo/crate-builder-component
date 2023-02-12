import postcss from "rollup-plugin-postcss";
import cssnano from "cssnano";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";

export default {
    input: "./src/crate-builder/index.wc-css.js",
    output: {
        dir: "dist/web-component-styles",
    },
    plugins: [
        nodeResolve(),
        postcss({
            extract: "styles.css",
            plugins: [cssnano({ preset: "default" })],
        }),
        copy({
            targets: [
                {
                    src: "node_modules/@fortawesome/fontawesome-free/webfonts",
                    dest: "dist/",
                },
            ],
        }),
    ],
};
