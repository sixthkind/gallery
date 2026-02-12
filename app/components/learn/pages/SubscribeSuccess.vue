<script setup>
import { useRoute, useRouter } from 'vue-router';
import { verifyPayment } from '~/utils/stripe';
const { toLearnPath } = useLearnRoutes();

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref('');
const subscription = ref(null);

const verifySubscription = async () => {
  try {
    const sessionId = route.query.session_id;
    
    if (!sessionId) {
      error.value = 'No session ID provided';
      return;
    }

    const result = await verifyPayment(null, sessionId);
    subscription.value = result;
  } catch (err) {
    console.error('Error verifying subscription:', err);
    error.value = err.message || 'Failed to verify subscription';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  verifySubscription();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="max-w-2xl mx-auto p-6">
        <div v-if="loading" class="flex justify-center items-center py-12">
          <ion-spinner></ion-spinner>
          <p class="ml-4 text-gray-600">Verifying your subscription...</p>
        </div>

        <div v-else-if="error" class="text-center py-12">
          <Icon name="lucide:x-circle" class="text-red-500 text-6xl mb-4 mx-auto" />
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p class="text-gray-600 mb-6">{{ error }}</p>
          <button
            @click="navigateTo(toLearnPath('/subscribe'))"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>

        <div v-else class="text-center py-12">
          <Icon name="lucide:check-circle" class="text-green-500 text-6xl mb-4 mx-auto" />
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h2>
          <p class="text-gray-600 mb-2">
            You now have access to all {{ subscription?.tier }} tier courses.
          </p>
          <p class="text-sm text-gray-500 mb-6">
            You can manage your subscription from your profile page.
          </p>
          <div class="flex justify-center space-x-4">
            <button
              @click="navigateTo(toLearnPath('/courses'))"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Courses
            </button>
            <button
              @click="navigateTo('/profile')"
              class="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
