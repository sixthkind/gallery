/**
 * Composable to check if subscriptions feature is enabled
 * @returns {boolean} true if subscriptions are disabled, false if enabled
 */
export const useSubscriptions = () => {
  const config = useRuntimeConfig();
  const isDisabled = computed(() => config.public.disableSubscriptions === true);
  
  return {
    isDisabled,
    isEnabled: computed(() => !isDisabled.value)
  };
};

