// middleware/course-auth.ts

import { pb } from "#imports";
import { canAccessCourse } from "~/utils/courses";
import { authUtils } from "~/utils/auth";

/* 
This middleware checks if a user can access a course before allowing access to the learning interface
Access is granted through:
1. Direct enrollment (free or paid)
2. Active subscription with appropriate tier
3. Superuser status (bypass all checks)
*/

export default defineNuxtRouteMiddleware(async (to, from) => {
  const isAuthenticated = pb.authStore.isValid;
  
  // First check if user is authenticated
  if (!isAuthenticated) {
    return navigateTo('/auth');
  }

  // Superusers can access any course without enrollment
  if (authUtils.isSuperuser()) {
    return;
  }

  // Extract course ID from the route
  const courseId = Array.isArray(to.params.id) ? to.params.id[0] : to.params.id;
  
  if (!courseId) {
    return navigateTo('/courses');
  }

  // Check if user can access the course (enrollment, subscription, or free)
  try {
    const hasAccess = await canAccessCourse(pb.authStore.model.id, String(courseId));
    
    if (!hasAccess) {
      // Redirect to course detail page if no access
      return navigateTo(`/courses/${courseId}`);
    }
  } catch (error) {
    console.error('Error checking course access:', error);
    return navigateTo('/courses');
  }
});

