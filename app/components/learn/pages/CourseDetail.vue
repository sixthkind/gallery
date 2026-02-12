<script setup>
import { pb } from '~/utils/pb';
import { authUtils } from '~/utils/auth';
import { enrollInCourse, isEnrolled, getUserProgress, getCourseLessons } from '~/utils/courses';
import { useRoute } from 'vue-router';
const { toLearnPath } = useLearnRoutes();

const route = useRoute();
const courseId = computed(() => String(route.params.id));

// Useful for debugging course routing - uncomment if needed
// console.log('courseId', courseId.value);

const course = ref(null);
const sections = ref([]);
const enrolled = ref(false);
const progress = ref(null);
const loading = ref(true);
const enrolling = ref(false);
const isPurchased = ref(false);
const user = computed(() => pb.authStore.model);
const isAuthenticated = computed(() => !!user.value);
const isSuperuser = computed(() => authUtils.isSuperuser());

const fetchCourseData = async () => {
  try {
    loading.value = true;

    if (!courseId.value) {
      console.error('No course ID provided');
      return;
    }

    // Fetch course
    const courseData = await pb.collection('_learn_courses').getOne(courseId.value, {
      expand: 'subscription_tier'
    });
    course.value = courseData;

    // Fetch sections with lessons
    const sectionsData = await getCourseLessons(courseId.value);
    sections.value = sectionsData;

    // Check enrollment and progress if user is logged in
    if (user.value) {
      // Superusers are always considered enrolled
      if (isSuperuser.value) {
        enrolled.value = true;
      } else {
        enrolled.value = await isEnrolled(user.value.id, courseId.value);
        
        // Check if course was purchased (one-time payment)
        if (enrolled.value) {
          try {
            const enrollment = await pb.collection('_learn_enrollments').getFirstListItem(
              `user="${user.value.id}" && course="${courseId.value}"`
            );
            isPurchased.value = enrollment.purchase_type === 'one-time';
          } catch (error) {
            console.error('Error checking purchase status:', error);
          }
        }
      }
      
      if (enrolled.value && !isSuperuser.value) {
        const progressData = await getUserProgress(user.value.id, courseId.value);
        progress.value = progressData.progress;
        
        // Add completion status to lessons
        sections.value = progressData.sections;
      }
    }
  } catch (error) {
    console.error('Error fetching course:', error);
  } finally {
    loading.value = false;
  }
};

const handleEnroll = async () => {
  if (!user.value) {
    navigateTo('/auth');
    return;
  }

  try {
    enrolling.value = true;
    await enrollInCourse(user.value.id, courseId.value);
    enrolled.value = true;
    
    // Navigate to learning interface
    navigateTo(toLearnPath(`/courses/${courseId.value}/learn`));
  } catch (error) {
    console.error('Error enrolling in course:', error);
    alert('Failed to enroll in course. Please try again.');
  } finally {
    enrolling.value = false;
  }
};

const handleContinue = () => {
  navigateTo(toLearnPath(`/courses/${courseId.value}/learn`));
};

onMounted(() => {
  fetchCourseData();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="py-8">
          <div v-if="loading" class="animate-pulse">
            <div class="w-full aspect-video max-h-96 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>

          <CoursesCourseDetail
            v-else-if="course"
            :course="course"
            :sections="sections"
            :enrolled="enrolled"
            :progress="progress"
            :loading="enrolling"
            :is-authenticated="isAuthenticated"
            :is-purchased="isPurchased"
            @enroll="handleEnroll"
            @continue="handleContinue"
          />

          <div v-else class="text-center py-16">
            <p class="text-xl text-gray-600 dark:text-gray-400">Course not found.</p>
          </div>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
