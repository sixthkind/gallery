<script setup lang="ts">
definePageMeta({
  middleware: ["auth", "main-gallery"]
});

const { modules, refreshModules } = useModules();

try {
  await refreshModules(true);
} catch (error) {
  // Fallback to current in-memory module state if refresh fails.
}

const merchMain = computed(() => {
  return modules.value.some((module) => module.slug === "merch" && module.installed && module.isMain);
});
</script>

<template>
  <MerchPagesAlbumDetail v-if="merchMain" />
  <GalleryPagesAlbumDetail v-else />
</template>
