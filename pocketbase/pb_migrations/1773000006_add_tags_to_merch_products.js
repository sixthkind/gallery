/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let collection;
  try {
    collection = app.findCollectionByNameOrId("merch_products");
  } catch (error) {
    return;
  }

  const tagsField = collection.fields.getByName("tags");
  if (!tagsField) {
    collection.fields.addAt(10, new Field({
      "cascadeDelete": false,
      "collectionId": "pbc_merch_tg001",
      "hidden": false,
      "id": "relation_merch_tg",
      "maxSelect": 999,
      "minSelect": 0,
      "name": "tags",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }));
  } else if (tagsField.collectionId !== "pbc_merch_tg001") {
    tagsField.collectionId = "pbc_merch_tg001";
  }

  return app.save(collection);
}, (app) => {
  let collection;
  try {
    collection = app.findCollectionByNameOrId("merch_products");
  } catch (error) {
    return;
  }

  const tagsField = collection.fields.getByName("tags");
  if (tagsField) {
    collection.fields.removeById(tagsField.id);
  }

  return app.save(collection);
});
