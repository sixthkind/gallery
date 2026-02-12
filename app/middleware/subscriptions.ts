import { useSubscriptions } from '~/composables/useSubscriptions';

export default defineNuxtRouteMiddleware((to, from) => {
  const { isEnabled: subscriptionsEnabled } = useSubscriptions();
  
  if (!subscriptionsEnabled.value) {
    return navigateTo('/');
  }
});

