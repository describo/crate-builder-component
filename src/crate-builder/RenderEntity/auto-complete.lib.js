import isArray from "lodash-es/isArray";
const defaultFields = ["@id", "name"];

export class lookup {
    constructor({ config, lookup }) {
        this.config = config;
        this.lookup = lookup;
    }

    async entitiesByType(type, queryString) {
        if (!queryString) return;
        type = isArray(type) ? type.join(", ") : type;
        let fields, datapacks;
        try {
            ({ fields, datapacks } = this.config?.[type]);
        } catch (error) {
            fields = defaultFields;
            datapacks = [];
        }

        let query = assembleQuery(type, fields, queryString);
        // console.log("***", JSON.stringify(query, null, 2));
        let { documents } = await this.lookup.dataPacks({
            type,
            elasticQuery: query,
            fields,
            datapacks,
            queryString,
            limit: 10,
        });
        return documents ?? [];
    }

    async ror(queryString) {
        const api = "https://api.ror.org/organizations";
        let response = await fetch(`${api}?query.advanced=${queryString}`);
        if (response.status !== 200) return [];

        response = await response.json();
        let results = response.items.slice(0, 10).map((item) => {
            return {
                "@id": item.id,
                "@type": "Organization",
                name: item.name,
            };
        });
        return results;
    }
}

export function awaitTimeout(delay, reason) {
    return new Promise((resolve, reject) =>
        setTimeout(() => (reason === undefined ? resolve() : resolve(reason)), delay)
    );
}

export async function wrapPromise(promise, delay, reason = { reason: "Lookup Timeout" }) {
    return Promise.race([promise, awaitTimeout(delay, reason)]);
}

/**
 *
 * Why oh why are we doing this by hand?!
 *
 * Because we can't use the component in another application that uses vite due
 *  to the mixed CJS and ESM import rubbish when we use elastic-builder... /sigh
 */
function assembleQuery(type, fields, queryString) {
    let query = {
        from: 0,
        size: 10,
        query: {
            bool: {
                must: [
                    {
                        match: {
                            "@type.keyword": {
                                query: type,
                                operator: "and",
                            },
                        },
                    },
                ],
            },
        },
    };

    let shouldMatches = [];
    fields.forEach((field) => {
        shouldMatches.push({
            match: {
                [field]: { query: queryString, operator: "and" },
            },
        });
    });

    query.query.bool.must.push({
        bool: {
            should: shouldMatches,
        },
    });
    return query;
}
