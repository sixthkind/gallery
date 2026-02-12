<template>
  <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-bold text-gray-900">{{ title }}</h3>
        <p v-if="subtitle" class="text-sm text-gray-500">{{ subtitle }}</p>
      </div>
      <div v-if="badge" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
        {{ badge }}
      </div>
    </div>

    <p v-if="description" class="text-sm text-gray-600 mb-4">{{ description }}</p>

    <div class="mb-4">
      <div class="flex items-baseline">
        <span class="text-3xl font-bold text-gray-900">{{ formattedPrice }}</span>
        <span v-if="interval" class="text-gray-500 ml-2">/{{ interval }}</span>
      </div>
      <p v-if="originalPrice && originalPrice !== price" class="text-sm text-gray-400 line-through">
        {{ formatPrice(originalPrice) }}
      </p>
    </div>

    <ul v-if="features && features.length" class="space-y-2 mb-6">
      <li v-for="(feature, index) in features" :key="index" class="flex items-start">
        <Icon name="lucide:check" class="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
        <span class="text-gray-600 text-sm">{{ feature }}</span>
      </li>
    </ul>

    <slot name="action">
      <button
        @click="$emit('purchase')"
        :disabled="disabled"
        :class="[
          'w-full py-3 px-4 rounded-lg font-medium transition',
          variant === 'primary'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        ]"
      >
        {{ buttonText }}
      </button>
    </slot>
  </div>
</template>

<script setup>
import { formatPrice } from '~/utils/stripe';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    default: null
  },
  interval: {
    type: String,
    default: ''
  },
  features: {
    type: Array,
    default: () => []
  },
  badge: {
    type: String,
    default: ''
  },
  buttonText: {
    type: String,
    default: 'Purchase'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value)
  }
});

defineEmits(['purchase']);

const formattedPrice = computed(() => {
  if (props.price === 0) return 'Free';
  return formatPrice(props.price);
});
</script>

