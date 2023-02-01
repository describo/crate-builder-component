import {defineCustomElement} from "vue";
import DescriboCrateBuilder from "./Shell.component.ce.vue";

// Web Component build entrypoint
const element = defineCustomElement(DescriboCrateBuilder);
export default customElements.define("describo-crate-builder", element);
