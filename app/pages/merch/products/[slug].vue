<script setup>
definePageMeta({
  middleware: ["auth", "merch-module"]
});
</script>

<template>
  <MerchPagesProductDetail />
</template>
