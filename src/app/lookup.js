export class Lookup {
    constructor() {}
    /**
     *
     * @param {Array | String} type: the type array or type string of the entity being looked up
     * @param {String} queryString: the query string typed in by the user
     * @param {Number} limit=5: the number of matches to return - default = 5
     */
    async entityTemplates({ type = undefined, queryString = undefined, limit = 5 }) {
        // code to lookup entity templates in *YOUR* system
        //
        // type: the @type of template to lookup
        // queryString: what the user is looking for. You probably want to look in the
        //   @id and name fields at least
        // limit: number of matches to return
    }

    /**
     *
     * @param {Object} elasticQuery: a query object to be used against an elastic search server
     * @param {Array | String} type: the type array or type string of the entity being looked up
     * @param {String} queryString: the query string typed in by the user
     * @param {Array | String} fields: the fields to search against in the data pack json objects
     * @param {Array | String} datapack: the datapack or packs with the data to be used for this entity type
     * @param {Number} limit=10: the number of matches to return - default = 10
     *
     * @returns
     */
    async dataPacks({
        elasticQuery = undefined,
        type = undefined,
        queryString = undefined,
        fields = undefined,
        datapack = undefined,
        limit = 10,
    }) {
        if (elasticQuery) {
            // query: the elastic query to perform
            //
            // it's up to you to get it to the elastic search server. In this example
            //   it's hardcoded in the _execute method
            return await this._execute({ query: elasticQuery });
        } else {
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

    /** private method */
    async _execute({ query }) {
        let response = await fetch("http://localhost:9200/_search", {
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
