<script setup>
definePageMeta({
  middleware: ["auth", "gallery-module"]
});
</script>

<template>
  <GalleryPagesTagDetail />
</template>
