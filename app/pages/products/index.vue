<script setup>
definePageMeta({
  middleware: ["auth", "main-merch"]
});
</script>

<template>
  <MerchPagesProducts />
</template>
