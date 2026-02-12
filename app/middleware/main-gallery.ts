import { pb } from "#imports";

export default defineNuxtRouteMiddleware(async () => {
  if (!pb.authStore.isValid) {
    return navigateTo("/auth");
  }

  const { modules, refreshModules } = useModules();
  await refreshModules();

  const gallery = modules.value.find((module) => module.slug === "gallery");
  if (!gallery?.installed || !gallery?.isMain) {
    return navigateTo("/");
  }
});
