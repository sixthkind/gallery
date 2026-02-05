/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1234567890")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "file2359244304",
    "maxSelect": 1,
    "maxSize": 52428800,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml"
    ],
    "name": "photo",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": [
      "100x100",
      "250x250",
      "500x500",
      "1200x0"
    ],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1234567890")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "file2359244304",
    "maxSelect": 1,
    "maxSize": 52428800,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml"
    ],
    "name": "photo",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": [
      "100x100",
      "500x500",
      "1200x0"
    ],
    "type": "file"
  }))

  return app.save(collection)
})
