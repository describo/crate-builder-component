import isArray from "lodash-es/isArray";
const defaultFields = ["@id", "name"];

const resultsLimit = 10;

export class Lookup {
    constructor({ config, lookup, crateManager }) {
        this.config = config;
        this.lookup = lookup;
        this.crateManager = crateManager;
    }

    async getEntities(type, queryString) {
        if (!queryString) return { endpoint: "internal", documents: [] };

        let results = await this.crateManager?.getEntities({
            limit: resultsLimit,
            type,
            query: queryString,
        });

        if (results) {
            return { endpoint: "internal", documents: stringifyDocumentType(results) ?? [] };
        } else {
            return { endpoint: "internal", documents: [] };
        }
    }

    async dataPacks(type, queryString) {
        if (!queryString) return { endpoint: "datapacks", documents: [] };

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
        let results = await this.lookup?.dataPacks({
            type,
            elasticQuery: query,
            fields,
            datapacks,
            queryString,
            limit: 10,
        });
        if (results?.documents) {
            return {
                endpoint: "datapacks",
                documents: stringifyDocumentType(results.documents) ?? [],
            };
        } else {
            return { endpoint: "datapacks", documents: [] };
        }
        // return stringifyDocumentType(documents) ?? [];
    }

    async entities(type, queryString) {
        if (!queryString) return { endpoint: "entities", documents: [] };

        type = isArray(type) ? type.join(", ") : type;
        let fields = defaultFields;

        let query = assembleQuery(type, fields, queryString);
        // console.log("***", JSON.stringify(query, null, 2));
        let results = await this.lookup?.entities({
            type,
            elasticQuery: query,
            fields,
            queryString,
            limit: 10,
        });

        if (results?.documents) {
            return {
                endpoint: "entities",
                documents: stringifyDocumentType(results.documents) ?? [],
            };
        } else {
            return { endpoint: "entities", documents: [] };
        }
        // return stringifyDocumentType(documents) ?? [];
    }

    async entityTemplates(type, queryString) {
        if (!queryString) return { endpoint: "templates", documents: [] };

        let results = await this.lookup?.entityTemplates({
            type,
            filter: queryString,
            limit: resultsLimit,
        });
        if (results) {
            return { endpoint: "templates", documents: stringifyDocumentType(results) ?? [] };
        } else {
            return { endpoint: "templates", documents: [] };
        }
    }

    async ror(queryString) {
        if (!queryString) return { endpoint: "ror", documents: [] };

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

        if (results) {
            return { endpoint: "ror", documents: results };
        } else {
            return { endpoint: "ror", documents: [] };
        }
        // return results;
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
        size: resultsLimit,
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
                [field]: { query: queryString, operator: "and", fuzziness: "AUTO" },
            },
        });
    });

    query.query.bool.must.push({
        bool: {
            should: shouldMatches,
        },
    });
    // console.log(JSON.stringify(shouldMatches, null, 2));
    return query;
}

function stringifyDocumentType(documents) {
    return documents.map((d) => {
        if (isArray(d["@type"])) {
            d["@type"] = d["@type"].join(", ");
        }
        return d;
    });
}
