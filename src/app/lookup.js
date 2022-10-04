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

    async dataPacks({ query = undefined, fields = [], datapack = [], queryString = undefined }) {
        if (query) {
            // query: the elastic query to perform
            //
            // it's up to you to get it to the elastic search server. In this example
            //   it's hardcoded in the _execute method
            return await this._execute({ query });
        } else if ((fields, datapack, queryString)) {
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
