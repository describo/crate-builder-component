import difference from "lodash-es/difference.js";
import orderBy from "lodash-es/orderBy.js";
import uniqBy from "lodash-es/uniqBy.js";
const coreProperties = ["@id", "@type", "@reverse", "name"];

export function applyLayout({ configuration, entity, extraProperties, profileManager: pm }) {
    let missingRequiredData = false;
    let inputs = [];

    ({ missingRequiredData, entity, inputs } = getProfileInputs({
        configuration,
        entity,
        pm,
    }));

    if (extraProperties.length) {
        extraProperties.forEach((property) => {
            if (!entity[property]) entity[property] = [];
        });
    }
    let layouts = pm.getLayout({ entity });
    let renderTabs = false;
    let tabs = [];
    if (layouts) {
        renderTabs = true;
        tabs = applyLayoutToEntity({ layouts, inputs, entity });
        tabs = applyTabDataIndicators({ configuration, tabs, entity });
    }

    return { renderTabs, missingRequiredData, entity, tabs };
}

function getProfileInputs({ configuration, entity, pm }) {
    const inputs = pm.getInputsFromProfile({ entity });

    let missingRequiredData = false;
    for (let input of inputs) {
        if (input.name === "name") continue;
        if (!input.id) {
            console.error(`Excluding invalid input - missing id: ${input}`);
            continue;
        }
        if (!entity[input.name] && !configuration.readonly) {
            entity[input.name] = [];
        }

        if (input.required && !entity[input.name].length) {
            missingRequiredData = true;
        }
    }
    return { missingRequiredData, entity, inputs };
}

function applyLayoutToEntity({ layouts, inputs, entity }) {
    // normalise the layouts
    let sort = false;
    for (let name of Object.keys(layouts)) {
        layouts[name].name = name;
        layouts[name].inputs = [];
        if (!layouts[name].properties) layouts[name].properties = [];
        if (layouts[name].order) sort = true;
    }

    // sort the profile inputs into their groups
    for (let input of inputs) {
        if (coreProperties.includes(input.name)) continue;
        if (!entity[input.name]) continue;
        if (input.hide) continue;
        if (input.group && layouts[input.group]) {
            layouts[input.group].inputs.push(input);
        }
    }

    // now sort any ungrouped inputs using the properties
    //   array in each layout
    let ungroupedInputs = [];
    for (let input of inputs) {
        if (coreProperties.includes(input.name)) continue;
        if (!entity[input.name]) continue;
        if (input?.hide) continue;
        if (input.group && layouts[input.group]) continue;
        let matched = false;
        for (let name of Object.keys(layouts)) {
            if (
                layouts[name].properties.includes(input.id) ||
                layouts[name].properties.includes(input.name)
            ) {
                layouts[name].inputs.push(input);
                matched = true;
            }
        }
        if (!matched) ungroupedInputs.push(input);
    }

    // and any that still aren't part of a group go into overflow
    for (let input of ungroupedInputs) {
        layouts.overflow.inputs.push(input);
    }

    // get a list of the properties defined on the entity
    //   but which have no input definition and pop them
    //   into the overflow group with a default Text configuration
    let profileInputs = inputs.map((i) => i.name);
    let entityProperties = Object.keys(entity);
    let missingInputs = difference(entityProperties, profileInputs);
    for (let input of missingInputs) {
        if (coreProperties.includes(input)) continue;
        layouts.overflow.inputs.push({
            name: input,
            multiple: true,
            values: ["Text"],
        });
    }

    let tabs = Object.keys(layouts)
        .map((k) => layouts[k])
        .filter((t) => t.name !== "appliesTo");
    if (sort) tabs = orderBy(tabs, "order");

    // if a properties array is defined
    //  reorder the inputs by the order in that array
    for (let tab of tabs) {
        if (tab.properties.length) {
            let orderedInputs = [];
            let otherInputs = [];
            for (let property of tab.properties) {
                for (let input of tab.inputs) {
                    if ([input.name, input.id].includes(property)) {
                        orderedInputs.push(input);
                    } else {
                        otherInputs.push(input);
                    }
                }
            }
            orderedInputs = uniqBy(orderedInputs, "name");
            otherInputs = uniqBy(otherInputs, "name");
            otherInputs = difference(otherInputs, orderedInputs);
            tab.inputs = [...orderedInputs, ...otherInputs];
        }
    }
    return tabs;
}

function applyTabDataIndicators({ configuration, tabs, entity }) {
    // special case: component in readonly mode
    if (configuration.readonly) {
        tabs = tabs.map((tab) => {
            tab.hasData = false;
            tab.missingRequiredData = false;
            return tab;
        });
    } else {
        for (let tab of tabs) {
            tab.missingRequiredData = false;
            tab.hasData = false;
            for (let input of tab.inputs) {
                if (input.required && !entity[input.name].length) {
                    tab.missingRequiredData = true;
                }
                if (entity[input.name].length) {
                    tab.hasData = true;
                }
            }
        }
    }
    return tabs;
}
