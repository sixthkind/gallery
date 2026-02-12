<script setup>
definePageMeta({
  middleware: ["auth", "gallery-module"]
});
</script>

<template>
  <GalleryPagesMain />
</template>
