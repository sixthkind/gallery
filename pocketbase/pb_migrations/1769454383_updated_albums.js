/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("albums")
  } catch (e) {
    // Collection doesn't exist in this DB state; skip.
    return
  }

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number1063427325",
    "max": null,
    "min": null,
    "name": "sortOrder",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("albums")
  } catch (e) {
    // Collection doesn't exist in this DB state; skip.
    return
  }

  // remove field
  collection.fields.removeById("number1063427325")

  return app.save(collection)
})
