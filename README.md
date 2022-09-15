# Crate Builder Component

- [Crate Builder Component](#crate-builder-component)
- [Developing the plugin](#developing-the-plugin)
- [Repo structure](#repo-structure)
- [Using the component in your app](#using-the-component-in-your-app)
  - [Installation and setup](#installation-and-setup)
    - [Setting up for tailwind css](#setting-up-for-tailwind-css)
  - [Component Dependencies](#component-dependencies)
  - [Basic Usage - pass in crate and profile](#basic-usage---pass-in-crate-and-profile)
  - [Full Usage - configuration and events](#full-usage---configuration-and-events)
    - [Configuration](#configuration)
    - [Events](#events)

This is the core UI component for assembling an RO-Crate inside Describo. It is a self container
VueJS component that can be used inside your app. If you use this component, your app is responsible
for loading the crate file from the storage layer (or minting a new one if none exists) and saving
the update crate back. Your app can also provide a profile to the component and a class to handle
template lookups.

# Developing the plugin

To work on this plugin there is a small VueJS app in this codebase. To start up the dev environment:

```
npm run develop

--> browse to localhost:9000
```

# Repo structure

-   The development app is at `./src/app`. In there you will find the file main.js where we import
    the plugin and wire it into Vue as well as an App.vue file where we load the component.
-   The component is at `./src/crate-builder`.

# Using the component in your app

## Installation and setup

### Setting up for tailwind css

The component uses [tailwindcss](https://tailwindcss.com/) and the
[Element Plus](https://element-plus.org/en-US/) component library. The library plugs in Element Plus
when it is instantiated but in order for the CSS to be processed correctly, you need to
`setup your app for tailwind` and add a `tailwind.config.js` that looks like:

```
module.exports = {
    future: {},
    content: [
        "./src/**/*.html",
        "./src/**/*.{js,jsx,ts,tsx,vue}",
        "./node_modules/@describo/**/*.vue",
    ],
    theme: {
        extend: {},
    },
    variants: {},
    plugins: [],
};
```

The last line in the config (`"./node_modules/@describo/\**/*.vue",`) is the important part. Here
we're telling tailwind to process css in the component classes. Without that, t styling in the
component. Other than this, ensure you set up tailwind for your environment as per _their_
documentation.

-   `npm install --save @describo/crate-builder-component`

-   Plug it into your Vue app. It will look something like:

```
import { createApp } from "vue";
import App from "./App.vue";
import DescriboCrateBuilder from "@describo/crate-builder-component";
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
```

## Component Dependencies

The app requires a functioning vue router setup to be installed into your app as shown above.

## Basic Usage - pass in crate and profile

In it's most basic form, the component is plugged in as:

```
    <describo-crate-builder
        :crate="data.crate"
        :profile="data.profile">
    </describo-crate-builder>
```

Pass in the crate file and optionally a profile.

## Full Usage - configuration and events

```
    <describo-crate-builder
        :crate="data.crate"
        :profile="data.profile"
        :lookup="lookup"
        :enable-context-editor="true"
        :enable-crate-preview="true"
        :enable-browse-entities="true"
        @save:crate="saveCrate"
        @save:crate:template="saveTemplate"
        @save:entity:template="saveTemplate">
    </describo-crate-builder>
```

### Configuration

-   `lookup`: Pass in an instance of a class the component can use to lookup entity templates. The
    signature of the class must be:

```
export class Lookup {
    constructor() {
    }
    entityTemplates({ type, filter, limit = 5 }) {
        // code to lookup entity templates in *YOUR* system
    }
    crateTemplates() {
        // code to lookup crate templates in *YOUR* system
    }
}
```

-   `enable-context-editor`: true | false: enable / disable the context editor control
-   `enable-crate-preview`: true | false: enable / disable the crate preview control
-   `enable-browse-entities`: true | false: enable / disable the browse entities control

### Events

-   `@save:crate`: whenever the crate changes internally, this event will be emitted with the full
    crate for your app to save or handle in some way
-   `@save:crate:template`: this event emits the current crate as a template with a name. This is so
    users can craft one crate and then re-use it for other datasets. It's up to your app to save it
    and provide it as an option to the users when loading up a dataset.
-   `@save:entity:template`: this event emits an entity template for re-use within this crate or
    others. It's up to your app to save it and make it available to the crate-builder via the
    `lookup` interface defined above.
