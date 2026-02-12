<script setup>
definePageMeta({
  middleware: ["auth", "main-gallery"]
});
</script>

<template>
  <GalleryPagesAlbumDetail />
</template>
