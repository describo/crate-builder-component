import "../src/crate-builder/tailwind.css";
import { setup } from "@storybook/vue3";
import ElementPlus from "element-plus";
import "@element-plus/theme-chalk/dist/index.css";
import "@fortawesome/fontawesome-free/js/all";
import { config } from "@fortawesome/fontawesome-svg-core";
import {i18next} from '../src/crate-builder/i18n';

config.autoReplaceSvg = "nest";

setup((app) => {
    app.use(ElementPlus);
    app.provide("configuration", {
        mode: "embedded",
        enableContextEditor: true,
        enableCratePreview: true,
        enableBrowseEntities: true,
        enableTemplateSave: true,
        readonly: false,
        enableTemplateLookups: false,
        enableDataPackLookups: false,
    });
    // Change language to match env var STORYBOOK_LANG or fall back to en
    i18next.changeLanguage(process.env.STORYBOOK_LANG ?? "en");
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
