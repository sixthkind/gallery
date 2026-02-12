export const GALLERY_COLLECTIONS = {
  photos: "gallery_photos",
  albums: "gallery_albums",
  groups: "gallery_groups",
  tags: "gallery_tags"
} as const;

export const LEARN_COLLECTIONS = {
  courses: "_learn_courses",
  sections: "_learn_sections",
  lessons: "_learn_lessons",
  enrollments: "_learn_enrollments",
  lessonProgress: "_learn_lesson_progress",
  modules: "_learn_modules",
  subscriptionTiers: "_learn_subscription_tiers",
  stripeConfig: "_learn_stripe_config"
} as const;

export const CORE_COLLECTIONS = {
  modules: "modules"
} as const;

export const resolveEditCollection = (type: string) => {
  const map: Record<string, string> = {
    courses: LEARN_COLLECTIONS.courses,
    sections: LEARN_COLLECTIONS.sections,
    lessons: LEARN_COLLECTIONS.lessons,
    modules: LEARN_COLLECTIONS.modules,
    subscription_tiers: LEARN_COLLECTIONS.subscriptionTiers
  };
  return map[type] || type;
};
