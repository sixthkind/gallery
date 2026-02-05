<template>
  <Teleport to="body">
    <div
      v-if="photo"
      class="lightbox-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      @click.self="close"
    >
      <!-- Close Button -->
      <button
        @click="close"
        class="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors duration-200"
        aria-label="Close"
      >
        <Icon name="heroicons:x-mark" class="text-4xl" />
      </button>

      <!-- Previous Button -->
      <button
        v-if="photos.length > 1"
        @click.stop="navigate('prev')"
        class="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors duration-200 bg-black/50 rounded-full p-3"
        aria-label="Previous photo"
      >
        <Icon name="heroicons:chevron-left" class="text-3xl" />
      </button>

      <!-- Next Button -->
      <button
        v-if="photos.length > 1"
        @click.stop="navigate('next')"
        class="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors duration-200 bg-black/50 rounded-full p-3"
        aria-label="Next photo"
      >
        <Icon name="heroicons:chevron-right" class="text-3xl" />
      </button>

      <!-- Image Container -->
      <div class="relative max-w-7xl w-full h-full flex flex-col items-center justify-center p-4">
        <!-- Image -->
        <div class="flex-grow flex items-center justify-center w-full mb-4">
          <img
            :src="fullSizeRequested ? getFullPhotoUrl(photo) : getPhotoUrl(photo, '1200x0')"
            :alt="displayTitle"
            class="max-w-full max-h-[calc(100vh-200px)] object-contain"
            @click.stop
            @load="handleImageLoad"
          />
        </div>

        <!-- Photo Info Container (maintains space in layout) -->
        <div
          class="relative max-w-2xl w-full"
          ref="infoContainer"
          :style="{ minHeight: isMetadataExpanded ? containerMinHeight : 'auto' }"
        >
          <!-- Photo Info -->
          <div
            :class="[
              'bg-black/70 backdrop-blur-sm rounded-lg p-4 w-full',
              isMetadataExpanded 
                ? 'absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto' 
                : ''
            ]"
            @click.stop
          >
          <div v-if="showTitle" class="mb-3">
            <div v-if="showTitle">
              <h2
                v-if="!isEditingTitle"
                class="text-lg"
                :class="[
                  localTitle ? 'text-white' : 'text-white/50',
                  isAuthenticated ? 'cursor-pointer hover:text-white' : ''
                ]"
                @click="startTitleEdit"
              >
                {{ titleDisplayText }}
              </h2>
              <input
                v-else
                v-model="pendingTitle"
                type="text"
                maxlength="200"
                class="text-lg text-white w-full bg-transparent border-b border-white/30 focus:outline-none focus:border-white/70"
                @blur="stopTitleEdit"
                @keydown.enter.prevent="stopTitleEdit"
                @keydown.esc.prevent="stopTitleEdit"
                aria-label="Photo title"
              />
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2 items-center">
            <button
              v-for="tag in tags"
              :key="tag.id"
              @click.stop="openTag(tag)"
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90 hover:bg-white/20 transition-colors"
            >
              {{ tag.name }}
              <button
                v-if="isAuthenticated"
                @click.stop="removeTag(tag)"
                class="text-white/70 hover:text-white"
                aria-label="Remove tag"
              >
                <Icon name="heroicons:x-mark" class="text-sm" />
              </button>
            </button>
            <span v-if="!tags.length" class="text-xs text-white/60">No tags</span>
            <button
              @click="loadFullSize"
              :disabled="fullSizeLoaded || fullSizeLoading"
              class="ml-auto inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90 hover:bg-white/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Icon
                :name="fullSizeLoading ? 'svg-spinners:ring-resize' : (fullSizeLoaded ? 'lucide:check' : 'lucide:fullscreen')"
                class="text-sm"
              />
              <span>Full Res</span>
            </button>
          </div>
          <div v-if="isAuthenticated" class="mt-3 flex items-center gap-2">
            <input
              v-model="tagInput"
              type="text"
              maxlength="50"
              placeholder="Add tag"
              class="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-white/40"
              @keydown.enter.prevent="addTag"
            />
            <button
              @click="addTag"
              class="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
          <div class="flex items-center gap-4 mt-3 text-sm text-white/70">
            <div class="flex items-center gap-3">
              <span>{{ formatDate(photo.dateTaken || photo.created) }}</span>
              <div v-if="showLocation" class="flex items-center gap-2">
                <span class="text-white/40">•</span>
                <span
                  v-if="!isEditingLocation"
                  class="text-white/70"
                  :class="isAuthenticated ? 'cursor-pointer hover:text-white' : ''"
                  @click="startLocationEdit"
                >
                  {{ locationDisplayText }}
                </span>
                <input
                  v-else
                  v-model="pendingLocation"
                  type="text"
                  maxlength="200"
                  class="text-sm text-white w-56 max-w-full bg-transparent border-b border-white/30 focus:outline-none focus:border-white/70"
                  @blur="stopLocationEdit"
                  @keydown.enter.prevent="stopLocationEdit"
                  @keydown.esc.prevent="stopLocationEdit"
                  aria-label="Photo location"
                />
              </div>
            </div>
            <span v-if="photos.length > 1" class="ml-auto">
              {{ currentIndex + 1 }} / {{ photos.length }}
            </span>
          </div>

          <!-- Photo Metadata -->
          <details v-if="hasMetadata(photo)" class="mt-3 text-sm text-white/80" @toggle="onMetadataToggle">
            <summary class="cursor-pointer hover:text-white transition-colors flex items-center gap-2">
              <Icon name="heroicons:information-circle" class="text-base" />
              <span>Photo Information</span>
            </summary>
            <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 text-xs">
              <div v-if="photo.cameraMake || photo.cameraModel" class="flex flex-col">
                <span class="text-white/60">Camera</span>
                <span class="text-white">{{ photo.cameraMake }} {{ photo.cameraModel }}</span>
              </div>
              <div v-if="photo.iso" class="flex flex-col">
                <span class="text-white/60">ISO</span>
                <span class="text-white">{{ photo.iso }}</span>
              </div>
              <div v-if="photo.aperture" class="flex flex-col">
                <span class="text-white/60">Aperture</span>
                <span class="text-white">f/{{ photo.aperture }}</span>
              </div>
              <div v-if="photo.shutterSpeed" class="flex flex-col">
                <span class="text-white/60">Shutter Speed</span>
                <span class="text-white">{{ photo.shutterSpeed }}s</span>
              </div>
              <div v-if="photo.focalLength" class="flex flex-col">
                <span class="text-white/60">Focal Length</span>
                <span class="text-white">{{ photo.focalLength }}mm</span>
              </div>
              <div v-if="photo.width && photo.height" class="flex flex-col">
                <span class="text-white/60">Dimensions</span>
                <span class="text-white">{{ photo.width }} × {{ photo.height }}px</span>
              </div>
              <div v-if="photo.fileSize" class="flex flex-col">
                <span class="text-white/60">File Size</span>
                <span class="text-white">{{ formatFileSize(photo.fileSize) }}</span>
              </div>
              <div v-if="photo.latitude && photo.longitude" class="flex flex-col md:col-span-2">
                <span class="text-white/60">GPS Coordinates</span>
                <span class="text-white">
                  {{ photo.latitude.toFixed(6) }}, {{ photo.longitude.toFixed(6) }}
                  <a 
                    :href="`https://maps.google.com/?q=${photo.latitude},${photo.longitude}`" 
                    target="_blank"
                    class="ml-2 text-blue-400 hover:text-blue-300"
                  >
                    View on Map
                  </a>
                </span>
              </div>
            </div>
          </details>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { pb } from '#imports';
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  photo: {
    type: Object,
    required: true
  },
  photos: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'navigate', 'tags-updated']);

const router = useRouter();
const tags = ref([]);
const tagInput = ref('');
const isMetadataExpanded = ref(false);
const infoContainer = ref(null);
const containerMinHeight = ref('auto');
const isAuthenticated = computed(() => pb.authStore.isValid);
const fullSizeRequested = ref(false);
const fullSizeLoading = ref(false);
const fullSizeLoaded = ref(false);
const isEditingTitle = ref(false);
const isEditingLocation = ref(false);
const pendingTitle = ref('');
const pendingLocation = ref('');
const localTitle = ref('');
const localLocation = ref('');
const titleSaveTimer = ref(null);
const locationSaveTimer = ref(null);

const displayTitle = computed(() => localTitle.value || props.photo?.title || 'Photo');
const showTitle = computed(() => isAuthenticated.value || !!localTitle.value);
const showLocation = computed(() => isAuthenticated.value || !!localLocation.value);
const titleDisplayText = computed(() => localTitle.value || (isAuthenticated.value ? 'Add title' : ''));
const locationDisplayText = computed(() => localLocation.value || (isAuthenticated.value ? 'Add location' : ''));

// Get current photo index
const currentIndex = computed(() => {
  return props.photos.findIndex(p => p.id === props.photo.id);
});

// Get photo URL with thumbnail
const getPhotoUrl = (photo, thumb = '1200x0') => {
  return pb.files.getURL(photo, photo.photo, { thumb });
};

// Get full size photo URL
const getFullPhotoUrl = (photo) => {
  return pb.files.getURL(photo, photo.photo);
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Check if photo has metadata
const hasMetadata = (photo) => {
  if (!photo) return false;
  return !!(
    photo.cameraMake || 
    photo.cameraModel || 
    photo.iso || 
    photo.aperture || 
    photo.shutterSpeed || 
    photo.focalLength || 
    photo.width || 
    photo.height || 
    photo.fileSize || 
    (photo.latitude && photo.longitude)
  );
};

const syncEditableFields = () => {
  clearTimeout(titleSaveTimer.value);
  clearTimeout(locationSaveTimer.value);
  localTitle.value = props.photo?.title || '';
  localLocation.value = props.photo?.location || '';
  pendingTitle.value = localTitle.value;
  pendingLocation.value = localLocation.value;
  isEditingTitle.value = false;
  isEditingLocation.value = false;
};

const startTitleEdit = async () => {
  if (!isAuthenticated.value) return;
  isEditingTitle.value = true;
  pendingTitle.value = localTitle.value;
  await nextTick();
};

const startLocationEdit = async () => {
  if (!isAuthenticated.value) return;
  isEditingLocation.value = true;
  pendingLocation.value = localLocation.value;
  await nextTick();
};

const queueTitleSave = () => {
  if (!isAuthenticated.value || !props.photo?.id) return;
  clearTimeout(titleSaveTimer.value);
  const photoId = props.photo.id;
  titleSaveTimer.value = setTimeout(async () => {
    const newTitle = pendingTitle.value.trim();
    if (newTitle === localTitle.value) return;
    try {
      const updated = await pb.collection('photos').update(photoId, {
        title: newTitle
      });
      localTitle.value = updated?.title ?? newTitle;
    } catch (error) {
      console.error('Error updating photo title:', error);
    }
  }, 400);
};

const queueLocationSave = () => {
  if (!isAuthenticated.value || !props.photo?.id) return;
  clearTimeout(locationSaveTimer.value);
  const photoId = props.photo.id;
  locationSaveTimer.value = setTimeout(async () => {
    const newLocation = pendingLocation.value.trim();
    if (newLocation === localLocation.value) return;
    try {
      const updated = await pb.collection('photos').update(photoId, {
        location: newLocation
      });
      localLocation.value = updated?.location ?? newLocation;
    } catch (error) {
      console.error('Error updating photo location:', error);
    }
  }, 400);
};

const stopTitleEdit = () => {
  isEditingTitle.value = false;
  queueTitleSave();
};

const stopLocationEdit = () => {
  isEditingLocation.value = false;
  queueLocationSave();
};

// Close lightbox
const close = () => {
  emit('close');
};

// Navigate to next/previous photo
const navigate = (direction) => {
  emit('navigate', direction);
};

// Handle metadata toggle
const onMetadataToggle = (event) => {
  if (!event.target.open && infoContainer.value) {
    // Capture the height before expanding
    containerMinHeight.value = `${infoContainer.value.offsetHeight}px`;
  }
  isMetadataExpanded.value = event.target.open;
};

const loadPhotoDetails = async () => {
  if (!props.photo?.id) return;
  try {
    const record = await pb.collection('photos').getOne(props.photo.id, { expand: 'tags' });
    tags.value = record.expand?.tags || [];
    if (!isEditingTitle.value) {
      localTitle.value = record.title || '';
      pendingTitle.value = localTitle.value;
    }
    if (!isEditingLocation.value) {
      localLocation.value = record.location || '';
      pendingLocation.value = localLocation.value;
    }
  } catch (error) {
    console.error('Error loading photo details:', error);
  }
};

const addTag = async () => {
  if (!isAuthenticated.value) return;
  const name = tagInput.value.trim().toLowerCase();
  if (!name) return;
  const safeName = name.replace(/"/g, '\\"');

  try {
    let tagRecord;
    try {
      tagRecord = await pb.collection('tags').getFirstListItem(`name = "${safeName}"`);
    } catch (error) {
      tagRecord = await pb.collection('tags').create({
        name,
        user: pb.authStore.record?.id
      });
    }

    if (!tags.value.some(tag => tag.id === tagRecord.id)) {
      const updatedTags = [...tags.value, tagRecord];
      await pb.collection('photos').update(props.photo.id, {
        tags: updatedTags.map(tag => tag.id)
      });
      tags.value = updatedTags;
      emit('tags-updated', { photoId: props.photo.id, tags: updatedTags });
    }
    tagInput.value = '';
  } catch (error) {
    console.error('Error adding tag:', error);
  }
};

const removeTag = async (tag) => {
  if (!isAuthenticated.value) return;
  try {
    const updatedTags = tags.value.filter(existing => existing.id !== tag.id);
    await pb.collection('photos').update(props.photo.id, {
      tags: updatedTags.map(existing => existing.id)
    });
    tags.value = updatedTags;
    emit('tags-updated', { photoId: props.photo.id, tags: updatedTags });
  } catch (error) {
    console.error('Error removing tag:', error);
  }
};

const openTag = (tag) => {
  if (!tag?.name) return;
  close();
  router.push(`/tags/${encodeURIComponent(tag.name)}`);
};

const loadFullSize = () => {
  if (fullSizeLoaded.value || fullSizeLoading.value) return;
  fullSizeRequested.value = true;
  fullSizeLoading.value = true;
};

const handleImageLoad = () => {
  if (!fullSizeRequested.value || !fullSizeLoading.value) return;
  fullSizeLoading.value = false;
  fullSizeLoaded.value = true;
};

// Keyboard navigation
const handleKeydown = (e) => {
  switch (e.key) {
    case 'Escape':
      close();
      break;
    case 'ArrowLeft':
      if (props.photos.length > 1) {
        navigate('prev');
      }
      break;
    case 'ArrowRight':
      if (props.photos.length > 1) {
        navigate('next');
      }
      break;
  }
};

// Prevent body scroll when lightbox is open
const preventScroll = (e) => {
  e.preventDefault();
};

onMounted(() => {
  // Add keyboard listener
  window.addEventListener('keydown', handleKeydown);
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  document.addEventListener('touchmove', preventScroll, { passive: false });

  syncEditableFields();
  loadPhotoDetails();
});

onUnmounted(() => {
  // Remove keyboard listener
  window.removeEventListener('keydown', handleKeydown);
  
  // Restore body scroll
  document.body.style.overflow = '';
  document.removeEventListener('touchmove', preventScroll);
  clearTimeout(titleSaveTimer.value);
  clearTimeout(locationSaveTimer.value);
});

watch(() => props.photo?.id, () => {
  tagInput.value = '';
  isMetadataExpanded.value = false;
  containerMinHeight.value = 'auto';
  fullSizeRequested.value = false;
  fullSizeLoading.value = false;
  fullSizeLoaded.value = false;
  syncEditableFields();
  loadPhotoDetails();
});

watch(pendingTitle, () => {
  if (isEditingTitle.value) {
    queueTitleSave();
  }
});

watch(pendingLocation, () => {
  if (isEditingLocation.value) {
    queueLocationSave();
  }
});
</script>

<style scoped>
.lightbox-overlay {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

img {
  animation: scaleIn 0.2s ease-in-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Custom scrollbar for photo info */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
