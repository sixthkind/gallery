<script setup lang="ts">
definePageMeta({
  middleware: "auth"
});

const { modules, loading, refreshModules, installModule, uninstallModule } = useModules();
const activeSlug = ref<string | null>(null);
const actionError = ref<string>("");

const onInstall = async (slug: string) => {
  activeSlug.value = slug;
  actionError.value = "";
  try {
    await installModule(slug);
  } catch (error: any) {
    actionError.value = error?.data?.error || error?.message || "Failed to install module";
  } finally {
    activeSlug.value = null;
  }
};

const onUninstall = async (slug: string) => {
  activeSlug.value = slug;
  actionError.value = "";
  try {
    await uninstallModule(slug);
  } catch (error: any) {
    actionError.value = error?.data?.error || error?.message || "Failed to uninstall module";
  } finally {
    activeSlug.value = null;
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
            Install and remove optional modules for this app instance.
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
                </div>

                <div class="flex items-center gap-2">
                  <a
                    v-if="module.installed"
                    :href="module.routeBase || '/gallery'"
                    class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Open
                  </a>
                  <button
                    v-if="!module.installed"
                    :disabled="activeSlug === module.slug"
                    class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    @click="onInstall(module.slug)"
                  >
                    {{ activeSlug === module.slug ? "Installing..." : "Install" }}
                  </button>
                  <button
                    v-else
                    :disabled="activeSlug === module.slug"
                    class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    @click="onUninstall(module.slug)"
                  >
                    {{ activeSlug === module.slug ? "Uninstalling..." : "Uninstall" }}
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
