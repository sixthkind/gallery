<script setup lang="ts">
definePageMeta({ middleware: ["auth", "subscriptions", "main-learn"] });
</script>

<template>
  <LearnPagesSubscribe />
</template>
