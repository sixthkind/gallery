import { computed, useRoute } from "#imports";

const isRootGalleryRoute = (path: string) => {
  return (
    path === "/" ||
    path === "/albums" ||
    path.startsWith("/albums/") ||
    path === "/tags" ||
    path.startsWith("/tags/")
  );
};

export const useGalleryRoutes = () => {
  const route = useRoute();
  const { modules } = useModules();

  const galleryRecord = computed(() => {
    return modules.value.find((module) => module.slug === "gallery");
  });

  const galleryIsMain = computed(() => {
    if (galleryRecord.value?.installed) {
      return !!galleryRecord.value.isMain;
    }

    // Fallback for first render before module state is loaded.
    return isRootGalleryRoute(route.path);
  });

  const toGalleryPath = (path = "/") => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (galleryIsMain.value) {
      return normalizedPath;
    }

    return normalizedPath === "/" ? "/gallery" : `/gallery${normalizedPath}`;
  };

  return {
    galleryIsMain,
    toGalleryPath
  };
};
