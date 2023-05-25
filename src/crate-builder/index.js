import "./tailwind.css";
import "@element-plus/theme-chalk/dist/index.css";
import "./component.css";
import "@fortawesome/fontawesome-free/js/all";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoReplaceSvg = "nest";
import DescriboCrateBuilder from "./Shell.component.vue";
import i18n from "./i18n"

export default {
    install(Vue, options) {
        console.log("install", Vue, options)
        Vue.component("DescriboCrateBuilder", DescriboCrateBuilder);
        // Vue.use(i18n)
    },
};

console.log("window.Vue", window.Vue)
// Automatic installation if Vue has been added to the global scope.
if (typeof window !== "undefined" && window.Vue) {
    window.Vue.use(DescriboCrateBuilder);
}
