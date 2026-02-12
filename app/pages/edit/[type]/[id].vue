<script setup>
definePageMeta({
  middleware: "edit-access"
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <CommonEdit />
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
