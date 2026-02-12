import { pb } from '~/utils/pb';

export default defineNuxtPlugin(async () => {
  // Refresh auth state on app initialization to get latest user data
  if (pb.authStore.isValid) {
    try {
      // Check if current auth is for superuser or regular user
      const record: any = pb.authStore.record;
      if (record?.collectionName === '_superusers') {
        await pb.collection('_superusers').authRefresh();
      } else {
        await pb.collection('users').authRefresh();
      }
      // Useful for debugging auth refresh - uncomment if needed
      // console.log('Auth refreshed successfully, user:', pb.authStore.record);
    } catch (error) {
      console.error('Auth refresh failed:', error);
      // If refresh fails, clear invalid auth
      pb.authStore.clear();
    }
  }
});



