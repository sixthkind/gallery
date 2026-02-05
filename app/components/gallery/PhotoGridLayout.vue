<template>
  <div class="photo-grid-wrapper">
    <!-- Masonry Layout -->
    <TransitionGroup
      v-if="layout === 'masonry'"
      name="photo-grid"
      tag="div"
      class="masonry-grid"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-for="item in displayItems"
        :key="item.id"
        :data-item-id="item.id"
        :class="['masonry-item group cursor-pointer transition-opacity duration-500', getItemOpacity(item), getGlowClass(item), getHoverClass(item)]"
        :draggable="canDragItem(item)"
        @click="handlePhotoClick(item, $event)"
        @dragstart.stop="onDragStart(item, $event)"
        @dragover.prevent="onDragOver(item, $event)"
        @drop.prevent="onDrop(item, $event)"
        @dragend="onDragEnd"
      >
        <slot name="photo-item" :item="item" :photo="item" :getPhotoUrl="getPhotoUrl">
          <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <img
              :src="getPhotoUrl(item, '500x500')"
              :alt="item.title || 'Photo'"
              class="w-full h-auto object-cover"
              loading="lazy"
            />
            <!-- Selection Checkbox -->
            <div
              v-if="selectionMode && !item.isGroup"
              class="absolute top-3 left-3 z-10"
              @click.stop="toggleSelection(item, $event)"
            >
              <div
                :class="[
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                  isSelected(item.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white/90 border-white hover:bg-white'
                ]"
              >
                <Icon
                  v-if="isSelected(item.id)"
                  name="heroicons:check"
                  class="text-white text-sm"
                />
              </div>
            </div>
            <slot name="photo-overlay" :item="item" :photo="item"></slot>
          </div>
        </slot>
      </div>
    </TransitionGroup>

    <!-- Grid Layout -->
    <TransitionGroup
      v-else-if="layout === 'grid'"
      name="photo-grid"
      tag="div"
      class="grid-layout"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-for="item in displayItems"
        :key="item.id"
        :data-item-id="item.id"
        :class="['grid-item group cursor-pointer transition-opacity duration-500', getItemOpacity(item), getGlowClass(item), getHoverClass(item)]"
        :draggable="canDragItem(item)"
        @click="handlePhotoClick(item, $event)"
        @dragstart.stop="onDragStart(item, $event)"
        @dragover.prevent="onDragOver(item, $event)"
        @drop.prevent="onDrop(item, $event)"
        @dragend="onDragEnd"
      >
        <slot name="photo-item" :item="item" :photo="item" :getPhotoUrl="getPhotoUrl">
          <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 aspect-square">
            <img
              :src="getPhotoUrl(item, '500x500')"
              :alt="item.title || 'Photo'"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <!-- Selection Checkbox -->
            <div
              v-if="selectionMode && !item.isGroup"
              class="absolute top-3 left-3 z-10"
              @click.stop="toggleSelection(item, $event)"
            >
              <div
                :class="[
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                  isSelected(item.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white/90 border-white hover:bg-white'
                ]"
              >
                <Icon
                  v-if="isSelected(item.id)"
                  name="heroicons:check"
                  class="text-white text-sm"
                />
              </div>
            </div>
            <slot name="photo-overlay" :item="item" :photo="item"></slot>
          </div>
        </slot>
      </div>
    </TransitionGroup>

    <!-- Tile Layout -->
    <TransitionGroup
      v-else-if="layout === 'tile'"
      name="photo-grid"
      tag="div"
      class="tile-layout"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-for="item in displayItems"
        :key="item.id"
        :data-item-id="item.id"
        :class="['tile-item group cursor-pointer transition-opacity duration-500', getItemOpacity(item), getGlowClass(item), getHoverClass(item)]"
        :draggable="canDragItem(item)"
        @click="handlePhotoClick(item, $event)"
        @dragstart.stop="onDragStart(item, $event)"
        @dragover.prevent="onDragOver(item, $event)"
        @drop.prevent="onDrop(item, $event)"
        @dragend="onDragEnd"
      >
        <slot name="photo-item" :item="item" :photo="item" :getPhotoUrl="getPhotoUrl">
          <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 h-64">
            <img
              :src="getPhotoUrl(item, '500x500')"
              :alt="item.title || 'Photo'"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <!-- Selection Checkbox -->
            <div
              v-if="selectionMode && !item.isGroup"
              class="absolute top-3 left-3 z-10"
              @click.stop="toggleSelection(item, $event)"
            >
              <div
                :class="[
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                  isSelected(item.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white/90 border-white hover:bg-white'
                ]"
              >
                <Icon
                  v-if="isSelected(item.id)"
                  name="heroicons:check"
                  class="text-white text-sm"
                />
              </div>
            </div>
            <slot name="photo-overlay" :item="item" :photo="item"></slot>
          </div>
        </slot>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { pb } from '#imports';
import { computed, ref, nextTick } from 'vue';

const props = defineProps({
  photos: {
    type: Array,
    required: false,
    default: () => []
  },
  items: {
    type: Array,
    required: false,
    default: () => []
  },
  layout: {
    type: String,
    default: 'masonry',
    validator: (value) => ['masonry', 'grid', 'tile'].includes(value)
  },
  selectionMode: {
    type: Boolean,
    default: false
  },
  selectedPhotos: {
    type: Array,
    default: () => []
  },
  expandingGroupId: {
    type: String,
    default: null
  },
  expandedGroupIds: {
    type: Set,
    default: () => new Set()
  },
  areAllGroupsExpanded: {
    type: Boolean,
    default: false
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  currentExpandedGroupId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['photo-click', 'toggle-selection', 'reorder']);

// Store element positions for FLIP animation
const elementPositions = ref(new Map());
const groupPhotoOrigin = ref(null);
const expandingPhotoIndex = ref(0);
const draggingItemId = ref(null);

// Use items if provided, otherwise fall back to photos for backward compatibility
const displayItems = computed(() => {
  return props.items.length > 0 ? props.items : props.photos;
});

// Get photo URL with thumbnail
const getPhotoUrl = (item, thumb = '500x500') => {
  // Handle group items
  if (item.isGroup && item.group?.expand?.coverPhoto) {
    return pb.files.getURL(item.group.expand.coverPhoto, item.group.expand.coverPhoto.photo, { thumb });
  }
  // Handle regular photos
  if (item.photo) {
    return pb.files.getURL(item, item.photo, { thumb });
  }
  return '';
};

// Check if photo is selected
const isSelected = (itemId) => {
  return props.selectedPhotos.includes(itemId);
};

// Toggle selection
const toggleSelection = (item, event) => {
  emit('toggle-selection', { item, shiftKey: !!event?.shiftKey });
};

const canDragItem = (item) => {
  if (!props.selectionMode) return false;
  if (!item.isGroupPhoto) return true;
  return props.isEditMode && item.parentGroupId === props.currentExpandedGroupId;
};

const onDragStart = (item, event) => {
  if (!canDragItem(item)) return;
  draggingItemId.value = item.id;
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id);
  }
};

const onDragOver = (item, event) => {
  if (!canDragItem(item)) return;
  if (event?.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const onDrop = (item, event) => {
  if (!canDragItem(item)) return;
  const sourceId = draggingItemId.value || event?.dataTransfer?.getData('text/plain');
  const targetId = item.id;
  if (sourceId && targetId && sourceId !== targetId) {
    emit('reorder', { sourceId, targetId, groupId: item.parentGroupId || null });
  }
  draggingItemId.value = null;
};

const onDragEnd = () => {
  draggingItemId.value = null;
};

// Handle item click
const handlePhotoClick = (item, event) => {
  if (props.selectionMode && !item.isGroup) {
    toggleSelection(item, event);
  } else {
    emit('photo-click', item);
  }
};

// Get opacity class for item
const getItemOpacity = (item) => {
  // When selection mode is enabled:
  // - Collapsed groups should be dimmed (but clickable to switch active group)
  if (props.selectionMode && item.isGroup && !item.isExpanded) {
    return 'opacity-40';
  }
  
  // - Everything else in selection mode should be fully visible
  if (props.selectionMode) {
    return 'opacity-100';
  }
  
  // When selection mode is disabled (normal mode):
  // - If no groups are expanded, show everything fully
  if (!props.expandedGroupIds || props.expandedGroupIds.size === 0) {
    return 'opacity-100';
  }

  // - If all groups are expanded, keep everything fully visible
  if (props.areAllGroupsExpanded) {
    return 'opacity-100';
  }
  
  // - If groups are expanded, show expanded group photos fully
  if (item.isGroupPhoto && props.expandedGroupIds.has(item.parentGroupId)) {
    return 'opacity-100';
  }
  
  // - Dim everything else when groups are expanded
  return 'opacity-40';
};

// Get glow class for photos in expanded group when in edit mode
const getGlowClass = (item) => {
  // Only apply glow when selection mode is ON, edit mode is ON, and photo is in the expanded group
  if (props.selectionMode && props.isEditMode && props.currentExpandedGroupId && item.isGroupPhoto && item.parentGroupId === props.currentExpandedGroupId) {
    return 'edit-mode-glow';
  }
  return '';
};

// Get hover class for greyed-out groups in selection mode
const getHoverClass = (item) => {
  // Add hover effect to make collapsed groups fully visible on hover in selection mode
  if (props.selectionMode && item.isGroup && !item.isExpanded) {
    return 'hover:opacity-100';
  }
  return '';
};

// FLIP Animation Handlers
const onBeforeEnter = (el) => {
  const itemId = el.dataset.itemId;
  const item = displayItems.value.find(i => i.id === itemId);
  
  if (item?.isGroupPhoto && item.parentGroupId === props.expandingGroupId && groupPhotoOrigin.value) {
    // For newly expanded group photos, get their final position first
    const rect = el.getBoundingClientRect();
    const container = el.closest('.photo-grid-wrapper');
    const containerRect = container?.getBoundingClientRect();
    
    if (containerRect) {
      // Calculate offset from origin to final position
      const deltaX = groupPhotoOrigin.value.x - (rect.left - containerRect.left);
      const deltaY = groupPhotoOrigin.value.y - (rect.top - containerRect.top);
      
      // Store index for staggering
      const groupPhotos = displayItems.value.filter(
        i => i.isGroupPhoto && i.parentGroupId === props.expandingGroupId
      );
      const photoIndex = groupPhotos.findIndex(p => p.id === itemId);
      el.dataset.photoIndex = photoIndex;
      
      // Start from the group's position
      el.style.opacity = '0';
      el.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
      el.style.transformOrigin = 'center center';
    }
  }
};

const onEnter = (el, done) => {
  const itemId = el.dataset.itemId;
  const item = displayItems.value.find(i => i.id === itemId);
  
  if (item?.isGroupPhoto && item.parentGroupId === props.expandingGroupId && groupPhotoOrigin.value) {
    // Get the stagger delay based on photo index
    const photoIndex = parseInt(el.dataset.photoIndex || '0');
    const staggerDelay = photoIndex * 50; // 50ms delay between each photo
    
    // Use double RAF for smooth animation with stagger
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
          el.style.opacity = '1';
          el.style.transform = 'translate(0, 0) scale(1)';
          
          const handleTransitionEnd = () => {
            el.style.transition = '';
            el.style.transform = '';
            el.style.transformOrigin = '';
            el.removeEventListener('transitionend', handleTransitionEnd);
            done();
          };
          
          el.addEventListener('transitionend', handleTransitionEnd);
          
          // Fallback timeout in case transitionend doesn't fire
          setTimeout(() => {
            el.removeEventListener('transitionend', handleTransitionEnd);
            done();
          }, 700);
        });
      });
    }, staggerDelay);
  } else {
    done();
  }
};

const onLeave = (el, done) => {
  const itemId = el.dataset.itemId;
  const item = displayItems.value.find(i => i.id === itemId);
  
  if (item?.isGroup && item.id === props.expandingGroupId) {
    // Store the group's position before it leaves (for expanding photos)
    const rect = el.getBoundingClientRect();
    const container = el.closest('.photo-grid-wrapper');
    const containerRect = container?.getBoundingClientRect();
    
    if (containerRect) {
      groupPhotoOrigin.value = {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      };
    }
    
    // Animate the group shrinking and fading out
    el.style.transition = 'all 0.4s ease-out';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.8)';
    
    setTimeout(done, 400);
  } else if (item?.isGroupPhoto && !props.expandingGroupId) {
    // Collapsing group photo - animate back to group position
    // Find where the group will appear
    const futureGroupElement = document.querySelector(`[data-item-id="${item.parentGroupId}"]`);
    
    if (futureGroupElement) {
      const groupRect = futureGroupElement.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const deltaX = groupRect.left - rect.left;
      const deltaY = groupRect.top - rect.top;
      
      el.style.transition = 'all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
      el.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
      el.style.opacity = '0';
      
      setTimeout(done, 500);
    } else {
      // Fallback if group element not found
      el.style.transition = 'all 0.3s ease-out';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.8)';
      setTimeout(done, 300);
    }
  } else {
    done();
  }
};

// Expose method to trigger animation from parent
defineExpose({
  prepareAnimation: (groupElement) => {
    if (groupElement) {
      const rect = groupElement.getBoundingClientRect();
      const container = groupElement.closest('.photo-grid-wrapper');
      const containerRect = container?.getBoundingClientRect();
      
      if (containerRect) {
        groupPhotoOrigin.value = {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top
        };
      }
    }
  }
});
</script>

<style scoped>
/* Masonry Layout */
.masonry-grid {
  column-count: 2;
  column-gap: 1rem;
  position: relative;
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

.masonry-item {
  break-inside: avoid;
  margin-bottom: 1rem;
}

/* Grid Layout - Equal height items */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  position: relative;
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

.grid-item {
  position: relative;
  /* Ensure items flow correctly in grid during animations */
  min-height: 0;
  min-width: 0;
}

/* Tile Layout - Larger fixed height tiles */
.tile-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  position: relative;
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

.tile-item {
  position: relative;
}

/* Common styles */
.aspect-square {
  aspect-ratio: 1 / 1;
}

/* TransitionGroup animations */
.photo-grid-move {
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Ensure smooth transitions for entering elements */
.photo-grid-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Position absolute during leave to allow smooth repositioning of remaining items */
.photo-grid-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Default enter/leave states (overridden by JavaScript for group photos) */
.photo-grid-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.photo-grid-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Masonry specific - keep items in flow during animation */
.masonry-grid .masonry-item {
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Grid and Tile - smoother transitions */
.grid-layout .grid-item,
.tile-layout .tile-item {
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Glowing box shadow for photos in expanded group when in edit mode */
.edit-mode-glow {
  box-shadow: 0 0 8px rgba(255, 100, 255, 0.5), 0 0 15px rgba(255, 100, 255, 0.3);
}
</style>
