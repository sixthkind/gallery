<template>
  <div class="lesson-viewer h-full flex flex-col relative">
    <!-- Fixed Title Bar -->
    <div class="fixed top-20 left-0 right-0 lg:left-80 z-50">
      <div class="px-8">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-start justify-between backdrop-blur-md bg-stone-50 dark:bg-gray-900 bg-opacity-50 rounded-2xl px-8 py-4 shadow-lg">
            <h1 class="text-4xl font-bold flex-1 text-primary">{{ lesson.title }}</h1>
            <div v-if="isAdmin" class="flex gap-2 ml-4 flex-shrink-0">
              <ion-button 
                v-if="!isEditMode"
                @click="toggleEditMode"
                fill="outline"
                size="small"
                shape="round"
                mode="ios"
              >
                <Icon name="lucide:edit" class="mr-2" />
                Edit Content
              </ion-button>
              
              <ion-button 
                v-if="isEditMode"
                @click="saveContent"
                color="primary"
                size="small"
                shape="round"
                mode="ios"
                :disabled="isSaving"
              >
                <Icon name="lucide:save" class="mr-2" />
                {{ isSaving ? 'Saving...' : 'Save' }}
              </ion-button>
              
              <ion-button 
                v-if="isEditMode"
                @click="cancelEdit"
                fill="outline"
                size="small"
                shape="round"
                mode="ios"
                :disabled="isSaving"
              >
                <Icon name="lucide:x" class="mr-2" />
                Cancel
              </ion-button>
              
              <ion-button 
                @click="editLesson"
                fill="clear"
                size="small"
                shape="round"
                mode="ios"
                title="Edit lesson details"
              >
                <Icon name="lucide:settings" />
              </ion-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area with Padding -->
    <div class="flex-1 overflow-y-auto pt-40 pb-32 px-8">
      <div class="max-w-4xl mx-auto">
        <!-- Editor mode for superusers -->
        <CoursesLessonEditor
          v-if="isEditMode && isAdmin"
          ref="editorRef"
          :lesson-id="lesson.id"
          :initial-content="lesson.content"
          :auto-save="false"
          @save="handleEditorSave"
        />
        
        <!-- Reader mode for everyone else (and superusers not editing) -->
        <CoursesLessonReader
          v-else
          :content="lesson.content"
        />
      </div>
    </div>

    <!-- Fixed Navigation Bar -->
    <div class="fixed bottom-6 left-0 right-0 lg:left-80 z-50">
      <div class="px-8">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between backdrop-blur-md bg-stone-50 dark:bg-gray-900 bg-opacity-50 rounded-2xl px-8 py-4 shadow-lg">
            <div class="flex items-center gap-3">
              <ion-button
                v-if="completed"
                @click="$emit('toggle-complete', false)"
                fill="clear"
                size="small"
                shape="round"
                mode="ios"
              >
                <Icon name="lucide:x-circle" class="mr-2" />
                Mark as Incomplete
              </ion-button>

              <ion-button
                v-if="!completed && hasNext"
                @click="$emit('skip')"
                fill="clear"
                size="small"
                shape="round"
                mode="ios"
              >
                <Icon name="lucide:skip-forward" class="mr-2" />
                Skip
              </ion-button>
            </div>

            <div class="flex items-center gap-2">
              <ion-button
                v-if="hasPrevious"
                @click="$emit('previous')"
                fill="outline"
                shape="round"
                mode="ios"
              >
                <Icon name="lucide:chevron-left" class="mr-2" />
                Previous
              </ion-button>

              <ion-button
                v-if="hasNext"
                @click="$emit('next')"
                color="primary"
                shape="round"
                mode="ios"
              >
                Next
                <Icon name="lucide:chevron-right" class="ml-2" />
              </ion-button>

              <ion-button
                v-else
                @click="$emit('finish')"
                color="success"
                shape="round"
                mode="ios"
              >
                <Icon name="lucide:check-circle" class="mr-2" />
                Finish Course
              </ion-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { pb } from '~/utils/pb';
import { authUtils } from '~/utils/auth';

const props = defineProps({
  lesson: {
    type: Object,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  hasNext: {
    type: Boolean,
    default: false
  },
  hasPrevious: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-complete', 'next', 'skip', 'previous', 'finish', 'content-updated']);

const user = computed(() => pb.authStore.record);
const isAdmin = computed(() => authUtils.isSuperuser());
const isEditMode = ref(false);
const isSaving = ref(false);
const editorRef = ref(null);

// Toggle edit mode
const toggleEditMode = () => {
  isEditMode.value = true;
};

// Cancel editing
const cancelEdit = () => {
  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
    isEditMode.value = false;
  }
};

// Save content from editor
const saveContent = async () => {
  if (!editorRef.value) return;
  
  try {
    isSaving.value = true;
    
    // Get content from editor
    const content = await editorRef.value.getContent();
    
    // Save to PocketBase
    await pb.collection('_learn_lessons').update(props.lesson.id, {
      content: JSON.stringify(content)
    });
    
    // Update local lesson object
    props.lesson.content = content;
    
    // Exit edit mode
    isEditMode.value = false;
    
    // Emit event to parent
    emit('content-updated', content);
  } catch (error) {
    console.error('Error saving content:', error);
    alert('Failed to save content. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

// Handle auto-save from editor
const handleEditorSave = async (content) => {
  try {
    await pb.collection('_learn_lessons').update(props.lesson.id, {
      content: JSON.stringify(content)
    });
    
    props.lesson.content = content;
    emit('content-updated', content);
  } catch (error) {
    console.error('Error auto-saving content:', error);
  }
};

// Navigate to lesson settings/details edit page
const editLesson = () => {
  navigateTo(`/edit/lessons/${props.lesson.id}`);
};
</script>

