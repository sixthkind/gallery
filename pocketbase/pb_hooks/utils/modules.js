/// <reference path="../pb_data/types.d.ts" />

const MODULE_SLUG_GALLERY = "gallery";
const MODULE_SLUG_LEARN = "learn";
const COLLECTION_MODULES = "modules";
const MODULES_COLLECTION_ID = "pbc_5550000001";
const MODULE_CONFIG_FIELD_ID = "jsonmod00000008";

const GALLERY_TAGS_ID = "pbc_1219621782";
const GALLERY_PHOTOS_ID = "pbc_1234567890";
const GALLERY_GROUPS_ID = "pbc_9876543210";
const GALLERY_ALBUMS_ID = "pbc_2468135790";

const GALLERY_TAGS = "gallery_tags";
const GALLERY_PHOTOS = "gallery_photos";
const GALLERY_GROUPS = "gallery_groups";
const GALLERY_ALBUMS = "gallery_albums";

const LEARN_COURSES_ID = "pbc_learn_c001";
const LEARN_SECTIONS_ID = "pbc_learn_s001";
const LEARN_LESSONS_ID = "pbc_learn_l001";
const LEARN_ENROLLMENTS_ID = "pbc_learn_e001";
const LEARN_LESSON_PROGRESS_ID = "pbc_learn_p001";
const LEARN_MODULES_ID = "pbc_learn_m001";
const LEARN_SUBSCRIPTION_TIERS_ID = "pbc_learn_t001";
const LEARN_STRIPE_CONFIG_ID = "pbc_learn_sc01";

const LEARN_COURSES = "_learn_courses";
const LEARN_SECTIONS = "_learn_sections";
const LEARN_LESSONS = "_learn_lessons";
const LEARN_ENROLLMENTS = "_learn_enrollments";
const LEARN_LESSON_PROGRESS = "_learn_lesson_progress";
const LEARN_MODULES = "_learn_modules";
const LEARN_SUBSCRIPTION_TIERS = "_learn_subscription_tiers";
const LEARN_STRIPE_CONFIG = "_learn_stripe_config";

const DEFAULT_MODULE_CONFIGS = {
  [MODULE_SLUG_GALLERY]: {
    navbar: {
      titleText: "Gallery",
      buttons: [
        { title: "Albums", path: "/albums", icon: "heroicons:rectangle-stack" },
        { title: "Tags", path: "/tags", icon: "heroicons:tag" }
      ]
    },
    settings: {
      titleEditable: true
    }
  },
  [MODULE_SLUG_LEARN]: {
    navbar: {
      titleText: "Learn",
      buttons: [
        { title: "Courses", path: "/courses", icon: "heroicons:book-open" },
        { title: "Enrollments", path: "/enrollments", icon: "heroicons:bookmark-square", requiresAuth: true }
      ]
    },
    settings: {
      titleEditable: true
    }
  }
};

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

function hasAllLearnCollections() {
  return !!(
    findCollectionSafe(LEARN_COURSES) &&
    findCollectionSafe(LEARN_SECTIONS) &&
    findCollectionSafe(LEARN_LESSONS) &&
    findCollectionSafe(LEARN_ENROLLMENTS) &&
    findCollectionSafe(LEARN_LESSON_PROGRESS) &&
    findCollectionSafe(LEARN_MODULES) &&
    findCollectionSafe(LEARN_SUBSCRIPTION_TIERS) &&
    findCollectionSafe(LEARN_STRIPE_CONFIG)
  );
}

function isSupportedModuleSlug(slug) {
  return slug === MODULE_SLUG_GALLERY || slug === MODULE_SLUG_LEARN;
}

function cloneJSON(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDefaultModuleConfig(slug) {
  return cloneJSON(DEFAULT_MODULE_CONFIGS[slug] || {
    navbar: { titleText: "", buttons: [] },
    settings: { titleEditable: false }
  });
}

function normalizeModuleButton(button) {
  if (!button || typeof button !== "object") return null;

  const title = typeof button.title === "string" ? button.title.trim() : "";
  const rawPath = typeof button.path === "string" ? button.path.trim() : "";
  if (!title || !rawPath) {
    return null;
  }

  const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  if (normalizedPath === "/") {
    return null;
  }
  const normalized = { title, path: normalizedPath };

  if (typeof button.icon === "string" && button.icon.trim()) {
    normalized.icon = button.icon.trim();
  }
  if (button.requiresAuth === true) {
    normalized.requiresAuth = true;
  }

  return normalized;
}

function normalizeModuleConfig(slug, rawConfig) {
  const defaults = getDefaultModuleConfig(slug);
  const source = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
  const sourceNavbar = source.navbar && typeof source.navbar === "object" ? source.navbar : {};
  const sourceSettings = source.settings && typeof source.settings === "object" ? source.settings : {};

  const titleText = typeof sourceNavbar.titleText === "string" && sourceNavbar.titleText.trim()
    ? sourceNavbar.titleText.trim()
    : defaults.navbar.titleText;

  const sourceButtons = Array.isArray(sourceNavbar.buttons) && sourceNavbar.buttons.length > 0
    ? sourceNavbar.buttons
    : defaults.navbar.buttons;
  const normalizedButtons = sourceButtons
    .map(normalizeModuleButton)
    .filter((button) => !!button);
  const buttons = normalizedButtons.length > 0
    ? normalizedButtons
    : defaults.navbar.buttons.map(normalizeModuleButton).filter((button) => !!button);

  return {
    navbar: {
      titleText,
      buttons
    },
    settings: {
      titleEditable: sourceSettings.titleEditable === undefined
        ? !!defaults.settings.titleEditable
        : !!sourceSettings.titleEditable
    }
  };
}

function ensureModuleConfigDefaults(moduleRecord, slug) {
  const currentConfig = moduleRecord.get("config");
  const normalized = normalizeModuleConfig(slug, currentConfig);
  const currentJSON = JSON.stringify(currentConfig || {});
  const normalizedJSON = JSON.stringify(normalized);

  if (currentJSON !== normalizedJSON) {
    moduleRecord.set("config", normalized);
    $app.save(moduleRecord);
  }

  return normalized;
}

function updateModuleConfig(moduleRecord, slug, configPatch) {
  const current = normalizeModuleConfig(slug, moduleRecord.get("config"));
  const patch = configPatch && typeof configPatch === "object" ? configPatch : {};
  const patchNavbar = patch.navbar && typeof patch.navbar === "object" ? patch.navbar : {};
  const patchSettings = patch.settings && typeof patch.settings === "object" ? patch.settings : {};

  const merged = {
    navbar: {
      ...current.navbar,
      ...(patchNavbar.titleText !== undefined ? { titleText: patchNavbar.titleText } : {}),
      ...(patchNavbar.buttons !== undefined ? { buttons: patchNavbar.buttons } : {})
    },
    settings: {
      ...current.settings,
      ...(patchSettings.titleEditable !== undefined ? { titleEditable: patchSettings.titleEditable } : {})
    }
  };

  const normalized = normalizeModuleConfig(slug, merged);
  moduleRecord.set("config", normalized);
  $app.save(moduleRecord);
  return normalized;
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
  // Prefer the request context auth (works for both users and superusers).
  if (e.auth) {
    return e.auth;
  }

  const authHeader = e.request.header.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new Error("Missing auth token");
  }

  try {
    return $app.findAuthRecordByToken(token, "auth");
  } catch (error) {
    throw new Error("Unauthorized");
  }
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

function ensureInstalledFieldIsOptional(modulesCollection) {
  const installedField = modulesCollection.fields.getByName("installed");
  if (!installedField) {
    modulesCollection.fields.addAt(4, new Field({
      "hidden": false,
      "id": "boolmod00000004",
      "name": "installed",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "bool"
    }));
    $app.save(modulesCollection);
    return;
  }

  if (installedField.required) {
    modulesCollection.fields.removeById(installedField.id);
    modulesCollection.fields.addAt(4, new Field({
      "hidden": false,
      "id": installedField.id || "boolmod00000004",
      "name": "installed",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "bool"
    }));
    $app.save(modulesCollection);
  }
}

function ensureConfigField(modulesCollection) {
  const configField = modulesCollection.fields.getByName("config");
  if (!configField) {
    modulesCollection.fields.addAt(8, new Field({
      "hidden": false,
      "id": MODULE_CONFIG_FIELD_ID,
      "maxSize": 0,
      "name": "config",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "json"
    }));
    $app.save(modulesCollection);
    return;
  }

  if (configField.type !== "json") {
    modulesCollection.fields.removeById(configField.id);
    modulesCollection.fields.addAt(8, new Field({
      "hidden": false,
      "id": configField.id || MODULE_CONFIG_FIELD_ID,
      "maxSize": 0,
      "name": "config",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "json"
    }));
    $app.save(modulesCollection);
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
        "required": false,
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
        "id": MODULE_CONFIG_FIELD_ID,
        "maxSize": 0,
        "name": "config",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
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

  if (!modulesCollection.fields.getByName("isMain")) {
    modulesCollection.fields.addAt(5, new Field({
      "hidden": false,
      "id": "boolmod00000007",
      "name": "isMain",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "bool"
    }));
    $app.save(modulesCollection);
  }

  ensureInstalledFieldIsOptional(modulesCollection);
  ensureConfigField(modulesCollection);

  const moduleConfigs = [
    {
      slug: MODULE_SLUG_GALLERY,
      name: "Gallery",
      description: "Photo gallery module",
      routeBase: "/gallery",
      collectionPrefix: "gallery_",
      installed: hasAllGalleryCollections(),
      config: getDefaultModuleConfig(MODULE_SLUG_GALLERY)
    },
    {
      slug: MODULE_SLUG_LEARN,
      name: "Learn",
      description: "E-learning courses module",
      routeBase: "/learn",
      collectionPrefix: "_learn_",
      installed: hasAllLearnCollections(),
      config: getDefaultModuleConfig(MODULE_SLUG_LEARN)
    }
  ];

  for (const config of moduleConfigs) {
    let moduleRecord = findModuleBySlugSafe(config.slug);
    if (!moduleRecord) {
      moduleRecord = new Record(modulesCollection);
    }

    moduleRecord.set("slug", config.slug);
    moduleRecord.set("name", config.name);
    moduleRecord.set("description", config.description);
    moduleRecord.set("installed", config.installed);
    moduleRecord.set("routeBase", config.routeBase);
    moduleRecord.set("collectionPrefix", config.collectionPrefix);
    moduleRecord.set("config", normalizeModuleConfig(config.slug, moduleRecord.get("config") || config.config));
    if (moduleRecord.get("isMain") === null || moduleRecord.get("isMain") === undefined) {
      moduleRecord.set("isMain", false);
    }
    $app.save(moduleRecord);
  }

  return modulesCollection;
}

function getOrCreateModuleRecord(slug) {
  ensureModulesCollectionAndSeed();
  let moduleRecord = findModuleBySlugSafe(slug);
  if (moduleRecord) {
    ensureModuleConfigDefaults(moduleRecord, slug);
    return moduleRecord;
  }

  const configs = {
    [MODULE_SLUG_GALLERY]: {
      name: "Gallery",
      description: "Photo gallery module",
      routeBase: "/gallery",
      collectionPrefix: "gallery_",
      installed: hasAllGalleryCollections(),
      config: getDefaultModuleConfig(MODULE_SLUG_GALLERY)
    },
    [MODULE_SLUG_LEARN]: {
      name: "Learn",
      description: "E-learning courses module",
      routeBase: "/learn",
      collectionPrefix: "_learn_",
      installed: hasAllLearnCollections(),
      config: getDefaultModuleConfig(MODULE_SLUG_LEARN)
    }
  };
  const config = configs[slug];
  if (!config) {
    throw new Error("Unknown module slug");
  }
  const modulesCollection = findCollectionSafe(COLLECTION_MODULES) || findCollectionSafe(MODULES_COLLECTION_ID);
  moduleRecord = new Record(modulesCollection);
  moduleRecord.set("slug", slug);
  moduleRecord.set("name", config.name);
  moduleRecord.set("description", config.description);
  moduleRecord.set("installed", config.installed);
  moduleRecord.set("isMain", false);
  moduleRecord.set("routeBase", config.routeBase);
  moduleRecord.set("collectionPrefix", config.collectionPrefix);
  moduleRecord.set("config", normalizeModuleConfig(slug, config.config));
  $app.save(moduleRecord);
  return moduleRecord;
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

function buildLearnSubscriptionTiersCollection() {
  return new Collection({
    "id": LEARN_SUBSCRIPTION_TIERS_ID,
    "name": LEARN_SUBSCRIPTION_TIERS,
    "type": "base",
    "system": false,
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.collectionName = '_superusers'",
    "updateRule": "@request.auth.collectionName = '_superusers'",
    "deleteRule": "@request.auth.collectionName = '_superusers'",
    "indexes": [
      `CREATE UNIQUE INDEX idx_learn_tier_key ON ${LEARN_SUBSCRIPTION_TIERS} (key)`
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
        "id": "text_tier_name",
        "max": 0,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_tier_key",
        "max": 0,
        "min": 0,
        "name": "key",
        "pattern": "^[a-z_]+$",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1843675174",
        "max": 0,
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
        "id": "number_price_monthly",
        "max": null,
        "min": 0,
        "name": "price_monthly",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_price_yearly",
        "max": null,
        "min": 0,
        "name": "price_yearly",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_stripe_monthly",
        "max": 0,
        "min": 0,
        "name": "stripe_price_id_monthly",
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
        "id": "text_stripe_yearly",
        "max": 0,
        "min": 0,
        "name": "stripe_price_id_yearly",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json_features",
        "maxSize": 0,
        "name": "features",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number_order",
        "max": null,
        "min": null,
        "name": "order",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "bool_active",
        "name": "active",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
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

function buildLearnCoursesCollection() {
  return new Collection({
    "id": LEARN_COURSES_ID,
    "name": LEARN_COURSES,
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != '' || published = true",
    "viewRule": "@request.auth.id != '' || published = true",
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
        "id": "text1001",
        "max": 0,
        "min": 0,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "editor1002",
        "maxSize": 0,
        "name": "description",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
      },
      {
        "hidden": false,
        "id": "file1003",
        "maxSelect": 1,
        "maxSize": 5242880,
        "mimeTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"],
        "name": "image",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": ["200x200", "600x0"],
        "type": "file"
      },
      {
        "hidden": false,
        "id": "number7001",
        "max": null,
        "min": 0,
        "name": "price",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "cascadeDelete": false,
        "collectionId": LEARN_SUBSCRIPTION_TIERS_ID,
        "hidden": false,
        "id": "relation_tier",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "subscription_tier",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "bool1004",
        "name": "published",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool7003",
        "name": "featured",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
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

function buildLearnSectionsCollection() {
  return new Collection({
    "id": LEARN_SECTIONS_ID,
    "name": LEARN_SECTIONS,
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != '' || course.published = true",
    "viewRule": "@request.auth.id != '' || course.published = true",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "indexes": [`CREATE INDEX idx_learn_section_course ON ${LEARN_SECTIONS} (course)`],
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
        "id": "text2001",
        "max": 0,
        "min": 0,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number2002",
        "max": null,
        "min": 0,
        "name": "order",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "cascadeDelete": true,
        "collectionId": LEARN_COURSES_ID,
        "hidden": false,
        "id": "relation2003",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "course",
        "presentable": false,
        "required": true,
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

function buildLearnLessonsCollection() {
  return new Collection({
    "id": LEARN_LESSONS_ID,
    "name": LEARN_LESSONS,
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != '' || section.course.published = true",
    "viewRule": "@request.auth.id != '' || section.course.published = true",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "indexes": [`CREATE INDEX idx_learn_lesson_section ON ${LEARN_LESSONS} (section)`],
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
        "id": "text3001",
        "max": 0,
        "min": 0,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json3002",
        "maxSize": 0,
        "name": "content",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number3003",
        "max": null,
        "min": 0,
        "name": "order",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "cascadeDelete": true,
        "collectionId": LEARN_SECTIONS_ID,
        "hidden": false,
        "id": "relation3004",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "section",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "file3005",
        "maxSelect": 99,
        "maxSize": 5242880,
        "mimeTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"],
        "name": "images",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": ["200x200", "600x400"],
        "type": "file"
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

function buildLearnModulesCollection() {
  return new Collection({
    "id": LEARN_MODULES_ID,
    "name": LEARN_MODULES,
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != '' || published = true",
    "viewRule": "@request.auth.id != '' || published = true",
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
        "id": "text5001",
        "max": 0,
        "min": 0,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "editor5002",
        "maxSize": 0,
        "name": "description",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
      },
      {
        "hidden": false,
        "id": "file5003",
        "maxSelect": 1,
        "maxSize": 5242880,
        "mimeTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"],
        "name": "image",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": ["200x200", "600x0"],
        "type": "file"
      },
      {
        "cascadeDelete": false,
        "collectionId": LEARN_COURSES_ID,
        "hidden": false,
        "id": "relation5004",
        "maxSelect": 999,
        "minSelect": 1,
        "name": "courses",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number5005",
        "max": null,
        "min": 0,
        "name": "price",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "bool5006",
        "name": "published",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
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

function buildLearnStripeConfigCollection() {
  return new Collection({
    "id": LEARN_STRIPE_CONFIG_ID,
    "name": LEARN_STRIPE_CONFIG,
    "type": "base",
    "system": false,
    "listRule": "@request.auth.collectionName = '_superusers'",
    "viewRule": "@request.auth.collectionName = '_superusers'",
    "createRule": "@request.auth.collectionName = '_superusers'",
    "updateRule": "@request.auth.collectionName = '_superusers'",
    "deleteRule": "@request.auth.collectionName = '_superusers'",
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
        "id": "text6001",
        "max": 0,
        "min": 0,
        "name": "publishable_key",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": true,
        "id": "text6002",
        "max": 0,
        "min": 0,
        "name": "secret_key",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": true,
        "id": "text6003",
        "max": 0,
        "min": 0,
        "name": "webhook_secret",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select6004",
        "maxSelect": 1,
        "name": "environment",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["test", "live"]
      },
      {
        "hidden": false,
        "id": "bool6005",
        "name": "active",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
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

function buildLearnEnrollmentsCollection() {
  return new Collection({
    "id": LEARN_ENROLLMENTS_ID,
    "name": LEARN_ENROLLMENTS,
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != '' && @request.auth.id = user",
    "viewRule": "@request.auth.id != '' && @request.auth.id = user",
    "createRule": "@request.auth.id != '' && @request.auth.id = user",
    "updateRule": "@request.auth.id != '' && @request.auth.id = user",
    "deleteRule": "@request.auth.id != '' && @request.auth.id = user",
    "indexes": [
      `CREATE UNIQUE INDEX idx_learn_unique_enrollment ON ${LEARN_ENROLLMENTS} (user, course)`,
      `CREATE INDEX idx_learn_user_enrollments ON ${LEARN_ENROLLMENTS} (user)`
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
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation4001",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "user",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": LEARN_COURSES_ID,
        "hidden": false,
        "id": "relation4002",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "course",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "date4003",
        "max": "",
        "min": "",
        "name": "enrolled_at",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "select8001",
        "maxSelect": 1,
        "name": "purchase_type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": ["free", "one-time", "subscription", "module"]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text8002",
        "max": 0,
        "min": 0,
        "name": "stripe_payment_intent_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": LEARN_MODULES_ID,
        "hidden": false,
        "id": "relation8003",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "module",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "date8004",
        "max": "",
        "min": "",
        "name": "expires_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "number9001",
        "max": null,
        "min": 0,
        "name": "amount_paid",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text9002",
        "max": 10,
        "min": 0,
        "name": "currency",
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

function buildLearnLessonProgressCollection() {
  return new Collection({
    "id": LEARN_LESSON_PROGRESS_ID,
    "name": LEARN_LESSON_PROGRESS,
    "type": "base",
    "system": false,
    "listRule": "@request.auth.id != '' && @request.auth.id = user",
    "viewRule": "@request.auth.id != '' && @request.auth.id = user",
    "createRule": "@request.auth.id != '' && @request.auth.id = user",
    "updateRule": "@request.auth.id != '' && @request.auth.id = user",
    "deleteRule": "@request.auth.id != '' && @request.auth.id = user",
    "indexes": [
      `CREATE UNIQUE INDEX idx_learn_unique_progress ON ${LEARN_LESSON_PROGRESS} (user, lesson)`,
      `CREATE INDEX idx_learn_user_progress ON ${LEARN_LESSON_PROGRESS} (user)`
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
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation5001",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "user",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": LEARN_LESSONS_ID,
        "hidden": false,
        "id": "relation5002",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "lesson",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "bool5003",
        "name": "completed",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "date5004",
        "max": "",
        "min": "",
        "name": "completed_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
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

function ensureLearnCollections() {
  if (hasAllLearnCollections()) {
    return;
  }

  // Drop partial state in reverse dependency order.
  dropCollectionByName(LEARN_LESSON_PROGRESS);
  dropCollectionByName(LEARN_ENROLLMENTS);
  dropCollectionByName(LEARN_LESSONS);
  dropCollectionByName(LEARN_SECTIONS);
  dropCollectionByName(LEARN_MODULES);
  dropCollectionByName(LEARN_COURSES);
  dropCollectionByName(LEARN_SUBSCRIPTION_TIERS);
  dropCollectionByName(LEARN_STRIPE_CONFIG);

  // Deterministic creation order for relation dependencies.
  $app.save(buildLearnSubscriptionTiersCollection());
  $app.save(buildLearnCoursesCollection());
  $app.save(buildLearnSectionsCollection());
  $app.save(buildLearnLessonsCollection());
  $app.save(buildLearnModulesCollection());
  $app.save(buildLearnStripeConfigCollection());
  $app.save(buildLearnEnrollmentsCollection());
  $app.save(buildLearnLessonProgressCollection());
}

function purgeLearnCollections() {
  dropCollectionByName(LEARN_LESSON_PROGRESS);
  dropCollectionByName(LEARN_ENROLLMENTS);
  dropCollectionByName(LEARN_LESSONS);
  dropCollectionByName(LEARN_SECTIONS);
  dropCollectionByName(LEARN_MODULES);
  dropCollectionByName(LEARN_COURSES);
  dropCollectionByName(LEARN_SUBSCRIPTION_TIERS);
  dropCollectionByName(LEARN_STRIPE_CONFIG);
}

function ensureCollectionsForModule(slug) {
  if (slug === MODULE_SLUG_GALLERY) {
    ensureGalleryCollections();
    return;
  }

  if (slug === MODULE_SLUG_LEARN) {
    ensureLearnCollections();
    return;
  }

  throw new Error("Unknown module slug");
}

function purgeCollectionsForModule(slug) {
  if (slug === MODULE_SLUG_GALLERY) {
    purgeGalleryCollections();
    return;
  }

  if (slug === MODULE_SLUG_LEARN) {
    purgeLearnCollections();
    return;
  }

  throw new Error("Unknown module slug");
}

function clearMainModuleSelection() {
  const records = $app.findRecordsByFilter(
    COLLECTION_MODULES,
    "isMain = true",
    "name",
    200,
    0
  );

  for (const record of records) {
    record.set("isMain", false);
    $app.save(record);
  }
}

module.exports = {
  MODULE_SLUG_GALLERY,
  MODULE_SLUG_LEARN,
  COLLECTION_MODULES,
  isSupportedModuleSlug,
  setCORSHeaders,
  requireAuth,
  ensureModulesCollectionAndSeed,
  getOrCreateModuleRecord,
  ensureModuleConfigDefaults,
  updateModuleConfig,
  ensureCollectionsForModule,
  purgeCollectionsForModule,
  clearMainModuleSelection
};
