# Crate Builder Component

-   [Crate Builder Component](#crate-builder-component)
-   [Documentation](#documentation)
-   [Crate Manager API Documentation](#crate-manager-api-documentation)
-   [Developing the plugin](#developing-the-plugin)
    -   [Storybook](#storybook)
    -   [Development application](#development-application)
-   [Building and publishing a release](#building-and-publishing-a-release)
-   [Repository structure](#repository-structure)

This is the core UI component for assembling an RO-Crate inside Describo. It is a self contained
VueJS component that can be used inside your app. If you use this component, your app is responsible
for loading the crate file from the storage layer (or minting a new one if none exists) and saving
the updated crate back. Your app can also provide a profile to the component and a class to handle
template lookups.

# Documentation

Comprehensive documentation is available @
[https://describo.github.io/documentation/component/get-started.html](https://describo.github.io/documentation/component/get-started.html)

# Crate Manager API Documentation

[https://describo.github.io/crate-builder-component/CrateManager.html](https://describo.github.io/crate-builder-component/CrateManager.html)
https://describo.github.io/crate-builder-component/CrateManager.html

# Developing the plugin

## Storybook

[Storybook](storybook.js.org/) is used in this application. When you are just developing the
components, storybook is what you want as you can focus just on the component in isolation. To start
it run:

```
npm run storybook
```

## Development application

When you want to see the component in action as a whole, there is a small VueJS app in this
codebase. To start up the dev environment:

```
> docker compose up (starts up an elastic search container for datapack lookups)
> npm run develop

--> browse to localhost:9000
```

# Building and publishing a release

-   `npm run build`: This builds the plugin and styles that the react component uses
-   `npm version {minor|patch}`
-   `git push origin master --tags`
-   Go to the repo and create a release from the tag, documenting what is in it.
-   Publish to npm: `npm publish`
-   Create an issue in the
    [React component issue tracker](https://github.com/describo/crate-builder-component-react/issues)
    to inform that a new release of that component needs to be built and published to npm.

# Repository structure

-   The development app is at `./src/app`. In there you will find the file main.js where we import
    the plugin and wire it into Vue as well as an App.vue file where we load the component.
-   The component is at `./src/crate-builder`.
