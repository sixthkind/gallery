/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1234567890")

  // Add EXIF metadata fields
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "json1111111111",
    "maxSize": 0,
    "name": "exif",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2222222222",
    "max": 100,
    "min": 0,
    "name": "cameraMake",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3333333333",
    "max": 100,
    "min": 0,
    "name": "cameraModel",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4444444444",
    "max": 100,
    "min": 0,
    "name": "lens",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number5555555555",
    "max": null,
    "min": null,
    "name": "iso",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text6666666666",
    "max": 50,
    "min": 0,
    "name": "shutterSpeed",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "number7777777777",
    "max": null,
    "min": null,
    "name": "aperture",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number8888888888",
    "max": null,
    "min": null,
    "name": "focalLength",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "date9999999999",
    "max": "",
    "min": "",
    "name": "dateTaken",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "number1010101010",
    "max": null,
    "min": null,
    "name": "latitude",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "number1111111010",
    "max": null,
    "min": null,
    "name": "longitude",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "number1212121212",
    "max": null,
    "min": null,
    "name": "width",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "number1313131313",
    "max": null,
    "min": null,
    "name": "height",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "number1414141414",
    "max": null,
    "min": null,
    "name": "orientation",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  collection.fields.addAt(23, new Field({
    "hidden": false,
    "id": "number1515151515",
    "max": null,
    "min": null,
    "name": "fileSize",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1234567890")

  // Remove metadata fields
  collection.fields.removeById("json1111111111")
  collection.fields.removeById("text2222222222")
  collection.fields.removeById("text3333333333")
  collection.fields.removeById("text4444444444")
  collection.fields.removeById("number5555555555")
  collection.fields.removeById("text6666666666")
  collection.fields.removeById("number7777777777")
  collection.fields.removeById("number8888888888")
  collection.fields.removeById("date9999999999")
  collection.fields.removeById("number1010101010")
  collection.fields.removeById("number1111111010")
  collection.fields.removeById("number1212121212")
  collection.fields.removeById("number1313131313")
  collection.fields.removeById("number1414141414")
  collection.fields.removeById("number1515151515")

  return app.save(collection)
})
