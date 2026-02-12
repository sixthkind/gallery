<script setup lang="ts">
definePageMeta({
  middleware: "auth"
});

const { modules, refreshModules } = useModules();
const loading = ref(true);

const isLearnMain = computed(() => {
  return modules.value.some((module) => module.slug === "learn" && module.installed && module.isMain);
});

const isGalleryMain = computed(() => {
  return modules.value.some((module) => module.slug === "gallery" && module.installed && module.isMain);
});

onMounted(async () => {
  try {
    await refreshModules();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <LearnPagesMain v-if="isLearnMain" />
  <GalleryPagesMain v-else-if="isGalleryMain" />

  <ion-page v-else>
    <ion-content>
      <CommonContainer>
        <div class="py-12">
          <h1 class="text-3xl font-bold text-slate-800 dark:text-slate-100">App Placeholder</h1>
          <p class="mt-3 text-slate-500 dark:text-slate-300">
            Select a main module in management to make it render at the root path.
          </p>

          <div class="mt-6">
            <a
              href="/modules"
              class="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Open Modules
            </a>
          </div>

          <p v-if="loading" class="mt-4 text-sm text-slate-400">Loading module configuration...</p>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
