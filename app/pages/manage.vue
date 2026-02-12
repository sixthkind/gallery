<script setup lang="ts">
definePageMeta({
  middleware: "auth"
});

const {
  modules,
  loading,
  refreshModules,
  installModule,
  uninstallModule,
  setMainModule,
  unsetMainModule
} = useModules();
const activeSlug = ref<string | null>(null);
const activeAction = ref<"install" | "uninstall" | "set-main" | "unset-main" | null>(null);
const actionError = ref<string>("");

const onInstall = async (slug: string) => {
  activeSlug.value = slug;
  activeAction.value = "install";
  actionError.value = "";
  try {
    await installModule(slug);
  } catch (error: any) {
    actionError.value = error?.data?.error || error?.message || "Failed to install module";
  } finally {
    activeSlug.value = null;
    activeAction.value = null;
  }
};

const onUninstall = async (slug: string) => {
  activeSlug.value = slug;
  activeAction.value = "uninstall";
  actionError.value = "";
  try {
    await uninstallModule(slug);
  } catch (error: any) {
    actionError.value = error?.data?.error || error?.message || "Failed to uninstall module";
  } finally {
    activeSlug.value = null;
    activeAction.value = null;
  }
};

const onSetMain = async (slug: string) => {
  activeSlug.value = slug;
  activeAction.value = "set-main";
  actionError.value = "";
  try {
    await setMainModule(slug);
  } catch (error: any) {
    actionError.value = error?.data?.error || error?.message || "Failed to set main module";
  } finally {
    activeSlug.value = null;
    activeAction.value = null;
  }
};

const onUnsetMain = async (slug: string) => {
  activeSlug.value = slug;
  activeAction.value = "unset-main";
  actionError.value = "";
  try {
    await unsetMainModule(slug);
  } catch (error: any) {
    actionError.value = error?.data?.error || error?.message || "Failed to clear main module";
  } finally {
    activeSlug.value = null;
    activeAction.value = null;
  }
};

onMounted(async () => {
  await refreshModules();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="py-8">
          <h1 class="text-3xl font-bold text-slate-800 dark:text-slate-100">Core Management</h1>
          <p class="text-slate-500 dark:text-slate-300 mt-2">
            Install modules, manage installed modules, and choose which installed module owns `/`.
          </p>

          <div v-if="actionError" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ actionError }}
          </div>

          <div v-if="loading" class="mt-6 text-slate-500">Loading modules...</div>

          <div v-else-if="modules.length === 0" class="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            No modules registered.
          </div>

          <div v-else class="mt-6 grid gap-4">
            <div
              v-for="module in modules"
              :key="module.id"
              class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100">{{ module.name }}</h2>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-300">{{ module.description || 'No description' }}</p>
                  <p class="mt-2 text-xs font-semibold uppercase tracking-wide" :class="module.installed ? 'text-emerald-600' : 'text-amber-600'">
                    {{ module.installed ? "Installed" : "Not installed" }}
                  </p>
                  <p
                    v-if="module.installed && module.isMain"
                    class="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-600"
                  >
                    Main Module (Root Path)
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <a
                    v-if="module.installed"
                    :href="module.isMain ? '/' : (module.routeBase || '/gallery')"
                    class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Open
                  </a>
                  <button
                    v-if="module.installed && !module.isMain"
                    :disabled="activeSlug === module.slug"
                    class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    @click="onSetMain(module.slug)"
                  >
                    {{ activeSlug === module.slug && activeAction === 'set-main' ? "Setting..." : "Set as Main" }}
                  </button>
                  <button
                    v-if="module.installed && module.isMain"
                    :disabled="activeSlug === module.slug"
                    class="rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                    @click="onUnsetMain(module.slug)"
                  >
                    {{ activeSlug === module.slug && activeAction === 'unset-main' ? "Clearing..." : "Unset Main" }}
                  </button>
                  <button
                    v-if="!module.installed"
                    :disabled="activeSlug === module.slug"
                    class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    @click="onInstall(module.slug)"
                  >
                    {{ activeSlug === module.slug && activeAction === 'install' ? "Installing..." : "Install" }}
                  </button>
                  <button
                    v-else
                    :disabled="activeSlug === module.slug"
                    class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    @click="onUninstall(module.slug)"
                  >
                    {{ activeSlug === module.slug && activeAction === 'uninstall' ? "Uninstalling..." : "Uninstall" }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
