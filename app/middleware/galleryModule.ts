import { pb } from "#imports";

export default defineNuxtRouteMiddleware(async () => {
  // auth middleware should run first, but keep this defensive.
  if (!pb.authStore.isValid) {
    return navigateTo("/auth");
  }

  const { refreshModules, isInstalled } = useModules();

  try {
    await refreshModules();
  } catch (error) {
    return navigateTo("/");
  }

  if (!isInstalled("gallery")) {
    return navigateTo("/");
  }
});
