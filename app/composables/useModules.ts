import { pb } from "#imports";
import { CORE_COLLECTIONS, GALLERY_COLLECTIONS, LEARN_COLLECTIONS } from "~/utils/collections";

type ModuleRecord = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  installed: boolean;
  isMain: boolean;
  routeBase?: string;
  collectionPrefix?: string;
  created?: string;
  updated?: string;
};

type ModulesResponse = {
  modules: ModuleRecord[];
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
    collectionPrefix: "gallery_"
  },
  {
    id: "catalog-learn",
    slug: "learn",
    name: "Learn",
    description: "E-learning courses module",
    installed: false,
    isMain: false,
    routeBase: "/learn",
    collectionPrefix: "_learn_"
  }
];

async function callModulesAPI(path: string, method: "GET" | "POST") {
  const token = pb.authStore.token;
  if (!token) {
    throw new Error("Missing auth token");
  }

  return await $fetch(path, {
    baseURL: pb.baseUrl,
    method,
    headers: {
      Authorization: `Bearer ${token}`
    }
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
      if (!existing) return module;
      const merged = { ...module, ...existing };
      return {
        ...merged,
        installed: !!merged.installed,
        isMain: !!merged.isMain
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
        return { ...module, installed: galleryInstalled, isMain: false };
      }
      if (module.slug === "learn") {
        return { ...module, installed: learnInstalled, isMain: false };
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

  const installModule = async (slug: string) => {
    await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/install`, "POST");
    await refreshModules(true);
  };

  const uninstallModule = async (slug: string) => {
    await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/uninstall`, "POST");
    await refreshModules(true);
  };

  const setMainModule = async (slug: string) => {
    try {
      await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/set-main`, "POST");
    } catch (error) {
      const records = await pb.collection(CORE_COLLECTIONS.modules).getFullList();
      const target = records.find((record: any) => String(record.slug) === slug);
      if (!target) throw error;
      if (!target.installed) {
        throw new Error("Module must be installed before it can be set as main");
      }
      await Promise.all(records.map((record: any) =>
        pb.collection(CORE_COLLECTIONS.modules).update(record.id, { isMain: false })
      ));
      await pb.collection(CORE_COLLECTIONS.modules).update(target.id, { isMain: true });
    }
    await refreshModules(true);
  };

  const unsetMainModule = async (slug: string) => {
    try {
      await callModulesAPI(`/api/modules/${encodeURIComponent(slug)}/unset-main`, "POST");
    } catch (error) {
      const records = await pb.collection(CORE_COLLECTIONS.modules).getFullList();
      const target = records.find((record: any) => String(record.slug) === slug);
      if (!target) throw error;
      await pb.collection(CORE_COLLECTIONS.modules).update(target.id, { isMain: false });
    }
    await refreshModules(true);
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
    unsetMainModule
  };
};
