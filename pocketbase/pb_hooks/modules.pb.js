/// <reference path="../pb_data/types.d.ts" />

const MODULE_SLUG_GALLERY = "gallery";
const COLLECTION_MODULES = "modules";
const MODULES_COLLECTION_ID = "pbc_5550000001";

const GALLERY_TAGS_ID = "pbc_1219621782";
const GALLERY_PHOTOS_ID = "pbc_1234567890";
const GALLERY_GROUPS_ID = "pbc_9876543210";
const GALLERY_ALBUMS_ID = "pbc_2468135790";

const GALLERY_TAGS = "gallery_tags";
const GALLERY_PHOTOS = "gallery_photos";
const GALLERY_GROUPS = "gallery_groups";
const GALLERY_ALBUMS = "gallery_albums";

function setCORSHeaders(e) {
  e.response.header().set("Access-Control-Allow-Origin", "*");
  e.response.header().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  e.response.header().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  e.response.header().set("Access-Control-Max-Age", "86400");
}

function findCollectionSafe(identifier) {
  try {
    return $app.findCollectionByNameOrId(identifier);
  } catch (err) {
    return null;
  }
}

function hasAllGalleryCollections() {
  return !!(
    findCollectionSafe(GALLERY_TAGS) &&
    findCollectionSafe(GALLERY_PHOTOS) &&
    findCollectionSafe(GALLERY_GROUPS) &&
    findCollectionSafe(GALLERY_ALBUMS)
  );
}

function migrateLegacyGalleryNamesIfNeeded() {
  const tags = findCollectionSafe(GALLERY_TAGS_ID);
  const photos = findCollectionSafe(GALLERY_PHOTOS_ID);
  const groups = findCollectionSafe(GALLERY_GROUPS_ID);
  const albums = findCollectionSafe(GALLERY_ALBUMS_ID);

  if (!tags || !photos || !groups || !albums) {
    return;
  }

  if (tags.name !== GALLERY_TAGS) {
    tags.name = GALLERY_TAGS;
    $app.save(tags);
  }
  if (photos.name !== GALLERY_PHOTOS) {
    photos.name = GALLERY_PHOTOS;
    $app.save(photos);
  }
  if (groups.name !== GALLERY_GROUPS) {
    groups.name = GALLERY_GROUPS;
    $app.save(groups);
  }
  if (albums.name !== GALLERY_ALBUMS) {
    albums.name = GALLERY_ALBUMS;
    $app.save(albums);
  }
}

function requireAuth(e) {
  const authHeader = e.request.header.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new Error("Missing auth token");
  }

  return $app.findAuthRecordByToken(token, "auth");
}

function findModuleBySlugSafe(slug) {
  try {
    return $app.findFirstRecordByFilter(
      COLLECTION_MODULES,
      "slug = {:slug}",
      { slug }
    );
  } catch (error) {
    return null;
  }
}

function buildModulesCollection() {
  return new Collection({
    "id": MODULES_COLLECTION_ID,
    "name": COLLECTION_MODULES,
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
}

function ensureModulesCollectionAndSeed() {
  migrateLegacyGalleryNamesIfNeeded();

  let modulesCollection = findCollectionSafe(COLLECTION_MODULES) || findCollectionSafe(MODULES_COLLECTION_ID);
  if (!modulesCollection) {
    modulesCollection = buildModulesCollection();
    $app.save(modulesCollection);
  }

  let galleryModule = findModuleBySlugSafe(MODULE_SLUG_GALLERY);
  if (!galleryModule) {
    galleryModule = new Record(modulesCollection);
    galleryModule.set("slug", MODULE_SLUG_GALLERY);
    galleryModule.set("name", "Gallery");
    galleryModule.set("description", "Photo gallery module");
    galleryModule.set("installed", hasAllGalleryCollections());
    galleryModule.set("routeBase", "/gallery");
    galleryModule.set("collectionPrefix", "gallery_");
    $app.save(galleryModule);
  }

  return modulesCollection;
}

function getOrCreateGalleryModuleRecord() {
  ensureModulesCollectionAndSeed();
  let galleryModule = findModuleBySlugSafe(MODULE_SLUG_GALLERY);
  if (galleryModule) return galleryModule;

  const modulesCollection = findCollectionSafe(COLLECTION_MODULES) || findCollectionSafe(MODULES_COLLECTION_ID);
  galleryModule = new Record(modulesCollection);
  galleryModule.set("slug", MODULE_SLUG_GALLERY);
  galleryModule.set("name", "Gallery");
  galleryModule.set("description", "Photo gallery module");
  galleryModule.set("installed", hasAllGalleryCollections());
  galleryModule.set("routeBase", "/gallery");
  galleryModule.set("collectionPrefix", "gallery_");
  $app.save(galleryModule);
  return galleryModule;
}

function buildGalleryTagsCollection() {
  return new Collection({
    "id": GALLERY_TAGS_ID,
    "name": GALLERY_TAGS,
    "type": "base",
    "system": false,
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "indexes": [],
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
        "id": "text1579384326",
        "max": 0,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2375276105",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
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
}

function buildGalleryPhotosCollectionWithoutGroupAlbum() {
  return new Collection({
    "id": GALLERY_PHOTOS_ID,
    "name": GALLERY_PHOTOS,
    "type": "base",
    "system": false,
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id = user",
    "updateRule": "@request.auth.id = user",
    "deleteRule": "@request.auth.id = user",
    "indexes": [],
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
        "id": "text724990059",
        "max": 200,
        "min": 0,
        "name": "title",
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
        "id": "text892341567",
        "max": 1000,
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
      },
      {
        "cascadeDelete": false,
        "collectionId": GALLERY_TAGS_ID,
        "hidden": false,
        "id": "relation1219621782",
        "maxSelect": 10,
        "minSelect": 0,
        "name": "tags",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2375276105",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "bool135791116",
        "name": "favorite",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "json1111111111",
        "maxSize": 0,
        "name": "exif",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
        "hidden": false,
        "id": "date9999999999",
        "max": "",
        "min": "",
        "name": "dateTaken",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
        "hidden": false,
        "id": "number5043921187",
        "max": null,
        "min": null,
        "name": "sortOrder",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
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
}

function buildGalleryAlbumsCollection() {
  return new Collection({
    "id": GALLERY_ALBUMS_ID,
    "name": GALLERY_ALBUMS,
    "type": "base",
    "system": false,
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id = user",
    "updateRule": "@request.auth.id = user",
    "deleteRule": "@request.auth.id = user",
    "indexes": [],
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
        "id": "text724990060",
        "max": 200,
        "min": 0,
        "name": "title",
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
        "id": "text892341568",
        "max": 1000,
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
        "cascadeDelete": false,
        "collectionId": GALLERY_PHOTOS_ID,
        "hidden": false,
        "id": "relation2468135790",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "coverPhoto",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2468135791",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
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
}

function buildGalleryGroupsCollection() {
  return new Collection({
    "id": GALLERY_GROUPS_ID,
    "name": GALLERY_GROUPS,
    "type": "base",
    "system": false,
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id = user",
    "updateRule": "@request.auth.id = user",
    "deleteRule": "@request.auth.id = user",
    "indexes": [],
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
        "id": "text724990059",
        "max": 200,
        "min": 0,
        "name": "title",
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
        "id": "text892341567",
        "max": 1000,
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
        "cascadeDelete": false,
        "collectionId": GALLERY_PHOTOS_ID,
        "hidden": false,
        "id": "relation9876543210",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "coverPhoto",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": GALLERY_PHOTOS_ID,
        "hidden": false,
        "id": "relation9876543211",
        "maxSelect": 999,
        "minSelect": 0,
        "name": "photos",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation9876543212",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": GALLERY_ALBUMS_ID,
        "hidden": false,
        "id": "relation2468135793",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "album",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "bool135791117",
        "name": "favorite",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "number5043921188",
        "max": null,
        "min": null,
        "name": "sortOrder",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
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
}

function dropCollectionByName(name) {
  const collection = findCollectionSafe(name);
  if (collection) {
    $app.delete(collection);
  }
}

function ensureGalleryCollections() {
  const tags = findCollectionSafe(GALLERY_TAGS);
  const photos = findCollectionSafe(GALLERY_PHOTOS);
  const groups = findCollectionSafe(GALLERY_GROUPS);
  const albums = findCollectionSafe(GALLERY_ALBUMS);

  if (tags && photos && groups && albums) {
    return;
  }

  // Remove partial state before recreating in a deterministic order.
  dropCollectionByName(GALLERY_GROUPS);
  dropCollectionByName(GALLERY_ALBUMS);
  dropCollectionByName(GALLERY_PHOTOS);
  dropCollectionByName(GALLERY_TAGS);

  $app.save(buildGalleryTagsCollection());
  $app.save(buildGalleryPhotosCollectionWithoutGroupAlbum());
  $app.save(buildGalleryAlbumsCollection());
  $app.save(buildGalleryGroupsCollection());

  const photosCollection = $app.findCollectionByNameOrId(GALLERY_PHOTOS_ID);

  if (!photosCollection.fields.getByName("group")) {
    photosCollection.fields.addAt(6, new Field({
      "cascadeDelete": false,
      "collectionId": GALLERY_GROUPS_ID,
      "hidden": false,
      "id": "relation9876543213",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "group",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }));
  }

  if (!photosCollection.fields.getByName("album")) {
    photosCollection.fields.addAt(7, new Field({
      "cascadeDelete": false,
      "collectionId": GALLERY_ALBUMS_ID,
      "hidden": false,
      "id": "relation2468135792",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "album",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }));
  }

  $app.save(photosCollection);
}

function purgeGalleryCollections() {
  dropCollectionByName(GALLERY_GROUPS);
  dropCollectionByName(GALLERY_ALBUMS);
  dropCollectionByName(GALLERY_PHOTOS);
  dropCollectionByName(GALLERY_TAGS);
}

routerAdd("OPTIONS", "/api/modules", (e) => {
  setCORSHeaders(e);
  return e.noContent(204);
});

routerAdd("OPTIONS", "/api/modules/*", (e) => {
  setCORSHeaders(e);
  return e.noContent(204);
});

routerAdd("GET", "/api/modules", (e) => {
  setCORSHeaders(e);
  try {
    requireAuth(e);
  } catch (error) {
    return e.json(401, { error: error.message || "Unauthorized" });
  }

  try {
    ensureModulesCollectionAndSeed();

    const records = $app.findRecordsByFilter(
      COLLECTION_MODULES,
      "",
      "name",
      200,
      0
    );

    const modules = records.map((record) => ({
      id: record.id,
      slug: record.get("slug"),
      name: record.get("name"),
      description: record.get("description"),
      installed: !!record.get("installed"),
      routeBase: record.get("routeBase"),
      collectionPrefix: record.get("collectionPrefix"),
      created: record.get("created"),
      updated: record.get("updated")
    }));

    return e.json(200, { modules });
  } catch (error) {
    return e.json(500, { error: error.message || "Failed to list modules" });
  }
});

routerAdd("POST", "/api/modules/{slug}/install", (e) => {
  setCORSHeaders(e);
  try {
    requireAuth(e);
    const slug = e.request.pathValue("slug");

    if (slug !== MODULE_SLUG_GALLERY) {
      return e.json(400, { error: "Unknown module slug" });
    }

    const moduleRecord = getOrCreateGalleryModuleRecord();

    ensureGalleryCollections();

    if (!moduleRecord.get("installed")) {
      moduleRecord.set("installed", true);
      $app.save(moduleRecord);
    }

    return e.json(200, {
      slug,
      installed: true
    });
  } catch (error) {
    const message = error.message || "Failed to install module";
    const status = /auth|token|authorization/i.test(message) ? 401 : 400;
    return e.json(status, { error: message });
  }
});

routerAdd("POST", "/api/modules/{slug}/uninstall", (e) => {
  setCORSHeaders(e);
  try {
    requireAuth(e);
    const slug = e.request.pathValue("slug");

    if (slug !== MODULE_SLUG_GALLERY) {
      return e.json(400, { error: "Unknown module slug" });
    }

    const moduleRecord = getOrCreateGalleryModuleRecord();

    purgeGalleryCollections();
    if (moduleRecord.get("installed")) {
      moduleRecord.set("installed", false);
      $app.save(moduleRecord);
    }

    return e.json(200, {
      slug,
      installed: false
    });
  } catch (error) {
    const message = error.message || "Failed to uninstall module";
    const status = /auth|token|authorization/i.test(message) ? 401 : 400;
    return e.json(status, { error: message });
  }
});
