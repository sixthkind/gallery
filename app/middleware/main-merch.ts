import { pb } from "#imports";

export default defineNuxtRouteMiddleware(async () => {
  if (!pb.authStore.isValid) {
    return navigateTo("/auth");
  }

  const { modules, refreshModules } = useModules();
  await refreshModules(true);

  const merch = modules.value.find((module) => module.slug === "merch");
  if (!merch?.installed || !merch?.isMain) {
    return navigateTo("/");
  }
});
