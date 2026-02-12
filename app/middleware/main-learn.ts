export default defineNuxtRouteMiddleware(async (to) => {
  const { modules, refreshModules } = useModules();
  await refreshModules();

  const learn = modules.value.find((module) => module.slug === "learn");
  if (!learn?.installed) {
    return navigateTo("/");
  }

  if (learn.isMain) {
    return;
  }

  const target = to.fullPath.startsWith("/learn") ? to.fullPath : `/learn${to.fullPath}`;
  return navigateTo(target);
});
