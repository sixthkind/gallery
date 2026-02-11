<script setup>
import { pb } from '#imports';
import { GALLERY_COLLECTIONS } from '~/utils/collections';
import { alertController } from '@ionic/vue';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({
  middleware: ["auth", "gallery-module"]
});

const route = useRoute();
const router = useRouter();
const tagName = computed(() => route.params.name);
const tagRecord = ref(null);
const tags = ref([]);
const photos = ref([]);
const loading = ref(true);
const selectedPhoto = ref(null);
const isEditingTag = ref(false);
const pendingTagName = ref('');
const saveTimer = ref(null);
const isAuthenticated = computed(() => pb.authStore.isValid);
const isDeletingTag = ref(false);

const fetchTag = async () => {
  if (!tagName.value) {
    tagRecord.value = null;
    photos.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    tagRecord.value = await pb.collection(GALLERY_COLLECTIONS.tags).getFirstListItem(`name = "${String(tagName.value).replace(/"/g, '\\"')}"`);
    const tagId = tagRecord.value.id;
    pendingTagName.value = tagRecord.value?.name || '';
    const allTagged = await pb.collection(GALLERY_COLLECTIONS.photos).getFullList({
      sort: '-dateTaken,-created',
      expand: 'tags'
    });
    photos.value = allTagged.filter(photo => {
      if (Array.isArray(photo.tags)) {
        return photo.tags.includes(tagId);
      }
      return false;
    });
  } catch (error) {
    console.error('Error fetching tag photos:', error);
    tagRecord.value = null;
    photos.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchTagsList = async () => {
  try {
    tags.value = await pb.collection(GALLERY_COLLECTIONS.tags).getFullList({
      sort: 'name'
    });
  } catch (error) {
    console.error('Error fetching tags list:', error);
    tags.value = [];
  }
};

const nextTag = computed(() => {
  if (tags.value.length < 2) return null;
  const currentId = tagRecord.value?.id;
  let index = -1;
  if (currentId) {
    index = tags.value.findIndex(tag => tag.id === currentId);
  }
  if (index === -1) {
    const currentName = String(tagName.value || '');
    index = tags.value.findIndex(tag => tag.name === currentName);
  }
  if (index === -1) return tags.value[0] ?? null;
  const nextIndex = (index + 1) % tags.value.length;
  return tags.value[nextIndex] ?? null;
});

const openLightbox = (photo) => {
  selectedPhoto.value = photo;
};

const closeLightbox = () => {
  selectedPhoto.value = null;
};

const allPhotosForLightbox = computed(() => photos.value);

const startTagEdit = async () => {
  if (!isAuthenticated.value) return;
  isEditingTag.value = true;
  pendingTagName.value = tagRecord.value?.name || '';
  await nextTick();
};

const queueTagSave = () => {
  if (!isAuthenticated.value || !tagRecord.value) return;
  clearTimeout(saveTimer.value);
  saveTimer.value = setTimeout(async () => {
    const newName = pendingTagName.value.trim();
    if (!newName || newName === tagRecord.value.name) return;
    try {
      tagRecord.value = await pb.collection(GALLERY_COLLECTIONS.tags).update(tagRecord.value.id, {
        name: newName
      });
      tags.value = tags.value
        .map(tag => {
          if (tag.id !== tagRecord.value?.id) return tag;
          return { ...tag, name: newName };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      if (newName !== tagName.value) {
        window.history.replaceState({}, '', `/gallery/tags/${encodeURIComponent(newName)}`);
      }
    } catch (error) {
      console.error('Error updating tag name:', error);
    }
  }, 400);
};

const stopTagEdit = () => {
  isEditingTag.value = false;
  queueTagSave();
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/gallery/tags');
};

const deleteTag = async () => {
  if (!isAuthenticated.value || !tagRecord.value || isDeletingTag.value) return;
  const tagLabel = tagRecord.value?.name || String(tagName.value || '').trim() || 'this tag';
  const alert = await alertController.create({
    header: 'Delete Tag',
    message: `Delete "${tagLabel}"? This cannot be undone.`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          isDeletingTag.value = true;
          try {
            await pb.collection(GALLERY_COLLECTIONS.tags).delete(tagRecord.value.id);
            router.push({ path: '/gallery/tags', query: { refreshed: Date.now().toString() } });
          } catch (error) {
            console.error('Error deleting tag:', error);
          } finally {
            isDeletingTag.value = false;
          }
        }
      }
    ]
  });
  await alert.present();
};

const navigateLightbox = (direction) => {
  const list = allPhotosForLightbox.value;
  const index = list.findIndex(p => p.id === selectedPhoto.value?.id);
  if (index === -1) return;
  const nextIndex = direction === 'next'
    ? (index + 1) % list.length
    : (index - 1 + list.length) % list.length;
  selectedPhoto.value = list[nextIndex];
};

const handleTagsUpdated = ({ photoId, tags }) => {
  const tagIds = tags.map(tag => tag.id);
  photos.value = photos.value
    .map(photo => {
      if (photo.id !== photoId) return photo;
      return {
        ...photo,
        tags: tagIds,
        expand: {
          ...photo.expand,
          tags
        }
      };
    })
    .filter(photo => {
      if (!tagRecord.value) return true;
      return photo.tags?.includes(tagRecord.value.id);
    });
};

onMounted(() => {
  fetchTag();
  fetchTagsList();
});

watch(tagName, () => {
  if (!tagName.value) return;
  fetchTag();
  fetchTagsList();
});

watch(pendingTagName, () => {
  if (isEditingTag.value) {
    queueTagSave();
  }
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="flex items-center justify-between mt-4 mb-6">
          <div class="flex items-center gap-2">
            <button
              class="text-gray-500 hover:text-gray-700 transition-colors mt-2"
              @click="goBack"
              aria-label="Back to tags"
            >
              <Icon name="heroicons:arrow-left" class="text-2xl" />
            </button>
            <span class="text-2xl font-bold text-gray-800"><span style="margin-right: -6px;">#</span></span>
            <span v-if="!isEditingTag" class="text-2xl font-bold text-gray-800">
              <button
                :class="isAuthenticated ? 'cursor-pointer hover:text-gray-900' : ''"
                @click="startTagEdit"
              >
                {{ tagRecord?.name || tagName }}
              </button>
            </span>
            <input
              v-else
              v-model="pendingTagName"
              type="text"
              maxlength="50"
              class="text-2xl font-bold text-gray-800 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
              @blur="stopTagEdit"
              @keydown.enter.prevent="stopTagEdit"
              @keydown.esc.prevent="stopTagEdit"
              aria-label="Tag name"
            />
          </div>
          <div class="flex items-center gap-3">
            <button
              v-if="isAuthenticated"
              @click="deleteTag"
              :disabled="isDeletingTag"
              class="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icon
                v-if="isDeletingTag"
                name="svg-spinners:ring-resize"
                class="text-base"
              />
              <span>Delete Tag</span>
            </button>
            <button
              v-if="nextTag"
              class="flex items-center gap-2 text-gray-300 hover:text-gray-700 transition-colors"
              @click="router.push(`/gallery/tags/${encodeURIComponent(nextTag.name)}`)"
              aria-label="Next tag"
            >
              <span class="text-lg font-semibold">#{{ nextTag.name }}</span>
              <Icon name="heroicons:arrow-right" class="text-2xl" />
            </button>
          </div>
        </div>

        <div v-if="loading">
          <GalleryPhotoSkeletonGrid layout="grid" />
        </div>
        <div v-else-if="photos.length === 0" class="text-center py-20 text-gray-500">
          No photos with this tag.
        </div>
        <div v-else class="tag-gallery-shell">
          <GalleryPhotoGridLayout
            :items="photos"
            layout="grid"
            :selection-mode="false"
            :selected-photos="[]"
            @photo-click="openLightbox"
          >
            <template #photo-item="{ item, getPhotoUrl }">
              <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 aspect-square">
                <img
                  :src="getPhotoUrl(item, '500x500')"
                  :alt="item.title || 'Photo'"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </template>
          </GalleryPhotoGridLayout>
        </div>
      </CommonContainer>

      <GalleryPhotoLightbox
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

<style scoped>
.tag-gallery-shell {
  position: relative;
  padding: 2rem 0;
}
</style>
