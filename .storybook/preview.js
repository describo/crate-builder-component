import "../src/crate-builder/tailwind.css";
import { setup } from "@storybook/vue3";
import ElementPlus from "element-plus";
import "@element-plus/theme-chalk/dist/index.css";
import "@fortawesome/fontawesome-free/js/all";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoReplaceSvg = "nest";

setup((app) => {
    app.use(ElementPlus);
});

// export const parameters = {
//     actions: { argTypesRegex: "^on[A-Z].*" },
//     controls: {
//         matchers: {
//             color: /(background|color)$/i,
//             date: /Date$/,
//         },
//     },
// };
