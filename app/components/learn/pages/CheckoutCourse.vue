<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const courseId = computed(() => String(route.params.id));
</script>

<template>
  <ion-page>
    <ion-content>
      <PaymentCourseCheckout :course-id="courseId" />
    </ion-content>
  </ion-page>
</template>

