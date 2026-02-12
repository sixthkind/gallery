import { pb } from "#imports";
import { CORE_COLLECTIONS, GALLERY_COLLECTIONS, LEARN_COLLECTIONS } from "~/utils/collections";
import { authUtils } from "~/utils/auth";

export type ModuleNavbarButton = {
  title: string;
  path: string;
  icon?: string;
  requiresAuth?: boolean;
};

export type ModuleConfig = {
  navbar: {
    titleText: string;
    buttons: ModuleNavbarButton[];
  };
  settings: {
    titleEditable: boolean;
  };
};

export type ModuleConfigPatch = {
  navbar?: {
    titleText?: string;
    buttons?: ModuleNavbarButton[];
  };
  settings?: {
    titleEditable?: boolean;
  };
};

type ModuleRecord = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  installed: boolean;
  isMain: boolean;
  routeBase?: string;
  collectionPrefix?: string;
  config?: ModuleConfig;
  created?: string;
  updated?: string;
};

type ModulesResponse = {
  modules: ModuleRecord[];
};

type ModuleConfigResponse = {
  slug: string;
  config: ModuleConfig;
};

const DEFAULT_MODULE_CONFIGS: Record<string, ModuleConfig> = {
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

const cloneConfig = (config: ModuleConfig): ModuleConfig => {
  return JSON.parse(JSON.stringify(config));
};

const getDefaultModuleConfig = (slug: string): ModuleConfig => {
  const defaultConfig = DEFAULT_MODULE_CONFIGS[slug];
  if (!defaultConfig) {
    return {
      navbar: {
        titleText: "",
        buttons: []
      },
      settings: {
        titleEditable: false
      }
    };
  }

  return cloneConfig(defaultConfig);
};

const normalizeButton = (button: any): ModuleNavbarButton | null => {
  if (!button || typeof button !== "object") return null;

  const title = typeof button.title === "string" ? button.title.trim() : "";
  const rawPath = typeof button.path === "string" ? button.path.trim() : "";
  if (!title || !rawPath) return null;

  const normalized: ModuleNavbarButton = {
    title,
    path: rawPath.startsWith("/") ? rawPath : `/${rawPath}`
  };
  if (normalized.path === "/") {
    return null;
  }

  if (typeof button.icon === "string" && button.icon.trim()) {
    normalized.icon = button.icon.trim();
  }
  if (button.requiresAuth === true) {
    normalized.requiresAuth = true;
  }

  return normalized;
};

const normalizeModuleConfig = (slug: string, rawConfig: any): ModuleConfig => {
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
    .map((button: any) => normalizeButton(button))
    .filter((button: ModuleNavbarButton | null): button is ModuleNavbarButton => !!button);

  const buttons = normalizedButtons.length > 0
    ? normalizedButtons
    : defaults.navbar.buttons;

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
};

const INSTALLABLE_MODULES: ModuleRecord[] = [
  {
    id: "catalog-gallery",
    slug: "gallery",
    name: "Gallery",
    description: "Photo gallery module",
    installed: false,
    isMain: false,
    routeBase: "/gallery",
    collectionPrefix: "gallery_",
    config: getDefaultModuleConfig("gallery")
  },
  {
    id: "catalog-learn",
    slug: "learn",
    name: "Learn",
    description: "E-learning courses module",
    installed: false,
    isMain: false,
    routeBase: "/learn",
    collectionPrefix: "_learn_",
    config: getDefaultModuleConfig("learn")
  }
];

async function callModulesAPI(path: string, method: "GET" | "POST", body?: Record<string, any>) {
  const token = pb.authStore.token;
  if (!token) {
    throw new Error("Missing auth token");
  }

  return await $fetch(path, {
    baseURL: pb.baseUrl,
    method,
    headers: {
      Authorization: `Bearer ${token}`
    },
    ...(body ? { body } : {})
  });
}

export const useModules = () => {
  const modules = useState<ModuleRecord[]>("modules:list", () => []);
  const loaded = useState<boolean>("modules:loaded", () => false);
  const loading = useState<boolean>("modules:loading", () => false);
  const listError = useState<string | null>("modules:listError", () => null);

  const mergeWithCatalog = (records: ModuleRecord[]) => {
    const bySlug = new Map(records.map((record) => [record.slug, record]));
    return INSTALLABLE_MODULES.map((module) => {
      const existing = bySlug.get(module.slug);
      if (!existing) {
        return {
          ...module,
          config: getDefaultModuleConfig(module.slug)
        };
      }

      const merged = { ...module, ...existing };
      return {
        ...merged,
        installed: !!merged.installed,
        isMain: !!merged.isMain,
        config: normalizeModuleConfig(merged.slug, merged.config)
      };
    });
  };

  const fallbackFromModulesCollection = async () => {
    const records = await pb.collection(CORE_COLLECTIONS.modules).getFullList({
      sort: "name"
    });

    const mapped = records.map((record: any) => ({
      id: record.id,
      slug: String(record.slug),
      name: String(record.name),
      description: record.description ? String(record.description) : "",
      installed: !!record.installed,
      isMain: !!record.isMain,
      routeBase: record.routeBase ? String(record.routeBase) : "",
      collectionPrefix: record.collectionPrefix ? String(record.collectionPrefix) : "",
      config: normalizeModuleConfig(String(record.slug), record.config),
      created: record.created,
      updated: record.updated
    }));

    return mergeWithCatalog(mapped);
  };

  const fallbackFromCatalogProbe = async () => {
    let galleryInstalled = false;
    let learnInstalled = false;
    try {
      await pb.collection(GALLERY_COLLECTIONS.photos).getList(1, 1, { fields: "id" });
      galleryInstalled = true;
    } catch (error) {
      galleryInstalled = false;
    }

    try {
      await pb.collection(LEARN_COLLECTIONS.courses).getList(1, 1, { fields: "id" });
      learnInstalled = true;
    } catch (error) {
      learnInstalled = false;
    }

    return INSTALLABLE_MODULES.map((module) => {
      if (module.slug === "gallery") {
        return { ...module, installed: galleryInstalled, isMain: false, config: getDefaultModuleConfig("gallery") };
      }
      if (module.slug === "learn") {
        return { ...module, installed: learnInstalled, isMain: false, config: getDefaultModuleConfig("learn") };
      }
      return module;
    });
  };

  const refreshModules = async (force = false) => {
    if (loaded.value && !force) {
      return modules.value;
    }

    if (!pb.authStore.isValid) {
      try {
        modules.value = await fallbackFromCatalogProbe();
        listError.value = null;
      } catch (error: any) {
        modules.value = [...INSTALLABLE_MODULES];
        listError.value = "You must be signed in to load full module state.";
      }
      loaded.value = true;
      return modules.value;
    }

    const record: any = pb.authStore.record;
    if (record?.collectionName === "_superusers") {
      try {
        modules.value = await fallbackFromModulesCollection();
        listError.value = null;
      } catch (error: any) {
        modules.value = await fallbackFromCatalogProbe();
        listError.value = null;
      }
      loaded.value = true;
      return modules.value;
    }

    loading.value = true;
    listError.value = null;
    try {
      const response = await callModulesAPI("/api/modules", "GET") as ModulesResponse;
      modules.value = mergeWithCatalog(Array.isArray(response.modules) ? response.modules : []);
      loaded.value = true;
      return modules.value;
    } catch (apiError: any) {
      const apiMessage = apiError?.data?.error || apiError?.message || "Failed to load modules from API.";
      listError.value = apiMessage;

      try {
        modules.value = await fallbackFromModulesCollection();
        listError.value = null;
        loaded.value = true;
        return modules.value;
      } catch (collectionError: any) {
        modules.value = await fallbackFromCatalogProbe();
        listError.value = null;
        loaded.value = true;
        return modules.value;
      }
    } finally {
      loading.value = false;
    }
  };

  const isInstalled = (slug: string) => {
    return modules.value.some((module) => module.slug === slug && module.installed);
  };

  const requireSuperuser = () => {
    if (!authUtils.isSuperuser()) {
      throw new Error("Forbidden: superuser access required");
    }
  };

  const installModule = async (slug: string) => {
    requireSuperuser();
    await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/install`, "POST");
    await refreshModules(true);
  };

  const uninstallModule = async (slug: string) => {
    requireSuperuser();
    await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/uninstall`, "POST");
    await refreshModules(true);
  };

  const setMainModule = async (slug: string) => {
    requireSuperuser();
    await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/set-main`, "POST");
    await refreshModules(true);
  };

  const unsetMainModule = async (slug: string) => {
    requireSuperuser();
    await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/unset-main`, "POST");
    await refreshModules(true);
  };

  const setLocalModuleConfig = (slug: string, config: ModuleConfig) => {
    let found = false;
    modules.value = modules.value.map((module) => {
      if (module.slug !== slug) return module;
      found = true;
      return {
        ...module,
        config
      };
    });

    if (!found) {
      const catalogModule = INSTALLABLE_MODULES.find((module) => module.slug === slug);
      if (catalogModule) {
        modules.value.push({
          ...catalogModule,
          config
        });
      }
    }
  };

  const getModuleConfig = async (slug: string, force = false) => {
    const existing = modules.value.find((module) => module.slug === slug);
    if (!force && existing?.config) {
      return normalizeModuleConfig(slug, existing.config);
    }

    const response = await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/config`, "GET") as ModuleConfigResponse;
    const config = normalizeModuleConfig(slug, response?.config);
    setLocalModuleConfig(slug, config);
    return config;
  };

  const updateModuleConfig = async (slug: string, configPatch: ModuleConfigPatch) => {
    requireSuperuser();
    const response = await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/config`, "POST", {
      config: configPatch
    }) as ModuleConfigResponse;

    const config = normalizeModuleConfig(slug, response?.config);
    setLocalModuleConfig(slug, config);
    return config;
  };

  return {
    modules,
    loading,
    loaded,
    listError,
    refreshModules,
    isInstalled,
    installModule,
    uninstallModule,
    setMainModule,
    unsetMainModule,
    getModuleConfig,
    updateModuleConfig
  };
};
