<template>
  <div class="sticky-top translucent safe-area-top pt-2">
    <div class="max-w-screen-xl mx-auto px-5">
      <header class="flex w-full flex-col lg:flex-row justify-between items-center pb-3">
        <div class="flex w-full items-center justify-between">

          <div class="flex items-center gap-3">
            <div class="bg-white bg-opacity-90 hover:bg-opacity-70 flex backdrop-blur mt-3 rounded-lg border p-2 dark:bg-slate-900/70 dark:hover:bg-slate-900/80 dark:border-slate-700/60">
              <a :href="homePath">
                <span class="font-bold text-primary">_</span><span class="font-bold text-slate-500 dark:text-slate-200">{{ activeModuleTitleText }}</span>
              </a>
            </div>

          </div>

          <div class="flex items-center gap-3">
            <!-- Theme toggle -->
            <button
              @click="toggleDarkMode"
              class="bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border h-10 w-10 inline-flex items-center justify-center leading-none hover:bg-opacity-90 transition-colors ring-1 ring-slate-300/40 dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60 dark:ring-slate-600/35"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <Icon
                :name="isDark ? 'heroicons:sun' : 'heroicons:moon'"
                class="w-5 h-5 text-gray-700 dark:text-slate-200"
              />
            </button>

            <!-- Gallery Action Icons (only show on gallery page) -->
            <div v-if="showGalleryActions" class="flex items-center gap-2">
              <!-- Upload Icon -->
              <button
                @click="mediaState?.toggleUpload()"
                class="bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border p-2 hover:bg-opacity-90 transition-colors dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60"
                :title="mediaState?.showUpload.value ? 'Hide upload' : 'Show upload'"
              >
                <Icon 
                  name="heroicons:cloud-arrow-up" 
                  :class="[
                    'w-5 h-5 transition-colors',
                    mediaState?.showUpload.value ? 'text-primary' : 'text-gray-400 dark:text-slate-400'
                  ]"
                />
              </button>
              
              <!-- Selection Mode Toggle Icon -->
              <button
                @click="mediaState?.toggleSelection()"
                class="bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border p-2 hover:bg-opacity-90 transition-colors dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60"
                :title="mediaState?.selectionMode.value ? 'Exit selection mode' : 'Enter selection mode'"
              >
                <Icon 
                  name="heroicons:cursor-arrow-rays" 
                  :class="[
                    'w-5 h-5 transition-colors',
                    mediaState?.selectionMode.value ? 'text-primary' : 'text-gray-400 dark:text-slate-400'
                  ]"
                />
              </button>
              
              <!-- Layout Icon -->
              <!-- <button
                @click="galleryState.cycleLayout()"
                class="bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border p-2 hover:bg-opacity-90 transition-colors"
                :title="`Current layout: ${galleryState.currentLayout.value}. Click to cycle layouts`"
              >
                <Icon 
                  :name="getLayoutIcon(galleryState.currentLayout.value)" 
                  class="w-5 h-5 text-gray-700"
                />
              </button> -->
            </div>
            <a
              v-for="item in activeModuleDesktopButtons"
              :key="item.path"
              :href="item.path"
              class="hidden md:inline-flex items-center gap-2 bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border px-3 py-2 hover:bg-opacity-90 transition-colors dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60"
              :title="item.title"
            >
              <Icon :name="item.icon" class="w-5 h-5 text-gray-700 dark:text-slate-200" />
              <span class="font-bold text-slate-500 dark:text-slate-300">{{ item.title }}</span>
            </a>

            <a
              v-if="isSuperuser"
              href="/modules"
              class="hidden md:inline-flex items-center gap-2 bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border px-3 py-2 hover:bg-opacity-90 transition-colors dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60"
              title="Modules"
            >
              <Icon name="heroicons:cog-6-tooth" class="w-5 h-5 text-gray-700 dark:text-slate-200" />
              <span class="font-bold text-slate-500 dark:text-slate-300">Modules</span>
            </a>

            <div v-if="pb.authStore.isValid" class="hidden md:flex bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border p-2 flex items-center dark:bg-slate-900/60 dark:border-slate-700/60">
              <a href="/profile">
                <span class="font-bold text-primary">{{ emailUsername }}</span>
                <span class="font-bold text-slate-500 dark:text-slate-300">@</span><span class="font-bold text-slate-400 dark:text-slate-400">{{ emailDomain }}</span>
              </a>
            </div>

            <div class="block md:hidden bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border p-2 dark:bg-slate-900/60 dark:border-slate-700/60">
            <button @click="open = !open" class="text-gray-800 dark:text-slate-100 pr-1 pl-0.5">
              <svg
                fill="currentColor"
                class="w-4 h-4"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Menu</title>
                <path
                  v-show="open"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M18.278 16.864a1 1 0 01-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 01-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 011.414-1.414l4.829 4.828 4.828-4.828a1 1 0 111.414 1.414l-4.828 4.829 4.828 4.828z"
                ></path>
                <path
                  v-show="!open"
                  fill-rule="evenodd"
                  d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z"
                ></path>
              </svg>
            </button>
          </div>
          </div>

        </div>

        <nav
            v-if="open"
            class="w-full lg:w-auto mt-3 md:hidden lg:mt-3 bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border dark:bg-slate-900/60 dark:border-slate-700/60"
            :class="{ block: open, hidden: !open }"
          >
          <ul class="flex flex-col lg:flex-row lg:gap-3">
              <li v-for="item of menuitems" :key="item.path" class="text-center">
                <a
                  :href="item.path"
                  class="flex justify-center items-center gap-2 lg:px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                  <Icon v-if="item.icon" :name="item.icon" class="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  {{ item.title }}
                </a>
              </li>
            </ul>
          </nav>
      </header>
    </div>
  </div>
</template>

<script setup>
  import { pb } from "#imports";
  import { useRoute } from "vue-router";

  const route = useRoute();
  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === "dark");
  const toggleDarkMode = () => {
    colorMode.preference = isDark.value ? "light" : "dark";
  };

  const runtimeConfig = useRuntimeConfig();
  const fallbackTitle = computed(() => {
    const first = String(runtimeConfig.public.sitename || "").trim();
    const second = String(runtimeConfig.public.sitename2 || "").trim();
    return `${first}${second}`.trim() || "axiom";
  });

  const email = ref(pb.authStore.record?.email || "");
  const emailUsername = computed(() => email.value.split("@")[0]);
  const emailDomain = computed(() => email.value.split("@")[1]);

  const open = ref(false);
  const { isSuperuser } = usePermissions();
  const { modules, refreshModules, isInstalled } = useModules();

  const galleryInstalled = computed(() => isInstalled("gallery"));
  const galleryModule = computed(() => modules.value.find((module) => module.slug === "gallery"));
  const galleryMain = computed(() => !!galleryModule.value?.isMain);

  const merchInstalled = computed(() => isInstalled("merch"));
  const merchModule = computed(() => modules.value.find((module) => module.slug === "merch"));
  const merchMain = computed(() => !!merchModule.value?.isMain);

  const learnInstalled = computed(() => isInstalled("learn"));
  const learnModule = computed(() => modules.value.find((module) => module.slug === "learn"));
  const learnMain = computed(() => !!learnModule.value?.isMain);

  const isRootGalleryRoute = (path) => {
    return (
      path === "/" ||
      path === "/albums" ||
      path.startsWith("/albums/") ||
      path === "/tags" ||
      path.startsWith("/tags/")
    );
  };

  const isRootMerchRoute = (path) => {
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

  const isRootLearnRoute = (path) => {
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

  const isLearnEditRoute = (path) => {
    return (
      path.startsWith("/edit/courses") ||
      path.startsWith("/edit/sections") ||
      path.startsWith("/edit/lessons") ||
      path.startsWith("/edit/modules") ||
      path.startsWith("/edit/subscription_tiers")
    );
  };

  const extractPath = (value) => {
    const raw = String(value || "");
    return raw.split("?")[0].split("#")[0] || "/";
  };

  const activePath = computed(() => {
    if (process.client) {
      const browserPath = extractPath(
        `${window.location.pathname}${window.location.search}${window.location.hash}`
      );
      if (browserPath) {
        return browserPath;
      }
    }

    return extractPath(route.fullPath || route.path);
  });

  const activeModuleSlug = computed(() => {
    const path = activePath.value;

    if (path === "/") {
      if (learnMain.value && learnInstalled.value) return "learn";
      if (merchMain.value && merchInstalled.value) return "merch";
      if (galleryMain.value && galleryInstalled.value) return "gallery";
      return null;
    }

    if (path === "/learn" || path.startsWith("/learn/")) return "learn";
    if (path === "/gallery" || path.startsWith("/gallery/")) return "gallery";
    if (path === "/merch" || path.startsWith("/merch/")) return "merch";
    if (isRootLearnRoute(path) || isLearnEditRoute(path)) return "learn";
    if (isRootMerchRoute(path) && merchMain.value) return "merch";
    if (isRootGalleryRoute(path)) return "gallery";

    return null;
  });

  const activeModule = computed(() => {
    if (!activeModuleSlug.value) return null;
    return modules.value.find((module) => module.slug === activeModuleSlug.value) || null;
  });

  const normalizePath = (path) => {
    const trimmed = typeof path === "string" ? path.trim() : "";
    if (!trimmed || trimmed === "/") return "/";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  };

  const moduleBasePath = (moduleRecord) => {
    if (!moduleRecord) return "/";
    if (moduleRecord.isMain) return "/";
    const rawBase = typeof moduleRecord.routeBase === "string" ? moduleRecord.routeBase.trim() : "";
    if (rawBase) {
      return rawBase.startsWith("/") ? rawBase : `/${rawBase}`;
    }
    return `/${moduleRecord.slug}`;
  };

  const resolveModulePath = (moduleRecord, buttonPath) => {
    const normalized = normalizePath(buttonPath);
    if (!moduleRecord || moduleRecord.isMain) return normalized;
    const base = moduleBasePath(moduleRecord);
    if (normalized === "/") return base;
    return `${base}${normalized}`;
  };

  const activeModuleTitleText = computed(() => {
    const navbar = activeModule.value?.config?.navbar;
    if (navbar && typeof navbar.titleText === "string" && navbar.titleText.trim()) {
      return navbar.titleText.trim();
    }
    if (activeModule.value?.name) return activeModule.value.name;
    return fallbackTitle.value;
  });

  const activeModuleDesktopButtons = computed(() => {
    const moduleRecord = activeModule.value;
    if (!moduleRecord) return [];

    const buttons = Array.isArray(moduleRecord.config?.navbar?.buttons)
      ? moduleRecord.config.navbar.buttons
      : [];

    return buttons
      .filter((button) => {
        if (!button || typeof button !== "object") return false;
        if (button.requiresAuth === true && !pb.authStore.isValid) return false;
        return typeof button.title === "string" && !!button.title.trim() &&
          typeof button.path === "string" && !!button.path.trim();
      })
      .map((button) => ({
        title: button.title.trim(),
        path: resolveModulePath(moduleRecord, button.path),
        icon: (typeof button.icon === "string" && button.icon.trim()) ? button.icon.trim() : "heroicons:link"
      }));
  });

  const homePath = computed(() => {
    const moduleRecord = activeModule.value;
    if (!moduleRecord) return "/";
    return moduleBasePath(moduleRecord);
  });

  const menuitems = computed(() => {
    const items = [
      {
        title: "Home",
        path: homePath.value,
        icon: "heroicons:home"
      },
      ...activeModuleDesktopButtons.value
    ];

    if (isSuperuser.value) {
      items.push({
        title: "Modules",
        path: "/modules",
        icon: "heroicons:cog-6-tooth"
      });
    }
    if (pb.authStore.isValid) {
      items.push({
        title: "Profile",
        path: "/profile",
        icon: "heroicons:user-circle"
      });
    }

    return items;
  });

  watch(() => pb.authStore.isValid, async () => {
    try {
      await refreshModules(true);
    } catch (error) {
      // Keep navbar usable if module fetch fails.
    }
  }, { immediate: true });

  // Use shared media state composables for gallery-like modules.
  const isGalleryPage = computed(() => {
    const path = activePath.value;
    const isNestedGallery = path === "/gallery" || path.startsWith("/gallery/");
    if (!galleryMain.value) return isNestedGallery;

    return isNestedGallery || isRootGalleryRoute(path);
  });

  const isMerchPage = computed(() => {
    const path = activePath.value;
    const isNestedMerch = path === "/merch" || path.startsWith("/merch/");
    if (!merchMain.value) return isNestedMerch;

    return isNestedMerch || isRootMerchRoute(path);
  });

  const galleryState = useGalleryState();
  const merchState = useMerchState();
  const mediaState = computed(() => {
    if (activeModuleSlug.value === "merch") return merchState;
    if (activeModuleSlug.value === "gallery") return galleryState;
    return null;
  });
  const showGalleryActions = computed(() => {
    if (!isSuperuser.value) return false;
    if (activeModuleSlug.value === "gallery") {
      return isGalleryPage.value && !!galleryState;
    }
    if (activeModuleSlug.value === "merch") {
      return isMerchPage.value && !!merchState;
    }
    return false;
  });
</script>

<style scoped>
  .sticky-top {
    position: sticky;
    top: 0;
    z-index: 1000; /* Optional: Ensures the element stays on top of other content */
  }

  .safe-area-top {
    padding-top: env(safe-area-inset-top);
    margin-top: calc(env(safe-area-inset-top) * -1);
  }
</style>
