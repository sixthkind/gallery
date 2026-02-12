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
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-for="(section, sectionIndex) in sections" :key="section.id" class="border-b border-gray-200 dark:border-gray-800">
        <div
          class="w-full p-2 transition-colors flex items-center justify-between gap-2"
        >
          <button
            @click="toggleSection(section.id)"
            class="flex-1 text-left flex items-center gap-2 min-w-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded px-2 py-1 -ml-2"
          >
            <span class="text-sm text-gray-400 flex-shrink-0">{{ sectionIndex + 1 }}.</span>
            <input
              v-if="isEditMode && editingSection === section.id"
              v-model="editingSectionTitle"
              @blur="saveSectionTitle(section)"
              @keyup.enter="saveSectionTitle(section)"
              @keyup.esc="cancelEditSection"
              @click.stop
              class="text-sm font-medium bg-white dark:bg-gray-800 border border-blue-500 rounded px-2 py-1 flex-1 min-w-0"
              ref="sectionTitleInput"
            />
            <span v-else class="text-sm font-medium flex-1 min-w-0">{{ section.title }}</span>
            <div class="text-xs text-gray-500 flex-shrink-0">
              {{ section.lessons?.length || 0 }} lessons
            </div>
          </button>

          <div class="flex items-center gap-0 flex-shrink-0">
            <!-- Reorder arrows for sections -->
            <div v-if="isReorderMode" class="flex flex-col mr-1">
              <button
                @click.stop="handleMoveSectionUp(section, sectionIndex)"
                :disabled="sectionIndex === 0"
                :class="[
                  'p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors',
                  sectionIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''
                ]"
                title="Move section up"
              >
                <Icon name="lucide:chevron-up" class="text-blue-600 dark:text-blue-400" size="14" />
              </button>
              <button
                @click.stop="handleMoveSectionDown(section, sectionIndex)"
                :disabled="sectionIndex === sections.length - 1"
                :class="[
                  'p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors',
                  sectionIndex === sections.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                ]"
                title="Move section down"
              >
                <Icon name="lucide:chevron-down" class="text-blue-600 dark:text-blue-400" size="14" />
              </button>
            </div>

            <!-- Edit controls -->
            <button
              v-if="isEditMode"
              @click.stop="startEditSection(section)"
              class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Edit section title"
            >
              <Icon name="lucide:edit-2" class="text-gray-600 dark:text-gray-400" size="16" />
            </button>
            <button
              v-if="isEditMode"
              @click.stop="addLesson(section)"
              class="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Add lesson"
            >
              <Icon name="lucide:plus-circle" class="text-blue-600 dark:text-blue-400" size="16" />
            </button>
            <button
              v-if="isEditMode"
              @click.stop="handleDeleteSection(section)"
              class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Delete section"
            >
              <Icon name="lucide:trash-2" class="text-red-600 dark:text-red-400" size="16" />
            </button>
            
            <!-- Always visible expand/collapse toggle -->
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
          class="bg-gray-50 dark:bg-gray-800/50"
        >
          <div
            v-for="(lesson, lessonIndex) in section.lessons"
            :key="lesson.id"
            class="flex items-center gap-2 group"
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
                  : ''
              ]"
            >
              <Icon 
                name="lucide:play-circle"
                class="text-gray-400 flex-shrink-0"
              />
              <span class="flex-1 line-clamp-2">{{ lesson.title }}</span>
            </button>
            
            <!-- Lesson controls (reorder + delete) -->
            <div 
              class="flex items-center gap-1 pr-2 transition-opacity"
              :class="isReorderMode || isEditMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
            >
              <!-- Reorder arrows -->
              <div v-if="isReorderMode" class="flex flex-col">
                <button
                  @click.stop="handleMoveLessonUp(lesson, section)"
                  :disabled="lessonIndex === 0"
                  :class="[
                    'p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors',
                    lessonIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''
                  ]"
                  title="Move lesson up"
                >
                  <Icon name="lucide:chevron-up" class="text-blue-600 dark:text-blue-400" size="14" />
                </button>
                <button
                  @click.stop="handleMoveLessonDown(lesson, section)"
                  :disabled="lessonIndex === section.lessons.length - 1"
                  :class="[
                    'p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors',
                    lessonIndex === section.lessons.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                  ]"
                  title="Move lesson down"
                >
                  <Icon name="lucide:chevron-down" class="text-blue-600 dark:text-blue-400" size="14" />
                </button>
              </div>
              
              <!-- Delete button (edit mode only) -->
              <button
                v-if="isEditMode"
                @click.stop="handleDeleteLesson(lesson, section)"
                class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                title="Delete lesson"
              >
                <Icon name="lucide:trash-2" class="text-red-600 dark:text-red-400" size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Section button in edit mode -->
      <div v-if="isEditMode" class="p-4">
        <ion-button 
          @click="addSection"
          expand="block"
          fill="outline"
          size="small"
          shape="round"
          mode="ios"
          color="secondary"
        >
          <Icon name="lucide:plus" class="mr-2" />
          Add Section
        </ion-button>
      </div>
    </div>

    <!-- Admin controls footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
      <ion-button 
        @click="toggleEditMode"
        expand="block"
        :fill="isEditMode ? 'solid' : 'outline'"
        size="small"
        shape="round"
        mode="ios"
        :color="isEditMode ? 'primary' : 'secondary'"
      >
        <Icon :name="isEditMode ? 'lucide:check' : 'lucide:edit'" class="mr-2" />
        {{ isEditMode ? 'Done Editing' : 'Edit' }}
      </ion-button>
      
      <ion-button 
        @click="toggleReorderMode"
        expand="block"
        :fill="isReorderMode ? 'solid' : 'outline'"
        size="small"
        shape="round"
        mode="ios"
        :color="isReorderMode ? 'primary' : 'secondary'"
      >
        <Icon :name="isReorderMode ? 'lucide:check' : 'lucide:arrows-up-down'" class="mr-2" />
        {{ isReorderMode ? 'Done Reordering' : 'Reorder' }}
      </ion-button>
    </div>
    </div>
  </div>
</template>

<script setup>
import { pb } from '~/utils/pb';
import { 
  moveSectionUp, 
  moveSectionDown, 
  deleteSection,
  moveLessonUp,
  moveLessonDown,
  deleteLesson,
  getNextSectionOrder,
  getNextLessonOrder
} from '~/utils/ordering';

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
  }
});

const emit = defineEmits(['select-lesson', 'refresh']);

const expandedSections = ref(new Set());
const isEditMode = ref(false);
const isReorderMode = ref(false);
const editingSection = ref(null);
const editingSectionTitle = ref('');
const sectionTitleInput = ref(null);

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

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) {
    // Cancel any ongoing edits
    editingSection.value = null;
    editingSectionTitle.value = '';
  }
};

const toggleReorderMode = () => {
  isReorderMode.value = !isReorderMode.value;
};

const startEditSection = (section) => {
  editingSection.value = section.id;
  editingSectionTitle.value = section.title;
  nextTick(() => {
    sectionTitleInput.value?.focus();
  });
};

const cancelEditSection = () => {
  editingSection.value = null;
  editingSectionTitle.value = '';
};

const saveSectionTitle = async (section) => {
  if (!editingSectionTitle.value.trim() || editingSectionTitle.value === section.title) {
    cancelEditSection();
    return;
  }

  try {
    await pb.collection('_learn_sections').update(section.id, {
      title: editingSectionTitle.value.trim()
    });
    
    // Update local data
    section.title = editingSectionTitle.value.trim();
    cancelEditSection();
    
    // Emit refresh event to parent
    emit('refresh');
  } catch (error) {
    console.error('Error updating section title:', error);
    alert('Failed to update section title');
  }
};

// Section ordering handlers
const handleMoveSectionUp = async (section, sectionIndex) => {
  if (sectionIndex === 0) return;
  
  try {
    await moveSectionUp(section.id, props.sections);
    emit('refresh');
  } catch (error) {
    console.error('Error moving section up:', error);
    alert('Failed to move section');
  }
};

const handleMoveSectionDown = async (section, sectionIndex) => {
  if (sectionIndex === props.sections.length - 1) return;
  
  try {
    await moveSectionDown(section.id, props.sections);
    emit('refresh');
  } catch (error) {
    console.error('Error moving section down:', error);
    alert('Failed to move section');
  }
};

const handleDeleteSection = async (section) => {
  const lessonCount = section.lessons?.length || 0;
  const confirmMessage = lessonCount > 0
    ? `Are you sure you want to delete "${section.title}" and its ${lessonCount} lesson(s)? This action cannot be undone.`
    : `Are you sure you want to delete "${section.title}"? This action cannot be undone.`;
  
  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    await deleteSection(section.id, props.sections, { deleteLessons: true });
    emit('refresh');
  } catch (error) {
    console.error('Error deleting section:', error);
    alert('Failed to delete section');
  }
};

// Lesson ordering handlers
const handleMoveLessonUp = async (lesson, section) => {
  try {
    await moveLessonUp(lesson.id, section.lessons);
    emit('refresh');
  } catch (error) {
    console.error('Error moving lesson up:', error);
    alert('Failed to move lesson');
  }
};

const handleMoveLessonDown = async (lesson, section) => {
  try {
    await moveLessonDown(lesson.id, section.lessons);
    emit('refresh');
  } catch (error) {
    console.error('Error moving lesson down:', error);
    alert('Failed to move lesson');
  }
};

const handleDeleteLesson = async (lesson, section) => {
  if (!confirm(`Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await deleteLesson(lesson.id, section.lessons);
    emit('refresh');
  } catch (error) {
    console.error('Error deleting lesson:', error);
    alert('Failed to delete lesson');
  }
};

const addSection = () => {
  const nextOrder = getNextSectionOrder(props.sections);
  const prefill = encodeURIComponent(JSON.stringify({ 
    course: props.courseId,
    order: nextOrder
  }));
  navigateTo(`/edit/sections?prefill=${prefill}`);
};

const addLesson = (section) => {
  const nextOrder = getNextLessonOrder(section.lessons);
  const prefill = encodeURIComponent(JSON.stringify({ 
    section: section.id,
    order: nextOrder
  }));
  navigateTo(`/edit/lessons?prefill=${prefill}`);
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

