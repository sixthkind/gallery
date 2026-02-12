/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let collection;
  try {
    collection = app.findCollectionByNameOrId("pbc_5550000001");
  } catch (error) {
    return;
  }

  if (!collection.fields.getByName("isMain")) {
    collection.fields.addAt(5, new Field({
      "hidden": false,
      "id": "boolmod00000007",
      "name": "isMain",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "bool"
    }));
  }

  app.save(collection);

  try {
    const galleryModule = app.findFirstRecordByFilter("modules", "slug = 'gallery'");
    if (galleryModule.get("isMain") === null || galleryModule.get("isMain") === undefined) {
      galleryModule.set("isMain", false);
      app.save(galleryModule);
    }
  } catch (error) {
    // no-op when the seed record doesn't exist yet
  }
}, (app) => {
  let collection;
  try {
    collection = app.findCollectionByNameOrId("pbc_5550000001");
  } catch (error) {
    return;
  }

  if (collection.fields.getByName("isMain")) {
    collection.fields.removeById("boolmod00000007");
    app.save(collection);
  }
});
