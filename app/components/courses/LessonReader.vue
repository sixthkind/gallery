<template>
  <div class="lesson-reader prose dark:prose-invert max-w-none">
    <div v-if="blocks && blocks.length > 0" class="space-y-4">
      <div v-for="(block, index) in blocks" :key="`block-${index}`">
        <!-- Paragraph -->
        <p v-if="block.type === 'paragraph'" v-html="block.data.text" class="text-base leading-relaxed"></p>
        
        <!-- Header -->
        <component 
          v-else-if="block.type === 'header'" 
          :is="'h' + block.data.level" 
          v-html="block.data.text"
          :class="{
            'text-4xl font-bold mt-8 mb-4': block.data.level === 1,
            'text-3xl font-bold mt-6 mb-3': block.data.level === 2,
            'text-2xl font-bold mt-5 mb-3': block.data.level === 3,
            'text-xl font-semibold mt-4 mb-2': block.data.level === 4,
            'text-lg font-semibold mt-3 mb-2': block.data.level === 5,
            'text-base font-semibold mt-2 mb-2': block.data.level === 6
          }"
        ></component>
        
        <!-- List -->
        <component 
          v-else-if="block.type === 'list'"
          :is="block.data.style === 'ordered' ? 'ol' : 'ul'"
          :class="block.data.style === 'ordered' ? 'list-decimal pl-6 space-y-2' : 'list-disc pl-6 space-y-2'"
        >
          <li v-for="(item, idx) in block.data.items" :key="idx" v-html="item" class="leading-relaxed"></li>
        </component>
        
        <!-- Image -->
        <figure v-else-if="block.type === 'image'" class="my-6">
          <img 
            :src="block.data.file?.url || block.data.url" 
            :alt="block.data.caption || ''"
            class="rounded-lg w-full shadow-md"
          />
          <figcaption v-if="block.data.caption" class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            {{ block.data.caption }}
          </figcaption>
        </figure>
        
        <!-- Code -->
        <div v-else-if="block.type === 'code'" class="my-4">
          <pre class="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg p-4 overflow-x-auto border border-gray-700"><code class="text-gray-100 font-mono">{{ block.data.code }}</code></pre>
        </div>
        
        <!-- Quote -->
        <blockquote v-else-if="block.type === 'quote'" class="border-l-4 border-blue-500 pl-4 py-2 my-4 italic bg-blue-50 dark:bg-blue-900/20 rounded-r">
          <p v-html="block.data.text" class="text-lg"></p>
          <cite v-if="block.data.caption" class="block mt-2 text-sm text-gray-600 dark:text-gray-400 not-italic">
            — {{ block.data.caption }}
          </cite>
        </blockquote>
        
        <!-- Embed (videos) -->
        <div v-else-if="block.type === 'embed'" class="my-6">
          <div class="aspect-video rounded-lg overflow-hidden shadow-md">
            <iframe 
              :src="block.data.embed" 
              :width="block.data.width || '100%'"
              :height="block.data.height || '100%'"
              frameborder="0"
              allowfullscreen
              class="w-full h-full"
            ></iframe>
          </div>
          <p v-if="block.data.caption" class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            {{ block.data.caption }}
          </p>
        </div>
        
        <!-- Table -->
        <div v-else-if="block.type === 'table'" class="my-4 overflow-x-auto">
          <table class="min-w-full border border-gray-300 dark:border-gray-700">
            <thead v-if="block.data.withHeadings">
              <tr class="bg-gray-100 dark:bg-gray-800">
                <th 
                  v-for="(cell, idx) in block.data.content[0]" 
                  :key="idx"
                  class="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold"
                >
                  {{ cell }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(row, rowIdx) in (block.data.withHeadings ? block.data.content.slice(1) : block.data.content)" 
                :key="rowIdx"
                class="even:bg-gray-50 dark:even:bg-gray-900"
              >
                <td 
                  v-for="(cell, cellIdx) in row" 
                  :key="cellIdx"
                  class="border border-gray-300 dark:border-gray-700 px-4 py-2"
                >
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Delimiter -->
        <div v-else-if="block.type === 'delimiter'" class="flex items-center justify-center my-8">
          <div class="flex space-x-2">
            <div class="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
          </div>
        </div>
        
        <!-- Warning/Callout -->
        <div v-else-if="block.type === 'warning'" class="my-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r">
          <div class="flex items-start">
            <Icon name="lucide:alert-triangle" class="text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" size="20" />
            <div class="flex-1">
              <p v-if="block.data.title" class="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                {{ block.data.title }}
              </p>
              <p v-html="block.data.message" class="text-yellow-700 dark:text-yellow-400"></p>
            </div>
          </div>
        </div>
        
        <!-- Checklist -->
        <ul v-else-if="block.type === 'checklist'" class="space-y-2 my-4">
          <li v-for="(item, idx) in block.data.items" :key="idx" class="flex items-start">
            <Icon 
              :name="item.checked ? 'lucide:check-square' : 'lucide:square'" 
              :class="item.checked ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'"
              class="mr-3 mt-0.5 flex-shrink-0"
              size="20"
            />
            <span 
              v-html="item.text" 
              :class="item.checked ? 'line-through text-gray-500 dark:text-gray-500' : ''"
              class="flex-1"
            ></span>
          </li>
        </ul>
        
        <!-- Link Preview -->
        <a 
          v-else-if="block.type === 'linkTool'"
          :href="block.data.link" 
          target="_blank"
          rel="noopener noreferrer"
          class="block my-4 p-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div class="flex items-start">
            <img 
              v-if="block.data.meta?.image?.url" 
              :src="block.data.meta.image.url" 
              :alt="block.data.meta.title"
              class="w-24 h-24 object-cover rounded mr-4 flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-blue-600 dark:text-blue-400 truncate">
                {{ block.data.meta?.title || block.data.link }}
              </p>
              <p v-if="block.data.meta?.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {{ block.data.meta.description }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-2 truncate">
                {{ block.data.link }}
              </p>
            </div>
          </div>
        </a>
      </div>
    </div>
    <div v-else class="text-gray-500 dark:text-gray-400 italic">
      No content available for this lesson.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { validateBlockData } from '~/utils/editor';

const props = defineProps({
  content: {
    type: [Object, String],
    default: null
  }
});

// Parse the content and extract blocks
const blocks = computed(() => {
  if (!props.content) {
    return [];
  }
  
  // Handle JSON object
  if (typeof props.content === 'object') {
    if (validateBlockData(props.content)) {
      return props.content.blocks || [];
    }
    return [];
  }
  
  // Handle JSON string
  if (typeof props.content === 'string') {
    try {
      const parsed = JSON.parse(props.content);
      if (validateBlockData(parsed)) {
        return parsed.blocks || [];
      }
    } catch (e) {
      // Useful for debugging content parsing issues - uncomment if needed
      // console.warn('LessonReader: Failed to parse content as JSON, treating as HTML:', e);
      // If it's HTML (legacy content), render it as a single paragraph
      return [{
        type: 'paragraph',
        data: { text: props.content }
      }];
    }
  }
  
  return [];
});
</script>

<style scoped>
.lesson-reader {
  @apply text-gray-900 dark:text-gray-100;
}

.lesson-reader :deep(a) {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

.lesson-reader :deep(strong) {
  @apply font-bold;
}

.lesson-reader :deep(em) {
  @apply italic;
}

.lesson-reader :deep(code) {
  @apply bg-gray-900 dark:bg-gray-900 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
