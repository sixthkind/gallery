<template>
  <div :class="['photo-skeleton-grid', layoutClass]">
    <div v-for="n in computedCount" :key="n" class="skeleton-item">
      <div :class="['skeleton-tile', tileClass]"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

const props = defineProps({
  layout: {
    type: String,
    default: 'grid',
    validator: (value) => ['masonry', 'grid', 'tile'].includes(value)
  },
  rows: {
    type: Number,
    default: 4
  }
});

const columns = ref(2);

const layoutClass = computed(() => {
  if (props.layout === 'tile') return 'tile-layout';
  if (props.layout === 'grid') return 'grid-layout';
  return 'masonry-grid';
});

const tileClass = computed(() => (
  props.layout === 'tile' ? 'skeleton-tile--tall' : 'skeleton-tile--square'
));

const computedCount = computed(() => Math.max(1, columns.value * props.rows));

const updateColumns = () => {
  const width = window.innerWidth;
  if (props.layout === 'tile') {
    if (width >= 1536) columns.value = 4;
    else if (width >= 640) columns.value = 3;
    else columns.value = 2;
    return;
  }
  if (width >= 1280) columns.value = 4;
  else if (width >= 640) columns.value = 3;
  else columns.value = 2;
};

onMounted(() => {
  updateColumns();
  window.addEventListener('resize', updateColumns);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateColumns);
});
</script>

<style scoped>
.masonry-grid {
  column-count: 2;
  column-gap: 1rem;
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

.grid-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
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

.tile-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
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

.skeleton-item {
  width: 100%;
  margin-bottom: 1rem;
}

.grid-layout .skeleton-item,
.tile-layout .skeleton-item {
  margin-bottom: 0;
}

.masonry-grid .skeleton-item {
  break-inside: avoid;
}

.skeleton-tile {
  width: 100%;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, #f2f2f2 0%, #e6e6e6 50%, #f2f2f2 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.3s ease-in-out infinite;
}

:global(html.dark) .skeleton-tile {
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.65) 0%, rgba(51, 65, 85, 0.65) 50%, rgba(30, 41, 59, 0.65) 100%);
  background-size: 200% 100%;
}

.skeleton-tile--square {
  aspect-ratio: 1 / 1;
}

.skeleton-tile--tall {
  height: 16rem;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
