# Crate Builder Component

-   [Crate Builder Component](#crate-builder-component)
-   [Developing the plugin](#developing-the-plugin)
    -   [Storybook](#storybook)
    -   [Development application](#development-application)
-   [Building and publishing a release](#building-and-publishing-a-release)
-   [Repo structure](#repo-structure)
-   [Using the component in your app](#using-the-component-in-your-app)
    -   [Install the package](#install-the-package)
    -   [Vite users](#vite-users)
    -   [Profiles](#profiles)
    -   [Tailwind CSS dependency](#tailwind-css-dependency)
    -   [Vue Router Dependency](#vue-router-dependency)
    -   [Wire it up](#wire-it-up)
-   [Identifiers and Types](#identifiers-and-types)
-   [Basic Usage - pass in crate and profile](#basic-usage---pass-in-crate-and-profile)
-   [Full Usage - configuration and events](#full-usage---configuration-and-events)
    -   [Configuration](#configuration)
        -   [Reactive Properties](#reactive-properties)
        -   [Unreactive Properties](#unreactive-properties)
    -   [Events](#events)

This is the core UI component for assembling an RO-Crate inside Describo. It is a self contained
VueJS component that can be used inside your app. If you use this component, your app is responsible
for loading the crate file from the storage layer (or minting a new one if none exists) and saving
the updated crate back. Your app can also provide a profile to the component and a class to handle
template lookups.

# Developing the plugin

## Storybook

[Storybook](storybook.js.org/) is used in this application. When you are just developing the
components, storybook is what you want as you can focus just on the component in isolation. To start
it run:

```
npm run storybook
```

## Development application

When you want to see component in action as a whole, there is a small VueJS app in this codebase. To
start up the dev environment:

```
docker compose up (starts up an elastic search container for datapack lookups)
npm run develop

--> browse to localhost:9000
```

# Building and publishing a release

Build the VueJS and web component

-   `npm run build`

Version it

-   npm version {minor|patch}

Push the tag to github and create a release

-   `git push origin master --tags`
-   Go to the repo and create a release from the tag, documenting what is in it.
-   Publish to npm: `npm publish`
-   Create an issue in the
    [React component issue tracker](https://github.com/describo/crate-builder-component-react/issues)
    to inform that a new release of that component needs to be built and published to npm.

# Repo structure

-   The development app is at `./src/app`. In there you will find the file main.js where we import
    the plugin and wire it into Vue as well as an App.vue file where we load the component.
-   The component is at `./src/crate-builder`.

# Using the component in your app

## Install the package

-   `npm install --save @describo/crate-builder-component`

## Vite users

Vite requires some extra configuration in order to use this component.

```
* npm install --save unplugin-auto-import unplugin-vue-components element-plus
```

-   vite.config.js

```JS
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
    plugins: [
        vue(),
        // ...
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
    ],
    optimizeDeps: {
        include: ["element-plus", "lodash", "@describo/crate-builder-component"],
    },
});
```

## Profiles

Profiles used with this component are described in
[https://github.com/describo/profiles](https://github.com/describo/profiles).

The profiles that this component understands are an evolution of the original Describo Online
profiles so be sure to follow the documentation linked above.

## Tailwind CSS dependency

The component uses [tailwindcss](https://tailwindcss.com/) and in order for the CSS to be processed
correctly, you need to `setup your app for tailwind` and add a `tailwind.config.js` that looks like:

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

The app can handle updating the route with the current active entity or that capability can be
completely disabled (ie you want to do it yourself or maybe you're using the webcomponent build). Be
sure to read the note about internal routing in the section:
[Unreactive Properties](#unreactive-properties)

## Wire it up

-   Plug it into your Vue app. It will look something like:

```JS
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

# Identifiers and Types

It is super important that your data is well formed. A big part of this is how you define your
identifiers.
[Read about how describo handles your crate when it loads and what is required of you.](./README.identifiers.md)

In addition, every entity in your crate must have an `@type`. If any entity doesn't, then the whole
crate will be marked bad not be loaded.

# Basic Usage - pass in crate and profile

In it's most basic form, the component is plugged in as:

```JS
    <describo-crate-builder
        :crate="data.crate"
        :profile="data.profile">
    </describo-crate-builder>
```

Pass in the crate file and optionally a profile.

# Full Usage - configuration and events

```JS
    <describo-crate-builder
        :crate="data.crate"
        :profile="data.profile"
        :lookup="lookup"
        :entityId="data.entityId"
        :enable-context-editor="true"
        :enable-crate-preview="true"
        :enable-browse-entities="true"
        :enable-template-save="true"
        :enable-internal-routing="true"
        :readonly="false"
        @save:crate="saveCrate"
        @save:crate:template="saveTemplate"
        @save:entity:template="saveTemplate">
    </describo-crate-builder>
```

## Configuration

### Reactive Properties

These properties are reactive. If you change them in the outer application they will update inside
the component.

-   `crate`: The RO Crate data. Note - this is the JSON object `not` a path to a file to be loaded.
    Your app needs to do the loading.
-   `profile`: The profile. Note - this is the JSON object `not` a path to a file to be loaded. Your
    app needs to do the loading.
-   `entityId`: Setting this property to an `@id` inside the crate will trigger the component to
    load that entity.

### Unreactive Properties

The properties are NOT reactive. If you change them in the outer application they will not update
inside the component.

-   `lookup`: Pass in an instance of a class the component can use to lookup entity templates or
    datapacks. The signature of the class must be:

```JS
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
-   `enableInternalRouting`: true | false: `(default: false)`: enable / disable the internal router
    which updates the location whenever an entity is selected. If no router is found (ie inside a
    web component or just not used), routing is turned off anyway. Most likely you want to leave the
    component to deal with this or listen out for the `navigation` event and handle it yourself if
    the component can't.
-   `enableReverseLinkBrowser`: true : false: `(default: true)`: enable / disable the reverse link
    browser. If enabled, it can be shown as a right sidebar as required.
-   `readonly`: true | false: `(default: false)` : if set to true all of the controls to edit that
    the data are turned off. The crate is set into a mode where it is readonly.
-   `webComponent`: true | false: `(default: true)` : Setting this to true alters the behaviour of
    some components when the crate builder is used as a web component.

## Events

-   `ready`: When you pass a crate into the component the internal data view first needs to be
    created. This takes longer as the size of the crate grows. Further, downloading large crates in
    your app to pass into the component can also be slow. So, if you want to put a loading indicator
    over the top of the component when you first start the download to when the crate is ready to be
    used, listen for this event to cancel the indicator.
-   `error`: If the component fails to load the crate it will emit an error message with more
    information. You should listen for this event and handle it accordingly in your application. It
    emits an object with one property, `errors` which is an array of errors found in the crate.
-   `navigation`: The component emits a navigation event whenever an entity is selected. The output
    is an object with a single property `id` which you can set on the location if you want to enable
    navigation (back, forward) and want to manage it yourself.
-   `@save:crate`: whenever the crate changes internally, this event will be emitted with the full
    crate for your app to save or handle in some way
-   `@save:crate:template`: this event emits the current crate as a template with a name. This is so
    users can craft one crate and then re-use it for other datasets. It's up to your app to save it
    and provide it as an option to the users when loading up a dataset.
-   `@save:entity:template`: this event emits an entity template for re-use within this crate or
    others. It's up to your app to save it and make it available to the crate-builder via the
    `lookup` interface defined above.
