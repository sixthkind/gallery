<template>
  <div class="sticky-top translucent safe-area-top pt-2">
    <div class="max-w-screen-xl mx-auto px-5">
      <header class="flex w-full flex-col lg:flex-row justify-between items-center pb-3">
        <div class="flex w-full items-center justify-between">

          <div class="flex items-center gap-3">
            <div class="bg-white bg-opacity-90 hover:bg-opacity-70 flex backdrop-blur mt-3 rounded-lg border p-2 dark:bg-slate-900/70 dark:hover:bg-slate-900/80 dark:border-slate-700/60">
              <a href="/">
                <span class="font-bold text-primary">_</span><span class="font-bold text-slate-500 dark:text-slate-200">{{ sitename }}</span><span class="font-bold text-slate-500 opacity-80 dark:text-slate-300">{{ sitename2 }}</span>
              </a>
            </div>

          </div>

          <div class="flex items-center gap-3">
            <!-- Theme toggle -->
            <button
              @click="toggleDarkMode"
              class="bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border px-3 py-2 inline-flex items-center justify-center leading-none hover:bg-opacity-90 transition-colors dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <span class="inline-flex items-center justify-center rounded-md border border-slate-200/70 dark:border-slate-700/70 p-1">
                <Icon
                  :name="isDark ? 'heroicons:sun' : 'heroicons:moon'"
                  class="w-5 h-5 text-gray-700 dark:text-slate-200"
                />
              </span>
            </button>

            <!-- Gallery Action Icons (only show on gallery page) -->
            <div v-if="pb.authStore.isValid && isGalleryPage && galleryState" class="flex items-center gap-2">
              <!-- Upload Icon -->
              <button
                @click="galleryState.toggleUpload()"
                class="bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border p-2 hover:bg-opacity-90 transition-colors dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60"
                :title="galleryState.showUpload.value ? 'Hide upload' : 'Show upload'"
              >
                <Icon 
                  name="heroicons:cloud-arrow-up" 
                  :class="[
                    'w-5 h-5 transition-colors',
                    galleryState.showUpload.value ? 'text-primary' : 'text-gray-400 dark:text-slate-400'
                  ]"
                />
              </button>
              
              <!-- Selection Mode Toggle Icon -->
              <button
                @click="galleryState.toggleSelection()"
                class="bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border p-2 hover:bg-opacity-90 transition-colors dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60"
                :title="galleryState.selectionMode.value ? 'Exit selection mode' : 'Enter selection mode'"
              >
                <Icon 
                  name="heroicons:cursor-arrow-rays" 
                  :class="[
                    'w-5 h-5 transition-colors',
                    galleryState.selectionMode.value ? 'text-primary' : 'text-gray-400 dark:text-slate-400'
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
              href="/albums"
              class="hidden md:inline-flex items-center gap-2 bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border px-3 py-2 hover:bg-opacity-90 transition-colors dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60"
              title="Albums"
            >
              <Icon name="heroicons:rectangle-stack" class="w-5 h-5 text-gray-700 dark:text-slate-200" />
              <span class="font-bold text-slate-500 dark:text-slate-300">Albums</span>
            </a>
            <a
              href="/tags"
              class="hidden md:inline-flex items-center gap-2 bg-white bg-opacity-70 backdrop-blur mt-3 rounded-lg border px-3 py-2 hover:bg-opacity-90 transition-colors dark:bg-slate-900/60 dark:hover:bg-slate-900/80 dark:border-slate-700/60"
              title="Tags"
            >
              <Icon name="heroicons:tag" class="w-5 h-5 text-gray-700 dark:text-slate-200" />
              <span class="font-bold text-slate-500 dark:text-slate-300">Tags</span>
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
              <li v-for="item of menuitems" :key="item.link" class="text-center">
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
  import { useRoute } from 'vue-router';
  
  const route = useRoute();
  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');
  const toggleDarkMode = () => {
    colorMode.preference = isDark.value ? 'light' : 'dark';
  };
  const config = useRuntimeConfig();
  const sitename = ref(String(config.public.sitename));
  const sitename2 = ref(String(config.public.sitename2));
  if (sitename.value == '') {
    sitename.value = 'ax';
    sitename2.value = 'iom';
  }

  const email = ref(pb.authStore.record?.email || '');

  const emailUsername = computed(() => email.value.split('@')[0]);
  const emailDomain = computed(() => email.value.split('@')[1]);

  const open = ref(false);

  const menuitems = computed(() => {
    const items = [
      {
        title: "Home",
        path: "/",
        icon: "heroicons:home",
      },
      {
        title: "Albums",
        path: "/albums",
        icon: "heroicons:rectangle-stack",
      },
      {
        title: "Tags",
        path: "/tags",
        icon: "heroicons:tag",
      }
    ];

    if (pb.authStore.isValid) {
      items.push({
        title: "Profile",
        path: "/profile",
        icon: "heroicons:user-circle",
      });
    }

    return items;
  });

  // Use shared gallery state composable (only on gallery page)
  const isGalleryPage = computed(() => route.path === '/' || route.path === '/albums' || route.path.startsWith('/albums/'));
  const galleryState = useGalleryState();

  // Get layout icon based on current layout
  const getLayoutIcon = (layout) => {
    const layoutIcons = {
      'masonry': 'heroicons:squares-2x2',
      'grid': 'heroicons:squares-plus',
      'tile': 'heroicons:rectangle-stack'
    };
    return layoutIcons[layout] || 'heroicons:squares-plus';
  };
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
