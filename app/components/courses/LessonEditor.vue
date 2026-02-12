<template>
  <div class="lesson-editor">
    <textarea
      v-model="editorText"
      class="w-full min-h-[400px] rounded-lg border border-gray-200 bg-white p-6 text-base leading-relaxed text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      placeholder="Start writing your lesson content..."
      @input="handleInput"
    />

    <div
      v-if="isSaving"
      class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-700 shadow-lg dark:bg-blue-900/30 dark:text-blue-300"
    >
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400" />
      <span>Saving...</span>
    </div>

    <div
      v-if="lastSaved"
      class="mt-2 text-right text-sm text-gray-500 dark:text-gray-400"
    >
      Last saved: {{ formatTime(lastSaved) }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import { validateBlockData, getDefaultEditorData, sanitizeEditorData } from '~/utils/editor';

const props = defineProps({
  lessonId: {
    type: String,
    required: true
  },
  initialContent: {
    type: [Object, String],
    default: null
  },
  autoSave: {
    type: Boolean,
    default: true
  },
  autoSaveDelay: {
    type: Number,
    default: 2000
  }
});

const emit = defineEmits(['save', 'change']);

const editorText = ref('');
const isSaving = ref(false);
const lastSaved = ref(null);
let autoSaveTimeout = null;

const formatTime = (date) => {
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const blockDataToText = (data) => {
  if (!validateBlockData(data)) {
    return '';
  }

  return data.blocks
    .map((block) => {
      if (typeof block?.data?.text === 'string') {
        return block.data.text;
      }
      if (typeof block?.data?.caption === 'string') {
        return block.data.caption;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
};

const textToBlockData = (text) => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return getDefaultEditorData();
  }

  return sanitizeEditorData({
    time: Date.now(),
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: trimmed
        }
      }
    ],
    version: '2.30.2'
  });
};

const syncFromInitialContent = (value) => {
  if (!value) {
    editorText.value = '';
    return;
  }

  if (typeof value === 'object') {
    editorText.value = blockDataToText(value);
    return;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      editorText.value = blockDataToText(parsed);
      return;
    } catch {
      editorText.value = value;
      return;
    }
  }

  editorText.value = '';
};

const saveContent = async () => {
  isSaving.value = true;

  try {
    const output = textToBlockData(editorText.value);
    emit('save', output);
    lastSaved.value = new Date();
    return output;
  } finally {
    setTimeout(() => {
      isSaving.value = false;
    }, 400);
  }
};

const getContent = async () => textToBlockData(editorText.value);

const clear = async () => {
  editorText.value = '';
};

const handleInput = () => {
  emit('change', editorText.value);

  if (!props.autoSave) {
    return;
  }

  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(async () => {
    await saveContent();
  }, props.autoSaveDelay);
};

watch(() => props.initialContent, syncFromInitialContent, { immediate: true });

onBeforeUnmount(() => {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
});

defineExpose({
  saveContent,
  getContent,
  clear
});
</script>
