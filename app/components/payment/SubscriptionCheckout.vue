<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
      <p class="text-xl text-gray-600">Get unlimited access to courses with a subscription</p>
      
      <!-- Interval Toggle -->
      <div class="flex items-center justify-center mt-6">
        <span :class="['font-medium', interval === 'month' ? 'text-gray-900' : 'text-gray-500']">
          Monthly
        </span>
        <button
          @click="toggleInterval"
          class="mx-4 relative inline-flex h-6 w-11 items-center rounded-full transition"
          :class="interval === 'year' ? 'bg-blue-600' : 'bg-gray-300'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition"
            :class="interval === 'year' ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
        <span :class="['font-medium', interval === 'year' ? 'text-gray-900' : 'text-gray-500']">
          Yearly
          <span class="ml-2 text-green-600 text-sm">(Save 17%)</span>
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ion-spinner></ion-spinner>
      <p class="ml-4 text-gray-600">Loading subscription plans...</p>
    </div>

    <!-- Pricing Cards -->
    <div v-else-if="tiers.length > 0" class="grid md:grid-cols-3 gap-8 mb-12">
      <PaymentPricingCard
        v-for="(tier, index) in tiers"
        :key="tier.id"
        :title="tier.name"
        :subtitle="`${getTierCourseCount(tier.id)} courses included`"
        :description="tier.description"
        :price="interval === 'month' ? tier.price_monthly : tier.price_yearly"
        :interval="interval"
        :features="tier.features"
        :badge="index === 1 ? 'Most Popular' : (tier.price_monthly === 0 && tier.price_yearly === 0 ? 'Free' : '')"
        :variant="index === 1 ? 'primary' : 'secondary'"
        :button-text="(tier.price_monthly === 0 && tier.price_yearly === 0) ? 'Get Started Free' : 'Subscribe'"
        :disabled="processing"
        @purchase="subscribe(tier.id)"
      />
    </div>

    <!-- No Tiers Available -->
    <div v-else class="text-center py-12">
      <p class="text-gray-600">No subscription plans available at this time.</p>
    </div>

    <!-- Loading State -->
    <div v-if="processing" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6">
        <ion-spinner></ion-spinner>
        <p class="text-gray-900 mt-4">Redirecting to checkout...</p>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="success" class="max-w-2xl mx-auto mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-green-800">{{ success }}</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Features Comparison -->
    <div class="max-w-4xl mx-auto mt-16">
      <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">What's Included</h2>
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="space-y-4">
          <div class="flex items-center">
            <Icon name="lucide:check" class="text-green-500 mr-3" />
            <span class="text-gray-700">Unlimited access to all tier courses</span>
          </div>
          <div class="flex items-center">
            <Icon name="lucide:check" class="text-green-500 mr-3" />
            <span class="text-gray-700">New courses added monthly</span>
          </div>
          <div class="flex items-center">
            <Icon name="lucide:check" class="text-green-500 mr-3" />
            <span class="text-gray-700">Cancel anytime - no commitment</span>
          </div>
          <div class="flex items-center">
            <Icon name="lucide:check" class="text-green-500 mr-3" />
            <span class="text-gray-700">Track your progress across all courses</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { pb } from '~/utils/pb';
const { toLearnPath } = useLearnRoutes();

const interval = ref('month');
const processing = ref(false);
const error = ref('');
const loading = ref(true);
const tiers = ref([]);
const courseCounts = ref({});
const success = ref('');

// Load subscription tiers from database
const loadTiers = async () => {
  try {
    loading.value = true;
    const tierRecords = await pb.collection('_learn_subscription_tiers').getFullList({
      filter: 'active=true',
      sort: 'order',
      $autoCancel: false
    });
    
    tiers.value = tierRecords.map(tier => ({
      id: tier.id,
      key: tier.key,
      name: tier.name,
      description: tier.description,
      price_monthly: tier.price_monthly,
      price_yearly: tier.price_yearly,
      features: tier.features || [],
      order: tier.order
    }));

    // Load course counts for each tier
    await loadCourseCounts();
  } catch (err) {
    console.error('Error loading subscription tiers:', err);
    error.value = 'Failed to load subscription plans';
  } finally {
    loading.value = false;
  }
};

// Load course counts per tier
const loadCourseCounts = async () => {
  try {
    for (const tier of tiers.value) {
      const courses = await pb.collection('_learn_courses').getList(1, 1, {
        filter: `subscription_tier="${tier.id}"`,
        $autoCancel: false
      });
      courseCounts.value[tier.id] = courses.totalItems;
    }
  } catch (err) {
    console.error('Error loading course counts:', err);
  }
};

const getTierCourseCount = (tierId) => {
  return courseCounts.value[tierId] || 0;
};

const toggleInterval = () => {
  interval.value = interval.value === 'month' ? 'year' : 'month';
};

const subscribe = async (tierId) => {
  if (processing.value) return;
  
  error.value = '';
  success.value = '';
  processing.value = true;

  try {
    // Create checkout session with tier_id
    const response = await pb.send('/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        tier_id: tierId,
        interval: interval.value
      }
    });

    // Handle free tier enrollment
    if (response.free) {
      success.value = response.message || 'Successfully enrolled in free tier!';
      processing.value = false;
      
      // Redirect to courses page after a short delay
      setTimeout(() => {
        navigateTo(toLearnPath('/courses'));
      }, 2000);
      return;
    }

    // Handle paid tier - redirect to Stripe checkout
    if (response.url) {
      window.location.href = response.url;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (err) {
    console.error('Error creating checkout:', err);
    error.value = err.message || 'Failed to start checkout process';
    processing.value = false;
  }
};

onMounted(() => {
  loadTiers();
});
</script>
