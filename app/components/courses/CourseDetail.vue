<template>
  <div class="course-detail">
    <div v-if="course.image" class="w-full max-w-xl mb-8">
      <div class="h-64 overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-lg">
        <img 
          :src="getImageUrl(course)" 
          :alt="course.title"
          class="w-full h-full object-cover object-center"
        />
      </div>
    </div>
    <div v-else class="w-full max-w-2xl mb-8">
      <div class="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center rounded-lg">
        <Icon name="lucide:graduation-cap" class="text-white text-8xl" />
      </div>
    </div>

    <div class="mb-8">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-4xl font-bold">{{ course.title }}</h1>
            <span 
              v-if="!course.published && isAdmin" 
              class="px-3 py-1 text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full"
            >
              Unpublished
            </span>
          </div>
        </div>
        <div v-if="isAdmin" class="flex gap-2 ml-4">
          <ion-button 
            @click="editCourse"
            fill="outline"
            size="small"
            shape="round"
            mode="ios"
          >
            <Icon name="lucide:edit" class="mr-2" />
            Edit Course
          </ion-button>
        </div>
      </div>
      
      <div v-if="course.description" class="prose dark:prose-invert max-w-none mb-6" v-html="course.description"></div>

      <!-- Pricing Information (hidden if already purchased) -->
      <div v-if="!isPurchased" class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span v-if="isPaid" class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {{ formattedPrice }}
              </span>
              <span v-else class="text-3xl font-bold text-green-600 dark:text-green-400">
                Free
              </span>
            </div>
            
            <p v-if="isPaid" class="text-sm text-gray-600 dark:text-gray-400">
              One-time purchase • Lifetime access
            </p>
            
            <p v-if="accessViaSubscription && subscriptionsEnabled" class="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
              ✓ Included in your subscription
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <span 
              v-if="tierName && subscriptionsEnabled" 
              class="px-3 py-1 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full"
            >
              {{ tierName }} Tier
            </span>
            
            <ion-button 
              v-if="tierName && !accessViaSubscription && subscriptionsEnabled"
              @click="navigateTo(toLearnPath('/subscribe'))"
              fill="outline"
              shape="round"
              mode="ios"
              size="small"
            >
              <Icon name="lucide:star" class="mr-2" />
              Subscribe
            </ion-button>
          </div>
        </div>
      </div>

      <div v-if="!isAuthenticated" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <p class="text-yellow-800 dark:text-yellow-200">Please sign in to {{ isPaid ? 'purchase' : 'enroll in' }} this course.</p>
      </div>

      <div v-if="isAuthenticated" class="flex items-center gap-4">
        <!-- Free Course or Accessible via Subscription -->
        <ion-button 
          v-if="!enrolled && (!isPaid || accessViaSubscription)"
          size="large"
          shape="round"
          mode="ios"
          @click="$emit('enroll')"
          :disabled="loading"
        >
          <Icon name="lucide:plus-circle" class="mr-2" />
          {{ loading ? 'Enrolling...' : 'Enroll in Course' }}
        </ion-button>

        <!-- Paid Course - Purchase -->
        <ion-button 
          v-if="!enrolled && isPaid && !accessViaSubscription"
          size="large"
          shape="round"
          mode="ios"
          color="primary"
          @click="navigateTo(toLearnPath(`/checkout/course/${course.id}`))"
          :disabled="loading"
        >
          <Icon name="lucide:shopping-cart" class="mr-2" />
          Purchase for {{ formattedPrice }}
        </ion-button>

        <!-- Already Enrolled -->
        <ion-button 
          v-if="enrolled"
          size="large"
          shape="round"
          mode="ios"
          color="primary"
          @click="$emit('continue')"
        >
          <Icon name="lucide:play-circle" class="mr-2" />
          Continue Learning
        </ion-button>

        <div v-if="enrolled && progress !== null && !isAdmin" class="flex-1 max-w-xs">
          <CoursesProgressBar 
            :progress="progress" 
            :label="progress >= 100 ? 'Completed!' : 'Your Progress'" 
            size="sm"
          />
        </div>
      </div>
    </div>

    <div v-if="sections && sections.length > 0" class="mt-12">
      <h2 class="text-2xl font-bold mb-6">Course Content</h2>
      
      <div class="space-y-4">
        <div 
          v-for="(section, index) in sections" 
          :key="section.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <div 
            :class="[
              'p-4 font-semibold flex items-center justify-between transition-colors',
              isSectionComplete(section) 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-gray-50 dark:bg-gray-800'
            ]"
          >
            <div class="flex items-center gap-3">
              <span class="text-gray-400">{{ index + 1 }}.</span>
              <span>{{ section.title }}</span>
            </div>
            <span class="text-sm text-gray-500">
              {{ section.lessons?.length || 0 }} {{ section.lessons?.length === 1 ? 'lesson' : 'lessons' }}
            </span>
          </div>
          
          <div v-if="section.lessons && section.lessons.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
            <div 
              v-for="lesson in section.lessons" 
              :key="lesson.id"
              :class="[
                'p-4 pl-12 transition-colors',
                lesson.completed 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : 'bg-gray-50 dark:bg-gray-800/50'
              ]"
            >
              <div class="flex items-center gap-2">
                <Icon 
                  :name="lesson.completed ? 'lucide:check-circle' : 'lucide:play-circle'"
                  :class="lesson.completed ? 'text-green-600' : 'text-gray-400'"
                />
                <span>{{ lesson.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { pb } from '~/utils/pb';
import { authUtils } from '~/utils/auth';
import { formatPrice } from '~/utils/stripe';
import { useSubscriptions } from '~/composables/useSubscriptions';
const { toLearnPath } = useLearnRoutes();

const { isEnabled: subscriptionsEnabled } = useSubscriptions();

const props = defineProps({
  course: {
    type: Object,
    required: true
  },
  sections: {
    type: Array,
    default: () => []
  },
  enrolled: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  accessViaSubscription: {
    type: Boolean,
    default: false
  },
  isPurchased: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['enroll', 'continue']);

const user = computed(() => pb.authStore.record);
const isAdmin = computed(() => authUtils.isSuperuser());

const isPaid = computed(() => {
  return props.course.price && props.course.price > 0;
});

const formattedPrice = computed(() => {
  if (!isPaid.value) return 'Free';
  return formatPrice(props.course.price);
});

const editCourse = () => {
  navigateTo(`/edit/courses/${props.course.id}`);
};

const addSection = () => {
  const nextOrder = (props.sections?.length || 0) + 1;
  const prefill = encodeURIComponent(JSON.stringify({ 
    course: props.course.id,
    order: nextOrder
  }));
  navigateTo(`/edit/sections?prefill=${prefill}`);
};

const getImageUrl = (course) => {
  if (!course.image) return '';
  const config = useRuntimeConfig();
  return `${config.public.pocketbaseURL}/api/files/_learn_courses/${course.id}/${course.image}`;
};

const isSectionComplete = (section) => {
  if (!section.lessons || section.lessons.length === 0) return false;
  return section.lessons.every(lesson => lesson.completed);
};

const tierName = computed(() => {
  // Check if subscription_tier is expanded (object with name)
  if (props.course.expand?.subscription_tier?.name) {
    return props.course.expand.subscription_tier.name;
  }
  // Fallback for old data or non-expanded tier
  return null;
});
</script>
