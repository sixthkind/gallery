export default defineNuxtRouteMiddleware(async () => {
  const { refreshModules, isInstalled } = useModules();

  try {
    await refreshModules(true);
  } catch (error) {
    return navigateTo("/");
  }

  if (!isInstalled("merch")) {
    return navigateTo("/");
  }
});
