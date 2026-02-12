import { pb } from './pb';

/**
 * Enroll a user in a course
 */
export async function enrollInCourse(userId: string, courseId: string) {
  try {
    // Check if already enrolled
    const existing = await pb.collection('_learn_enrollments').getFirstListItem(
      `user="${userId}" && course="${courseId}"`
    ).catch(() => null);

    if (existing) {
      return existing;
    }

    // Create enrollment
    const enrollment = await pb.collection('_learn_enrollments').create({
      user: userId,
      course: courseId,
      enrolled_at: new Date().toISOString()
    });

    return enrollment;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
}

/**
 * Check if a user is enrolled in a course
 */
export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  try {
    const enrollment = await pb.collection('_learn_enrollments').getFirstListItem(
      `user="${userId}" && course="${courseId}"`
    ).catch(() => null);

    return !!enrollment;
  } catch (error) {
    return false;
  }
}

/**
 * Get all courses a user is enrolled in
 */
export async function getUserEnrollments(userId: string) {
  try {
    const enrollments = await pb.collection('_learn_enrollments').getFullList({
      filter: `user="${userId}"`,
      expand: 'course',
      sort: '-enrolled_at'
    });

    return enrollments;
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    return [];
  }
}

/**
 * Mark a lesson as complete for a user
 */
export async function markLessonComplete(userId: string, lessonId: string) {
  try {
    // Check if progress already exists
    const existing = await pb.collection('_learn_lesson_progress').getFirstListItem(
      `user="${userId}" && lesson="${lessonId}"`
    ).catch(() => null);

    if (existing) {
      // Update existing progress
      return await pb.collection('_learn_lesson_progress').update(existing.id, {
        completed: true,
        completed_at: new Date().toISOString()
      });
    } else {
      // Create new progress record
      return await pb.collection('_learn_lesson_progress').create({
        user: userId,
        lesson: lessonId,
        completed: true,
        completed_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    throw error;
  }
}

/**
 * Mark a lesson as incomplete for a user
 */
export async function markLessonIncomplete(userId: string, lessonId: string) {
  try {
    const existing = await pb.collection('_learn_lesson_progress').getFirstListItem(
      `user="${userId}" && lesson="${lessonId}"`
    ).catch(() => null);

    if (existing) {
      return await pb.collection('_learn_lesson_progress').update(existing.id, {
        completed: false,
        completed_at: null
      });
    }
  } catch (error) {
    console.error('Error marking lesson incomplete:', error);
    throw error;
  }
}

/**
 * Get user progress for a specific course
 */
export async function getUserProgress(userId: string, courseId: string) {
  try {
    // Get all sections and lessons for the course
    const sections = await pb.collection('_learn_sections').getFullList({
      filter: `course="${courseId}"`,
      sort: 'order',
      expand: 'course'
    });

    const sectionIds = sections.map(s => s.id).join(',');
    
    if (!sectionIds) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        progress: 0,
        sections: []
      };
    }

    const lessons = await pb.collection('_learn_lessons').getFullList({
      filter: sectionIds.split(',').map(id => `section="${id}"`).join(' || '),
      sort: 'order',
      expand: 'section'
    });

    // Get user's progress for these lessons
    const lessonIds = lessons.map(l => l.id).join(',');
    let completedProgress: any[] = [];
    
    if (lessonIds) {
      completedProgress = await pb.collection('_learn_lesson_progress').getFullList({
        filter: `user="${userId}" && (${lessonIds.split(',').map(id => `lesson="${id}"`).join(' || ')}) && completed=true`
      });
    }

    const completedLessonIds = new Set(completedProgress.map(p => p.lesson));
    const totalLessons = lessons.length;
    const completedLessons = completedProgress.length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Structure data by sections
    const sectionsWithProgress = sections.map(section => {
      const sectionLessons = lessons.filter(l => l.section === section.id);
      const sectionCompleted = sectionLessons.filter(l => completedLessonIds.has(l.id)).length;
      
      return {
        ...section,
        lessons: sectionLessons.map(lesson => ({
          ...lesson,
          completed: completedLessonIds.has(lesson.id)
        })),
        progress: sectionLessons.length > 0 
          ? Math.round((sectionCompleted / sectionLessons.length) * 100) 
          : 0
      };
    });

    return {
      totalLessons,
      completedLessons,
      progress,
      sections: sectionsWithProgress
    };
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return {
      totalLessons: 0,
      completedLessons: 0,
      progress: 0,
      sections: []
    };
  }
}

/**
 * Get the next incomplete lesson in a course
 */
export async function getNextLesson(userId: string, courseId: string) {
  try {
    const progressData = await getUserProgress(userId, courseId);
    
    // Find first incomplete lesson
    for (const section of progressData.sections) {
      for (const lesson of section.lessons) {
        if (!lesson.completed) {
          return lesson;
        }
      }
    }

    // If all lessons are complete, return the first lesson
    if (progressData.sections.length > 0 && progressData.sections[0].lessons.length > 0) {
      return progressData.sections[0].lessons[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting next lesson:', error);
    return null;
  }
}

/**
 * Get all lessons for a course organized by sections
 */
export async function getCourseLessons(courseId: string) {
  try {
    const sections = await pb.collection('_learn_sections').getFullList({
      filter: `course="${courseId}"`,
      sort: 'order'
    });

    // Useful for debugging course structure - uncomment if needed
    // console.log('sections', sections);

    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await pb.collection('_learn_lessons').getFullList({
          filter: `section="${section.id}"`,
          sort: 'order'
        });

        // Useful for debugging course structure - uncomment if needed
        // console.log('lessons', lessons);

        return {
          ...section,
          lessons
        };
      })
    );

    return sectionsWithLessons;
  } catch (error) {
    console.error('Error fetching course lessons:', error);
    return [];
  }
}

/**
 * Get user subscription details
 */
export async function getUserSubscription(userId: string) {
  try {
    const user = await pb.collection('users').getOne(userId);
    return {
      status: user.learnSubscriptionStatus || 'inactive',
      tier: user.learnSubscriptionTierId || '',
      expires: user.learnSubscriptionCurrentPeriodEnd,
      interval: user.learnSubscriptionInterval || null
    };
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return {
      status: 'inactive',
      tier: '',
      expires: null,
      interval: null
    };
  }
}

async function hasTierAccess(userTierId: string, courseTierId: string): Promise<boolean> {
  if (!userTierId || !courseTierId) return false;
  if (userTierId === courseTierId) return true;

  try {
    const tiers = await pb.collection('_learn_subscription_tiers').getFullList({
      filter: `id = \"${userTierId}\" || id = \"${courseTierId}\"`,
      sort: 'order'
    });
    const byId = new Map(tiers.map((tier: any) => [tier.id, Number(tier.order || 0)]));
    const userOrder = byId.get(userTierId);
    const courseOrder = byId.get(courseTierId);
    if (userOrder === undefined || courseOrder === undefined) {
      return false;
    }
    return userOrder >= courseOrder;
  } catch (error) {
    return false;
  }
}

/**
 * Check if user can access a course (enrollment, subscription, or free)
 */
export async function canAccessCourse(userId: string, courseId: string): Promise<boolean> {
  try {
    // Check if enrolled directly
    const enrolled = await isEnrolled(userId, courseId);
    if (enrolled) return true;

    // Get course details
    const course = await pb.collection('_learn_courses').getOne(courseId);
    
    // Check if course is free
    if (!course.price || course.price === 0) {
      return true; // Free courses can be accessed
    }

    // Check if user has subscription access
    const subscription = await getUserSubscription(userId);
    if (subscription.status === 'active' && course.subscription_tier) {
      const hasAccess = await hasTierAccess(String(subscription.tier), String(course.subscription_tier));
      if (hasAccess) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking course access:', error);
    return false;
  }
}

/**
 * Get all courses accessible to a user (enrolled + subscription)
 */
export async function getAvailableCourses(userId: string) {
  try {
    // Get enrolled courses
    const enrollments = await getUserEnrollments(userId);
    const enrolledCourseIds = new Set(enrollments.map(e => e.course));

    // Get user subscription
    const subscription = await getUserSubscription(userId);
    
    // Get all courses
    const allCourses = await pb.collection('_learn_courses').getFullList({
      filter: 'published = true',
      sort: '-created',
      expand: 'subscription_tier'
    });

    const accessibleCourses = await Promise.all(allCourses.map(async (course) => {
      const isEnrolled = enrolledCourseIds.has(course.id);
      const isFree = !course.price || course.price === 0;
      const inSubscription = subscription.status === 'active' && course.subscription_tier
        ? await hasTierAccess(String(subscription.tier), String(course.subscription_tier))
        : false;

      return {
        ...course,
        enrolled: isEnrolled,
        accessViaSubscription: inSubscription && !isEnrolled,
        canAccess: isEnrolled || isFree || inSubscription
      };
    }));

    return accessibleCourses;
  } catch (error) {
    console.error('Error fetching available courses:', error);
    return [];
  }
}
