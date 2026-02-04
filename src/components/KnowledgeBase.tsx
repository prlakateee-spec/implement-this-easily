import { useState } from 'react';
import { 
  PlayCircle, 
  FileText, 
  Layout, 
  CheckCircle, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { COURSES, Course } from '@/lib/data';
import { Button } from '@/components/ui/button';

interface KnowledgeBaseProps {
  completedModules: string[];
  onToggleModule: (moduleId: string) => void;
}

export function KnowledgeBase({ completedModules, onToggleModule }: KnowledgeBaseProps) {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

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

    return (
      <div className="p-6 lg:p-10 animate-fade-in-up">
        <button
          onClick={() => setActiveModuleId(null)}
          className="mb-6 text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ChevronLeft size={16} />
          Назад к курсу
        </button>

        <div className="bg-card rounded-3xl shadow-soft border border-border overflow-hidden">
          {/* Video placeholder */}
          <div className="aspect-video bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <PlayCircle className="w-10 h-10 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground">Видео материал</p>
            </div>
          </div>

          <div className="p-8">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {module.title}
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              В этом модуле мы разберем ключевые аспекты работы с китайскими поставщиками.
              Вы узнаете как правильно вести переговоры, проверять надежность фабрик и
              избегать типичных ошибок новичков.
            </p>

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
      <h1 className="text-3xl font-bold text-foreground mb-8">База знаний</h1>

      <div className="grid gap-6">
        {COURSES.map((course) => {
          const completedCount = course.modules.filter(m => 
            completedModules.includes(m.id)
          ).length;
          const totalModules = course.modules.length;
          const courseProgress = Math.round((completedCount / totalModules) * 100);

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
