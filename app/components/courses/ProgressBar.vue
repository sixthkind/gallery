<template>
  <div v-if="progress !== null" class="progress-bar-container">
    <div class="flex items-center justify-between text-xs mb-1">
      <span class="text-gray-600 dark:text-gray-400">{{ label }}</span>
      <span :class="progress >= 100 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400'">{{ progress }}%</span>
    </div>
    <div 
      :class="[
        'w-full bg-gray-200 dark:bg-gray-700 rounded-full transition-all duration-300',
        size === 'sm' ? 'h-2' : 'h-3'
      ]"
    >
      <div 
        :class="[
          'rounded-full transition-all duration-300',
          progress >= 100 ? 'bg-green-500' : 'bg-indigo-500',
          size === 'sm' ? 'h-2' : 'h-3'
        ]"
        :style="{ width: progress + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  progress: {
    type: Number,
    default: null
  },
  label: {
    type: String,
    default: 'Progress'
  },
  size: {
    type: String,
    default: 'sm', // 'sm' or 'md'
    validator: (value) => ['sm', 'md'].includes(value)
  }
});
</script>

