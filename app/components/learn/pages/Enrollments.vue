<script setup>
import { ref, computed, onMounted } from 'vue';
import { pb } from '~/utils/pb';
import { getUserProgress } from '~/utils/courses';
import { formatPrice } from '~/utils/stripe';
const { toLearnPath } = useLearnRoutes();

const user = computed(() => pb.authStore.model);
const enrollments = ref([]);
const progressData = ref({});
const loading = ref(true);
const showPurchasesOnly = ref(false);

// Fetch enrollments and progress
const fetchEnrollments = async () => {
  if (!user.value) return;
  
  try {
    loading.value = true;
    
    // Fetch enrollments with expanded course data
    const enrollmentRecords = await pb.collection('_learn_enrollments').getFullList({
      filter: `user="${user.value.id}"`,
      expand: 'course,course.subscription_tier',
      sort: '-enrolled_at'
    });
    
    enrollments.value = enrollmentRecords;
    
    // Fetch progress for each course
    for (const enrollment of enrollmentRecords) {
      if (enrollment.expand?.course) {
        try {
          const progress = await getUserProgress(user.value.id, enrollment.expand.course.id);
          progressData.value[enrollment.expand.course.id] = progress.progress;
        } catch (error) {
          console.error('Error fetching progress:', error);
          progressData.value[enrollment.expand.course.id] = 0;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching enrollments:', error);
  } finally {
    loading.value = false;
  }
};

// Filter enrollments based on purchase toggle
const filteredEnrollments = computed(() => {
  if (!showPurchasesOnly.value) {
    return enrollments.value;
  }
  
  // Filter for purchased courses (not free)
  return enrollments.value.filter(enrollment => {
    const purchaseType = enrollment.purchase_type;
    return purchaseType && purchaseType !== 'free';
  });
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

const goBack = () => {
  window.history.back();
};

const navigateToCourse = (courseId) => {
  navigateTo(toLearnPath(`/courses/${courseId}`));
};

const getPurchaseTypeLabel = (purchaseType) => {
  if (!purchaseType || purchaseType === 'free') return 'Free Enrollment';
  
  const labels = {
    'one-time': 'Purchased',
    'subscription': 'Subscription',
    'module': 'Module Purchase'
  };
  
  return labels[purchaseType] || 'Enrolled';
};

const getPurchaseTypeBadgeClass = (purchaseType) => {
  if (!purchaseType || purchaseType === 'free') {
    return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  }
  
  const classes = {
    'one-time': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    'subscription': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    'module': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
  };
  
  return classes[purchaseType] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
};

onMounted(() => {
  fetchEnrollments();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="k-container animated fadeInUp">
          <div class="mb-4 flex justify-between items-center">
            <div class="flex items-center gap-2">
              <button 
                @click="goBack" 
                class="w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-90 hover:bg-opacity-70 transition-all"
              >
                <Icon name="lucide:chevron-left" size="1.4em" class="text-slate-500" />
              </button>
              <h2 class="font-bold text-2xl text-slate-500">
                My Enrollments
              </h2>
            </div>
          </div>

          <!-- Purchase Filter Toggle -->
          <div class="mb-6 flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="showPurchasesOnly"
                class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show purchases only
              </span>
            </label>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              ({{ filteredEnrollments.length }} {{ filteredEnrollments.length === 1 ? 'course' : 'courses' }})
            </span>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <ion-spinner name="crescent"></ion-spinner>
            <p class="mt-4 text-gray-500 dark:text-gray-400">Loading enrollments...</p>
          </div>

          <!-- Empty State -->
          <div 
            v-else-if="filteredEnrollments.length === 0" 
            class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg"
          >
            <Icon 
              name="lucide:graduation-cap" 
              size="4em" 
              class="mx-auto mb-4 text-gray-400" 
            />
            <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {{ showPurchasesOnly ? 'No Purchased Courses' : 'No Enrollments Yet' }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">
              {{ showPurchasesOnly ? 'You haven\'t purchased any courses yet.' : 'Browse our courses to get started.' }}
            </p>
            <ion-button 
              @click="navigateTo(toLearnPath('/courses'))"
              shape="round"
              mode="ios"
            >
              Browse Courses
            </ion-button>
          </div>

          <!-- Enrollments Grid -->
          <div 
            v-else 
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div
              v-for="enrollment in filteredEnrollments"
              :key="enrollment.id"
              class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer flex flex-col h-full shadow-sm hover:shadow-md transition-shadow"
              @click="navigateToCourse(enrollment.expand?.course?.id)"
            >
              <!-- Course Image -->
              <div 
                v-if="enrollment.expand?.course?.image" 
                class="h-48 overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0"
              >
                <img 
                  :src="getImageUrl(enrollment.expand.course)" 
                  :alt="enrollment.expand.course.title"
                  class="w-full h-full object-cover object-center"
                />
              </div>
              <div 
                v-else 
                class="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0"
              >
                <Icon name="lucide:graduation-cap" class="text-white text-6xl" />
              </div>

              <!-- Course Info -->
              <div class="p-6 flex-1 flex flex-col">
                <h3 class="text-xl font-semibold mb-2 line-clamp-2">
                  {{ enrollment.expand?.course?.title }}
                </h3>
                
                <div 
                  class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 h-10"
                  v-html="stripHtml(enrollment.expand?.course?.description)"
                ></div>

                <!-- Purchase Type Badge and Price -->
                <div class="mb-4 flex items-center gap-2 flex-wrap">
                  <span 
                    :class="getPurchaseTypeBadgeClass(enrollment.purchase_type)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ getPurchaseTypeLabel(enrollment.purchase_type) }}
                  </span>
                  
                  <!-- Price Display - Show actual amount paid if available -->
                  <span 
                    v-if="enrollment.amount_paid && enrollment.amount_paid > 0"
                    class="text-sm font-semibold text-blue-600 dark:text-blue-400"
                  >
                    {{ formatPrice(enrollment.amount_paid, enrollment.currency || 'USD') }}
                  </span>
                  <span 
                    v-else-if="enrollment.expand?.course?.price && enrollment.expand.course.price > 0"
                    class="text-sm font-semibold text-blue-600 dark:text-blue-400"
                  >
                    {{ formatPrice(enrollment.expand.course.price) }}
                  </span>
                  <span 
                    v-else
                    class="text-sm font-semibold text-green-600 dark:text-green-400"
                  >
                    Free
                  </span>
                </div>

                <!-- Progress Bar -->
                <div class="mb-4">
                  <CoursesProgressBar 
                    :progress="progressData[enrollment.expand?.course?.id] || 0" 
                    :label="(progressData[enrollment.expand?.course?.id] || 0) >= 100 ? 'Completed!' : 'Progress'" 
                    size="sm"
                  />
                </div>

                <!-- Enrollment Date -->
                <div class="mt-auto">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Enrolled {{ new Date(enrollment.enrolled_at).toLocaleDateString() }}
                  </p>
                  
                  <ion-button 
                    size="small" 
                    shape="round" 
                    mode="ios"
                    expand="block"
                    @click.stop="navigateToCourse(enrollment.expand?.course?.id)"
                  >
                    Continue Learning
                  </ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.k-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
