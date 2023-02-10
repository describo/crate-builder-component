import { defineCustomElement } from "vue";
import DescriboCrateBuilder from "./Shell.component.wc.vue";

// We need to import and inline the styles into the component. These
//   have been built by an earlier rollup process.
import css from "../../dist/web-component-styles/styles.css";
DescriboCrateBuilder.styles = [css];

// Web Component build entrypoint
const element = defineCustomElement(DescriboCrateBuilder);
export default customElements.define("describo-crate-builder", element);
