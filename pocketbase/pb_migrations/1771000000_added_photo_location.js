/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1234567890")

  if (!collection.fields.getByName("location")) {
    collection.fields.addAt(24, new Field({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text1616161616",
      "max": 200,
      "min": 0,
      "name": "location",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }))
  }

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1234567890")

  if (collection.fields.getByName("location")) {
    collection.fields.removeById("text1616161616")
  }

  return app.save(collection)
})
