import { pb } from '~/utils/pb';

/**
 * Upload an image to PocketBase for a specific lesson
 * @param file - The image file to upload
 * @param lessonId - The ID of the lesson
 * @returns The URL of the uploaded image
 */
export async function uploadImageToPocketBase(file: File, lessonId: string): Promise<string> {
  try {
    // Get the current lesson record
    const lesson = await pb.collection('_learn_lessons').getOne(lessonId);
    
    // Create FormData with the new image
    const formData = new FormData();
    
    // Keep existing images and add the new one
    if (lesson.images && lesson.images.length > 0) {
      lesson.images.forEach((img: string) => {
        formData.append('images', img);
      });
    }
    formData.append('images', file);
    
    // Update the lesson with the new image
    const updatedLesson = await pb.collection('_learn_lessons').update(lessonId, formData);
    
    // Get the URL of the newly uploaded image
    const newImageFilename = updatedLesson.images[updatedLesson.images.length - 1];
    return getImageUrl(lessonId, newImageFilename);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Generate a PocketBase file URL for an image
 * @param lessonId - The ID of the lesson
 * @param filename - The filename of the image
 * @returns The full URL to the image
 */
export function getImageUrl(lessonId: string, filename: string): string {
  const config = useRuntimeConfig();
  return `${config.public.pocketbaseURL}/api/files/_learn_lessons/${lessonId}/${filename}`;
}

/**
 * Get the Editor.js configuration with all tools
 * @param lessonId - The ID of the lesson for image uploads
 * @returns Editor.js configuration object
 */
export function getEditorConfig(lessonId: string) {
  // These imports will be done dynamically in the component
  // to avoid SSR issues
  return {
    holder: 'editorjs',
    placeholder: 'Start writing your lesson content...',
    minHeight: 0,
    tools: {}, // Tools will be added dynamically in the component
    onReady: () => {
      // Useful for debugging editor initialization - uncomment if needed
      // console.log('Editor.js is ready');
    },
    onChange: (api: any, event: any) => {
      // Useful for debugging editor changes - uncomment if needed
      // console.log('Content changed', event);
    }
  };
}

/**
 * Validate Editor.js block data
 * @param data - The Editor.js data to validate
 * @returns True if valid, false otherwise
 */
export function validateBlockData(data: any): boolean {
  if (!data) return false;
  if (typeof data !== 'object') return false;
  if (!data.blocks || !Array.isArray(data.blocks)) return false;
  
  return true;
}

/**
 * Get the default Editor.js data structure
 * @returns Empty Editor.js data structure
 */
export function getDefaultEditorData() {
  return {
    time: Date.now(),
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: ''
        }
      }
    ],
    version: '2.30.2'
  };
}

/**
 * Sanitize Editor.js data before saving
 * @param data - The Editor.js data to sanitize
 * @returns Sanitized data
 */
export function sanitizeEditorData(data: any) {
  if (!validateBlockData(data)) {
    return getDefaultEditorData();
  }
  
  // Remove any empty blocks at the end
  const blocks = data.blocks.filter((block: any, index: number) => {
    // Keep all blocks except empty paragraphs at the end
    if (block.type === 'paragraph' && !block.data.text.trim()) {
      return index < data.blocks.length - 1;
    }
    return true;
  });
  
  return {
    ...data,
    blocks: blocks.length > 0 ? blocks : getDefaultEditorData().blocks
  };
}

/**
 * Convert old HTML content to Editor.js format
 * This is a basic conversion for existing lessons
 * @param html - The HTML content to convert
 * @returns Editor.js data structure
 */
export function convertHtmlToEditorData(html: string) {
  if (!html || html.trim() === '') {
    return getDefaultEditorData();
  }
  
  // Very basic conversion - just wrap HTML in a paragraph
  // For more sophisticated conversion, you'd need to parse the HTML
  return {
    time: Date.now(),
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: html
        }
      }
    ],
    version: '2.30.2'
  };
}

