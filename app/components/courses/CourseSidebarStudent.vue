<template>
  <div class="course-sidebar h-full flex flex-col p-4">
    <div class="h-full flex flex-col bg-stone-50 dark:bg-gray-900 rounded-2xl overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-800">
      <NuxtLink 
        :to="`/courses/${courseId}`"
        class="block hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <h2 class="font-semibold text-lg line-clamp-2">{{ courseTitle }}</h2>
      </NuxtLink>
      
      <div v-if="progress !== null" class="mt-3">
        <CoursesProgressBar 
          :progress="progress" 
          :label="progress >= 100 ? 'Completed!' : 'Progress'" 
          size="sm"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-for="(section, sectionIndex) in sections" :key="section.id" class="border-b border-gray-200 dark:border-gray-800">
        <div
          :class="[
            'w-full p-2 transition-colors flex items-center justify-between gap-2',
            isSectionComplete(section)
              ? 'bg-green-50 dark:bg-green-900/20'
              : ''
          ]"
        >
          <button
            @click="toggleSection(section.id)"
            class="flex-1 text-left flex items-center gap-2 min-w-0"
            :class="[
              isSectionComplete(section)
                ? 'hover:bg-green-100 dark:hover:bg-green-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800',
              'transition-colors rounded px-2 py-1 -ml-2'
            ]"
          >
            <span class="text-sm text-gray-400 flex-shrink-0">{{ sectionIndex + 1 }}.</span>
            <span class="text-sm font-medium flex-1 min-w-0">{{ section.title }}</span>
            <div v-if="section.progress !== undefined" class="text-xs text-gray-500 flex-shrink-0">
              {{ section.lessons?.filter(l => l.completed).length || 0 }}/{{ section.lessons?.length || 0 }}
            </div>
          </button>

          <div class="flex items-center gap-0 flex-shrink-0">
            <!-- Expand/collapse toggle -->
            <button
              @click="toggleSection(section.id)"
              class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Icon 
                :name="expandedSections.has(section.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                class="text-gray-400"
                size="16"
              />
            </button>
          </div>
        </div>

        <div 
          v-show="expandedSections.has(section.id)"
          :class="[
            isSectionComplete(section)
              ? 'bg-green-50/50 dark:bg-green-900/10'
              : 'bg-gray-50 dark:bg-gray-800/50'
          ]"
        >
          <div
            v-for="lesson in section.lessons"
            :key="lesson.id"
            class="flex items-center gap-2"
            :class="[
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              activeLessonId === lesson.id && 'bg-blue-50 dark:bg-blue-900/20'
            ]"
          >
            <button
              @click="$emit('select-lesson', lesson)"
              :class="[
                'flex-1 p-3 pl-8 text-left text-sm transition-colors flex items-center gap-2',
                activeLessonId === lesson.id 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : lesson.completed
                    ? 'text-green-700 dark:text-green-400'
                    : ''
              ]"
            >
              <Icon 
                :name="lesson.completed ? 'lucide:check-circle' : 'lucide:play-circle'"
                :class="lesson.completed ? 'text-green-600' : 'text-gray-400'"
                class="flex-shrink-0"
              />
              <span class="flex-1 line-clamp-2">{{ lesson.title }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  courseId: {
    type: String,
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  sections: {
    type: Array,
    default: () => []
  },
  activeLessonId: {
    type: String,
    default: null
  },
  progress: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['select-lesson']);

const expandedSections = ref(new Set());

// Expand all sections by default
onMounted(() => {
  props.sections.forEach(section => {
    expandedSections.value.add(section.id);
  });
});

// Expand section containing active lesson
watch(() => props.activeLessonId, (newLessonId) => {
  if (newLessonId) {
    const section = props.sections.find(s => 
      s.lessons?.some(l => l.id === newLessonId)
    );
    if (section) {
      expandedSections.value.add(section.id);
    }
  }
}, { immediate: true });

const toggleSection = (sectionId) => {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId);
  } else {
    expandedSections.value.add(sectionId);
  }
};

const isSectionComplete = (section) => {
  if (!section.lessons || section.lessons.length === 0) return false;
  return section.lessons.every(lesson => lesson.completed);
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

