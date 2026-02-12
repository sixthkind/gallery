<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Stripe Configuration</h1>
      <p class="text-gray-600">Configure your Stripe payment integration. Keys are securely stored and encrypted.</p>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <ion-spinner></ion-spinner>
    </div>

    <div v-else class="bg-white rounded-lg shadow-md p-6">
      <!-- Environment Toggle -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Environment
        </label>
        <div class="flex space-x-4">
          <button
            @click="form.environment = 'test'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition',
              form.environment === 'test'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            Test Mode
          </button>
          <button
            @click="form.environment = 'live'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition',
              form.environment === 'live'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            Live Mode
          </button>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          {{ form.environment === 'test' ? 'Test mode uses test API keys and processes test payments only.' : 'Live mode processes real payments. Ensure you are using production API keys.' }}
        </p>
      </div>

      <!-- Publishable Key -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Publishable Key
        </label>
        <input
          v-model="form.publishable_key"
          type="text"
          placeholder="pk_test_... or pk_live_..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p class="text-sm text-gray-500 mt-1">
          Your Stripe publishable key (starts with pk_test_ or pk_live_)
        </p>
      </div>

      <!-- Secret Key -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Secret Key
        </label>
        <input
          v-model="form.secret_key"
          type="password"
          placeholder="sk_test_... or sk_live_..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p class="text-sm text-gray-500 mt-1">
          Your Stripe secret key (starts with sk_test_ or sk_live_). This will be encrypted.
        </p>
      </div>

      <!-- Webhook Secret -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Webhook Secret (Optional)
        </label>
        <input
          v-model="form.webhook_secret"
          type="password"
          placeholder="whsec_..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p class="text-sm text-gray-500 mt-1">
          Your Stripe webhook signing secret (starts with whsec_). Required for webhook verification.
        </p>
      </div>

      <!-- Webhook URL Info -->
      <div class="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 class="font-medium text-blue-900 mb-2">Webhook Configuration</h3>
        <p class="text-sm text-blue-800 mb-2">
          Configure this webhook endpoint in your Stripe dashboard:
        </p>
        <code class="block bg-blue-100 text-blue-900 px-3 py-2 rounded text-sm mb-2">
          {{ webhookUrl }}
        </code>
        <p class="text-sm text-blue-800">
          Events to listen for: <code class="bg-blue-100 px-1 rounded">payment_intent.succeeded</code>, 
          <code class="bg-blue-100 px-1 rounded">customer.subscription.*</code>
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3 animate-shake">
        <Icon name="lucide:alert-circle" class="text-red-600 text-xl flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-red-900 font-medium">Error</p>
          <p class="text-red-700">{{ error }}</p>
        </div>
        <button @click="error = ''" class="text-red-400 hover:text-red-600">
          <Icon name="lucide:x" class="text-lg" />
        </button>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start gap-3 animate-slide-in">
        <Icon name="lucide:check-circle" class="text-green-600 text-xl flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-green-900 font-medium">Success</p>
          <p class="text-green-700">{{ success }}</p>
        </div>
        <button @click="success = ''" class="text-green-400 hover:text-green-600">
          <Icon name="lucide:x" class="text-lg" />
        </button>
      </div>

      <!-- Action Buttons -->
      <div>
        <div class="flex space-x-4">
          <button
            @click="testConnection"
            :disabled="testing || saving || (!form.publishable_key && !hasExistingConfig) || (!form.secret_key && !hasExistingConfig)"
            class="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            <ion-spinner v-if="testing" name="crescent" class="w-4 h-4"></ion-spinner>
            <Icon v-else name="lucide:zap" class="text-lg" />
            <span>{{ testing ? 'Testing...' : hasExistingConfig && !form.secret_key ? 'Test Current Config' : 'Test Connection' }}</span>
          </button>
          <button
            @click="saveConfig"
            :disabled="testing || saving || !form.publishable_key || !form.secret_key"
            class="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            <ion-spinner v-if="saving" name="crescent" class="w-4 h-4"></ion-spinner>
            <Icon v-else name="lucide:save" class="text-lg" />
            <span>{{ saving ? 'Saving...' : 'Save Configuration' }}</span>
          </button>
        </div>
        
        <!-- Helper text when buttons are disabled -->
        <p v-if="!hasExistingConfig && (!form.publishable_key || !form.secret_key)" class="mt-3 text-sm text-gray-500 flex items-center gap-1">
          <Icon name="lucide:info" class="text-base" />
          <span>Fill in both publishable and secret keys to enable buttons</span>
        </p>
        
        <!-- Helper text for existing config -->
        <p v-if="hasExistingConfig && !form.secret_key" class="mt-3 text-sm text-blue-600 flex items-center gap-1">
          <Icon name="lucide:info" class="text-base" />
          <span>You can test your current saved configuration, or enter new keys to test/save a new configuration</span>
        </p>
      </div>
    </div>

    <!-- Help Section -->
    <div class="mt-8 p-6 bg-gray-50 rounded-lg">
      <h3 class="font-medium text-gray-900 mb-3">Where to find your Stripe keys:</h3>
      <ol class="list-decimal list-inside space-y-2 text-gray-700">
        <li>Log in to your <a href="https://dashboard.stripe.com" target="_blank" class="text-blue-600 hover:underline">Stripe Dashboard</a></li>
        <li>Click on "Developers"</li>
        <li>Select "API keys" from the sidebar</li>
        <li>Copy your Publishable key and Secret key</li>
        <li>For webhooks, go to "Developers" → "Webhooks" → "Add endpoint"</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}
</style>

<script setup>
import { pb } from '~/utils/pb';

definePageMeta({
  middleware: 'admin'
});

const form = ref({
  publishable_key: '',
  secret_key: '',
  webhook_secret: '',
  environment: 'test'
});

const loading = ref(true);
const saving = ref(false);
const testing = ref(false);
const error = ref('');
const success = ref('');
const hasExistingConfig = ref(false);

const config = useRuntimeConfig();
const webhookUrl = computed(() => {
  const baseUrl = config.public.pocketbaseURL || 'http://localhost:8090';
  return `${baseUrl}/api/v1/stripe/webhook`;
});

// Load existing configuration
const loadConfig = async () => {
  try {
    loading.value = true;
    const existingConfig = await pb.send('/api/v1/stripe/config', {
      method: 'GET'
    });
    
    if (existingConfig) {
      form.value.publishable_key = existingConfig.publishable_key;
      form.value.environment = existingConfig.environment;
      hasExistingConfig.value = true;
      // Don't load secret keys for security
    }
  } catch (err) {
    // No config exists yet, that's okay - silently ignore
    // User will configure for the first time
    hasExistingConfig.value = false;
  } finally {
    loading.value = false;
  }
};

// Test Stripe connection
const testConnection = async () => {
  error.value = '';
  success.value = '';
  testing.value = true;
  
  try {
    // If secret_key is empty but we have an existing config, test the saved config
    if (!form.value.secret_key && hasExistingConfig.value) {
      // Useful for debugging Stripe config testing - uncomment if needed
      // console.log('Testing existing saved configuration');
      const response = await pb.send('/api/v1/stripe/test-current-config', {
        method: 'POST'
      });
      
      // Useful for debugging Stripe config testing - uncomment if needed
      // console.log('Test response:', response);
      success.value = response.message || 'Current Stripe configuration is valid!';
    } else {
      // Test with provided keys
      // Useful for debugging Stripe config testing - uncomment if needed
      // console.log('Testing with provided keys');
      // console.log('Form values:', {
      //   publishable_key: form.value.publishable_key ? 'present' : 'missing',
      //   secret_key: form.value.secret_key ? 'present' : 'missing',
      //   environment: form.value.environment
      // });
      
      const response = await pb.send('/api/v1/stripe/test-config', {
        method: 'POST',
        body: {
          publishable_key: form.value.publishable_key,
          secret_key: form.value.secret_key,
          environment: form.value.environment
        }
      });
      
      // Useful for debugging Stripe config testing - uncomment if needed
      // console.log('Test response:', response);
      success.value = response.message || 'Stripe connection successful! Keys are valid.';
    }
    
    // Auto-dismiss success message after 5 seconds
    setTimeout(() => {
      success.value = '';
    }, 5000);
  } catch (err) {
    console.error('Test connection error:', err);
    // Extract error message from PocketBase error response
    const errorMessage = err?.data?.message || err?.message || 'Failed to connect to Stripe. Please check your keys.';
    error.value = errorMessage;
  } finally {
    testing.value = false;
  }
};

// Save configuration
const saveConfig = async () => {
  error.value = '';
  success.value = '';
  saving.value = true;
  
  try {
    await pb.send('/api/v1/stripe/config', {
      method: 'POST',
      body: form.value
    });
    
    success.value = 'Stripe configuration saved successfully!';
    hasExistingConfig.value = true;
    
    // Auto-dismiss success message after 5 seconds
    setTimeout(() => {
      success.value = '';
    }, 5000);
    
    // Clear secret fields after saving
    form.value.secret_key = '';
    form.value.webhook_secret = '';
  } catch (err) {
    console.error('Save config error:', err);
    // Extract error message from PocketBase error response
    const errorMessage = err?.data?.message || err?.message || 'Failed to save configuration';
    error.value = errorMessage;
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadConfig();
});
</script>

