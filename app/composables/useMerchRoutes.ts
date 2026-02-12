import { computed, useRoute } from "#imports";

const isRootMerchRoute = (path: string) => {
  return (
    path === "/" ||
    path === "/albums" ||
    path.startsWith("/albums/") ||
    path === "/tags" ||
    path.startsWith("/tags/") ||
    path === "/products" ||
    path.startsWith("/products/")
  );
};

export const useMerchRoutes = () => {
  const route = useRoute();
  const { modules } = useModules();

  const merchRecord = computed(() => {
    return modules.value.find((module) => module.slug === "merch");
  });

  const merchIsMain = computed(() => {
    if (merchRecord.value?.installed) {
      return !!merchRecord.value.isMain;
    }

    return isRootMerchRoute(route.path);
  });

  const toMerchPath = (path = "/") => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (merchIsMain.value) {
      return normalizedPath;
    }

    return normalizedPath === "/" ? "/merch" : `/merch${normalizedPath}`;
  };

  return {
    merchIsMain,
    toMerchPath
  };
};
