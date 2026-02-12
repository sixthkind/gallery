<template>
  <div 
    class="course-card bg-white dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer flex flex-col h-full transition-all duration-300"
    :class="{ 'featured-card': showFeaturedGlow }"
    @click="navigateToCourse"
  >
    <div v-if="course.image" class="h-48 overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
      <img 
        :src="getImageUrl(course)" 
        :alt="course.title"
        class="w-full h-full object-cover object-center"
      />
    </div>
    <div v-else class="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
      <Icon name="lucide:graduation-cap" class="text-white text-6xl" />
    </div>

    <div class="p-6">
      <div class="flex items-start justify-between gap-2 mb-2">
        <h3 class="text-xl font-semibold line-clamp-2 flex-1">{{ course.title }}</h3>
        <span 
          v-if="!course.published" 
          class="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full whitespace-nowrap"
        >
          Unpublished
        </span>
      </div>
      
      <div class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 h-10" v-html="course.description ? stripHtml(course.description) : '&nbsp;'"></div>

      <!-- Pricing and Tier Badge -->
      <div class="mb-4 flex items-center gap-2 flex-wrap">
        <span v-if="isPaid" class="text-lg font-bold text-blue-600 dark:text-blue-400">
          {{ formattedPrice }}
        </span>
        <span v-else class="text-lg font-bold text-green-600 dark:text-green-400">
          Free
        </span>
        
        <span 
          v-if="tierName && subscriptionsEnabled" 
          class="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full"
        >
          {{ tierName }}
        </span>
        
        <span 
          v-if="accessViaSubscription && subscriptionsEnabled" 
          class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
        >
          In Your Plan
        </span>
      </div>

      <div v-if="showProgress && progress !== null" class="mt-4">
        <CoursesProgressBar 
          :progress="progress" 
          :label="progress >= 100 ? 'Completed!' : 'Progress'" 
          size="sm"
        />
      </div>

      <div class="mt-4 flex items-center justify-between">
        <span v-if="enrolled" class="text-xs text-green-600 dark:text-green-400 font-medium">
          Enrolled
        </span>
        <span v-else class="text-xs text-gray-500 dark:text-gray-400">
          Not enrolled
        </span>
        
        <ion-button size="small" shape="round" mode="ios" @click.stop="$emit('action', course)">
          {{ enrolled ? 'Continue' : 'View Course' }}
        </ion-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { pb } from '~/utils/pb';
import { formatPrice } from '~/utils/stripe';
import { useSubscriptions } from '~/composables/useSubscriptions';
const { toLearnPath } = useLearnRoutes();

const { isEnabled: subscriptionsEnabled } = useSubscriptions();

const props = defineProps({
  course: {
    type: Object,
    required: true
  },
  enrolled: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: null
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  accessViaSubscription: {
    type: Boolean,
    default: false
  },
  showFeaturedGlow: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['action']);

const isPaid = computed(() => {
  return props.course.price && props.course.price > 0;
});

const formattedPrice = computed(() => {
  if (!isPaid.value) return 'Free';
  return formatPrice(props.course.price);
});

const tierName = computed(() => {
  // Check if subscription_tier is expanded (object with name)
  if (props.course.expand?.subscription_tier?.name) {
    return props.course.expand.subscription_tier.name;
  }
  // Fallback for old data or non-expanded tier
  return null;
});

const getImageUrl = (course) => {
  if (!course.image) return '';
  const config = useRuntimeConfig();
  return `${config.public.pocketbaseURL}/api/files/_learn_courses/${course.id}/${course.image}`;
};

const stripHtml = (html) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const navigateToCourse = () => {
  navigateTo(toLearnPath(`/courses/${props.course.id}`));
};
</script>

<style scoped>
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

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-card {
  box-shadow: 0 0 0 2px rgba(255, 227, 86, 0.5), 0 0 20px rgba(251, 191, 36, 0.3);
}

.featured-card:hover {
  box-shadow: 0 0 0 2px rgba(254, 223, 67, 0.6), 0 0 30px rgba(251, 191, 36, 0.5);
}
</style>
