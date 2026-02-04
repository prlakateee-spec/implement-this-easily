import { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  FileText, 
  Layout, 
  CheckCircle, 
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List,
  Loader2
} from 'lucide-react';
import { COURSES, Course } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getLessonContent, type Lesson, type LessonImage } from '@/lib/lessonApi';

interface KnowledgeBaseProps {
  completedModules: string[];
  onToggleModule: (moduleId: string) => void;
}

export function KnowledgeBase({ completedModules, onToggleModule }: KnowledgeBaseProps) {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Database content state
  const [dbLesson, setDbLesson] = useState<Lesson | null>(null);
  const [dbImages, setDbImages] = useState<LessonImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load lesson content from database when module is selected
  useEffect(() => {
    async function loadLessonContent() {
      if (!activeModuleId || !activeCourse) return;
      
      // Only load from DB for alipay course
      if (activeCourse.id !== 'alipay') {
        setDbLesson(null);
        setDbImages([]);
        return;
      }

      setIsLoading(true);
      try {
        // Map module id to database lesson by matching order
        const moduleIndex = activeCourse.modules.findIndex(m => m.id === activeModuleId);
        if (moduleIndex === -1) return;

        // Get lesson from database by course slug and order
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Get course id first
        const { data: course } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', 'alipay')
          .maybeSingle();
        
        if (!course) return;

        // Get lesson by order_index
        const { data: lesson } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', course.id)
          .eq('order_index', moduleIndex + 1)
          .maybeSingle();

        if (lesson) {
          setDbLesson(lesson);
          
          // Get images
          const { data: images } = await supabase
            .from('lesson_images')
            .select('*')
            .eq('lesson_id', lesson.id)
            .order('order_index');
          
          setDbImages(images || []);
        }
      } catch (error) {
        console.error('Error loading lesson content:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadLessonContent();
  }, [activeModuleId, activeCourse]);

  const handleModuleComplete = (moduleId: string) => {
    const wasCompleted = completedModules.includes(moduleId);
    onToggleModule(moduleId);
    
    if (!wasCompleted) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const ModuleIcon = ({ type }: { type: 'video' | 'text' | 'tool' }) => {
    const iconClass = "text-primary";
    switch (type) {
      case 'video':
        return <PlayCircle className={iconClass} size={20} />;
      case 'text':
        return <FileText className={iconClass} size={20} />;
      case 'tool':
        return <Layout className={iconClass} size={20} />;
    }
  };

  // Module View
  if (activeCourse && activeModuleId) {
    const module = activeCourse.modules.find(m => m.id === activeModuleId);
    if (!module) return null;
    
    const isCompleted = completedModules.includes(module.id);

    // Use database content if available, otherwise fallback
    const lessonContent = dbLesson?.content || 'Контент урока загружается...';
    const lessonImages = dbImages;

    return (
      <div className="p-6 lg:p-10 animate-fade-in-up">
        <button
          onClick={() => {
            setActiveModuleId(null);
            setDbLesson(null);
            setDbImages([]);
          }}
          className="mb-6 text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ChevronLeft size={16} />
          Назад к курсу
        </button>

        <div className="bg-card rounded-3xl shadow-soft border border-border overflow-hidden">
          {/* Images gallery or video placeholder */}
          {lessonImages.length > 0 ? (
            <div className="p-4 bg-muted/50">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {lessonImages.map((img, idx) => (
                  <a 
                    key={img.id} 
                    href={img.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="aspect-[4/3] rounded-xl overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                  >
                    <img 
                      src={img.image_url} 
                      alt={`Шаг ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <PlayCircle className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-muted-foreground">Видео материал</p>
                </div>
              )}
            </div>
          )}

          <div className="p-8">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {module.title}
            </h1>
            
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground mb-8">
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка контента...
              </div>
            ) : (
              <div className="text-muted-foreground mb-8 leading-relaxed whitespace-pre-line">
                {lessonContent}
              </div>
            )}

            <Button
              onClick={() => handleModuleComplete(module.id)}
              className={`px-8 py-6 text-lg font-bold shadow-lg ${
                isCompleted
                  ? 'bg-success text-success-foreground hover:bg-success/90'
                  : 'gradient-primary text-primary-foreground'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  Урок пройден
                </>
              ) : (
                <>
                  Завершить урок
                  <ChevronRight size={20} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Confetti celebration */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="text-center animate-bounce-in">
              <div className="text-8xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold gradient-text">МОЩНО!</h2>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Course View
  if (activeCourse) {
    return (
      <div className="p-6 lg:p-10 animate-fade-in-up">
        <button
          onClick={() => setActiveCourse(null)}
          className="mb-6 text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ChevronLeft size={16} />
          Назад к курсам
        </button>

        <div className="bg-card rounded-3xl shadow-soft border border-border overflow-hidden">
          <div className="gradient-primary p-8 text-primary-foreground">
            <span className="text-4xl mb-4 block">{activeCourse.emoji}</span>
            <h1 className="text-2xl font-bold mb-2">{activeCourse.title}</h1>
            <p className="text-primary-foreground/80">{activeCourse.description}</p>
          </div>

          <div className="divide-y divide-border">
            {activeCourse.modules.map((module) => {
              const isCompleted = completedModules.includes(module.id);
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModuleId(module.id)}
                  className="w-full p-5 hover:bg-muted/50 transition-colors flex items-center justify-between group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                      <ModuleIcon type={module.type} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{module.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCompleted && <CheckCircle size={18} className="text-success" />}
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Courses List
  return (
    <div className="p-6 lg:p-10 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">База знаний</h1>
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => value && setViewMode(value as 'list' | 'grid')}
          className="bg-muted rounded-lg p-1"
        >
          <ToggleGroupItem value="list" aria-label="Список" className="data-[state=on]:bg-background data-[state=on]:shadow-sm">
            <List size={18} />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Плитки" className="data-[state=on]:bg-background data-[state=on]:shadow-sm">
            <LayoutGrid size={18} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid gap-6'}>
        {COURSES.map((course) => {
          const completedCount = course.modules.filter(m => 
            completedModules.includes(m.id)
          ).length;
          const totalModules = course.modules.length;
          const courseProgress = Math.round((completedCount / totalModules) * 100);

          if (viewMode === 'grid') {
            return (
              <button
                key={course.id}
                onClick={() => setActiveCourse(course)}
                className="bg-card rounded-2xl p-6 shadow-soft border border-border hover:shadow-elevated hover:border-primary/20 transition-all text-left group flex flex-col"
              >
                <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-2xl shadow-glow mb-4">
                  {course.emoji}
                </div>
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  {course.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-4 flex-1">
                  {course.description}
                </p>
                
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${courseProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {completedCount}/{totalModules}
                  </span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={course.id}
              onClick={() => setActiveCourse(course)}
              className="bg-card rounded-2xl p-6 shadow-soft border border-border hover:shadow-elevated hover:border-primary/20 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-2xl shadow-glow shrink-0">
                  {course.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {course.title}
                    </h2>
                    <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    {course.description}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {completedCount}/{totalModules}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
