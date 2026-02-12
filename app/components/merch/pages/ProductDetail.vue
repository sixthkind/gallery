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
const activePhotoIndex = ref(0);
const productTags = ref<any[]>([]);
const productTagInput = ref("");
const selectedPhoto = ref<any | null>(null);
const isSuperuser = computed(() => authUtils.isSuperuser());
const allPhotosForLightbox = computed(() => photos.value);
const activePhoto = computed(() => photos.value[activePhotoIndex.value] || null);

const getPhotoDateValue = (photo: any) => {
  const value = photo?.dateTaken || photo?.created || 0;
  return new Date(value).getTime();
};

const sortPhotosLikeMerchGroup = (items: any[]) => {
  return [...items].sort((a, b) => {
    const aOrder = typeof a?.sortOrder === "number" ? a.sortOrder : null;
    const bOrder = typeof b?.sortOrder === "number" ? b.sortOrder : null;
    if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return getPhotoDateValue(b) - getPhotoDateValue(a);
  });
};
const isProductDetailPath = () => {
  const path = String(route.path || "");
  return path.startsWith("/products/") || path.startsWith("/merch/products/");
};

const fetchProduct = async () => {
  loading.value = true;
  product.value = null;
  photos.value = [];
  activePhotoIndex.value = 0;
  productTags.value = [];
  productTagInput.value = "";
  selectedPhoto.value = null;

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
      expand: "coverPhoto,photos,album,tags"
    });
    product.value = record;

    const productPhotos = Array.isArray(record.expand?.photos)
      ? sortPhotosLikeMerchGroup(record.expand.photos)
      : [];
    photos.value = productPhotos;
    activePhotoIndex.value = 0;
    productTags.value = Array.isArray(record.expand?.tags) ? record.expand.tags : [];
  } catch (error) {
    if (isProductDetailPath()) {
      await navigateTo(toMerchPath("/products"));
    }
  } finally {
    loading.value = false;
  }
};

const getLargePhotoUrl = (photo: any) => {
  return pb.files.getURL(photo, photo.photo, { thumb: "1600x0" });
};

const getThumbnailPhotoUrl = (photo: any) => {
  return pb.files.getURL(photo, photo.photo, { thumb: "0x500" });
};

const photoTileStyle = (photo: any) => {
  const width = Number(photo?.width || 0);
  const height = Number(photo?.height || 0);
  if (width > 0 && height > 0) {
    return { aspectRatio: `${width} / ${height}` };
  }
  return { aspectRatio: "1 / 1" };
};

const selectPhoto = (index: number) => {
  if (index < 0 || index >= photos.value.length) return;
  activePhotoIndex.value = index;
};

const showPreviousPhoto = () => {
  if (photos.value.length < 2) return;
  activePhotoIndex.value = (activePhotoIndex.value - 1 + photos.value.length) % photos.value.length;
};

const showNextPhoto = () => {
  if (photos.value.length < 2) return;
  activePhotoIndex.value = (activePhotoIndex.value + 1) % photos.value.length;
};

const openActivePhotoLightbox = () => {
  if (!activePhoto.value) return;
  selectedPhoto.value = activePhoto.value;
};

const openProductTag = async (tag: any) => {
  if (!tag?.name) return;
  await navigateTo(toMerchPath(`/tags/${encodeURIComponent(tag.name)}`));
};

const syncProductTags = (updatedTags: any[]) => {
  const tagIds = updatedTags.map((tag) => tag.id);
  productTags.value = updatedTags;
  if (!product.value) return;
  product.value = {
    ...product.value,
    tags: tagIds,
    expand: {
      ...product.value.expand,
      tags: updatedTags
    }
  };
};

const addProductTag = async () => {
  if (!isSuperuser.value || !product.value?.id) return;
  const name = productTagInput.value.trim().toLowerCase();
  if (!name) return;

  try {
    let tagRecord;
    const safeName = name.replace(/"/g, '\\"');
    try {
      tagRecord = await pb.collection(MERCH_COLLECTIONS.tags).getFirstListItem(`name = "${safeName}"`);
    } catch {
      const tagData: Record<string, any> = { name };
      if (pb.authStore.record?.collectionName === "users") {
        tagData.user = pb.authStore.record.id;
      }
      tagRecord = await pb.collection(MERCH_COLLECTIONS.tags).create(tagData);
    }

    if (!productTags.value.some((tag) => tag.id === tagRecord.id)) {
      const updatedTags = [...productTags.value, tagRecord];
      await pb.collection(MERCH_COLLECTIONS.products).update(product.value.id, {
        tags: updatedTags.map((tag) => tag.id)
      });
      syncProductTags(updatedTags);
    }
    productTagInput.value = "";
  } catch (error) {
    console.error("Error adding product tag:", error);
  }
};

const removeProductTag = async (tag: any) => {
  if (!isSuperuser.value || !product.value?.id || !tag?.id) return;
  try {
    const updatedTags = productTags.value.filter((existingTag) => existingTag.id !== tag.id);
    await pb.collection(MERCH_COLLECTIONS.products).update(product.value.id, {
      tags: updatedTags.map((existingTag) => existingTag.id)
    });
    syncProductTags(updatedTags);
  } catch (error) {
    console.error("Error removing product tag:", error);
  }
};

const closeLightbox = () => {
  selectedPhoto.value = null;
};

const navigateLightbox = (direction: "next" | "prev") => {
  if (!selectedPhoto.value || allPhotosForLightbox.value.length < 2) return;
  const currentIndex = allPhotosForLightbox.value.findIndex(
    (photo) => photo.id === selectedPhoto.value?.id
  );
  if (currentIndex < 0) return;

  const nextIndex =
    direction === "next"
      ? (currentIndex + 1) % allPhotosForLightbox.value.length
      : (currentIndex - 1 + allPhotosForLightbox.value.length) % allPhotosForLightbox.value.length;

  activePhotoIndex.value = nextIndex;
  selectedPhoto.value = allPhotosForLightbox.value[nextIndex];
};

const handleTagsUpdated = ({ photoId, tags }: { photoId: string; tags: any[] }) => {
  const tagIds = tags.map((tag) => tag.id);
  const updatedPhotos = photos.value.map((photo) => {
    if (photo.id !== photoId) return photo;
    return {
      ...photo,
      tags: tagIds,
      expand: {
        ...photo.expand,
        tags
      }
    };
  });
  photos.value = sortPhotosLikeMerchGroup(updatedPhotos);

  if (selectedPhoto.value?.id === photoId) {
    selectedPhoto.value = {
      ...selectedPhoto.value,
      tags: tagIds,
      expand: {
        ...selectedPhoto.value.expand,
        tags
      }
    };
  }
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

          <div class="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
            <div>
              <h1 class="text-3xl font-bold text-slate-800 dark:text-slate-100">{{ product.name || "Untitled Product" }}</h1>
              <p class="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
                ${{ typeof product.price === "number" ? product.price.toFixed(2) : "0.00" }} {{ (product.currency || "USD").toUpperCase() }}
              </p>
              <p class="mt-2 text-sm" :class="product.active ? 'text-emerald-600' : 'text-slate-500'">
                {{ product.active ? "Active" : "Inactive" }}
              </p>

              <div class="mt-5">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Tags</h2>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <div
                    v-for="tag in productTags"
                    :key="tag.id"
                    class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <button
                      type="button"
                      class="hover:text-slate-900 dark:hover:text-white"
                      @click="openProductTag(tag)"
                    >
                      #{{ tag.name }}
                    </button>
                    <button
                      v-if="isSuperuser"
                      type="button"
                      class="text-slate-400 hover:text-red-500"
                      aria-label="Remove tag"
                      @click="removeProductTag(tag)"
                    >
                      <Icon name="heroicons:x-mark" class="text-sm" />
                    </button>
                  </div>
                  <span v-if="!productTags.length" class="text-sm text-slate-500">No tags</span>
                </div>

                <div v-if="isSuperuser" class="mt-3 flex items-center gap-2">
                  <input
                    v-model="productTagInput"
                    type="text"
                    maxlength="50"
                    placeholder="Add tag"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    @keydown.enter.prevent="addProductTag"
                  />
                  <button
                    type="button"
                    class="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                    @click="addProductTag"
                  >
                    Add
                  </button>
                </div>
              </div>

              <p v-if="product.shortDescription" class="mt-4 text-slate-700 dark:text-slate-300">
                {{ product.shortDescription }}
              </p>

              <div v-if="product.details" class="prose prose-slate mt-4 max-w-none dark:prose-invert" v-html="product.details"></div>
            </div>

            <div class="mt-8 lg:mt-0">
              <div v-if="photos.length === 0" class="mt-3 text-slate-500">No photos assigned to this product.</div>
              <div v-else class="mt-3">
                <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900/40">
                  <button
                    type="button"
                    class="block h-[28rem] w-full p-3 sm:h-[32rem]"
                    @click="openActivePhotoLightbox"
                  >
                    <img
                      v-if="activePhoto"
                      :src="getLargePhotoUrl(activePhoto)"
                      :alt="activePhoto.title || 'Photo'"
                      class="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </button>

                  <button
                    v-if="photos.length > 1"
                    type="button"
                    class="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/75"
                    aria-label="Previous image"
                    @click.stop="showPreviousPhoto"
                  >
                    <Icon name="heroicons:chevron-left" class="text-2xl leading-none" />
                  </button>

                  <button
                    v-if="photos.length > 1"
                    type="button"
                    class="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/75"
                    aria-label="Next image"
                    @click.stop="showNextPhoto"
                  >
                    <Icon name="heroicons:chevron-right" class="text-2xl leading-none" />
                  </button>
                </div>

                <div class="mt-3 flex flex-wrap items-start gap-2">
                  <button
                    v-for="(photo, index) in photos"
                    :key="photo.id"
                    type="button"
                    :style="photoTileStyle(photo)"
                    :class="[
                      'h-20 overflow-hidden rounded-md border-2 bg-slate-100 transition-shadow dark:bg-slate-900/40',
                      index === activePhotoIndex
                        ? 'border-white shadow-[0_0_0_1px_rgba(100,116,139,0.8)]'
                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-500'
                    ]"
                    :aria-label="`View image ${index + 1}`"
                    @click="selectPhoto(index)"
                  >
                    <img
                      :src="getThumbnailPhotoUrl(photo)"
                      :alt="photo.title || 'Photo'"
                      class="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CommonContainer>

      <MerchPhotoLightbox
        v-if="selectedPhoto"
        :photo="selectedPhoto"
        :photos="allPhotosForLightbox"
        @close="closeLightbox"
        @navigate="navigateLightbox"
        @tags-updated="handleTagsUpdated"
      />
    </ion-content>
  </ion-page>
</template>
