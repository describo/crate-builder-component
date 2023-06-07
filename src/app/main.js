import "regenerator-runtime";
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
