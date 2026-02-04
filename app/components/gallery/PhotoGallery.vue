<template>
  <div class="photo-gallery-wrapper">
    <!-- Selection Actions Bar (shown when in selection mode) -->
    <div v-if="!loading && unifiedItems.length > 0 && selectionMode" class="selection-actions-wrapper">
      <div class="selection-actions flex items-center gap-3 p-3 bg-white bg-opacity-70 backdrop-blur rounded-lg shadow-sm border border-gray-200">
      <!-- Selected Count -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">{{ selectedPhotos.length }} selected</span>
      </div>
      
      <!-- Group Selected Button (only in select mode) -->
      <button
        v-if="!isEditMode && selectedPhotos.length >= 2"
        @click="createQuickGroup"
        class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:folder-plus" class="text-lg" />
        <span>Group</span>
      </button>
      
      <!-- Add to Group Button (when external photos are selected) -->
      <button
        v-if="isEditMode && hasPhotosOutsideGroup && selectedPhotos.length > 0"
        @click="addPhotosToGroup"
        class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:folder-plus" class="text-lg" />
        <span>Add to Group</span>
      </button>
      
      <!-- Remove from Group Button (when only internal photos are selected) -->
      <button
        v-if="isEditMode && !hasPhotosOutsideGroup && selectedPhotos.length > 0"
        @click="removePhotosFromGroup"
        class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:arrow-uturn-left" class="text-lg" />
        <span>Remove</span>
      </button>

      <!-- Replace Selected Photo Button (only when single photo is selected) -->
      <button
        v-if="selectedPhotos.length === 1"
        @click="triggerReplace"
        :disabled="replacing"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2',
          replacing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
        ]"
      >
        <Icon name="heroicons:arrow-path" class="text-lg" />
        <span>{{ replacing ? 'Replacing...' : 'Replace' }}</span>
      </button>
      
      <!-- Delete Selected Photos Button (works in both select mode and edit mode) -->
      <button
        v-if="selectedPhotos.length > 0"
        @click="confirmDeleteSelected"
        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:trash" class="text-lg" />
        <span>Delete</span>
      </button>
      
      <!-- Delete Group Button (only in edit mode when a group is expanded, and no photos from group are selected) -->
      <button
        v-if="isEditMode && currentExpandedGroupId && selectedPhotosInGroup.length === 0"
        @click="confirmDeleteGroup"
        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:trash" class="text-lg" />
        <span>Delete Group</span>
      </button>

      <button
          v-if="selectedPhotos.length > 0"
          @click="clearSelection"
          class="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
        <input
          ref="replaceInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleReplaceSelect"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading">
      <GalleryPhotoSkeletonGrid :layout="props.currentLayout" />
    </div>

    <!-- Empty State -->
    <div v-else-if="unifiedItems.length === 0" class="text-center py-20">
      <p class="text-gray-500 text-lg">No photos yet. Upload your first photo above!</p>
    </div>

    <!-- Gallery Content -->
    <div v-else class="gallery-grid-shell">
      <div
        v-if="expandedGroups.size > 0"
        class="gallery-dismiss-zone gallery-dismiss-zone--top"
        @click="collapseAllGroups"
        aria-hidden="true"
      ></div>
      <GalleryPhotoGridLayout
        ref="gridLayout"
        :items="unifiedItems"
        :layout="props.currentLayout"
        :selection-mode="props.selectionMode"
        :selected-photos="selectedPhotos"
        :expanding-group-id="expandingGroupId"
        :expanded-group-ids="expandedGroups"
        :are-all-groups-expanded="areAllGroupsExpanded"
        :is-edit-mode="isEditMode"
        :current-expanded-group-id="currentExpandedGroupId"
      @photo-click="handleItemClick"
      @toggle-selection="togglePhotoSelection"
      @reorder="reorderItems"
    >
      <template #photo-overlay="{ item }">
        <!-- Overlay for photos -->
        <div
          v-if="!item.isGroup && !props.selectionMode"
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4"
        >
          <button
            v-if="pb.authStore.isValid"
            @click.stop="toggleFavorite(item)"
            class="absolute top-3 right-12 bg-black/60 hover:bg-black/75 text-white rounded-full p-2 transition-colors duration-200"
            :title="isFavorited(item) ? 'Unfavorite' : 'Favorite'"
          >
            <Icon :name="isFavorited(item) ? 'heroicons:heart-solid' : 'heroicons:heart'" class="text-xl" />
          </button>
          <h3 v-if="item.title" class="text-white font-semibold text-lg mb-1">{{ item.title }}</h3>
          <p v-if="item.description" class="text-white/90 text-sm line-clamp-2">{{ item.description }}</p>
          
          <!-- Delete button -->
          <button
            @click.stop="confirmDelete(item)"
            class="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
            title="Delete photo"
          >
            <Icon name="heroicons:trash" class="text-xl" />
          </button>
        </div>
        
        <!-- Overlay for groups -->
        <div
          v-if="item.isGroup && !props.selectionMode"
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4"
        >
          <button
            v-if="pb.authStore.isValid"
            @click.stop="toggleFavorite(item)"
            class="absolute top-3 right-3 bg-black/60 hover:bg-black/75 text-white rounded-full p-2 transition-colors duration-200"
            :title="isFavorited(item) ? 'Unfavorite' : 'Favorite'"
          >
            <Icon :name="isFavorited(item) ? 'heroicons:heart-solid' : 'heroicons:heart'" class="text-xl" />
          </button>
          <h3 v-if="item.title" class="text-white font-semibold text-lg mb-1">{{ item.title }}</h3>
          <p v-if="item.description" class="text-white/90 text-sm line-clamp-2">{{ item.description }}</p>
          <p class="text-white/80 text-xs mt-1">{{ item.photoCount }} photo{{ item.photoCount !== 1 ? 's' : '' }}</p>
        </div>
      </template>
      
      <template #photo-item="{ item, getPhotoUrl }">
        <!-- Group with stack effect (collapsed) -->
        <div v-if="item.isGroup && !item.isExpanded" class="relative">
          <div class="group-stack-container">
            <!-- Stack layers (first layer is on top) -->
            <div
              v-for="(layer, index) in getStackLayers(item)"
              :key="layer.id"
              class="group-stack-layer"
              :style="{ 
                '--stack-x': `${index * 6}px`,
                '--stack-y': `${-index * 6}px`,
                '--stack-rotate': `${index === 0 ? 0 : (index % 2 ? -4 : 4)}deg`,
                '--stack-scale': `${1 - index * 0.05}`,
                '--stack-hover-x': `${index * 5}px`,
                '--stack-hover-y': `${-index * 7}px`,
                '--stack-hover-rotate': `${index === 0 ? 0 : (index % 2 ? -5 : 5)}deg`,
                opacity: Math.max(0.65, 1 - index * 0.18),
                zIndex: 10 - index
              }"
            >
              <img
                :src="getPhotoUrl(layer, '500x500')"
                :alt="layer.title || 'Photo'"
                class="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </div>
          
          <!-- Photo count badge -->
          <div class="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold z-20">
            {{ item.photoCount }}
          </div>

          <button
            v-if="props.selectionMode"
            @click.stop="toggleFavorite(item)"
            class="absolute top-2 right-2 text-white rounded-full p-2 transition-colors duration-200 z-20"
            :title="isFavorited(item) ? 'Unfavorite' : 'Favorite'"
          >
            <Icon :name="isFavorited(item) ? 'heroicons:heart-solid' : 'heroicons:heart'" class="text-xl" />
          </button>
        </div>
        
        <!-- Regular photo (including photos from expanded groups) -->
        <div v-else :class="['relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group', props.selectionMode && isEditMode && item.isGroupPhoto && item.parentGroupId === currentExpandedGroupId ? 'edit-mode-glow' : '']">
          <button
            v-if="props.selectionMode"
            @click.stop="toggleFavorite(item)"
            class="absolute top-2 right-2 text-white rounded-full p-2 transition-colors duration-200 z-20"
            :title="isFavorited(item) ? 'Unfavorite' : 'Favorite'"
          >
            <Icon :name="isFavorited(item) ? 'heroicons:heart-solid' : 'heroicons:heart'" class="text-xl" />
          </button>
          <img
            :src="getPhotoUrl(item, '500x500')"
            :alt="item.title || 'Photo'"
            class="w-full h-auto object-cover"
            loading="lazy"
          />
          
          <!-- Selection Checkbox -->
          <div
            v-if="props.selectionMode && !item.isGroup"
            class="absolute top-3 left-3 z-10"
            @click.stop="togglePhotoSelection(item)"
          >
            <div
              :class="[
                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                selectedPhotos.includes(item.id)
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white/90 border-white hover:bg-white'
              ]"
            >
              <Icon
                v-if="selectedPhotos.includes(item.id)"
                name="heroicons:check"
                class="text-white text-sm"
              />
            </div>
          </div>
        </div>
      </template>
      </GalleryPhotoGridLayout>
      <div
        v-if="expandedGroups.size > 0"
        class="gallery-dismiss-zone gallery-dismiss-zone--bottom"
        @click="collapseAllGroups"
        aria-hidden="true"
      ></div>
    </div>

    <!-- Lightbox Component -->
    <GalleryPhotoLightbox
      v-if="selectedPhoto"
      :photo="selectedPhoto"
      :photos="allPhotosForLightbox"
      @close="closeLightbox"
      @navigate="navigatePhoto"
      @tags-updated="handleTagsUpdated"
    />

  </div>
</template>

<script setup>
import { pb } from '#imports';
import { alertController } from '@ionic/vue';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import exifr from 'exifr';

const props = defineProps({
  selectionMode: {
    type: Boolean,
    default: false
  },
  dateSortDirection: {
    type: String,
    default: 'desc',
    validator: (value) => ['asc', 'desc'].includes(value)
  },
  currentLayout: {
    type: String,
    default: 'grid',
    validator: (value) => ['masonry', 'grid', 'tile'].includes(value)
  },
  albumId: {
    type: String,
    default: null
  },
  minLoadingMs: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update:selectionMode']);

// Use shared gallery state
const { selectedPhotos } = useGalleryState();

const photos = ref([]);
const groups = ref([]);
const loading = ref(true);
const selectedPhoto = ref(null);
const expandedGroups = ref(new Set()); // Track which groups are expanded
const expandingGroupId = ref(null); // Track which group is currently expanding
const expandedGroupsBeforeSelection = ref(new Set()); // Track expanded groups when entering selection mode
const gridLayout = ref(null); // Ref to the grid layout component
const replaceInput = ref(null);
const replacing = ref(false);
const groupCount = computed(() => groups.value.length);
const areAllGroupsExpanded = computed(() => {
  return groupCount.value > 0 && expandedGroups.value.size === groupCount.value;
});

const getPhotoDateValue = (photo) => {
  const value = photo?.dateTaken || photo?.created || 0;
  return new Date(value).getTime();
};

const getItemDateValue = (item) => {
  if (!item) return 0;
  if (item.isGroup) {
    return new Date(item.created || 0).getTime();
  }
  return getPhotoDateValue(item);
};

const getNextGroupSortOrder = () => {
  const step = 1000;
  const groupOrders = groups.value
    .map(group => group.sortOrder)
    .filter(order => typeof order === 'number');
  const maxOrder = groupOrders.length > 0 ? Math.max(...groupOrders) : 0;
  return maxOrder + step;
};

const comparePhotoDate = (a, b) => {
  const diff = getPhotoDateValue(b) - getPhotoDateValue(a);
  return props.dateSortDirection === 'asc' ? -diff : diff;
};

const compareItemDate = (a, b) => {
  const diff = getItemDateValue(b) - getItemDateValue(a);
  return props.dateSortDirection === 'asc' ? -diff : diff;
};

const setItemSortOrder = (itemId, isGroup, sortOrder) => {
  const targetList = isGroup ? groups.value : photos.value;
  const itemIndex = targetList.findIndex(item => item.id === itemId);
  if (itemIndex === -1) return;
  targetList[itemIndex] = { ...targetList[itemIndex], sortOrder };
};

const setGroupPhotoSortOrder = (groupId, photoId, sortOrder) => {
  const groupIndex = groups.value.findIndex(group => group.id === groupId);
  if (groupIndex === -1) return;
  const group = groups.value[groupIndex];
  if (!group.expand?.photos) return;
  const photoIndex = group.expand.photos.findIndex(photo => photo.id === photoId);
  if (photoIndex === -1) return;
  const updatedPhotos = [...group.expand.photos];
  updatedPhotos[photoIndex] = { ...updatedPhotos[photoIndex], sortOrder };
  groups.value[groupIndex] = {
    ...group,
    expand: {
      ...group.expand,
      photos: updatedPhotos
    }
  };
};


const ensureSortOrder = async (items) => {
  if (!pb.authStore.isValid) return;
  const missing = items.filter(item => typeof item.sortOrder !== 'number');
  if (missing.length === 0) return;

  const withOrder = items.filter(item => typeof item.sortOrder === 'number');
  const step = 1000;

  // Sort missing items by existing sortOrder first (to preserve any partial ordering), then by date
  const missingSorted = [...missing].sort((a, b) => {
    const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
    const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
    if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return compareItemDate(a, b);
  });

  let updates = [];
  if (withOrder.length === 0) {
    // No items have sortOrder yet - assign based on date order
    updates = missingSorted.map((item, index) => ({
      item,
      sortOrder: index * step
    }));
  } else {
    // Some items have sortOrder - place missing items at the end (after max) to preserve existing order
    const maxOrder = Math.max(...withOrder.map(item => item.sortOrder));
    updates = missingSorted.map((item, index) => ({
      item,
      sortOrder: maxOrder + step * (index + 1)
    }));
  }

  await Promise.all(updates.map(async ({ item, sortOrder }) => {
    try {
      const collectionName = item.isGroup ? 'groups' : 'photos';
      await pb.collection(collectionName).update(item.id, { sortOrder });
      setItemSortOrder(item.id, item.isGroup, sortOrder);
    } catch (error) {
      console.error('Error updating sort order:', error);
    }
  }));
};

const ensureGroupPhotoSortOrder = async () => {
  if (!pb.authStore.isValid) return;
  const step = 1000;
  const updates = [];

  groups.value.forEach(group => {
    const photosInGroup = group.expand?.photos || [];
    if (photosInGroup.length === 0) return;

    const missing = photosInGroup.filter(photo => typeof photo.sortOrder !== 'number');
    const numericOrders = photosInGroup
      .map(photo => photo.sortOrder)
      .filter(order => typeof order === 'number');
    const uniqueOrders = new Set(numericOrders);
    const needsNormalize = numericOrders.length !== photosInGroup.length || uniqueOrders.size !== photosInGroup.length;

    if (missing.length === 0 && !needsNormalize) return;

    const sortedPhotos = [...photosInGroup].sort(comparePhotoDate);
    sortedPhotos.forEach((photo, index) => {
      updates.push({
        groupId: group.id,
        photoId: photo.id,
        sortOrder: index * step
      });
    });
  });

  if (updates.length === 0) return;

  await Promise.all(updates.map(async ({ groupId, photoId, sortOrder }) => {
    try {
      await pb.collection('photos').update(photoId, { sortOrder });
      setGroupPhotoSortOrder(groupId, photoId, sortOrder);
    } catch (error) {
      console.error('Error updating group photo sort order:', error);
    }
  }));
};

// Fetch photos and groups from PocketBase
const fetchPhotos = async () => {
  const startedAt = Date.now();
  try {
    const albumFilter = props.albumId
      ? `album = "${props.albumId}"`
      : '(album = "" || album = null || favorite = true)';
    // Fetch all photos
    const allPhotos = await pb.collection('photos').getFullList({
      sort: props.dateSortDirection === 'asc' ? 'dateTaken,created' : '-dateTaken,-created',
      expand: 'tags,group',
      filter: albumFilter
    });
    
    // Fetch groups with expanded relations
    const allGroups = await pb.collection('groups').getFullList({
      sort: '-created',
      expand: 'coverPhoto,photos,photos.tags,user',
      filter: albumFilter
    });
    
    groups.value = allGroups;
    
    // Filter out photos that are in groups
    // In the main gallery (no albumId), favorited photos from groups also appear as standalone
    // In album pages, all grouped photos stay within their groups
    photos.value = allPhotos.filter(photo => {
      if (!photo.group) return true; // Not in a group - always include
      if (props.albumId) return false; // In album page - grouped photos stay in groups only
      return photo.favorite; // Main gallery - include favorited photos from groups
    });

    const itemsForOrdering = [
      ...photos.value.map(photo => ({ ...photo, isGroup: false })),
      ...groups.value.map(group => ({ ...group, isGroup: true }))
    ];
    await ensureSortOrder(itemsForOrdering);
    await ensureGroupPhotoSortOrder();
  } catch (error) {
    console.error('Error fetching photos:', error);
  } finally {
    const elapsed = Date.now() - startedAt;
    const waitMs = Math.max(0, props.minLoadingMs - elapsed);
    if (waitMs > 0) {
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    loading.value = false;
  }
};

// Check if we're in edit mode (only one specific group is expanded, not all groups)
const isEditMode = computed(() => {
  // Edit mode is when exactly one group is expanded and not all groups
  if (expandedGroups.value.size === 0) return false;
  if (expandedGroups.value.size === groups.value.length && groups.value.length > 1) return false;
  return expandedGroups.value.size === 1;
});

// Get the currently expanded group ID (for edit mode)
const currentExpandedGroupId = computed(() => {
  if (isEditMode.value && expandedGroups.value.size === 1) {
    return Array.from(expandedGroups.value)[0];
  }
  return null;
});

const baseItems = computed(() => {
  const items = [];
  const seenPhotoIds = new Set();
  const seenGroupIds = new Set();

  const addPhotoItem = (photo) => {
    if (!photo || seenPhotoIds.has(photo.id)) return;
    items.push({
      ...photo,
      isGroup: false,
      created: photo.created,
      sortOrder: photo.sortOrder
    });
    seenPhotoIds.add(photo.id);
  };

  const addGroupItem = (group) => {
    if (!group || seenGroupIds.has(group.id)) return;
    const orderedGroupPhotos = [...(group.expand?.photos || [])].sort((a, b) => {
      const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
      const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
      if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
      if (aOrder !== null) return -1;
      if (bOrder !== null) return 1;
      return comparePhotoDate(a, b);
    });
    const coverPhoto = orderedGroupPhotos[0] ||
      group.expand?.coverPhoto ||
      (group.expand?.photos?.find(p => p.id === group.coverPhoto)) ||
      (group.expand?.photos?.[0]);

    items.push({
      id: group.id,
      title: group.title,
      description: group.description,
      photo: coverPhoto?.photo,
      isGroup: true,
      group: group,
      photoCount: group.expand?.photos?.length || group.photos?.length || 0,
      created: group.created,
      sortOrder: group.sortOrder,
      isExpanded: expandedGroups.value.has(group.id)
    });
    seenGroupIds.add(group.id);
  };
  
  // Add photos that are not in groups
  if (photos.value && Array.isArray(photos.value)) {
    photos.value.forEach(photo => {
      addPhotoItem(photo);
    });
  }
  
  // Add groups as items
  if (groups.value && Array.isArray(groups.value)) {
    groups.value.forEach(group => {
      addGroupItem(group);
    });
  }

  return items;
});

const orderedBaseItems = computed(() => {
  const items = [...baseItems.value];
  items.sort((a, b) => {
    const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
    const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
    if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return compareItemDate(a, b);
  });
  return items;
});

// Create unified items array (photos + groups) based on manual order
const unifiedItems = computed(() => {
  // Build result: skip expanded groups, but include their photos
  const result = [];
  const seenPhotoIds = new Set();
  const seenGroupIds = new Set();

  // First, collect all photo IDs that belong to expanded groups
  // These should NOT appear as standalone photos
  const photosInExpandedGroups = new Set();
  orderedBaseItems.value.forEach(item => {
    if (item.isGroup && item.isExpanded && item.group?.expand?.photos) {
      item.group.expand.photos.forEach(photo => {
        photosInExpandedGroups.add(photo.id);
      });
    }
  });

  orderedBaseItems.value.forEach(item => {
    // If this is an expanded group, skip it but add its photos
    if (item.isGroup && item.isExpanded && item.group?.expand?.photos) {
      const groupPhotos = [...item.group.expand.photos].sort((a, b) => {
        const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
        const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
        if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
        if (aOrder !== null) return -1;
        if (bOrder !== null) return 1;
        return comparePhotoDate(a, b);
      });
      groupPhotos.forEach(photo => {
        if (seenPhotoIds.has(photo.id)) return;
        seenPhotoIds.add(photo.id);
        result.push({
          ...photo,
          isGroup: false,
          isGroupPhoto: true,
          parentGroupId: item.id,
          created: photo.created || item.created
        });
      });
    } else {
      if (item.isGroup) {
        if (seenGroupIds.has(item.id)) return;
        seenGroupIds.add(item.id);
      } else {
        // Skip standalone photos that belong to an expanded group
        // They will be shown within the group context instead
        if (photosInExpandedGroups.has(item.id)) return;
        if (seenPhotoIds.has(item.id)) return;
        seenPhotoIds.add(item.id);
      }
      // Add regular items (photos and collapsed groups)
      result.push(item);
    }
  });

  return result;
});

// Get stack layers for group display (show up to 3 photos stacked)
const getStackLayers = (item) => {
  if (!item.isGroup || !item.group?.expand?.photos) return [];
  const photos = [...item.group.expand.photos].sort((a, b) => {
    const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
    const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
    if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return comparePhotoDate(a, b);
  });

  // Return the first ordered photo, then up to 2 more photos
  return photos.slice(0, 3);
};

// All photos for lightbox navigation (follows gallery order)
const allPhotosForLightbox = computed(() => {
  const orderedPhotos = [];
  const seen = new Set();

  orderedBaseItems.value.forEach(item => {
    if (item.isGroup && item.group?.expand?.photos) {
      const groupPhotos = [...item.group.expand.photos].sort((a, b) => {
        const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
        const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
        if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
        if (aOrder !== null) return -1;
        if (bOrder !== null) return 1;
        return comparePhotoDate(a, b);
      });
      groupPhotos.forEach(photo => {
        if (!seen.has(photo.id)) {
          seen.add(photo.id);
          orderedPhotos.push(photo);
        }
      });
      return;
    }

    if (!item.isGroup && !seen.has(item.id)) {
      seen.add(item.id);
      orderedPhotos.push(item);
    }
  });

  return orderedPhotos;
});

// Get selected photos data (full objects) - includes photos from groups
const selectedPhotosData = computed(() => {
  const selected = [];
  
  // Add standalone photos
  selected.push(...photos.value.filter(p => selectedPhotos.value.includes(p.id)));
  
  // Add photos from expanded groups
  groups.value.forEach(group => {
    if (group.expand?.photos) {
      const groupPhotos = group.expand.photos.filter(p => selectedPhotos.value.includes(p.id));
      selected.push(...groupPhotos);
    }
  });
  
  return selected;
});

// Check which selected photos are inside vs outside the expanded group (for edit mode)
const selectedPhotosInGroup = computed(() => {
  if (!isEditMode.value || !currentExpandedGroupId.value) return [];
  
  const currentGroup = groups.value.find(g => g.id === currentExpandedGroupId.value);
  if (!currentGroup) return [];
  
  return selectedPhotos.value.filter(photoId => 
    currentGroup.photos?.includes(photoId)
  );
});

const selectedPhotosOutsideGroup = computed(() => {
  if (!isEditMode.value || !currentExpandedGroupId.value) return [];
  
  return selectedPhotos.value.filter(photoId => 
    !selectedPhotosInGroup.value.includes(photoId)
  );
});

// Determine if we should show "Add to Group" or "Remove from Group" button
const hasPhotosOutsideGroup = computed(() => {
  return isEditMode.value && selectedPhotosOutsideGroup.value.length > 0;
});

// Get photo URL with thumbnail
const getPhotoUrl = (photo, thumb = '500x500') => {
  return pb.files.getURL(photo, photo.photo, { thumb });
};

const setPhotoFavorite = (photoId, value) => {
  const photoIndex = photos.value.findIndex(photo => photo.id === photoId);
  if (photoIndex !== -1) {
    photos.value[photoIndex] = { ...photos.value[photoIndex], favorite: value };
  }

  groups.value = groups.value.map(group => {
    if (!group.expand?.photos) return group;
    const updatedPhotos = group.expand.photos.map(photo =>
      photo.id === photoId ? { ...photo, favorite: value } : photo
    );
    return {
      ...group,
      expand: {
        ...group.expand,
        photos: updatedPhotos
      }
    };
  });

  if (selectedPhoto.value?.id === photoId) {
    selectedPhoto.value = { ...selectedPhoto.value, favorite: value };
  }
};

const setGroupFavorite = (groupId, value) => {
  const groupIndex = groups.value.findIndex(group => group.id === groupId);
  if (groupIndex === -1) return;
  groups.value[groupIndex] = { ...groups.value[groupIndex], favorite: value };
};

const isFavorited = (item) => {
  if (item.isGroup) {
    return item.group?.favorite ?? item.favorite ?? false;
  }
  return item.favorite ?? false;
};

const toggleFavorite = async (item) => {
  if (!pb.authStore.isValid || !pb.authStore.record?.id) return;

  const currentFavorite = item.isGroup ? (item.group?.favorite ?? item.favorite ?? false) : (item.favorite ?? false);
  const nextFavorite = !currentFavorite;

  if (item.isGroup) {
    setGroupFavorite(item.id, nextFavorite);
    try {
      await pb.collection('groups').update(item.id, { favorite: nextFavorite });
    } catch (error) {
      console.error('Error updating group favorite:', error);
      setGroupFavorite(item.id, currentFavorite);
    }
    return;
  }

  setPhotoFavorite(item.id, nextFavorite);
  try {
    await pb.collection('photos').update(item.id, { favorite: nextFavorite });
  } catch (error) {
    console.error('Error updating photo favorite:', error);
    setPhotoFavorite(item.id, currentFavorite);
  }
};

const handleTagsUpdated = ({ photoId, tags }) => {
  const tagIds = tags.map(tag => tag.id);

  photos.value = photos.value.map(photo => {
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

  groups.value = groups.value.map(group => {
    if (!group.expand?.photos) return group;
    const updatedPhotos = group.expand.photos.map(photo => {
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
    return {
      ...group,
      expand: {
        ...group.expand,
        photos: updatedPhotos
      }
    };
  });

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

// Open lightbox
const openLightbox = (photo) => {
  selectedPhoto.value = photo;
};

// Close lightbox
const closeLightbox = () => {
  selectedPhoto.value = null;
};

// Navigate between photos in lightbox
const navigatePhoto = (direction) => {
  const allPhotos = allPhotosForLightbox.value;
  const currentIndex = allPhotos.findIndex(p => p.id === selectedPhoto.value.id);
  let newIndex;
  
  if (direction === 'next') {
    newIndex = (currentIndex + 1) % allPhotos.length;
  } else {
    newIndex = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
  }
  
  selectedPhoto.value = allPhotos[newIndex];
};

const lastSelectedPhotoId = ref(null);

const clearSelectionState = () => {
  selectedPhotos.value = [];
  lastSelectedPhotoId.value = null;
};

// Toggle photo selection
const togglePhotoSelection = (payload) => {
  const { item, shiftKey } = payload?.item ? payload : { item: payload, shiftKey: false };
  // Only allow selecting photos, not groups
  if (item.isGroup) return;
  
  if (shiftKey && lastSelectedPhotoId.value) {
    const selectableIds = unifiedItems.value
      .filter(candidate => !candidate.isGroup)
      .map(candidate => candidate.id);
    const startIndex = selectableIds.indexOf(lastSelectedPhotoId.value);
    const endIndex = selectableIds.indexOf(item.id);
    if (startIndex !== -1 && endIndex !== -1) {
      const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      const rangeIds = selectableIds.slice(from, to + 1);
      const selectionSet = new Set(selectedPhotos.value);
      rangeIds.forEach(id => selectionSet.add(id));
      selectedPhotos.value = Array.from(selectionSet);
      lastSelectedPhotoId.value = item.id;
      return;
    }
  }

  const index = selectedPhotos.value.indexOf(item.id);
  if (index > -1) {
    selectedPhotos.value.splice(index, 1);
  } else {
    selectedPhotos.value.push(item.id);
  }
  lastSelectedPhotoId.value = item.id;
};

const reorderItems = async ({ sourceId, targetId, groupId }) => {
  if (!props.selectionMode) return;
  if (!sourceId || !targetId || sourceId === targetId) return;

  if (groupId) {
    if (!isEditMode.value || currentExpandedGroupId.value !== groupId) return;
    const group = groups.value.find(item => item.id === groupId);
    const groupPhotos = group?.expand?.photos || [];
    const orderedGroupPhotos = [...groupPhotos].sort((a, b) => {
      const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
      const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
      if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
      if (aOrder !== null) return -1;
      if (bOrder !== null) return 1;
      return getPhotoDateValue(b) - getPhotoDateValue(a);
    });
    const ids = orderedGroupPhotos.map(photo => photo.id);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, sourceId);

    const prevId = ids[toIndex - 1];
    const nextId = ids[toIndex + 1];
    const prevItem = prevId ? orderedGroupPhotos.find(photo => photo.id === prevId) : null;
    const nextItem = nextId ? orderedGroupPhotos.find(photo => photo.id === nextId) : null;
    const prevOrder = typeof prevItem?.sortOrder === 'number' ? prevItem.sortOrder : null;
    const nextOrder = typeof nextItem?.sortOrder === 'number' ? nextItem.sortOrder : null;

    // Check if sortOrders are too close or identical (need renormalization)
    const needsRenormalization = 
      (prevOrder !== null && nextOrder !== null && Math.abs(nextOrder - prevOrder) < 0.1) ||
      (prevOrder === null && nextOrder !== null && nextOrder === 0) ||
      (prevOrder !== null && nextOrder === null && prevOrder === 0);

    if (needsRenormalization) {
      // Renormalize all photos in the group with proper spacing
      const step = 1000;
      const renormalizeUpdates = [];
      
      for (let i = 0; i < ids.length; i++) {
        const photoId = ids[i];
        const newSortOrder = i * step;
        renormalizeUpdates.push({ photoId, sortOrder: newSortOrder });
      }
      
      // Apply renormalization to database and local state
      await Promise.all(renormalizeUpdates.map(async ({ photoId, sortOrder }) => {
        try {
          await pb.collection('photos').update(photoId, { sortOrder });
          setGroupPhotoSortOrder(groupId, photoId, sortOrder);
        } catch (error) {
          console.error('Error renormalizing group photo sort order:', error);
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

    try {
      await pb.collection('photos').update(sourceId, { sortOrder: newOrder });
      // Only update local state after database update succeeds
      setGroupPhotoSortOrder(groupId, sourceId, newOrder);
    } catch (error) {
      console.error('Error updating group photo sort order:', error);
    }
    return;
  }

  const ids = orderedBaseItems.value.map(item => item.id);
  const fromIndex = ids.indexOf(sourceId);
  const toIndex = ids.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1) return;

  ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, sourceId);

  const sourceItem = baseItems.value.find(item => item.id === sourceId);
  if (!sourceItem) return;

  const prevId = ids[toIndex - 1];
  const nextId = ids[toIndex + 1];
  const prevItem = prevId ? baseItems.value.find(item => item.id === prevId) : null;
  const nextItem = nextId ? baseItems.value.find(item => item.id === nextId) : null;
  const prevOrder = typeof prevItem?.sortOrder === 'number' ? prevItem.sortOrder : null;
  const nextOrder = typeof nextItem?.sortOrder === 'number' ? nextItem.sortOrder : null;

  // Check if sortOrders are too close or identical (need renormalization)
  const needsRenormalization = 
    (prevOrder !== null && nextOrder !== null && Math.abs(nextOrder - prevOrder) < 0.1) ||
    (prevOrder === null && nextOrder !== null && nextOrder === 0) ||
    (prevOrder !== null && nextOrder === null && prevOrder === 0);

  if (needsRenormalization) {
    // Renormalize all items with proper spacing
    const step = 1000;
    const renormalizeUpdates = [];
    
    for (let i = 0; i < ids.length; i++) {
      const itemId = ids[i];
      const item = baseItems.value.find(it => it.id === itemId);
      if (!item) continue;
      
      const newSortOrder = i * step;
      const collectionName = item.isGroup ? 'groups' : 'photos';
      renormalizeUpdates.push({ itemId, item, sortOrder: newSortOrder, collectionName });
    }
    
    // Apply renormalization to database and local state
    await Promise.all(renormalizeUpdates.map(async ({ itemId, item, sortOrder, collectionName }) => {
      try {
        await pb.collection(collectionName).update(itemId, { sortOrder });
        setItemSortOrder(itemId, item.isGroup, sortOrder);
      } catch (error) {
        console.error('Error renormalizing item sort order:', error);
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

  try {
    const collectionName = sourceItem.isGroup ? 'groups' : 'photos';
    await pb.collection(collectionName).update(sourceId, { sortOrder: newOrder });
    // Only update local state after database update succeeds
    setItemSortOrder(sourceId, sourceItem.isGroup, newOrder);
  } catch (error) {
    console.error('Error updating sort order:', error);
  }
};

// Handle group expansion when selection mode changes
watch(() => props.selectionMode, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    // When entering selection mode, save the current expanded groups state
    expandedGroupsBeforeSelection.value = new Set(expandedGroups.value);
  } else if (!newValue && oldValue) {
    // When exiting selection mode, clear selection
    clearSelectionState();
    
    // Restore the expanded groups state from before selection mode was activated
    // If no groups were expanded before, this will collapse all groups
    expandedGroups.value = new Set(expandedGroupsBeforeSelection.value);
    expandedGroupsBeforeSelection.value = new Set(); // Clear the saved state
  }
});

// Clear selection
const clearSelection = () => {
  clearSelectionState();
};

const extractMetadata = async (file) => {
  try {
    const exifData = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      ifd0: true,
      ifd1: true,
      interop: true
    });

    if (!exifData) {
      return null;
    }

    return {
      exif: exifData,
      cameraMake: exifData.Make || null,
      cameraModel: exifData.Model || null,
      lens: exifData.LensModel || exifData.LensInfo || null,
      iso: exifData.ISO || null,
      shutterSpeed: exifData.ExposureTime ? `1/${Math.round(1 / exifData.ExposureTime)}` : null,
      aperture: exifData.FNumber || null,
      focalLength: exifData.FocalLength || null,
      dateTaken: exifData.DateTimeOriginal || exifData.DateTime || null,
      latitude: exifData.latitude || null,
      longitude: exifData.longitude || null,
      width: exifData.ImageWidth || exifData.ExifImageWidth || null,
      height: exifData.ImageHeight || exifData.ExifImageHeight || null,
      orientation: exifData.Orientation || null,
      fileSize: file.size
    };
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return null;
  }
};

const triggerReplace = () => {
  if (replacing.value) return;
  if (!replaceInput.value) return;
  replaceInput.value.click();
};

const handleReplaceSelect = async (event) => {
  const file = event?.target?.files?.[0];
  event.target.value = '';
  if (!file) return;
  await replaceSelectedPhoto(file);
};

const replaceSelectedPhoto = async (file) => {
  const target = selectedPhotosData.value[0];
  if (!target?.id) return;
  if (!pb.authStore.isValid) return;

  replacing.value = true;
  try {
    const metadata = await extractMetadata(file);
    const formData = new FormData();
    formData.append('photo', file);

    const appendValue = (key, value) => {
      formData.append(key, value ?? '');
    };

    appendValue('exif', metadata?.exif ? JSON.stringify(metadata.exif) : '');
    appendValue('cameraMake', metadata?.cameraMake ?? '');
    appendValue('cameraModel', metadata?.cameraModel ?? '');
    appendValue('lens', metadata?.lens ?? '');
    appendValue('iso', metadata?.iso != null ? metadata.iso.toString() : '');
    appendValue('shutterSpeed', metadata?.shutterSpeed ?? '');
    appendValue('aperture', metadata?.aperture != null ? metadata.aperture.toString() : '');
    appendValue('focalLength', metadata?.focalLength != null ? metadata.focalLength.toString() : '');
    if (metadata?.dateTaken) {
      const dateStr = metadata.dateTaken instanceof Date
        ? metadata.dateTaken.toISOString()
        : metadata.dateTaken;
      appendValue('dateTaken', dateStr);
    } else {
      appendValue('dateTaken', '');
    }
    appendValue('latitude', metadata?.latitude != null ? metadata.latitude.toString() : '');
    appendValue('longitude', metadata?.longitude != null ? metadata.longitude.toString() : '');
    appendValue('width', metadata?.width != null ? metadata.width.toString() : '');
    appendValue('height', metadata?.height != null ? metadata.height.toString() : '');
    appendValue('orientation', metadata?.orientation != null ? metadata.orientation.toString() : '');
    appendValue('fileSize', metadata?.fileSize != null ? metadata.fileSize.toString() : '');

    await pb.collection('photos').update(target.id, formData);
    refresh();
  } catch (error) {
    console.error('Error replacing photo:', error);
  } finally {
    replacing.value = false;
  }
};

const createQuickGroup = async () => {
  if (selectedPhotosData.value.length < 2) return;
  const currentUser = pb.authStore.record;
  if (!currentUser) return;

  try {
    const photoIds = selectedPhotosData.value.map(photo => photo.id);
    const coverPhotoId = photoIds[0];
    
    // Choose a sortOrder for the new group
    const firstPhoto = selectedPhotosData.value[0];
    const groupSortOrder = props.albumId
      ? getNextGroupSortOrder()
      : (typeof firstPhoto.sortOrder === 'number' ? firstPhoto.sortOrder : 0);
    
    const groupData = {
      title: '',
      description: '',
      coverPhoto: coverPhotoId,
      photos: photoIds,
      user: currentUser.id,
      sortOrder: groupSortOrder
    };
    if (props.albumId) {
      groupData.album = props.albumId;
    }

    const group = await pb.collection('groups').create(groupData);

    for (const photoId of photoIds) {
      const updateData = { group: group.id };
      if (props.albumId) {
        updateData.album = props.albumId;
      }
      await pb.collection('photos').update(photoId, updateData);
    }

    clearSelectionState();
    refresh();
  } catch (error) {
    console.error('Error creating group:', error);
  }
};

// Handle item click (photo or group)
const handleItemClick = (item) => {
  if (item.isGroup) {
    // In selection mode, allow switching between groups for editing
    if (props.selectionMode) {
      // If this group is already expanded, do nothing
      if (expandedGroups.value.has(item.id)) {
        return;
      }
      
      // Collapse all groups and expand this one
      expandedGroups.value.clear();
      clearSelectionState();
      toggleGroupExpansion(item.id);
      return;
    }
    
    // If there are expanded groups and this group is not one of them, collapse all groups
    if (expandedGroups.value.size > 0 && !expandedGroups.value.has(item.id)) {
      // Collapse all groups
      expandedGroups.value.clear();
      expandingGroupId.value = null;
      return; // Don't expand the clicked group, just collapse
    }
    
    // Toggle group expansion
    toggleGroupExpansion(item.id);
  } else {
    // In selection mode, clicking photos is handled by the grid layout (toggles selection)
    if (props.selectionMode) {
      return;
    }
    
    // If there are expanded groups and this photo is not part of any expanded group, collapse all groups
    if (expandedGroups.value.size > 0) {
      const isPartOfExpandedGroup = item.isGroupPhoto && expandedGroups.value.has(item.parentGroupId);
      
      if (!isPartOfExpandedGroup) {
        // Collapse all groups
        expandedGroups.value.clear();
        expandingGroupId.value = null;
        return; // Don't open lightbox, just collapse
      }
    }
    
    // Open photo in lightbox
    openLightbox(item);
  }
};

// Collapse all groups (called when clicking margins)
const collapseAllGroups = () => {
  expandedGroups.value.clear();
  expandingGroupId.value = null;
};

const expandAllGroups = () => {
  if (groups.value.length === 0) return;
  expandedGroups.value = new Set(groups.value.map(group => group.id));
  expandingGroupId.value = null;
};

// Toggle group expansion
const toggleGroupExpansion = async (groupId) => {
  if (expandedGroups.value.has(groupId)) {
    // Collapsing - just remove from set with smooth transition
    expandedGroups.value.delete(groupId);
    expandingGroupId.value = null;
    
    // Wait for DOM update and scroll to the collapsed group position
    await nextTick();
    setTimeout(() => {
      const groupElement = document.querySelector(`[data-item-id="${groupId}"]`);
      if (groupElement) {
        groupElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  } else {
    // Expanding - prepare animation
    expandingGroupId.value = groupId;
    
    // Find the group element before expansion
    await nextTick();
    const groupElement = document.querySelector(`[data-item-id="${groupId}"]`);
    if (groupElement && gridLayout.value?.prepareAnimation) {
      gridLayout.value.prepareAnimation(groupElement);
    }
    
    // Add to expanded groups
    expandedGroups.value.add(groupId);
    
    // Clear expanding flag after animation completes
    setTimeout(() => {
      expandingGroupId.value = null;
    }, 700);
  }
};

// Confirm delete with Ionic alert
const confirmDelete = async (photo) => {
  const alert = await alertController.create({
    header: 'Delete Photo',
    message: `Are you sure you want to delete ${photo.title || 'this photo'}?`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => deletePhoto(photo)
      }
    ]
  });
  await alert.present();
};

// Delete photo
const deletePhoto = async (photo) => {
  try {
    let groupToCheck = null;
    
    // If photo is in a group, remove it from the group first
    if (photo.group) {
      groupToCheck = photo.group;
      const group = await pb.collection('groups').getOne(photo.group);
      const updatedPhotos = group.photos.filter(id => id !== photo.id);
      
      // Update group photos
      await pb.collection('groups').update(group.id, {
        photos: updatedPhotos
      });
      
      // If this was the cover photo, set a new one or clear it
      if (group.coverPhoto === photo.id) {
        const newCoverPhoto = updatedPhotos.length > 0 ? updatedPhotos[0] : '';
        await pb.collection('groups').update(group.id, {
          coverPhoto: newCoverPhoto
        });
      }
    }
    
    await pb.collection('photos').delete(photo.id);
    photos.value = photos.value.filter(p => p.id !== photo.id);
    
    // Check if the group has 0 or 1 photos left and handle accordingly
    if (groupToCheck) {
      try {
        const group = await pb.collection('groups').getOne(groupToCheck);
        if (!group.photos || group.photos.length === 0) {
          // Delete empty group
          await pb.collection('groups').delete(groupToCheck);
          console.log(`Automatically deleted empty group: ${groupToCheck}`);
        } else if (group.photos.length === 1) {
          // Only one photo left - convert to standalone photo
          const lastPhotoId = group.photos[0];
          const groupSortOrder = group.sortOrder;
          
          // Remove group reference from the photo and set its sortOrder to group's sortOrder
          await pb.collection('photos').update(lastPhotoId, { 
            group: '',
            sortOrder: groupSortOrder
          });
          
          // Delete the group
          await pb.collection('groups').delete(groupToCheck);
          console.log(`Automatically deleted single-photo group: ${groupToCheck}, photo ${lastPhotoId} is now standalone`);
        }
      } catch (error) {
        console.error(`Error checking/deleting group ${groupToCheck}:`, error);
      }
    }
    
    // Close lightbox if deleted photo was open
    if (selectedPhoto.value?.id === photo.id) {
      selectedPhoto.value = null;
    }
    
    // Refresh to update groups
    refresh();
  } catch (error) {
    console.error('Error deleting photo:', error);
  }
};

// Confirm delete selected photos
const confirmDeleteSelected = async () => {
  if (selectedPhotos.value.length === 0) return;
  
  const photoCount = selectedPhotos.value.length;
  const alert = await alertController.create({
    header: 'Delete Photos',
    message: `Are you sure you want to delete ${photoCount} photo${photoCount !== 1 ? 's' : ''}? This action cannot be undone.`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => deleteSelectedPhotos()
      }
    ]
  });
  await alert.present();
};

// Delete multiple selected photos
const deleteSelectedPhotos = async () => {
  if (selectedPhotos.value.length === 0) return;
  
  try {
    const photosToDelete = selectedPhotosData.value;
    const groupsToCheck = new Set(); // Track groups that may become empty or single-photo
    
    // Delete each photo
    for (const photo of photosToDelete) {
      // If photo is in a group, remove it from the group first
      if (photo.group) {
        groupsToCheck.add(photo.group); // Track this group
        const group = await pb.collection('groups').getOne(photo.group);
        const updatedPhotos = group.photos.filter(id => id !== photo.id);
        
        // Update group photos
        await pb.collection('groups').update(group.id, {
          photos: updatedPhotos
        });
        
        // If this was the cover photo, set a new one or clear it
        if (group.coverPhoto === photo.id) {
          const newCoverPhoto = updatedPhotos.length > 0 ? updatedPhotos[0] : '';
          await pb.collection('groups').update(group.id, {
            coverPhoto: newCoverPhoto
          });
        }
      }
      
      // Delete the photo
      await pb.collection('photos').delete(photo.id);
    }
    
    // Check if any groups have 0 or 1 photos left and handle accordingly
    for (const groupId of groupsToCheck) {
      try {
        const group = await pb.collection('groups').getOne(groupId);
        if (!group.photos || group.photos.length === 0) {
          // Delete empty group
          await pb.collection('groups').delete(groupId);
          console.log(`Automatically deleted empty group: ${groupId}`);
        } else if (group.photos.length === 1) {
          // Only one photo left - convert to standalone photo
          const lastPhotoId = group.photos[0];
          const groupSortOrder = group.sortOrder;
          
          // Remove group reference from the photo and set its sortOrder to group's sortOrder
          await pb.collection('photos').update(lastPhotoId, { 
            group: '',
            sortOrder: groupSortOrder
          });
          
          // Delete the group
          await pb.collection('groups').delete(groupId);
          console.log(`Automatically deleted single-photo group: ${groupId}, photo ${lastPhotoId} is now standalone`);
        }
      } catch (error) {
        console.error(`Error checking/deleting group ${groupId}:`, error);
      }
    }
    
    // Update local state
    photos.value = photos.value.filter(p => !selectedPhotos.value.includes(p.id));
    
    // Close lightbox if deleted photo was open
    if (selectedPhoto.value && selectedPhotos.value.includes(selectedPhoto.value.id)) {
      selectedPhoto.value = null;
    }
    
    // Clear selection and exit selection mode if in edit mode
    clearSelectionState();
    if (isEditMode.value) {
      emit('update:selectionMode', false);
      expandedGroups.value.clear();
    }
    
    // Refresh to update groups
    refresh();
  } catch (error) {
    console.error('Error deleting selected photos:', error);
  }
};

// Add photos to group (Edit Mode)
const addPhotosToGroup = async () => {
  if (!isEditMode.value || !currentExpandedGroupId.value || selectedPhotos.value.length === 0) {
    return;
  }

  try {
    const groupId = currentExpandedGroupId.value;
    const group = await pb.collection('groups').getOne(groupId);
    
    // Add all selected photos to the group (combine existing and new)
    const updatedPhotos = [...new Set([...group.photos, ...selectedPhotos.value])];
    
    // Update group photos
    await pb.collection('groups').update(groupId, {
      photos: updatedPhotos
    });
    
    // Update the photos to add the group reference
    for (const photoId of selectedPhotos.value) {
      const updateData = { group: groupId };
      if (group.album) {
        updateData.album = group.album;
      }
      await pb.collection('photos').update(photoId, updateData);
    }
    
    // Clear selection and exit selection mode
    clearSelectionState();
    emit('update:selectionMode', false);
    
    // Refresh to update the gallery
    refresh();
  } catch (error) {
    console.error('Error adding photos to group:', error);
  }
};

// Remove photos from group (Edit Mode)
const removePhotosFromGroup = async () => {
  if (!isEditMode.value || !currentExpandedGroupId.value || selectedPhotos.value.length === 0) {
    return;
  }

  try {
    const groupId = currentExpandedGroupId.value;
    const group = await pb.collection('groups').getOne(groupId);
    
    // Filter out the selected photos from the group
    const updatedPhotos = group.photos.filter(id => !selectedPhotos.value.includes(id));
    
    // Check if the group will have 0 or 1 photos left after removal
    if (updatedPhotos.length === 0) {
      // Group will be empty - delete it
      await pb.collection('groups').delete(groupId);
      console.log(`Automatically deleted empty group: ${groupId}`);
      
      // Update removed photos to be standalone and positioned near the group
      const groupSortOrder = typeof group.sortOrder === 'number' ? group.sortOrder : 0;
      const sortOrderStep = 0.1;
      
      for (let i = 0; i < selectedPhotos.value.length; i++) {
        const photoId = selectedPhotos.value[i];
        const newSortOrder = groupSortOrder + sortOrderStep * (i + 1);
        
        await pb.collection('photos').update(photoId, {
          group: '',
          sortOrder: newSortOrder
        });
      }
    } else if (updatedPhotos.length === 1) {
      // Only one photo left - convert to standalone and delete group
      const lastPhotoId = updatedPhotos[0];
      const groupSortOrder = typeof group.sortOrder === 'number' ? group.sortOrder : 0;
      
      // Update the last remaining photo to be standalone at the group's position
      await pb.collection('photos').update(lastPhotoId, { 
        group: '',
        sortOrder: groupSortOrder
      });
      
      // Delete the group
      await pb.collection('groups').delete(groupId);
      console.log(`Automatically deleted single-photo group: ${groupId}, photo ${lastPhotoId} is now standalone`);
      
      // Update removed photos to appear right after
      const sortOrderStep = 0.1;
      for (let i = 0; i < selectedPhotos.value.length; i++) {
        const photoId = selectedPhotos.value[i];
        const newSortOrder = groupSortOrder + sortOrderStep * (i + 1);
        
        await pb.collection('photos').update(photoId, {
          group: '',
          sortOrder: newSortOrder
        });
      }
    } else {
      // Group still has 2+ photos - proceed normally
      // Update group photos
      await pb.collection('groups').update(groupId, {
        photos: updatedPhotos
      });
      
      // If the cover photo was removed, set a new one
      if (selectedPhotos.value.includes(group.coverPhoto)) {
        const newCoverPhoto = updatedPhotos[0];
        await pb.collection('groups').update(groupId, {
          coverPhoto: newCoverPhoto
        });
      }
      
      // Update the photos to remove the group reference and set sortOrder to appear next to the group
      const groupSortOrder = typeof group.sortOrder === 'number' ? group.sortOrder : 0;
      const sortOrderStep = 0.1;
      
      for (let i = 0; i < selectedPhotos.value.length; i++) {
        const photoId = selectedPhotos.value[i];
        const newSortOrder = groupSortOrder + sortOrderStep * (i + 1);
        
        await pb.collection('photos').update(photoId, {
          group: '',
          sortOrder: newSortOrder
        });
      }
    }
    
    // Clear selection and exit selection mode
    clearSelectionState();
    emit('update:selectionMode', false);
    
    // Refresh to update the gallery
    refresh();
  } catch (error) {
    console.error('Error removing photos from group:', error);
  }
};

// Confirm delete group
const confirmDeleteGroup = async () => {
  if (!isEditMode.value || !currentExpandedGroupId.value) return;
  
  const group = groups.value.find(g => g.id === currentExpandedGroupId.value);
  if (!group) return;
  
  const alert = await alertController.create({
    header: 'Delete Group',
    message: `Are you sure you want to delete the group "${group.title || 'Untitled Group'}"? This will remove all photos from the group and delete it.`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => deleteGroup()
      }
    ]
  });
  await alert.present();
};

// Delete group (removes all photos from group and deletes the group)
const deleteGroup = async () => {
  if (!isEditMode.value || !currentExpandedGroupId.value) return;
  
  try {
    const groupId = currentExpandedGroupId.value;
    const group = await pb.collection('groups').getOne(groupId);
    
    // Remove group reference from all photos in the group
    if (group.photos && group.photos.length > 0) {
      for (const photoId of group.photos) {
        await pb.collection('photos').update(photoId, {
          group: ''
        });
      }
    }
    
    // Delete the group
    await pb.collection('groups').delete(groupId);
    
    // Clear selection and exit selection mode
    clearSelectionState();
    emit('update:selectionMode', false);
    
    // Collapse the group (it's now deleted)
    expandedGroups.value.clear();
    
    // Refresh to update the gallery
    refresh();
  } catch (error) {
    console.error('Error deleting group:', error);
  }
};

// Refresh gallery (called from parent)
const refresh = () => {
  loading.value = true;
  fetchPhotos();
};

// Expose methods and state to parent
defineExpose({ 
  refresh,
  expandedGroups,
  collapseAllGroups,
  expandAllGroups,
  groupCount,
  areAllGroupsExpanded
});

onMounted(() => {
  fetchPhotos();
});
</script>

<style scoped>
.selection-actions-wrapper {
  position: sticky;
  top: calc(env(safe-area-inset-top, 0px) + 5.5rem); /* Account for navbar height + safe area */
  z-index: 999;
  margin-top: 0;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0 1rem;
}

.gallery-grid-shell {
  position: relative;
  padding: 2rem 0;
}

.gallery-dismiss-zone {
  position: absolute;
  left: 0;
  right: 0;
  height: 2rem;
  cursor: pointer;
}

.gallery-dismiss-zone--top {
  top: -0.75rem;
  height: 2.75rem;
}

.gallery-dismiss-zone--bottom {
  bottom: 0;
}

.selection-actions {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Masonry Layout for Groups */
.masonry-grid {
  column-count: 2;
  column-gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .masonry-grid {
    column-count: 3;
  }
}

@media (min-width: 1024px) {
  .masonry-grid {
    column-count: 3;
  }
}

@media (min-width: 1280px) {
  .masonry-grid {
    column-count: 4;
  }
}

/* Grid Layout for Groups */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .grid-layout {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid-layout {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .grid-layout {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* Tile Layout for Groups */
.tile-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .tile-layout {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .tile-layout {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1536px) {
  .tile-layout {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* Group Stack Effect */
.group-stack-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  transition: transform 0.3s ease;
}

.group-stack-container:hover {
  transform: translateY(-4px);
}

.group-stack-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  background: white;
  transform: translate(var(--stack-x), var(--stack-y)) rotate(var(--stack-rotate)) scale(var(--stack-scale));
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.group-stack-container:hover .group-stack-layer {
  transform: translate(var(--stack-hover-x), var(--stack-hover-y)) rotate(var(--stack-hover-rotate)) scale(var(--stack-scale));
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.group-stack-layer:last-child {
  position: relative;
}

.group-stack-layer img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

/* Glowing box shadow for photos in expanded group when in edit mode */
.edit-mode-glow {
  box-shadow: 0 0 8px rgba(255, 100, 255, 0.5), 0 0 15px rgba(255, 100, 255, 0.3);
}
</style>
