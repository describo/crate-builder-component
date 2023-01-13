import App from "./App.ce.vue";
import { createRouter, createWebHistory } from "vue-router";
import { defineCustomElement } from "vue";

import ElementPlus from "element-plus";
//import "@element-plus/theme-chalk/dist/index.css";

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

const element = defineCustomElement(App);
customElements.define("describo-wc", element);

export default router;