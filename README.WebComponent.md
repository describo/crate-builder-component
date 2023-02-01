# Compile Web Components

```
npm install
npm run build:vite
```

This will create 

- [crate-builder-component.mjs](dist%2Fcrate-builder-component.mjs)
- [crate-builder-component.umd.js](dist%2Fcrate-builder-component.umd.js)
- [style.css](dist%2Fstyle.css)

# Test Web Components

The `wc-test-app-react` is a React app used as an example of using the Describo crate builder web component in an external project:

```
cd wc-test-app-react
npm install
npm run start
```

The test app open at http://localhost:3000. Updating the values in the crate builder should eventually update the generated JSON in the right panel.
