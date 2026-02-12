<template>
  <div class="group-card-wrapper">
    <!-- Collapsed View -->
    <div
      v-if="!isExpanded"
      class="group-card-collapsed group cursor-pointer"
      @click="toggleExpand"
    >
      <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
        <img
          v-if="coverPhotoUrl"
          :src="coverPhotoUrl"
          :alt="group.title || 'Group'"
          class="w-full h-auto object-cover"
          loading="lazy"
        />
        <div
          v-else
          class="w-full h-64 bg-gray-200 flex items-center justify-center"
        >
          <Icon name="heroicons:photo" class="text-6xl text-gray-400" />
        </div>
        
        <!-- Group Badge -->
        <div class="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Icon name="heroicons:folder" class="text-sm" />
          <span>Group</span>
        </div>

        <!-- Photo Count Badge -->
        <div class="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Icon name="heroicons:photo" class="text-sm" />
          <span>{{ photoCount }}</span>
        </div>

        <!-- Overlay with title/description on hover -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <h3 v-if="group.title" class="text-white font-semibold text-lg mb-1">{{ group.title }}</h3>
          <p v-if="group.description" class="text-white/90 text-sm line-clamp-2">{{ group.description }}</p>
        </div>
      </div>
    </div>

    <!-- Expanded View -->
    <div
      v-else
      class="group-card-expanded"
    >
      <!-- Header -->
      <div class="bg-white rounded-t-lg border border-b-0 border-gray-200 p-4">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <Icon name="heroicons:folder" class="text-blue-500" />
              <h3 class="text-lg font-semibold text-gray-800">{{ group.title || 'Untitled Group' }}</h3>
            </div>
            <p v-if="group.description" class="text-sm text-gray-600">{{ group.description }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ photoCount }} photo{{ photoCount !== 1 ? 's' : '' }}</p>
          </div>
          <button
            @click="toggleExpand"
            class="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            aria-label="Collapse"
          >
            <Icon name="heroicons:chevron-up" class="text-2xl" />
          </button>
        </div>
      </div>

      <!-- Photos Grid -->
      <div class="bg-white rounded-b-lg border border-gray-200 p-4">
        <div
          v-if="photos.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="relative group cursor-pointer"
            @click="handlePhotoClick(photo)"
          >
            <div class="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 aspect-square">
              <img
                :src="getPhotoUrl(photo, '300x300')"
                :alt="photo.title || 'Photo'"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div
                v-if="photo.id === group.coverPhoto"
                class="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold"
              >
                Cover
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"></div>
            </div>
            <p
              v-if="photo.title"
              class="mt-2 text-xs text-gray-600 line-clamp-1"
            >
              {{ photo.title }}
            </p>
          </div>
        </div>
        <div
          v-else
          class="text-center py-8 text-gray-500"
        >
          <Icon name="heroicons:photo" class="text-4xl mx-auto mb-2 opacity-50" />
          <p>No photos in this group</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { pb } from '#imports';
import { ref, computed } from 'vue';

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['photo-click']);

const isExpanded = ref(false);

// Get photos from expanded relation
const photos = computed(() => {
  return props.group.expand?.photos || [];
});

// Get cover photo
const coverPhoto = computed(() => {
  if (!props.group.coverPhoto) return null;
  if (props.group.expand?.coverPhoto) {
    return props.group.expand.coverPhoto;
  }
  // Fallback: find in photos array
  return photos.value.find(p => p.id === props.group.coverPhoto) || null;
});

// Get cover photo URL
const coverPhotoUrl = computed(() => {
  if (!coverPhoto.value) return null;
  return pb.files.getURL(coverPhoto.value, coverPhoto.value.photo, { thumb: '500x500' });
});

// Photo count
const photoCount = computed(() => {
  return photos.value.length || props.group.photos?.length || 0;
});

// Get photo URL with thumbnail
const getPhotoUrl = (photo, thumb = '300x300') => {
  return pb.files.getURL(photo, photo.photo, { thumb });
};

// Toggle expand/collapse
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// Handle photo click
const handlePhotoClick = (photo) => {
  emit('photo-click', photo);
};
</script>

<style scoped>
.group-card-collapsed {
  break-inside: avoid;
  margin-bottom: 1rem;
}

.group-card-expanded {
  break-inside: avoid;
  margin-bottom: 1rem;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
