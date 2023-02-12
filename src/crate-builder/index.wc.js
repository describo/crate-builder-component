import {defineCustomElement, h} from "vue";
import DescriboCrateBuilder from "./Shell.component.wc.vue";

const element = defineCustomElement(DescriboCrateBuilder);
export default customElements.define("describo-crate-builder", element);
