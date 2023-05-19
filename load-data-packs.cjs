const { IndexDataPacks } = require("@describo/data-packs");
const { Client } = require("@elastic/elasticsearch");

const elasticUrl = "http://localhost:9200";
main();
async function main() {
    const index = new IndexDataPacks({ elasticUrl, log: true });
    await index.load();

    const client = new Client({
        node: elasticUrl,
    });

    let entities = [
        {
            "@id": "#person1",
            "@type": "Person",
            name: "person1",
        },
        {
            "@id": "#person2",
            "@type": ["Person", "Human"],
            name: "person2",
        },
        {
            "@id": "#language1",
            "@type": "Language",
            name: "language1",
        },
    ];
    for (let entity of entities) {
        await client.index({
            index: "entities",
            id: encodeURIComponent(entity["@id"]),
            document: entity,
        });
    }
}
