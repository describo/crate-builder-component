export const propertyDefinitions = {
    crate: {
        type: [Object, undefined],
    },
    profile: {
        type: [Object, undefined],
    },
    entityId: {
        type: [String, undefined],
    },
    lookup: {
        type: [Object, undefined],
    },
    enableContextEditor: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableCratePreview: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableBrowseEntities: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableTemplateSave: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
    enableInternalRouting: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableReverseLinkBrowser: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
    enableUrlMarkup: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    enableEntityTimestamps: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
    purgeUnlinkedEntities: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    readonly: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
    webComponent: {
        type: Boolean,
        default: false,
        validator: (val) => [true, false].includes(val),
    },
    tabLocation: {
        type: String,
        default: "left",
        validator: (val) => ["top", "bottom", "left", "right"].includes(val),
    },
    // resetTabOnEntityChange: {
    //     type: Boolean,
    //     default: true,
    //     validator: (val) => [true, false].includes(val),
    // },
    // resetTabOnProfileChange: {
    //     type: Boolean,
    //     default: true,
    //     validator: (val) => [true, false].includes(val),
    // },
    showControls: {
        type: Boolean,
        default: true,
        validator: (val) => [true, false].includes(val),
    },
    language: {
        type: String,
        default: "en",
    },
};
