/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let modulesCollection;
  try {
    modulesCollection = app.findCollectionByNameOrId("pbc_5550000001");
  } catch (error) {
    return;
  }

  const hasMerchCollections = (() => {
    try { app.findCollectionByNameOrId("merch_tags"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("merch_photos"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("merch_products"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("merch_albums"); } catch (_) { return false; }
    return true;
  })();

  const defaultConfig = {
    navbar: {
      titleText: "Merch",
      buttons: [
        { title: "Tags", path: "/tags", icon: "heroicons:tag" }
      ]
    },
    settings: {
      titleEditable: true
    }
  };

  let record = null;
  try {
    record = app.findFirstRecordByFilter("modules", "slug = 'merch'");
  } catch (error) {
    record = null;
  }

  if (!record) {
    record = new Record(modulesCollection);
    record.set("slug", "merch");
  }

  record.set("name", "Merch");
  record.set("description", "Merchandise catalog module");
  record.set("installed", hasMerchCollections);
  if (record.get("isMain") === null || record.get("isMain") === undefined) {
    record.set("isMain", false);
  }
  record.set("routeBase", "/merch");
  record.set("collectionPrefix", "merch_");

  try {
    const currentConfig = record.get("config");
    if (!currentConfig || typeof currentConfig !== "object") {
      record.set("config", defaultConfig);
    }
  } catch (error) {
    // ignore if field doesn't exist in older schemas
  }

  app.save(record);
}, (app) => {
  try {
    const record = app.findFirstRecordByFilter("modules", "slug = 'merch'");
    app.delete(record);
  } catch (error) {
    // no-op if merch module record wasn't created
  }
});
