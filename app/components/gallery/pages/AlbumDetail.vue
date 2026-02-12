<script setup>
import { pb } from '#imports';
import { GALLERY_COLLECTIONS } from '~/utils/collections';
import { authUtils } from '~/utils/auth';
import { alertController } from '@ionic/vue';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const albumId = computed(() => route.params.id);
const album = ref(null);
const loading = ref(true);
const isEditingTitle = ref(false);
const pendingTitle = ref('');
const saveTimer = ref(null);

const galleryRef = ref(null);
const { showUpload, selectionMode, currentLayout } = useGalleryState();
const isSuperuser = computed(() => authUtils.isSuperuser());
const isDeleting = ref(false);
const { toGalleryPath } = useGalleryRoutes();

const fetchAlbum = async () => {
  if (!albumId.value) {
    album.value = null;
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    album.value = await pb.collection(GALLERY_COLLECTIONS.albums).getOne(albumId.value);
    pendingTitle.value = album.value?.title || '';
  } catch (error) {
    console.error('Error fetching album:', error);
  } finally {
    loading.value = false;
  }
};

const startTitleEdit = async () => {
  if (!isSuperuser.value) return;
  isEditingTitle.value = true;
  pendingTitle.value = album.value?.title || '';
  await nextTick();
};

const queueTitleSave = () => {
  if (!isSuperuser.value) return;
  if (!album.value) return;
  clearTimeout(saveTimer.value);
  saveTimer.value = setTimeout(async () => {
    const newTitle = pendingTitle.value.trim();
    if (!newTitle || newTitle === album.value.title) return;
    try {
      album.value = await pb.collection(GALLERY_COLLECTIONS.albums).update(album.value.id, {
        title: newTitle
      });
    } catch (error) {
      console.error('Error updating album title:', error);
    }
  }, 400);
};

const stopTitleEdit = () => {
  isEditingTitle.value = false;
  queueTitleSave();
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push(toGalleryPath("/albums"));
};

const refreshGallery = () => {
  if (galleryRef.value) {
    galleryRef.value.refresh();
  }
};

const hasExpandedGroups = computed(() => {
  return galleryRef.value?.expandedGroups?.size > 0;
});

const hasGroups = computed(() => {
  return (galleryRef.value?.groupCount || 0) > 0;
});

const areAllGroupsExpanded = computed(() => {
  return galleryRef.value?.areAllGroupsExpanded || false;
});

const collapseGroups = () => {
  if (galleryRef.value) {
    galleryRef.value.collapseAllGroups();
  }
};

const toggleAllGroups = () => {
  if (!galleryRef.value) return;
  if (areAllGroupsExpanded.value) {
    galleryRef.value.collapseAllGroups();
    return;
  }
  galleryRef.value.expandAllGroups();
};

const deleteAlbum = async () => {
  if (!isSuperuser.value) return;
  if (!album.value || isDeleting.value) return;

  const alert = await alertController.create({
    header: 'Delete Album',
    message: `Delete "${album.value.title || 'Untitled'}" and all photos/groups inside? This cannot be undone.`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          isDeleting.value = true;
          try {
            const albumFilter = `album = "${albumId.value}"`;
            const groupsToDelete = await pb.collection(GALLERY_COLLECTIONS.groups).getFullList({ filter: albumFilter });
            for (const group of groupsToDelete) {
              await pb.collection(GALLERY_COLLECTIONS.groups).delete(group.id);
            }
            const photosToDelete = await pb.collection(GALLERY_COLLECTIONS.photos).getFullList({ filter: albumFilter });
            for (const photo of photosToDelete) {
              await pb.collection(GALLERY_COLLECTIONS.photos).delete(photo.id);
            }
            await pb.collection(GALLERY_COLLECTIONS.albums).delete(albumId.value);
            router.push({ path: toGalleryPath("/albums"), query: { refreshed: Date.now().toString() } });
          } catch (error) {
            console.error('Error deleting album:', error);
          } finally {
            isDeleting.value = false;
          }
        }
      }
    ]
  });
  await alert.present();
};

onMounted(() => {
  fetchAlbum();
});

watch(albumId, () => {
  if (!albumId.value) return;
  fetchAlbum();
});

watch(pendingTitle, () => {
  if (isEditingTitle.value) {
    queueTitleSave();
  }
});
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="relative">
        <!-- Left Margin Clickable Area -->
        <div 
          v-if="hasExpandedGroups"
          class="fixed left-0 top-0 bottom-0 cursor-pointer hover:bg-gray-100/30 dark:hover:bg-slate-800/20 transition-colors z-10"
          style="width: calc((100vw - min(1280px, 100vw - 2.5rem)) / 2);"
          @click.stop="collapseGroups"
          title="Click to collapse groups"
        ></div>
        
        <!-- Right Margin Clickable Area -->
        <div 
          v-if="hasExpandedGroups"
          class="fixed right-0 top-0 bottom-0 cursor-pointer hover:bg-gray-100/30 dark:hover:bg-slate-800/20 transition-colors z-10"
          style="width: calc((100vw - min(1280px, 100vw - 2.5rem)) / 2);"
          @click.stop="collapseGroups"
          title="Click to collapse groups"
        ></div>

        <CommonContainer>
          <div class="flex items-center justify-between mt-4">
            <div class="flex items-start gap-3">
              <button
                class="mt-1 text-gray-500 hover:text-gray-700 transition-colors"
                @click="goBack"
                aria-label="Back to albums"
              >
                <Icon name="heroicons:arrow-left" class="text-2xl" />
              </button>
              <div>
                <h1
                  v-if="!isEditingTitle"
                  class="text-2xl font-bold text-gray-800"
                  :class="isSuperuser ? 'cursor-pointer hover:text-gray-900' : ''"
                  @click="startTitleEdit"
                >
                  {{ album?.title || '' }}
                </h1>
                <input
                  v-else
                  v-model="pendingTitle"
                  type="text"
                  maxlength="200"
                  class="text-2xl font-bold text-gray-800 w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                  @blur="stopTitleEdit"
                  @keydown.enter.prevent="stopTitleEdit"
                  @keydown.esc.prevent="stopTitleEdit"
                  aria-label="Album title"
                />
                <p v-if="album?.description" class="text-sm text-gray-500 mt-1">{{ album.description }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="hasGroups"
                @click="toggleAllGroups"
                class="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                :title="areAllGroupsExpanded ? 'Collapse All' : 'Expand All'"
                :aria-label="areAllGroupsExpanded ? 'Collapse All' : 'Expand All'"
              >
                <Icon :name="areAllGroupsExpanded ? 'lucide:fold-horizontal' : 'lucide:unfold-horizontal'" class="text-lg" />
              </button>
              <button
                v-if="isSuperuser"
                @click="deleteAlbum"
                :disabled="isDeleting"
                class="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Icon
                  v-if="isDeleting"
                  name="svg-spinners:ring-resize"
                  class="text-base"
                />
                <span>Delete Album</span>
              </button>
            </div>
          </div>

          <div v-if="showUpload" class="mt-3">
            <GalleryPhotoUpload :album-id="albumId" @uploaded="refreshGallery" />
          </div>
          <GalleryPhotoGallery 
            ref="galleryRef" 
            :selection-mode="selectionMode"
            :current-layout="currentLayout"
            :album-id="albumId"
            date-sort-direction="asc"
            @update:selection-mode="selectionMode = $event"
          />
        </CommonContainer>
      </div>
    </ion-content>
  </ion-page>
</template>
