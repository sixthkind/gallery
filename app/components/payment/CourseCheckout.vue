<template>
  <div class="max-w-2xl mx-auto p-6">
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ion-spinner></ion-spinner>
    </div>

    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
      <button @click="$router.back()" class="mt-4 text-red-600 hover:underline">
        Go Back
      </button>
    </div>

    <div v-else-if="success" class="text-center py-12">
      <Icon name="lucide:check-circle" class="text-green-500 text-6xl mb-4 mx-auto" />
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
      <p class="text-gray-600 mb-6">You now have access to the course.</p>
      <button
        @click="navigateTo(toLearnPath(`/courses/${courseId}/learn`))"
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Start Learning
      </button>
    </div>

    <div v-else>
      <!-- Course Info -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
        <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <img
            v-if="course?.image"
            :src="pb.files.getURL(course, course.image)"
            :alt="course?.title"
            class="w-20 h-20 object-cover rounded"
          />
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900">{{ course?.title }}</h3>
            <p class="text-2xl font-bold text-blue-600 mt-1">{{ formattedPrice }}</p>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
        
        <div id="payment-element" class="mb-4"></div>
        
        <div v-if="paymentError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-red-800 text-sm">{{ paymentError }}</p>
        </div>

        <button
          @click="handleSubmit"
          :disabled="processing || !paymentElement"
          class="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {{ processing ? 'Processing...' : `Pay ${formattedPrice}` }}
        </button>

        <p class="text-center text-sm text-gray-500 mt-4">
          Secured by <strong>Stripe</strong>. Your payment information is encrypted.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { pb } from '~/utils/pb';
import { createPaymentIntent, initializeStripe, formatPrice } from '~/utils/stripe';
const { toLearnPath } = useLearnRoutes();

const props = defineProps({
  courseId: {
    type: String,
    required: true
  }
});

const course = ref(null);
const loading = ref(true);
const processing = ref(false);
const error = ref('');
const paymentError = ref('');
const success = ref(false);
const clientSecret = ref('');
const paymentElement = ref(null);

let stripe = null;
let elements = null;

const formattedPrice = computed(() => {
  if (!course.value?.price) return '$0.00';
  return formatPrice(course.value.price);
});

// Load course and create payment intent
const initializePayment = async () => {
  try {
    loading.value = true;
    error.value = '';

    // Load course
    course.value = await pb.collection('_learn_courses').getOne(props.courseId);

    if (!course.value.price || course.value.price <= 0) {
      error.value = 'This course is free. No payment required.';
      return;
    }

    // Initialize Stripe
    stripe = await initializeStripe();

    // Create payment intent
    const paymentIntent = await createPaymentIntent('course', props.courseId);
    clientSecret.value = paymentIntent.client_secret;

    // Create Elements
    elements = stripe.elements({
      clientSecret: clientSecret.value,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#2563eb'
        }
      }
    });

    // Create Payment Element (but don't mount yet)
    paymentElement.value = elements.create('payment');
    
    // Set loading to false FIRST so the DOM element appears
    loading.value = false;
    
    // Wait for DOM to update, then mount
    await nextTick();
    paymentElement.value.mount('#payment-element');

  } catch (err) {
    console.error('Error initializing payment:', err);
    error.value = err.message || 'Failed to initialize payment';
    loading.value = false;
  }
};

// Handle payment submission
const handleSubmit = async () => {
  if (!stripe || !elements) return;

  processing.value = true;
  paymentError.value = '';

  try {
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: window.location.href
      }
    });

    if (submitError) {
      paymentError.value = submitError.message;
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment successful
      success.value = true;
      
      // Verify and grant access
      await pb.send('/api/v1/stripe/verify-payment', {
        method: 'GET',
        query: { payment_intent_id: paymentIntent.id }
      });
    }
  } catch (err) {
    console.error('Payment error:', err);
    paymentError.value = err.message || 'Payment failed';
  } finally {
    processing.value = false;
  }
};

onMounted(() => {
  initializePayment();
});
</script>
