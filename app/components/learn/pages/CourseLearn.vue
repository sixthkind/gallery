<script setup>
import { pb } from '~/utils/pb';
import { authUtils } from '~/utils/auth';
import { isEnrolled, getUserProgress, markLessonComplete, markLessonIncomplete, getCourseLessons } from '~/utils/courses';
import { useRoute } from 'vue-router';
const { toLearnPath } = useLearnRoutes();

const route = useRoute();
const courseId = computed(() => String(route.params.id));

const course = ref(null);
const sections = ref([]);
const activeLesson = ref(null);
const activeLessonIndex = ref({ sectionIdx: 0, lessonIdx: 0 });
const enrolled = ref(false);
const progress = ref(null);
const loading = ref(true);
const user = computed(() => pb.authStore.model);
const isSuperuser = computed(() => authUtils.isSuperuser());

const allLessons = computed(() => {
  const lessons = [];
  sections.value.forEach((section, sIdx) => {
    section.lessons?.forEach((lesson, lIdx) => {
      lessons.push({
        ...lesson,
        sectionIdx: sIdx,
        lessonIdx: lIdx,
        sectionTitle: section.title
      });
    });
  });
  return lessons;
});

const hasNext = computed(() => {
  const currentIndex = allLessons.value.findIndex(l => l.id === activeLesson.value?.id);
  return currentIndex < allLessons.value.length - 1;
});

const hasPrevious = computed(() => {
  const currentIndex = allLessons.value.findIndex(l => l.id === activeLesson.value?.id);
  return currentIndex > 0;
});

const fetchCourseData = async () => {
  try {
    loading.value = true;

    if (!courseId.value) {
      console.error('No course ID provided');
      return;
    }

    // Check enrollment (superusers bypass this check)
    if (isSuperuser.value) {
      enrolled.value = true;
    } else {
      enrolled.value = await isEnrolled(user.value.id, courseId.value);
      
      if (!enrolled.value) {
        navigateTo(toLearnPath(`/courses/${courseId.value}`));
        return;
      }
    }

    // Fetch course
    const courseData = await pb.collection('_learn_courses').getOne(courseId.value, {
      expand: 'subscription_tier'
    });
    course.value = courseData;

    // Fetch progress (includes sections and lessons)
    if (isSuperuser.value) {
      // Superusers just get the lessons without progress tracking
      const sectionsData = await getCourseLessons(courseId.value);
      sections.value = sectionsData;
      progress.value = 0;
    } else {
      const progressData = await getUserProgress(user.value.id, courseId.value);
      sections.value = progressData.sections;
      progress.value = progressData.progress;
    }

    // Set initial active lesson (first incomplete or first lesson)
    if (sections.value.length > 0) {
      let foundIncomplete = false;
      
      for (let sIdx = 0; sIdx < sections.value.length; sIdx++) {
        const section = sections.value[sIdx];
        for (let lIdx = 0; lIdx < (section.lessons?.length || 0); lIdx++) {
          const lesson = section.lessons[lIdx];
          if (!lesson.completed && !foundIncomplete) {
            activeLesson.value = lesson;
            activeLessonIndex.value = { sectionIdx: sIdx, lessonIdx: lIdx };
            foundIncomplete = true;
            break;
          }
        }
        if (foundIncomplete) break;
      }

      // If all complete, show first lesson
      if (!activeLesson.value && sections.value[0].lessons?.length > 0) {
        activeLesson.value = sections.value[0].lessons[0];
        activeLessonIndex.value = { sectionIdx: 0, lessonIdx: 0 };
      }
    }
  } catch (error) {
    console.error('Error fetching course data:', error);
  } finally {
    loading.value = false;
  }
};

const selectLesson = (lesson) => {
  activeLesson.value = lesson;
  
  // Find lesson index
  sections.value.forEach((section, sIdx) => {
    const lIdx = section.lessons?.findIndex(l => l.id === lesson.id);
    if (lIdx !== -1) {
      activeLessonIndex.value = { sectionIdx: sIdx, lessonIdx: lIdx };
    }
  });
};

const toggleComplete = async (completed) => {
  if (!activeLesson.value) return;

  try {
    if (completed) {
      await markLessonComplete(user.value.id, activeLesson.value.id);
    } else {
      await markLessonIncomplete(user.value.id, activeLesson.value.id);
    }

    // Update local state
    const section = sections.value[activeLessonIndex.value.sectionIdx];
    if (section && section.lessons) {
      section.lessons[activeLessonIndex.value.lessonIdx].completed = completed;
    }

    // Update activeLesson to reflect the change immediately
    activeLesson.value.completed = completed;

    // Refresh progress
    const progressData = await getUserProgress(user.value.id, courseId.value);
    progress.value = progressData.progress;
  } catch (error) {
    console.error('Error toggling lesson completion:', error);
  }
};

const nextLesson = async () => {
  if (!activeLesson.value) return;
  
  // Mark current lesson as complete before moving to next
  if (!activeLesson.value.completed && !isSuperuser.value) {
    await toggleComplete(true);
  }
  
  const currentIndex = allLessons.value.findIndex(l => l.id === activeLesson.value?.id);
  if (currentIndex < allLessons.value.length - 1) {
    selectLesson(allLessons.value[currentIndex + 1]);
  }
};

const skipLesson = () => {
  const currentIndex = allLessons.value.findIndex(l => l.id === activeLesson.value?.id);
  if (currentIndex < allLessons.value.length - 1) {
    selectLesson(allLessons.value[currentIndex + 1]);
  }
};

const previousLesson = () => {
  const currentIndex = allLessons.value.findIndex(l => l.id === activeLesson.value?.id);
  if (currentIndex > 0) {
    selectLesson(allLessons.value[currentIndex - 1]);
  }
};

const finishCourse = async () => {
  if (!activeLesson.value) return;
  
  // Mark current lesson as complete before finishing
  if (!activeLesson.value.completed && !isSuperuser.value) {
    await toggleComplete(true);
  }
  
  navigateTo(toLearnPath(`/courses/${courseId.value}`));
};

onMounted(() => {
  fetchCourseData();
});
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div v-else-if="!enrolled" class="flex items-center justify-center h-full">
        <div class="text-center">
          <p class="text-xl text-gray-600 dark:text-gray-400 mb-4">You are not enrolled in this course.</p>
          <ion-button shape="round" mode="ios" @click="navigateTo(toLearnPath(`/courses/${courseId.value}`))">
            Go to Course
          </ion-button>
        </div>
      </div>

      <div v-else class="flex h-full">
        <!-- Sidebar - Superuser version -->
        <div v-if="isSuperuser" class="w-80 flex-shrink-0 hidden lg:block">
          <CoursesCourseSidebarSuperuser
            :course-id="courseId"
            :course-title="course?.title || 'Course'"
            :sections="sections"
            :active-lesson-id="activeLesson?.id"
            @select-lesson="selectLesson"
            @refresh="fetchCourseData"
          />
        </div>

        <!-- Sidebar - Student version -->
        <div v-else class="w-80 flex-shrink-0 hidden lg:block">
          <CoursesCourseSidebarStudent
            :course-id="courseId"
            :course-title="course?.title || 'Course'"
            :sections="sections"
            :active-lesson-id="activeLesson?.id"
            :progress="progress"
            @select-lesson="selectLesson"
          />
        </div>

        <!-- Main content -->
        <div class="flex-1">
          <CoursesLessonViewer
            v-if="activeLesson"
            :lesson="activeLesson"
            :completed="activeLesson.completed"
            :has-next="hasNext"
            :has-previous="hasPrevious"
            @toggle-complete="toggleComplete"
            @next="nextLesson"
            @skip="skipLesson"
            @previous="previousLesson"
            @finish="finishCourse"
          />

          <div v-else class="flex items-center justify-center h-full">
            <p class="text-xl text-gray-600 dark:text-gray-400">No lessons available.</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
