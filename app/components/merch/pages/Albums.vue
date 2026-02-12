<script setup>
import { pb } from '#imports';
import { MERCH_COLLECTIONS } from '~/utils/collections';
import { authUtils } from '~/utils/auth';
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const albums = ref([]);
const albumPhotos = ref(new Map());
const loading = ref(true);
const showCreate = ref(false);
const form = ref({
  title: '',
  description: ''
});
const error = ref(null);

const isSuperuser = computed(() => authUtils.isSuperuser());
const { selectionMode } = useMerchState();
const { toMerchPath } = useMerchRoutes();

const getAlbumDateValue = (album) => {
  const value = album?.created || 0;
  return new Date(value).getTime();
};

const ensureAlbumSortOrder = async (items) => {
  if (!isSuperuser.value) return;
  const missing = items.filter(item => typeof item.sortOrder !== 'number');
  if (missing.length === 0) return;

  const withOrder = items.filter(item => typeof item.sortOrder === 'number');
  const step = 1000;
  const missingSorted = [...missing].sort((a, b) => getAlbumDateValue(b) - getAlbumDateValue(a));

  let updates = [];
  if (withOrder.length === 0) {
    updates = missingSorted.map((item, index) => ({
      item,
      sortOrder: index * step
    }));
  } else {
    const minOrder = Math.min(...withOrder.map(item => item.sortOrder));
    const missingCount = missingSorted.length;
    updates = missingSorted.map((item, index) => ({
      item,
      sortOrder: minOrder - step * (missingCount - index)
    }));
  }

  await Promise.all(updates.map(async ({ item, sortOrder }) => {
    try {
      await pb.collection(MERCH_COLLECTIONS.albums).update(item.id, { sortOrder });
      item.sortOrder = sortOrder;
    } catch (error) {
      console.error('Error updating album sort order:', error);
    }
  }));
};

const normalizeAlbumSortOrder = async (items) => {
  if (!isSuperuser.value) return;
  if (!items || items.length === 0) return;
  const numericOrders = items
    .map(item => item.sortOrder)
    .filter(order => typeof order === 'number');
  const uniqueOrders = new Set(numericOrders);
  if (numericOrders.length === items.length && uniqueOrders.size === items.length) return;

  const step = 1000;
  const sortedItems = [...items].sort((a, b) => getAlbumDateValue(b) - getAlbumDateValue(a));
  await Promise.all(sortedItems.map(async (item, index) => {
    const sortOrder = index * step;
    try {
      await pb.collection(MERCH_COLLECTIONS.albums).update(item.id, { sortOrder });
      item.sortOrder = sortOrder;
    } catch (error) {
      console.error('Error normalizing album sort order:', error);
    }
  }));
};

const orderedAlbums = computed(() => {
  const items = [...albums.value];
  items.sort((a, b) => {
    const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
    const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
    if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return getAlbumDateValue(b) - getAlbumDateValue(a);
  });
  return items;
});

const fetchAlbums = async () => {
  loading.value = true;
  try {
    albums.value = await pb.collection(MERCH_COLLECTIONS.albums).getFullList({
      sort: '-created',
      expand: 'coverPhoto'
    });
    await ensureAlbumSortOrder(albums.value);
    await normalizeAlbumSortOrder(albums.value);
    const albumIds = albums.value.map(album => album.id);
    if (albumIds.length > 0) {
      const photos = await pb.collection(MERCH_COLLECTIONS.photos).getFullList({
        sort: '-dateTaken,-created',
        filter: `album != ""`
      });
      const byAlbum = new Map();
      photos.forEach(photo => {
        if (!photo.album || !albumIds.includes(photo.album)) return;
        if (!byAlbum.has(photo.album)) byAlbum.set(photo.album, []);
        byAlbum.get(photo.album).push(photo);
      });
      albumIds.forEach(albumId => {
        const list = byAlbum.get(albumId) || [];
        list.sort((a, b) => {
          const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
          const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
          if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
          if (aOrder !== null) return -1;
          if (bOrder !== null) return 1;
          const aDate = a.dateTaken || a.created || 0;
          const bDate = b.dateTaken || b.created || 0;
          return new Date(bDate) - new Date(aDate);
        });
        const seenGroups = new Set();
        const unique = [];
        for (const photo of list) {
          if (photo.product) {
            if (seenGroups.has(photo.product)) continue;
            seenGroups.add(photo.product);
          }
          unique.push(photo);
          if (unique.length >= 4) break;
        }
        albumPhotos.value.set(albumId, unique);
      });
    } else {
      albumPhotos.value = new Map();
    }
  } catch (err) {
    console.error('Error fetching albums:', err);
  } finally {
    loading.value = false;
  }
};

const getAlbumCoverUrl = (album) => {
  if (!album?.expand?.coverPhoto) return '';
  return pb.files.getURL(album.expand.coverPhoto, album.expand.coverPhoto.photo, { thumb: '500x500' });
};

const getAlbumTilePhotos = (albumId) => {
  return albumPhotos.value.get(albumId) || [];
};

const getPhotoUrl = (photo) => {
  return pb.files.getURL(photo, photo.photo, { thumb: '250x250' });
};

const openAlbum = (album) => {
  router.push(toMerchPath(`/albums/${album.id}`));
};

const setAlbumSortOrder = (albumId, sortOrder) => {
  const index = albums.value.findIndex(album => album.id === albumId);
  if (index === -1) return;
  albums.value[index] = { ...albums.value[index], sortOrder };
};

const reorderAlbums = async ({ sourceId, targetId }) => {
  if (!isSuperuser.value) return;
  if (!selectionMode.value) return;
  if (!sourceId || !targetId || sourceId === targetId) return;

  const ids = orderedAlbums.value.map(item => item.id);
  const fromIndex = ids.indexOf(sourceId);
  const toIndex = ids.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1) return;

  ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, sourceId);

  const prevId = ids[toIndex - 1];
  const nextId = ids[toIndex + 1];
  const prevItem = prevId ? orderedAlbums.value.find(item => item.id === prevId) : null;
  const nextItem = nextId ? orderedAlbums.value.find(item => item.id === nextId) : null;
  const prevOrder = typeof prevItem?.sortOrder === 'number' ? prevItem.sortOrder : null;
  const nextOrder = typeof nextItem?.sortOrder === 'number' ? nextItem.sortOrder : null;

  // Check if sortOrders are too close or identical (need renormalization)
  const needsRenormalization = 
    (prevOrder !== null && nextOrder !== null && Math.abs(nextOrder - prevOrder) < 0.1) ||
    (prevOrder === null && nextOrder !== null && nextOrder === 0) ||
    (prevOrder !== null && nextOrder === null && prevOrder === 0);

  if (needsRenormalization) {
    // Renormalize all albums with proper spacing
    const step = 1000;
    const renormalizeUpdates = [];
    
    for (let i = 0; i < ids.length; i++) {
      const albumId = ids[i];
      const newSortOrder = i * step;
      renormalizeUpdates.push({ albumId, sortOrder: newSortOrder });
    }
    
    // Apply renormalization to database and local state
    await Promise.all(renormalizeUpdates.map(async ({ albumId, sortOrder }) => {
      try {
        await pb.collection(MERCH_COLLECTIONS.albums).update(albumId, { sortOrder });
        setAlbumSortOrder(albumId, sortOrder);
      } catch (error) {
        console.error('Error renormalizing album sort order:', error);
      }
    }));
    
    return; // Renormalization done, the UI will update
  }

  let newOrder = 0;
  if (prevOrder === null && nextOrder === null) {
    newOrder = 0;
  } else if (prevOrder === null) {
    newOrder = nextOrder - 1000;
  } else if (nextOrder === null) {
    newOrder = prevOrder + 1000;
  } else {
    newOrder = prevOrder + (nextOrder - prevOrder) / 2;
  }

  setAlbumSortOrder(sourceId, newOrder);
  try {
    await pb.collection(MERCH_COLLECTIONS.albums).update(sourceId, { sortOrder: newOrder });
  } catch (error) {
    console.error('Error updating album sort order:', error);
  }
};

const toggleCreate = () => {
  if (!isSuperuser.value) return;
  showCreate.value = !showCreate.value;
  error.value = null;
};

const createAlbum = async () => {
  if (!isSuperuser.value) return;
  if (!form.value.title.trim()) {
    error.value = 'Title is required.';
    return;
  }
  try {
    const albumData = {
      title: form.value.title.trim(),
      description: form.value.description.trim()
    };
    if (pb.authStore.record?.id && pb.authStore.record?.collectionName === 'users') {
      albumData.user = pb.authStore.record.id;
    }
    await pb.collection(MERCH_COLLECTIONS.albums).create(albumData);
    form.value.title = '';
    form.value.description = '';
    showCreate.value = false;
    await fetchAlbums();
  } catch (err) {
    console.error('Error creating album:', err);
    error.value = 'Failed to create album. Please try again.';
  }
};

onMounted(() => {
  fetchAlbums();
});

onActivated(() => {
  fetchAlbums();
});

watch(() => route.fullPath, () => {
  fetchAlbums();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="flex items-center justify-between mt-4 mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Albums</h1>
          <button
            v-if="isSuperuser"
            @click="toggleCreate"
            class="bg-white bg-opacity-70 backdrop-blur rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-opacity-90 transition-colors"
          >
            Add Album
          </button>
        </div>

        <div v-if="showCreate" class="bg-white rounded-lg border p-4 mb-6">
          <div class="grid gap-3">
            <input
              v-model="form.title"
              type="text"
              maxlength="200"
              placeholder="Album title"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              v-model="form.description"
              rows="3"
              maxlength="1000"
              placeholder="Album description (optional)"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            ></textarea>
            <div class="flex items-center gap-3">
              <button
                @click="createAlbum"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create
              </button>
              <button
                @click="toggleCreate"
                class="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <span v-if="error" class="text-sm text-red-500">{{ error }}</span>
            </div>
          </div>
        </div>

        <div v-if="loading">
          <MerchPhotoSkeletonGrid layout="grid" />
        </div>
        <div v-else-if="albums.length === 0" class="text-center py-20 text-gray-500">
          No albums yet.
        </div>
        <MerchPhotoGridLayout
          v-else
          :items="orderedAlbums"
          layout="grid"
          :selection-mode="selectionMode"
          :selected-photos="[]"
          @photo-click="openAlbum"
          @reorder="reorderAlbums"
        >
          <template #photo-item="{ item }">
            <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-50 dark:bg-slate-900/40" style="aspect-ratio: 1 / 1;">
              <div class="grid grid-cols-2 grid-rows-2 w-full h-full">
                <div
                  v-for="(photo, index) in getAlbumTilePhotos(item.id)"
                  :key="photo.id"
                  class="w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-900/40"
                >
                  <img
                    :src="getPhotoUrl(photo)"
                    :alt="photo.title || 'Album photo'"
                    class="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div
                  v-if="getAlbumTilePhotos(item.id).length === 0"
                  class="col-span-2 row-span-2 flex items-center justify-center text-gray-400"
                >
                  <Icon name="heroicons:rectangle-stack" class="text-5xl" />
                </div>
              </div>
              <div class="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur text-white p-3">
                <div class="text-sm font-semibold">{{ item.title }}</div>
                <div v-if="item.description" class="text-xs text-white/80 line-clamp-2">{{ item.description }}</div>
              </div>
            </div>
          </template>
        </MerchPhotoGridLayout>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
