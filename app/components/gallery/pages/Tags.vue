<script setup>
import { pb } from '#imports';
import { GALLERY_COLLECTIONS } from '~/utils/collections';
import { ref, onMounted, watch, computed } from 'vue';

const colorMode = useColorMode();
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const tags = ref([]);
const loading = ref(true);
const skeletonPills = ref([]);
const { toGalleryPath } = useGalleryRoutes();

const maxTagCount = computed(() => {
  return tags.value.reduce((max, tag) => {
    const count = typeof tag.photoCount === 'number' ? tag.photoCount : 0;
    return Math.max(max, count);
  }, 0);
});

const getTagStyle = (tag) => {
  const count = typeof tag?.photoCount === 'number' ? tag.photoCount : 0;
  const max = maxTagCount.value;
  const ratio = max > 1 ? Math.max(0, Math.min(1, (count - 1) / (max - 1))) : 0;
  const glow = { r: 196, g: 181, b: 253 }; // Tailwind purple-400
  const borderAlpha = 0.25 + ratio * 0.65;
  const glowAlpha = 0.2 + ratio * 0.6;
  const glowSize = 2 + ratio * 6;
  const ringSize = 1 + ratio * 1.5;
  const isDark = colorMode.value === 'dark';

  return {
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.55)' : '#ffffff',
    borderColor: ratio > 0
      ? `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${borderAlpha})`
      : (isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgb(226, 232, 240)'),
    boxShadow: ratio > 0
      ? `0 0 0 ${ringSize}px rgba(${glow.r}, ${glow.g}, ${glow.b}, ${borderAlpha}), 0 0 ${glowSize}px rgba(${glow.r}, ${glow.g}, ${glow.b}, ${glowAlpha})`
      : 'none'
  };
};

const buildSkeletonPills = () => {
  skeletonPills.value = Array.from({ length: 30 }, () => {
    return Math.floor(70 + Math.random() * 110);
  });
};

const fetchTags = async () => {
  loading.value = true;
  try {
    const [tagRecords, photoRecords] = await Promise.all([
      pb.collection(GALLERY_COLLECTIONS.tags).getFullList({ sort: 'name' }),
      pb.collection(GALLERY_COLLECTIONS.photos).getFullList({ fields: 'id,tags' })
    ]);

    const counts = new Map();
    photoRecords.forEach(photo => {
      const photoTags = Array.isArray(photo.tags) ? photo.tags : [];
      photoTags.forEach(tagId => {
        counts.set(tagId, (counts.get(tagId) || 0) + 1);
      });
    });

    tags.value = tagRecords.map(tag => ({
      ...tag,
      photoCount: counts.get(tag.id) || 0
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
  } finally {
    loading.value = false;
  }
};

const openTag = (tag) => {
  if (!tag?.name) return;
  router.push(toGalleryPath(`/tags/${encodeURIComponent(tag.name)}`));
};

onMounted(() => {
  buildSkeletonPills();
  fetchTags();
});

watch(
  () => route.query.refreshed,
  (value) => {
    if (value) {
      fetchTags();
    }
  }
);

watch(loading, (isLoading) => {
  if (isLoading) {
    buildSkeletonPills();
  }
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="flex items-center justify-between mt-4 mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Tags</h1>
        </div>

        <div v-if="loading" class="flex flex-wrap gap-3">
          <div
            v-for="(width, index) in skeletonPills"
            :key="`skeleton-${index}`"
            class="tag-skeleton-pill"
            :style="{ width: `${width}px` }"
          ></div>
        </div>
        <div v-else-if="tags.length === 0" class="text-center py-20 text-gray-500">
          No tags yet.
        </div>
        <div v-else class="flex flex-wrap gap-3">
          <button
            v-for="tag in tags"
            :key="tag.id"
            @click="openTag(tag)"
            class="px-4 py-2 rounded-full backdrop-blur border border-gray-200 text-sm text-slate-800 hover:text-slate-900 transition-colors flex items-center gap-2"
            :style="getTagStyle(tag)"
            :title="`${tag.photoCount || 0} photos`"
          >
            <span>#{{ tag.name }}</span>
          </button>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.tag-skeleton-pill {
  height: 2.25rem;
  border-radius: 9999px;
  background: linear-gradient(90deg, #f2f2f2 0%, #e6e6e6 50%, #f2f2f2 100%);
  background-size: 200% 100%;
  animation: tag-skeleton-shimmer 1.3s ease-in-out infinite;
}

:global(html.dark) .tag-skeleton-pill {
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.65) 0%, rgba(51, 65, 85, 0.65) 50%, rgba(30, 41, 59, 0.65) 100%);
  background-size: 200% 100%;
}

@keyframes tag-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
