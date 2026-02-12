// middleware/admin.ts

import { pb } from "#imports";

/* 
This middleware checks if the user is an admin
If the user is not authenticated or not an admin, redirect to home
*/

export default defineNuxtRouteMiddleware((to, from) => {
  const isAuthenticated = pb.authStore.isValid;
  // Check if user is a superuser
  const record: any = pb.authStore.record;
  const isSuperuser = record?.collectionName === '_superusers';

  // Redirect if not authenticated or not superuser
  if (!isAuthenticated || !isSuperuser) {
    return navigateTo('/');
  }
});



