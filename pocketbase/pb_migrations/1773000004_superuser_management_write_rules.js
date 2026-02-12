/// <reference path="../pb_data/types.d.ts" />

const SUPERUSER_RULE = "@request.auth.collectionName = '_superusers'";

function patchCollectionRules(app, nameOrId, rules) {
  try {
    const collection = app.findCollectionByNameOrId(nameOrId);
    unmarshal(rules, collection);
    app.save(collection);
  } catch (error) {
    // Collection might not exist yet for optional modules.
  }
}

migrate((app) => {
  patchCollectionRules(app, "modules", {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: SUPERUSER_RULE,
    updateRule: SUPERUSER_RULE,
    deleteRule: SUPERUSER_RULE
  });

  patchCollectionRules(app, "gallery_tags", {
    createRule: SUPERUSER_RULE,
    updateRule: SUPERUSER_RULE,
    deleteRule: SUPERUSER_RULE
  });

  patchCollectionRules(app, "gallery_photos", {
    createRule: SUPERUSER_RULE,
    updateRule: SUPERUSER_RULE,
    deleteRule: SUPERUSER_RULE
  });

  patchCollectionRules(app, "gallery_albums", {
    createRule: SUPERUSER_RULE,
    updateRule: SUPERUSER_RULE,
    deleteRule: SUPERUSER_RULE
  });

  patchCollectionRules(app, "gallery_groups", {
    createRule: SUPERUSER_RULE,
    updateRule: SUPERUSER_RULE,
    deleteRule: SUPERUSER_RULE
  });

  patchCollectionRules(app, "_learn_courses", {
    createRule: SUPERUSER_RULE,
    updateRule: SUPERUSER_RULE,
    deleteRule: SUPERUSER_RULE
  });

  patchCollectionRules(app, "_learn_sections", {
    createRule: SUPERUSER_RULE,
    updateRule: SUPERUSER_RULE,
    deleteRule: SUPERUSER_RULE
  });

  patchCollectionRules(app, "_learn_lessons", {
    createRule: SUPERUSER_RULE,
    updateRule: SUPERUSER_RULE,
    deleteRule: SUPERUSER_RULE
  });

  patchCollectionRules(app, "_learn_modules", {
    createRule: SUPERUSER_RULE,
    updateRule: SUPERUSER_RULE,
    deleteRule: SUPERUSER_RULE
  });
}, (app) => {
  patchCollectionRules(app, "modules", {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  patchCollectionRules(app, "gallery_tags", {
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  patchCollectionRules(app, "gallery_photos", {
    createRule: "@request.auth.id = user",
    updateRule: "@request.auth.id = user",
    deleteRule: "@request.auth.id = user"
  });

  patchCollectionRules(app, "gallery_albums", {
    createRule: "@request.auth.id = user",
    updateRule: "@request.auth.id = user",
    deleteRule: "@request.auth.id = user"
  });

  patchCollectionRules(app, "gallery_groups", {
    createRule: "@request.auth.id = user",
    updateRule: "@request.auth.id = user",
    deleteRule: "@request.auth.id = user"
  });

  patchCollectionRules(app, "_learn_courses", {
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  patchCollectionRules(app, "_learn_sections", {
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  patchCollectionRules(app, "_learn_lessons", {
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  patchCollectionRules(app, "_learn_modules", {
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });
});
