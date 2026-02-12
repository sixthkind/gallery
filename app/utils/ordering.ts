import { pb } from './pb';

/**
 * Move a section up in the order (swap with previous section)
 */
export async function moveSectionUp(sectionId: string, sections: any[]): Promise<void> {
  const currentIndex = sections.findIndex(s => s.id === sectionId);
  
  if (currentIndex <= 0) {
    throw new Error('Section is already at the top');
  }
  
  const currentSection = sections[currentIndex];
  const previousSection = sections[currentIndex - 1];
  
  // Swap order values
  await Promise.all([
    pb.collection('_learn_sections').update(currentSection.id, { order: previousSection.order }),
    pb.collection('_learn_sections').update(previousSection.id, { order: currentSection.order })
  ]);
}

/**
 * Move a section down in the order (swap with next section)
 */
export async function moveSectionDown(sectionId: string, sections: any[]): Promise<void> {
  const currentIndex = sections.findIndex(s => s.id === sectionId);
  
  if (currentIndex === -1 || currentIndex >= sections.length - 1) {
    throw new Error('Section is already at the bottom');
  }
  
  const currentSection = sections[currentIndex];
  const nextSection = sections[currentIndex + 1];
  
  // Swap order values
  await Promise.all([
    pb.collection('_learn_sections').update(currentSection.id, { order: nextSection.order }),
    pb.collection('_learn_sections').update(nextSection.id, { order: currentSection.order })
  ]);
}

/**
 * Delete a section and renumber remaining sections
 */
export async function deleteSection(
  sectionId: string, 
  sections: any[], 
  options?: { deleteLessons?: boolean }
): Promise<void> {
  const section = sections.find(s => s.id === sectionId);
  
  if (!section) {
    throw new Error('Section not found');
  }
  
  // Delete all lessons in the section if requested
  if (options?.deleteLessons && section.lessons && section.lessons.length > 0) {
    await Promise.all(
      section.lessons.map((lesson: any) => 
        pb.collection('_learn_lessons').delete(lesson.id)
      )
    );
  }
  
  // Delete the section
  await pb.collection('_learn_sections').delete(sectionId);
  
  // Renumber remaining sections with higher order values
  const sectionsToUpdate = sections.filter(s => s.order > section.order);
  
  if (sectionsToUpdate.length > 0) {
    await Promise.all(
      sectionsToUpdate.map(s => 
        pb.collection('_learn_sections').update(s.id, { order: s.order - 1 })
      )
    );
  }
}

/**
 * Move a lesson up in the order (swap with previous lesson)
 */
export async function moveLessonUp(lessonId: string, lessons: any[]): Promise<void> {
  const currentIndex = lessons.findIndex(l => l.id === lessonId);
  
  if (currentIndex <= 0) {
    throw new Error('Lesson is already at the top');
  }
  
  const currentLesson = lessons[currentIndex];
  const previousLesson = lessons[currentIndex - 1];
  
  // Swap order values
  await Promise.all([
    pb.collection('_learn_lessons').update(currentLesson.id, { order: previousLesson.order }),
    pb.collection('_learn_lessons').update(previousLesson.id, { order: currentLesson.order })
  ]);
}

/**
 * Move a lesson down in the order (swap with next lesson)
 */
export async function moveLessonDown(lessonId: string, lessons: any[]): Promise<void> {
  const currentIndex = lessons.findIndex(l => l.id === lessonId);
  
  if (currentIndex === -1 || currentIndex >= lessons.length - 1) {
    throw new Error('Lesson is already at the bottom');
  }
  
  const currentLesson = lessons[currentIndex];
  const nextLesson = lessons[currentIndex + 1];
  
  // Swap order values
  await Promise.all([
    pb.collection('_learn_lessons').update(currentLesson.id, { order: nextLesson.order }),
    pb.collection('_learn_lessons').update(nextLesson.id, { order: currentLesson.order })
  ]);
}

/**
 * Delete a lesson and renumber remaining lessons in the section
 */
export async function deleteLesson(lessonId: string, lessons: any[]): Promise<void> {
  const lesson = lessons.find(l => l.id === lessonId);
  
  if (!lesson) {
    throw new Error('Lesson not found');
  }
  
  // Delete the lesson
  await pb.collection('_learn_lessons').delete(lessonId);
  
  // Renumber remaining lessons with higher order values
  const lessonsToUpdate = lessons.filter(l => l.order > lesson.order);
  
  if (lessonsToUpdate.length > 0) {
    await Promise.all(
      lessonsToUpdate.map(l => 
        pb.collection('_learn_lessons').update(l.id, { order: l.order - 1 })
      )
    );
  }
}

/**
 * Get the next available order number for sections in a course
 */
export function getNextSectionOrder(sections: any[]): number {
  if (!sections || sections.length === 0) return 1;
  return Math.max(...sections.map(s => s.order)) + 1;
}

/**
 * Get the next available order number for lessons in a section
 */
export function getNextLessonOrder(lessons: any[]): number {
  if (!lessons || lessons.length === 0) return 1;
  return Math.max(...lessons.map(l => l.order)) + 1;
}

