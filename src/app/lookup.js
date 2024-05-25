export class Lookup {
    constructor() {}
    /**
     * This method is used to lookup entities created by users and saved for their
     *  own personal use. How you implement that, if you do at all, is up to you.
     *  In desktop for example, when the user saves a template, that entity gets stored
     *  in their local database.
     *
     * @param {Object} params
     * @param {Array | String} params.type: the type array or type string of the entity being looked up
     * @param {String} params.queryString: the query string typed in by the user
     * @param {Number} params.limit=5: the number of matches to return - default = 5
     *
     * @returns {Object} { documents: [...]} - Object with documents array
     */
    async entityTemplates({ type = undefined, queryString = undefined, limit = 5 }) {
        // code to lookup entity templates in *YOUR* system
        //
        // type: the @type of template to lookup
        // queryString: what the user is looking for. You probably want to look in the
        //   @id and name fields at least
        // limit: number of matches to return
        //
        // return array of json-ld objects matching the query:
        // ---------------------------------------------------
        // let documents = [{json-ld object}, {json-ld object}, ...]
        // return { documents }
        return { documents: [] };
    }

    /**
     *
     * This method is used to lookup data packs. Data packs are JSON-LD snippets that
     *  have been created by an expert/s and can be trusted as being valid and correct.
     *
     * @param {Object} params
     * @param {Object} params.elasticQuery: a query object to be used against an elastic search server
     * @param {Array | String} params.type: the type array or type string of the entity being looked up
     * @param {String} params.queryString: the query string typed in by the user
     * @param {Array | String} params.fields: the fields to search against in the data pack json objects
     * @param {Array | String} params.datapack: the datapack or packs with the data to be used for this entity type
     * @param {Number} params.limit=10: the number of matches to return - default = 10
     *
     * @returns {Object} { documents: [...]} - Object with documents array
     */
    async dataPacks({
        elasticQuery = undefined,
        type = undefined,
        queryString = undefined,
        fields = undefined,
        datapacks = undefined,
        limit = 10,
    }) {
        if (elasticQuery) {
            // query: the elastic query to perform
            //
            // The crate builder component will pass a fully formed elastic search query to this method
            // It's up to you to get it to the elastic search server. In this example
            //   it's hardcoded in the _execute method
            const documents = await this._execute({ query: elasticQuery, indexPath: "data" });
            return { documents };
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
            return { documents: [] };
        }
    }

    /**
     * This method is used to lookup user created entities in, for example, a repository. Imagine
     *  a user creates an entity of type Country that overlaps with a Country in the data pack (same @id for both).
     *  The user created Country may not be correct but if it has the same @id and is stored
     *  in the same index, it will overrwrite the datapack version which is valid and correct.
     *
     * So, by separating out general entity lookups from data packs, you can store data in a way
     *  where user created stuff doesn't trample known good content.
     *
     * @param {Object} params
     * @param {Object} params.elasticQuery: a query object to be used against an elastic search server
     * @param {Array | String} params.type: the type array or type string of the entity being looked up
     * @param {String} params.queryString: the query string typed in by the user
     * @param {Array | String} params.fields: the fields to search against in the data pack json objects
     * @param {Array | String} params.datapack: the datapack or packs with the data to be used for this entity type
     * @param {Number} params.limit=10: the number of matches to return - default = 10
     * @returns {Object} { documents: [...]} - Object with documents array
     *
     * @returns
     */
    async entities({
        elasticQuery = undefined,
        type = undefined,
        queryString = undefined,
        fields = undefined,
        limit = 10,
    }) {
        if (elasticQuery) {
            // query: the elastic query to perform
            //
            // The crate builder component will pass a fully formed elastic search query to this method
            // It's up to you to get it to the elastic search server. In this example
            //   it's hardcoded in the _execute method
            const documents = await this._execute({ query: elasticQuery, indexPath: "entities" });
            return { documents };
        } else {
            // do the lookup yourself in whatever way you want
            //
            // return array of json-ld objects matching the query:
            // ---------------------------------------------------
            // let documents = [{json-ld object}, {json-ld object}, ...]
            return { documents: [] };
        }
    }

    /** private method */
    async _execute({ query, indexPath }) {
        let response = await fetch(`http://localhost:9200/${indexPath}/_search`, {
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
        // const total = response.hits.total.value;
        const documents = response.hits.hits.map((doc) => ({ ...doc._source }));
        // return { total, documents };
        return documents;
    }
}
