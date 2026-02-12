<script setup lang="ts">
definePageMeta({
  middleware: "auth"
});

const route = useRoute();

const normalizeSlug = (value: unknown) => {
  return decodeURIComponent(String(value || "")).trim().toLowerCase();
};

const getSlugFromPath = (fullPath: string) => {
  const cleanPath = String(fullPath || "").split("?")[0].split("#")[0];
  const segments = cleanPath.split("/").filter(Boolean);
  if (segments[0] !== "modules") return "";
  return normalizeSlug(segments[1] || "");
};

const DEFAULT_MODULE_CONFIGS: Record<string, any> = {
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

const withConfigFallback = (input: any, currentSlug: string) => {
  const fallback = DEFAULT_MODULE_CONFIGS[currentSlug] || {
    navbar: { titleText: "", buttons: [] },
    settings: { titleEditable: true }
  };
  const source = input && typeof input === "object" ? input : {};
  const sourceNavbar = source.navbar && typeof source.navbar === "object" ? source.navbar : {};
  const sourceSettings = source.settings && typeof source.settings === "object" ? source.settings : {};

  return {
    navbar: {
      titleText: typeof sourceNavbar.titleText === "string" && sourceNavbar.titleText.trim()
        ? sourceNavbar.titleText.trim()
        : fallback.navbar.titleText,
      buttons: Array.isArray(sourceNavbar.buttons) && sourceNavbar.buttons.length > 0
        ? sourceNavbar.buttons
        : fallback.navbar.buttons
    },
    settings: {
      titleEditable: sourceSettings.titleEditable === undefined
        ? !!fallback.settings.titleEditable
        : !!sourceSettings.titleEditable
    }
  };
};

const slug = computed(() => {
  const raw = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug;
  const fromParams = normalizeSlug(raw);
  if (fromParams) return fromParams;

  const fromRoute = getSlugFromPath(route.fullPath || route.path);
  if (fromRoute) return fromRoute;

  if (process.client) {
    const fromWindow = getSlugFromPath(window.location.pathname + window.location.search + window.location.hash);
    if (fromWindow) return fromWindow;
  }

  return "";
});

const {
  modules,
  refreshModules,
  getModuleConfig,
  updateModuleConfig
} = useModules();

const loading = ref(true);
const saving = ref(false);
const loadError = ref("");
const saveError = ref("");
const saved = ref(false);

const moduleRecord = computed(() => {
  return modules.value.find((module) => module.slug === slug.value) || null;
});

const moduleConfig = ref<any>(null);
const titleText = ref("");
const displayModuleName = computed(() => {
  if (moduleRecord.value?.name) return moduleRecord.value.name;
  if (!slug.value) return "";
  return slug.value.charAt(0).toUpperCase() + slug.value.slice(1);
});

const titleEditable = computed(() => {
  return !!moduleConfig.value?.settings?.titleEditable;
});

const moduleButtons = computed(() => {
  const buttons = moduleConfig.value?.navbar?.buttons;
  return Array.isArray(buttons) ? buttons : [];
});

let loadRunId = 0;
const activeSlug = ref("");

const loadModuleSettings = async () => {
  const runId = ++loadRunId;
  loading.value = true;
  loadError.value = "";
  saved.value = false;

  try {
    const currentSlug = slug.value;
    if (!currentSlug) {
      if (process.client) {
        setTimeout(() => {
          if (runId === loadRunId) {
            loadModuleSettings();
          }
        }, 50);
      }
      return;
    }

    if (activeSlug.value !== currentSlug) {
      activeSlug.value = currentSlug;
      titleText.value = "";
      moduleConfig.value = withConfigFallback(null, currentSlug);
    }

    // Optimistically show current in-memory config while revalidating from API.
    const existing = moduleRecord.value?.config;
    if (existing) {
      moduleConfig.value = withConfigFallback(existing, currentSlug);
      if (!titleText.value) {
        titleText.value = moduleConfig.value?.navbar?.titleText || displayModuleName.value;
      }
    }

    const config = await getModuleConfig(currentSlug, true);
    if (runId !== loadRunId) return;

    await refreshModules(true);
    if (runId !== loadRunId) return;

    moduleConfig.value = withConfigFallback(config, currentSlug);
    titleText.value = moduleConfig.value?.navbar?.titleText || displayModuleName.value;
  } catch (error: any) {
    if (runId !== loadRunId) return;
    loadError.value = error?.data?.error || error?.message || "Failed to load module settings.";
  } finally {
    if (runId !== loadRunId) return;
    if (!slug.value && !loadError.value) {
      loading.value = true;
      return;
    }
    loading.value = false;
  }
};

const saveSettings = async () => {
  if (!slug.value) return;

  saveError.value = "";
  saved.value = false;
  saving.value = true;
  try {
    const config = await updateModuleConfig(slug.value, {
      navbar: {
        titleText: titleText.value
      }
    });
    moduleConfig.value = withConfigFallback(config, slug.value);
    titleText.value = moduleConfig.value?.navbar?.titleText || displayModuleName.value;
    saved.value = true;
  } catch (error: any) {
    saveError.value = error?.data?.error || error?.message || "Failed to save module settings.";
  } finally {
    saving.value = false;
  }
};

watch(() => route.fullPath, loadModuleSettings, { immediate: true });
onActivated(loadModuleSettings);
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="py-8">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold text-slate-800 dark:text-slate-100">Module Settings</h1>
              <p class="mt-2 text-slate-500 dark:text-slate-300">
                Configure how this module appears in navigation.
              </p>
            </div>
            <NuxtLink
              to="/modules"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Back to Modules
            </NuxtLink>
          </div>

          <div v-if="loading" class="mt-6 text-slate-500">Loading module settings...</div>

          <div
            v-else-if="loadError"
            class="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ loadError }}
          </div>

          <div
            v-else-if="moduleRecord && !moduleRecord.installed"
            class="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Install this module before editing settings.
          </div>

          <div
            v-else
            class="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
          >
            <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100">{{ displayModuleName }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-300">Slug: {{ slug }}</p>

            <form class="mt-6" @submit.prevent="saveSettings">
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200" for="titleText">
                Navbar Title Text
              </label>
              <input
                id="titleText"
                v-model="titleText"
                type="text"
                :disabled="saving || !titleEditable"
                class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Enter title text"
              />
              <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                This text appears in the navbar when the module is active.
              </p>

              <div class="mt-6">
                <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Module Navbar Buttons</h3>
                <div v-if="moduleButtons.length === 0" class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  No buttons configured.
                </div>
                <div v-else class="mt-2 grid gap-2">
                  <div
                    v-for="button in moduleButtons"
                    :key="`${button.title}:${button.path}`"
                    class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <span class="font-semibold text-slate-700 dark:text-slate-200">{{ button.title }}</span>
                    <span class="ml-2 text-slate-500 dark:text-slate-400">{{ button.path }}</span>
                    <span v-if="button.requiresAuth" class="ml-2 text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-300">
                      Auth
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="saveError" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {{ saveError }}
              </div>
              <div v-if="saved" class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Settings saved.
              </div>

              <div class="mt-6 flex items-center gap-3">
                <button
                  type="submit"
                  :disabled="saving || !titleEditable"
                  class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {{ saving ? "Saving..." : "Save Settings" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
