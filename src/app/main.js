import "regenerator-runtime";
import "../crate-builder/tailwind.css";
import "element-plus/dist/index.css";
import "@fortawesome/fontawesome-free/js/all";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoReplaceSvg = "nest";
import { createApp } from "vue";
import App from "./App.vue";
import DescriboCrateBuilder from "../crate-builder/index.js";
import "./override-styles.css";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory("/"),
    routes: [
        {
            path: "/",
            name: "root",
            component: App,
        },
    ],
});

const app = createApp(App);
app.use(router);
app.use(DescriboCrateBuilder);
app.mount("#app");
