<template>
  <ion-app mode="ios">
    <CommonNavbar />
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
const colorMode = useColorMode();

// Keep native UI (form controls, scrollbars) in sync.
watchEffect(() => {
  const scheme = colorMode.value === 'dark' ? 'dark' : 'light';

  // Nuxt color-mode *should* manage the class, but in some Ionic contexts
  // we force it to guarantee Tailwind `dark:` + CSS vars apply immediately.
  document.documentElement.classList.toggle('dark', scheme === 'dark');
  document.body.classList.toggle('dark', scheme === 'dark');

  // Native UI (form controls, scrollbars).
  document.documentElement.style.colorScheme = scheme;
});
</script>

<style>
body {
  height: 100%;
  background: var(--app-bg);
  background-attachment: fixed;
}
</style>
