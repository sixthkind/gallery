<template>
  <div class="flex items-center justify-center">
    <div class="p-8 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-transparent dark:border-slate-700/60 w-full max-w-md">
      <h1 class="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-slate-100">Superuser Login</h1>
      <p class="text-sm text-center text-gray-500 dark:text-slate-300 mb-6">
        Use your superuser credentials to access management routes.
      </p>

      <form @submit.prevent="signIn">
        <div class="mb-4">
          <label class="block text-gray-500 dark:text-slate-300 text-sm font-bold mb-2">Email:</label>
          <input
            v-model="email"
            type="email"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-950/40 border-gray-200 dark:border-slate-700/60 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-500 dark:text-slate-300 text-sm font-bold mb-2">Password:</label>
          <input
            v-model="password"
            type="password"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-950/40 border-gray-200 dark:border-slate-700/60 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div class="mt-6 text-center">
          <button
            type="submit"
            :disabled="submitting"
            class="w-full px-6 py-3 bg-black text-white rounded-lg disabled:opacity-60"
          >
            {{ submitting ? "Signing in..." : "Sign In as Superuser" }}
          </button>
          <div v-if="errorMessage" class="mt-2 text-red-500 text-sm">
            {{ errorMessage }}
          </div>
        </div>
      </form>

      <p class="mt-4 text-gray-600 dark:text-slate-300 text-center text-sm">
        Regular user?
        <a href="/auth" class="text-primary font-bold">Use user login</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { authUtils } from "~/utils/auth";

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const submitting = ref(false);

onMounted(() => {
  if (authUtils.isSuperuser()) {
    window.location.href = "/modules";
  }
});

const signIn = async () => {
  if (!password.value || password.value.length < 8) {
    errorMessage.value = "Password must be at least 8 characters long.";
    return;
  }

  submitting.value = true;
  errorMessage.value = "";
  try {
    await authUtils.authenticateAdmin(email.value, password.value);
    window.location.href = "/modules";
  } catch (err) {
    errorMessage.value = err?.message || "Invalid superuser credentials.";
  } finally {
    submitting.value = false;
  }
};
</script>
