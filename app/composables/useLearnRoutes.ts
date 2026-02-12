import { computed, useRoute } from "#imports";

const isRootLearnRoute = (path: string) => {
  return (
    path === "/" ||
    path === "/courses" ||
    path.startsWith("/courses/") ||
    path === "/enrollments" ||
    path === "/subscribe" ||
    path.startsWith("/subscribe/") ||
    path.startsWith("/checkout/") ||
    path.startsWith("/admin/")
  );
};

export const useLearnRoutes = () => {
  const route = useRoute();
  const { modules } = useModules();

  const learnRecord = computed(() => {
    return modules.value.find((module) => module.slug === "learn");
  });

  const learnIsMain = computed(() => {
    if (learnRecord.value?.installed) {
      return !!learnRecord.value.isMain;
    }

    return isRootLearnRoute(route.path);
  });

  const toLearnPath = (path = "/") => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (learnIsMain.value) {
      return normalizedPath;
    }

    return normalizedPath === "/" ? "/learn" : `/learn${normalizedPath}`;
  };

  return {
    learnIsMain,
    toLearnPath
  };
};
