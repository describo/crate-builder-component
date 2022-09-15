import DescriboCrateBuilder from "./Shell.component.vue";
import "./tailwind.css";
import "@element-plus/theme-chalk/dist/index.css";
import ElementPlus from "element-plus";
import "@fortawesome/fontawesome-free/js/all";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoReplaceSvg = "nest";

export default {
    install(Vue, options) {
        Vue.use(ElementPlus);
        Vue.component("DescriboCrateBuilder", DescriboCrateBuilder);
    },
};

// Automatic installation if Vue has been added to the global scope.
if (typeof window !== "undefined" && window.Vue) {
    window.Vue.use(DescriboCrateBuilder);
}
