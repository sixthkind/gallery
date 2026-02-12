<script setup>
import { pb } from '~/utils/pb';
import { getUserEnrollments, getUserProgress } from '~/utils/courses';
import { authUtils } from '~/utils/auth';
const { toLearnPath } = useLearnRoutes();

const courses = ref([]);
const enrolledCourses = ref(new Map());
const courseProgress = ref(new Map());
const loading = ref(true);
const user = computed(() => pb.authStore.model);
const isSuperuser = computed(() => authUtils.isSuperuser());

const featuredCourses = computed(() => {
  return courses.value.filter(course => course.featured);
});

const allCourses = computed(() => {
  return courses.value;
});

const fetchCourses = async () => {
  try {
    loading.value = true;
    
    // Fetch courses - superusers see all courses, regular users see only published
    const filter = isSuperuser.value ? '' : 'published = true';
    const allCourses = await pb.collection('_learn_courses').getFullList({
      filter: filter,
      sort: '-created',
      expand: 'subscription_tier'
    });
    
    courses.value = allCourses;

    // If user is logged in, fetch their enrollments and progress
    if (user.value) {
      const enrollments = await getUserEnrollments(user.value.id);
      enrollments.forEach(enrollment => {
        enrolledCourses.value.set(enrollment.course, enrollment);
      });

      // Fetch progress for enrolled courses
      for (const enrollment of enrollments) {
        const progress = await getUserProgress(user.value.id, enrollment.course);
        courseProgress.value.set(enrollment.course, progress.progress);
      }
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
  } finally {
    loading.value = false;
  }
};

const handleCourseAction = (course) => {
  navigateTo(toLearnPath(`/courses/${course.id}`));
};

onMounted(() => {
  fetchCourses();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="mb-8 flex justify-between items-start">
          <div>
            <h1 class="text-4xl font-bold mb-2">Courses</h1>
            <p class="text-gray-600 dark:text-gray-400">Explore our collection of courses and start learning today.</p>
          </div>
          <ion-button 
            v-if="isSuperuser"
            @click="navigateTo('/edit/courses')"
            fill="outline"
            size="small"
            shape="round"
            mode="ios"
          >
            <Icon name="lucide:plus" class="mr-2" />
            Add Course
          </ion-button>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="animate-pulse">
            <div class="bg-gray-200 dark:bg-gray-700 aspect-video rounded-t-lg"></div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-b-lg">
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>

        <div v-else-if="courses.length === 0" class="text-center py-16">
          <Icon name="lucide:graduation-cap" class="text-6xl text-gray-400 mb-4" />
          <p class="text-xl text-gray-600 dark:text-gray-400">No courses available yet.</p>
        </div>

        <div v-else>
          <!-- Featured Courses Section -->
          <div v-if="featuredCourses.length > 0" class="mb-12">
            <h2 class="text-2xl font-bold mb-6">Featured Courses</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CoursesCourseCard
                v-for="course in featuredCourses"
                :key="'featured-' + course.id"
                :course="course"
                :enrolled="enrolledCourses.has(course.id)"
                :progress="courseProgress.get(course.id)"
                :show-progress="enrolledCourses.has(course.id)"
                :show-featured-glow="true"
                @action="handleCourseAction"
              />
            </div>
          </div>

          <!-- All Courses Section -->
          <div>
            <h2 class="text-2xl font-bold mb-6">All Courses</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CoursesCourseCard
                v-for="course in allCourses"
                :key="'all-' + course.id"
                :course="course"
                :enrolled="enrolledCourses.has(course.id)"
                :progress="courseProgress.get(course.id)"
                :show-progress="enrolledCourses.has(course.id)"
                @action="handleCourseAction"
              />
            </div>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
