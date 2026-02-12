/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let collection;
  try {
    collection = app.findCollectionByNameOrId("pbc_5550000001");
  } catch (error) {
    return;
  }

  const configField = collection.fields.getByName("config");
  if (!configField) {
    collection.fields.addAt(8, new Field({
      "hidden": false,
      "id": "jsonmod00000008",
      "maxSize": 0,
      "name": "config",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "json"
    }));
    app.save(collection);
  }

  const defaultsBySlug = {
    gallery: {
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
    learn: {
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

  const normalizeButtons = (buttons, fallbackButtons) => {
    const source = Array.isArray(buttons) && buttons.length > 0 ? buttons : fallbackButtons;
    const normalized = [];

    for (const button of source) {
      if (!button || typeof button !== "object") continue;
      const title = typeof button.title === "string" ? button.title.trim() : "";
      const rawPath = typeof button.path === "string" ? button.path.trim() : "";
      if (!title || !rawPath) continue;

      const normalizedButton = {
        title,
        path: rawPath.startsWith("/") ? rawPath : `/${rawPath}`
      };
      if (normalizedButton.path === "/") continue;
      if (typeof button.icon === "string" && button.icon.trim()) {
        normalizedButton.icon = button.icon.trim();
      }
      if (button.requiresAuth === true) {
        normalizedButton.requiresAuth = true;
      }
      normalized.push(normalizedButton);
    }

    return normalized.length > 0 ? normalized : fallbackButtons;
  };

  const normalizeConfig = (slug, currentConfig) => {
    const defaults = defaultsBySlug[slug];
    const source = currentConfig && typeof currentConfig === "object" ? currentConfig : {};
    const sourceNavbar = source.navbar && typeof source.navbar === "object" ? source.navbar : {};
    const sourceSettings = source.settings && typeof source.settings === "object" ? source.settings : {};

    return {
      navbar: {
        titleText: (typeof sourceNavbar.titleText === "string" && sourceNavbar.titleText.trim())
          ? sourceNavbar.titleText.trim()
          : defaults.navbar.titleText,
        buttons: normalizeButtons(sourceNavbar.buttons, defaults.navbar.buttons)
      },
      settings: {
        titleEditable: sourceSettings.titleEditable === undefined ? true : !!sourceSettings.titleEditable
      }
    };
  };

  for (const slug of Object.keys(defaultsBySlug)) {
    let record;
    try {
      record = app.findFirstRecordByFilter("modules", `slug = '${slug}'`);
    } catch (error) {
      continue;
    }

    const normalized = normalizeConfig(slug, record.get("config"));
    record.set("config", normalized);
    app.save(record);
  }
}, (app) => {
  let collection;
  try {
    collection = app.findCollectionByNameOrId("pbc_5550000001");
  } catch (error) {
    return;
  }

  const configField = collection.fields.getByName("config");
  if (configField) {
    collection.fields.removeById(configField.id);
    app.save(collection);
  }
});
