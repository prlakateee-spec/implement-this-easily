import { CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lesson, LessonImage } from '@/lib/lessonApi';
interface LessonArticleProps {
  title: string;
  content: string;
  images: LessonImage[];
  isLoading: boolean;
  isCompleted: boolean;
  onComplete: () => void;
}
export function LessonArticle({
  title,
  content,
  images,
  isLoading,
  isCompleted,
  onComplete
}: LessonArticleProps) {
  // Parse content into paragraphs
  const paragraphs = content.split('\n\n').filter((p) => p.trim());

  // Determine where to insert images (after first paragraph, or distributed)
  const getImageForParagraph = (index: number): LessonImage | null => {
    if (images.length === 0) return null;

    // For single image, show after first paragraph
    if (images.length === 1 && index === 0) {
      return images[0];
    }

    // For multiple images, distribute them evenly
    if (images.length > 1) {
      const imageIndex = Math.floor(index / paragraphs.length * images.length);
      if (imageIndex === index && images[index]) {
        return images[index];
      }
    }
    return null;
  };
  if (isLoading) {
    return <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>;
  }
  return <article className="max-w-3xl mx-auto">
      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
          {title}
        </h1>
        <div className="h-1 w-20 gradient-primary rounded-full" />
      </header>

      {/* Article Body */}
      <div className="prose prose-lg max-w-none">
        {paragraphs.map((paragraph, index) => (
          <div key={index}>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
              {paragraph}
            </p>
            
            {/* Insert image after corresponding paragraph */}
            {images[index] && (
              <figure className="my-8">
                <div className="rounded-2xl overflow-hidden shadow-elevated border border-border bg-muted">
                  <img
                    src={images[index].image_url}
                    alt={images[index].caption || `Шаг ${index + 1}`}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
                {images[index].caption && (
                  <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">
                    {images[index].caption}
                  </figcaption>
                )}
              </figure>
            )}
          </div>
        ))}

        {/* Show remaining images at end if there are more images than paragraphs */}
        {images.length > paragraphs.length && (
          <div className="space-y-8 mt-8">
            {images.slice(paragraphs.length).map((img, idx) => (
              <figure key={img.id}>
                <div className="rounded-2xl overflow-hidden shadow-elevated border border-border bg-muted">
                  <img
                    src={img.image_url}
                    alt={img.caption || `Шаг ${paragraphs.length + idx + 1}`}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
                {img.caption && (
                  <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>

      {/* Complete Button */}
      <footer className="mt-12 pt-8 border-t border-border">
        <Button onClick={onComplete} size="lg" className={`w-full md:w-auto px-10 py-6 text-lg font-bold shadow-lg ${isCompleted ? 'bg-success text-success-foreground hover:bg-success/90' : 'gradient-primary text-primary-foreground'}`}>
          {isCompleted ? <>
              <CheckCircle size={22} className="mr-2" />
              Урок пройден
            </> : <>
              Завершить урок
              <ChevronRight size={22} className="ml-2" />
            </>}
        </Button>
      </footer>
    </article>;
}