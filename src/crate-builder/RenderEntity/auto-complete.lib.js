import isArray from "lodash-es/isArray";
import esb from "elastic-builder";

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

        let query = new esb.RequestBodySearch()
            .from(0)
            .size(10)
            .query(
                new esb.BoolQuery().must([
                    esb.matchQuery("@type.keyword", type).operator("and"),
                    esb.boolQuery().should(
                        fields.map((field) => {
                            return esb.matchQuery(field, queryString).operator("and");
                        })
                    ),
                ])
            );
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
