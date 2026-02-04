import { supabase } from "@/integrations/supabase/client";

export interface LessonImage {
  id: number;
  lesson_id: number;
  image_url: string;
  caption: string;
  order_index: number;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content: string;
  duration: string;
  type: string;
  order_index: number;
  images?: LessonImage[];
}

export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  emoji: string;
}

// Initialize the external database schema
export async function initExternalDbSchema(): Promise<{ success: boolean; message?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('external-db', {
    body: { action: 'init_schema' }
  });
  
  if (error) {
    console.error('Error initializing schema:', error);
    return { success: false, error: error.message };
  }
  
  return data;
}

// Seed Alipay content to external database
export async function seedAlipayContent(): Promise<{ success: boolean; message?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('external-db', {
    body: { action: 'seed_alipay_content' }
  });
  
  if (error) {
    console.error('Error seeding content:', error);
    return { success: false, error: error.message };
  }
  
  return data;
}

// Get lessons for a course
export async function getLessons(courseId: number): Promise<{ success: boolean; lessons?: Lesson[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke('external-db', {
    body: { action: 'get_lessons', data: { course_id: courseId } }
  });
  
  if (error) {
    console.error('Error getting lessons:', error);
    return { success: false, error: error.message };
  }
  
  return data;
}

// Get lesson content with images
export async function getLessonContent(lessonId: number): Promise<{ success: boolean; lesson?: Lesson; error?: string }> {
  const { data, error } = await supabase.functions.invoke('external-db', {
    body: { action: 'get_lesson_content', data: { lesson_id: lessonId } }
  });
  
  if (error) {
    console.error('Error getting lesson content:', error);
    return { success: false, error: error.message };
  }
  
  return data;
}

// Save or update a lesson
export async function saveLesson(lesson: Partial<Lesson>): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('external-db', {
    body: { action: 'save_lesson', data: lesson }
  });
  
  if (error) {
    console.error('Error saving lesson:', error);
    return { success: false, error: error.message };
  }
  
  return data;
}

// Initialize and seed the database (one-time setup)
export async function setupExternalDatabase(): Promise<{ success: boolean; message?: string; error?: string }> {
  // First initialize schema
  const schemaResult = await initExternalDbSchema();
  if (!schemaResult.success) {
    return schemaResult;
  }
  
  // Then seed content
  const seedResult = await seedAlipayContent();
  return seedResult;
}
