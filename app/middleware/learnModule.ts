export default defineNuxtRouteMiddleware(async () => {
  const { refreshModules, isInstalled } = useModules();

  try {
    await refreshModules();
  } catch (error) {
    return navigateTo("/");
  }

  if (!isInstalled("learn")) {
    return navigateTo("/");
  }
});
