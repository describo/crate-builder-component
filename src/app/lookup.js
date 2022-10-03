export class Lookup {
    constructor() {}
    async entityTemplates({ type = undefined, queryString = undefined, limit = 5 }) {
        // code to lookup entity templates in *YOUR* system
        //
        // type: the @type of template to lookup
        // queryString: what the user is looking for. You probably want to look in the
        //   @id and name fields at least
        // limit: number of matches to return
    }

    async dataPacks({
        url = undefined,
        query = undefined,
        datapack = [],
        queryString = undefined,
    }) {
        if (url && query) {
            // url: the url to an endpoint that performs an elastic search lookup
            // query: the elastic query to perform
            //
            // If the url is to your api, you will likely need to adjust the 'execute' method
            //   unless your api endpoint just relays the elastic response back without modification
            return await this.execute({ url, query });
        } else if (queryString) {
            // do the lookup yourself in whatever way you want
            //
            // the value of 'datapack' will be whatever the profile author defined so
            //  that's your datasource. How you implement that lookup is totally
            //  up to you.
            //
            // return array of json-ld objects matching the query:
            // ---------------------------------------------------
            // let documents = [{json-ld object}, {json-ld object}, ...]
            // return { documents }
        }
    }

    async execute({ url, query }) {
        let response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(query),
        });
        let status = response.status;
        response = await response.json();
        if (status !== 200) {
            return response;
        }
        const total = response.hits.total.value;
        const documents = response.hits.hits.map((doc) => ({ ...doc._source }));
        return { total, documents };
    }
}
