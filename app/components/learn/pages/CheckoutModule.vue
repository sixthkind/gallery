<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const moduleId = computed(() => String(route.params.id));
</script>

<template>
  <ion-page>
    <ion-content>
      <PaymentModuleCheckout :module-id="moduleId" />
    </ion-content>
  </ion-page>
</template>

