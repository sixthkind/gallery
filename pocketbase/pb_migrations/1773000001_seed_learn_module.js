/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let modulesCollection;
  try {
    modulesCollection = app.findCollectionByNameOrId("pbc_5550000001");
  } catch (error) {
    return;
  }

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
    app.save(modulesCollection);
  } else if (installedField.required) {
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
    app.save(modulesCollection);
  }

  const hasLearnCollections = (() => {
    try { app.findCollectionByNameOrId("_learn_courses"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("_learn_sections"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("_learn_lessons"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("_learn_enrollments"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("_learn_lesson_progress"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("_learn_modules"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("_learn_subscription_tiers"); } catch (_) { return false; }
    try { app.findCollectionByNameOrId("_learn_stripe_config"); } catch (_) { return false; }
    return true;
  })();

  let record = null;
  try {
    record = app.findFirstRecordByFilter("modules", "slug = 'learn'");
  } catch (error) {
    record = null;
  }

  if (!record) {
    record = new Record(modulesCollection);
    record.set("slug", "learn");
  }

  record.set("name", "Learn");
  record.set("description", "E-learning courses module");
  record.set("installed", hasLearnCollections);
  if (record.get("isMain") === null || record.get("isMain") === undefined) {
    record.set("isMain", false);
  }
  record.set("routeBase", "/learn");
  record.set("collectionPrefix", "_learn_");
  app.save(record);
}, (app) => {
  try {
    const record = app.findFirstRecordByFilter("modules", "slug = 'learn'");
    app.delete(record);
  } catch (error) {
    // no-op if learn module record wasn't created
  }
});
