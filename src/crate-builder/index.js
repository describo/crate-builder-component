import "./component.css";
import DescriboCrateBuilder from "./Shell.component.vue";

export default {
    install(Vue, options) {
        Vue.component("DescriboCrateBuilder", DescriboCrateBuilder);
    },
};

// Automatic installation if Vue has been added to the global scope.
if (typeof window !== "undefined" && window.Vue) {
    window.Vue.use(DescriboCrateBuilder);
}
