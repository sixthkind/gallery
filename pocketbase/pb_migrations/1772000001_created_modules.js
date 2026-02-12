/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_5550000001",
    "name": "modules",
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "indexes": [
      "CREATE UNIQUE INDEX idx_modules_slug ON modules (slug)"
    ],
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "textmod00000001",
        "max": 100,
        "min": 1,
        "name": "slug",
        "pattern": "^[a-z0-9_\\-]+$",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "textmod00000002",
        "max": 200,
        "min": 1,
        "name": "name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "textmod00000003",
        "max": 2000,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "boolmod00000004",
        "name": "installed",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "boolmod00000007",
        "name": "isMain",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "textmod00000005",
        "max": 200,
        "min": 0,
        "name": "routeBase",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "textmod00000006",
        "max": 50,
        "min": 0,
        "name": "collectionPrefix",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ]
  });

  app.save(collection);

  const galleryModule = new Record(collection);
  galleryModule.set("slug", "gallery");
  galleryModule.set("name", "Gallery");
  galleryModule.set("description", "Photo gallery module");
  galleryModule.set("installed", true);
  galleryModule.set("isMain", false);
  galleryModule.set("routeBase", "/gallery");
  galleryModule.set("collectionPrefix", "gallery_");

  return app.save(galleryModule);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_5550000001");
  return app.delete(collection);
});
