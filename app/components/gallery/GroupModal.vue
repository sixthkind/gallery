<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="close"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-800">Create Group</h2>
          <button
            @click="close"
            class="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            aria-label="Close"
          >
            <Icon name="heroicons:x-mark" class="text-2xl" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Title -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
              Title <span class="text-red-500">*</span>
            </label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              maxlength="200"
              required
              placeholder="Enter group title"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="mt-1 text-xs text-gray-500">{{ formData.title.length }}/200 characters</p>
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="4"
              maxlength="1000"
              placeholder="Enter group description (optional)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">{{ formData.description.length }}/1000 characters</p>
          </div>

          <!-- Cover Photo Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cover Photo <span class="text-red-500">*</span>
            </label>
            <p class="text-xs text-gray-500 mb-3">Select which photo should be used as the cover image for this group</p>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div
                v-for="photo in selectedPhotos"
                :key="photo.id"
                @click="formData.coverPhotoId = photo.id"
                :class="[
                  'relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200',
                  formData.coverPhotoId === photo.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <img
                  :src="getPhotoUrl(photo, '200x200')"
                  :alt="photo.title || 'Photo'"
                  class="w-full h-32 object-cover"
                />
                <div
                  v-if="formData.coverPhotoId === photo.id"
                  class="absolute inset-0 bg-blue-500/20 flex items-center justify-center"
                >
                  <Icon name="heroicons:check-circle" class="text-3xl text-blue-600" />
                </div>
                <div
                  v-else
                  class="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200"
                ></div>
              </div>
            </div>
            
            <p v-if="!formData.coverPhotoId" class="mt-2 text-sm text-red-500">
              Please select a cover photo
            </p>
          </div>

          <!-- Selected Photos Count -->
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-600">
              <Icon name="heroicons:photo" class="inline-block mr-2" />
              <span class="font-medium">{{ selectedPhotos.length }}</span> photo{{ selectedPhotos.length !== 1 ? 's' : '' }} will be grouped
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="close"
              class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!formData.title || !formData.coverPhotoId || saving"
              :class="[
                'flex-1 px-4 py-2 rounded-lg font-semibold transition-colors duration-200',
                !formData.title || !formData.coverPhotoId || saving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              ]"
            >
              {{ saving ? 'Creating...' : 'Create Group' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { pb } from '#imports';
import { GALLERY_COLLECTIONS } from '~/utils/collections';
import { ref, reactive, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  selectedPhotos: {
    type: Array,
    required: true,
    default: () => []
  },
  albumId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close', 'created']);

const formData = reactive({
  title: '',
  description: '',
  coverPhotoId: null
});

const saving = ref(false);
const error = ref(null);

// Get photo URL with thumbnail
const getPhotoUrl = (photo, thumb = '200x200') => {
  return pb.files.getURL(photo, photo.photo, { thumb });
};

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    formData.title = '';
    formData.description = '';
    formData.coverPhotoId = props.selectedPhotos.length > 0 ? props.selectedPhotos[0].id : null;
    error.value = null;
  }
});

// Auto-select first photo as cover if available
watch(() => props.selectedPhotos, (photos) => {
  if (photos.length > 0 && !formData.coverPhotoId) {
    formData.coverPhotoId = photos[0].id;
  }
}, { immediate: true });

// Close modal
const close = () => {
  emit('close');
};

// Handle form submission
const handleSubmit = async () => {
  if (!formData.title || !formData.coverPhotoId) {
    error.value = 'Please fill in all required fields';
    return;
  }

  if (!props.selectedPhotos.length) {
    error.value = 'No photos selected';
    return;
  }

  // Verify cover photo is in selected photos
  if (!props.selectedPhotos.find(p => p.id === formData.coverPhotoId)) {
    error.value = 'Cover photo must be one of the selected photos';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    const currentUser = pb.authStore.record;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get all photo IDs
    const photoIds = props.selectedPhotos.map(p => p.id);

    // Create the group
    const groupData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      coverPhoto: formData.coverPhotoId,
      photos: photoIds,
      user: currentUser.id
    };
    if (props.albumId) {
      groupData.album = props.albumId;
    }

    const group = await pb.collection(GALLERY_COLLECTIONS.groups).create(groupData);

    // Update all photos to link them to the group
    for (const photoId of photoIds) {
      const updateData = { group: group.id };
      if (props.albumId) {
        updateData.album = props.albumId;
      }
      await pb.collection(GALLERY_COLLECTIONS.photos).update(photoId, updateData);
    }

    // Emit success event
    emit('created', group);
    close();
  } catch (err) {
    console.error('Error creating group:', err);
    error.value = err.message || 'Failed to create group. Please try again.';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
/* Additional styles if needed */
</style>
