# Crate Builder Component

- [Crate Builder Component](#crate-builder-component)
- [Developing the plugin](#developing-the-plugin)
- [Repo structure](#repo-structure)
- [Using the component in your app](#using-the-component-in-your-app)
  - [Profiles](#profiles)
  - [Tailwind CSS dependency](#tailwind-css-dependency)
  - [Vue Router Dependency](#vue-router-dependency)
  - [Install the package](#install-the-package)
  - [Wire it up](#wire-it-up)
- [Basic Usage - pass in crate and profile](#basic-usage---pass-in-crate-and-profile)
- [Full Usage - configuration and events](#full-usage---configuration-and-events)
  - [Configuration](#configuration)
  - [Events](#events)

This is the core UI component for assembling an RO-Crate inside Describo. It is a self contained
VueJS component that can be used inside your app. If you use this component, your app is responsible
for loading the crate file from the storage layer (or minting a new one if none exists) and saving
the updated crate back. Your app can also provide a profile to the component and a class to handle
template lookups.

# Developing the plugin

To work on this plugin there is a small VueJS app in this codebase. To start up the dev environment:

```
docker compose up (starts up an elastic search container for datapack lookups)
npm run develop

--> browse to localhost:9000
```

# Repo structure

-   The development app is at `./src/app`. In there you will find the file main.js where we import
    the plugin and wire it into Vue as well as an App.vue file where we load the component.
-   The component is at `./src/crate-builder`.

# Using the component in your app

## Profiles

Profiles used with this component are described in
[https://github.com/describo/profiles](https://github.com/describo/profiles).

The profiles that this component understands are an evolution of the original Describo Online
profiles so be sure to follow the documentation linked above.

## Tailwind CSS dependency

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
we're telling tailwind to process css in the component .vue files. Without that, the styling in the
component won't be used. Other than this, ensure you set up tailwind for your environment as per
_their_ documentation.

## Vue Router Dependency

The app requires a functioning vue router setup in your app as shown following.

## Install the package

-   `npm install --save @describo/crate-builder-component`

## Wire it up

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

# Basic Usage - pass in crate and profile

In it's most basic form, the component is plugged in as:

```
    <describo-crate-builder
        :crate="data.crate"
        :profile="data.profile">
    </describo-crate-builder>
```

Pass in the crate file and optionally a profile.

# Full Usage - configuration and events

```
    <describo-crate-builder
        :crate="data.crate"
        :profile="data.profile"
        :lookup="lookup"
        :enable-context-editor="true"
        :enable-crate-preview="true"
        :enable-browse-entities="true"
        :purge-unlinked-entities-before-save="true"
        :readonly="false"
        @save:crate="saveCrate"
        @save:crate:template="saveTemplate"
        @save:entity:template="saveTemplate">
    </describo-crate-builder>
```

## Configuration

-   `crate`: The RO Crate data. Note - this is the JSON object `not` a path to a file to be loaded.
    Your app needs to do the loading.
-   `profile`: The profile. Note - this is the JSON object `not` a path to a file to be loaded. Your
    app needs to do the loading.
-   `lookup`: Pass in an instance of a class the component can use to lookup entity templates or
    datapacks. The signature of the class must be:

```
export class Lookup {
    constructor() {
    }
    entityTemplates({ type, filter, limit = 5 }) {
        // code to lookup entity templates in *YOUR* system
    }
    dataPacks({ query, fields, datapack, queryString}) {
        // code to lookup data in a datapack somehow
    }
}
```

**See [./src/app/lookup.js](./src/app/lookup.js) for an example. In fact, you probably want to start
from there.**

-   `enable-context-editor`: true | false: `(default: true)` : enable / disable the context editor
    control
-   `enable-crate-preview`: true | false: `(default: true)` : enable / disable the crate preview
    control
-   `enable-browse-entities`: true | false: `(default: true)` : enable / disable the browse entities
    control
-   `enable-template-save`: true | false: `(default: false)` : enable / disable the entity and crate
    template saving controls
-   `readonly`: true | false: `(default: false)` : if set to true all of the controls to edit that
    the data are turned off. The crate is set into a mode where it is readonly.

## Events

-   `ready`: When you pass a crate into the component the internal data view first needs to be
    created. This takes longer as the size of the crate grows. Further, downloading large crates in
    your app to pass into the component can also be slow. So, if you want to put a loading indicator
    over the top of the component when you first start the download to when the crate is ready to be
    used, listen for this event to cancel the indicator.
-   `error`: If the component fails to load the crate it will emit an error message with more
    information. You should listen for this event and handle it accordingly in your application.
-   `@save:crate`: whenever the crate changes internally, this event will be emitted with the full
    crate for your app to save or handle in some way
-   `@save:crate:template`: this event emits the current crate as a template with a name. This is so
    users can craft one crate and then re-use it for other datasets. It's up to your app to save it
    and provide it as an option to the users when loading up a dataset.
-   `@save:entity:template`: this event emits an entity template for re-use within this crate or
    others. It's up to your app to save it and make it available to the crate-builder via the
    `lookup` interface defined above.
