const { mergeConfig } = require("vite");

module.exports = {
    stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
    addons: [
        {
            name: "@storybook/addon-postcss",
            options: {
                postcssLoaderOptions: {
                    implementation: require("postcss"),
                },
            },
        },
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
    ],
    framework: {
        name: "@storybook/vue3-vite",
        options: {},
    },
    features: {
        storyStoreV7: true,
    },
    docs: {
        autodocs: true,
    },
    // Make process.env available in preview.js's setup() function
    // https://github.com/storybookjs/storybook/issues/18920#issuecomment-1310602214
    async viteFinal(config) {
        return mergeConfig(config, {
            define: { "process.env": { ...process.env } },
        });
    },
};
