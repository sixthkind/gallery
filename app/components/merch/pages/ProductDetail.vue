<script setup lang="ts">
import { pb } from "#imports";
import { MERCH_COLLECTIONS } from "~/utils/collections";
import { authUtils } from "~/utils/auth";
import { useRoute } from "vue-router";

const route = useRoute();
const { toMerchPath } = useMerchRoutes();

const slug = computed(() => String(route.params.slug || "").trim());
const loading = ref(true);
const product = ref<any | null>(null);
const photos = ref<any[]>([]);
const isSuperuser = computed(() => authUtils.isSuperuser());
const isProductDetailPath = () => {
  const path = String(route.path || "");
  return path.startsWith("/products/") || path.startsWith("/merch/products/");
};

const fetchProduct = async () => {
  loading.value = true;
  product.value = null;
  photos.value = [];

  if (!slug.value) {
    if (!isProductDetailPath()) {
      loading.value = false;
      return;
    }
    await navigateTo(toMerchPath("/products"));
    return;
  }

  try {
    const safeSlug = slug.value.replace(/"/g, '\\"');
    const record = await pb.collection(MERCH_COLLECTIONS.products).getFirstListItem(`slug = "${safeSlug}"`, {
      expand: "coverPhoto,photos,album"
    });
    product.value = record;

    const productPhotos = Array.isArray(record.expand?.photos) ? record.expand.photos : [];
    photos.value = productPhotos;
  } catch (error) {
    if (isProductDetailPath()) {
      await navigateTo(toMerchPath("/products"));
    }
  } finally {
    loading.value = false;
  }
};

const getPhotoUrl = (photo: any) => {
  return pb.files.getURL(photo, photo.photo, { thumb: "500x500" });
};

onMounted(fetchProduct);
watch(slug, (nextSlug, previousSlug) => {
  if (!nextSlug || nextSlug === previousSlug) return;
  fetchProduct();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div v-if="loading" class="py-10 text-slate-500">Loading product...</div>

        <div v-else-if="product" class="py-6">
          <div class="mb-6 flex items-center justify-between gap-3">
            <NuxtLink
              :to="toMerchPath('/')"
              class="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
            >
              <Icon name="heroicons:arrow-left" class="mr-1" />
              Back to Home
            </NuxtLink>

            <NuxtLink
              v-if="isSuperuser && product.id"
              :to="`/edit/products/${product.id}`"
              class="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Icon name="heroicons:pencil-square" class="mr-1" />
              Edit Product
            </NuxtLink>
          </div>

          <h1 class="text-3xl font-bold text-slate-800 dark:text-slate-100">{{ product.name || "Untitled Product" }}</h1>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-300">Slug: {{ product.slug }}</p>
          <p class="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
            ${{ typeof product.price === "number" ? product.price.toFixed(2) : "0.00" }} {{ (product.currency || "USD").toUpperCase() }}
          </p>
          <p class="mt-2 text-sm" :class="product.active ? 'text-emerald-600' : 'text-slate-500'">
            {{ product.active ? "Active" : "Inactive" }}
          </p>

          <p v-if="product.shortDescription" class="mt-4 text-slate-700 dark:text-slate-300">
            {{ product.shortDescription }}
          </p>

          <div v-if="product.details" class="prose prose-slate mt-4 max-w-none dark:prose-invert" v-html="product.details"></div>

          <div class="mt-8">
            <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100">Photos</h2>
            <div v-if="photos.length === 0" class="mt-3 text-slate-500">No photos assigned to this product.</div>
            <div v-else class="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              <div
                v-for="photo in photos"
                :key="photo.id"
                class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
              >
                <img :src="getPhotoUrl(photo)" :alt="photo.title || 'Photo'" class="h-40 w-full object-contain bg-slate-100 dark:bg-slate-900/40" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
