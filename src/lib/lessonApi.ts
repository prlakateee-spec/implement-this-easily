import { supabase } from "@/integrations/supabase/client";

export interface LessonImage {
  id: string;
  lesson_id: string;
  image_url: string;
  caption: string | null;
  order_index: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  duration: string | null;
  type: string;
  order_index: number;
  images?: LessonImage[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
}

// Get lesson content with images from the database
export async function getLessonContent(lessonId: string): Promise<{ lesson: Lesson | null; images: LessonImage[] }> {
  // Get lesson
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonError) {
    console.error('Error fetching lesson:', lessonError);
    return { lesson: null, images: [] };
  }

  // Get images
  const { data: images, error: imagesError } = await supabase
    .from('lesson_images')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('order_index');

  if (imagesError) {
    console.error('Error fetching images:', imagesError);
    return { lesson, images: [] };
  }

  return { lesson, images: images || [] };
}

// Get all lessons for a course by slug
export async function getLessonsByCourseSlug(courseSlug: string): Promise<Lesson[]> {
  // First get the course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .maybeSingle();

  if (courseError || !course) {
    console.error('Error fetching course:', courseError);
    return [];
  }

  // Then get lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .order('order_index');

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    return [];
  }

  return lessons || [];
}

// Check if a course has database content
export async function courseHasDbContent(courseSlug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .maybeSingle();

  return !error && !!data;
}
