import {defineCustomElement} from "vue";
import DescriboCrateBuilder from "./Shell.component.ce.vue";

const element = defineCustomElement(DescriboCrateBuilder);
export default customElements.define("describo-crate-builder", element);
