import { useState } from 'react';
import { 
  Layout, 
  BookOpen, 
  LogOut, 
  ChevronRight, 
  Star, 
  Menu, 
  X,
  Trophy
} from 'lucide-react';
import { User } from '@/hooks/useAuth';
import { ProgressRing } from './ProgressRing';
import { KnowledgeBase } from './KnowledgeBase';
import { ACHIEVEMENTS } from '@/lib/data';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  completedModules: string[];
  progressPercentage: number;
  onToggleModule: (moduleId: string) => void;
}

export function Dashboard({ 
  user, 
  onLogout, 
  completedModules, 
  progressPercentage,
  onToggleModule 
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'knowledge'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const Sidebar = () => (
    <div className="hidden lg:flex flex-col w-72 bg-card border-r border-border p-6 h-screen sticky top-0">
      {/* Logo */}
      <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
          <Star className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl text-foreground">China Club</span>
      </button>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
            activeTab === 'dashboard'
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Layout size={20} />
          Главная
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
            activeTab === 'knowledge'
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <BookOpen size={20} />
          База знаний
        </button>
      </nav>

      {/* Tariff Card */}
      <div className="bg-muted rounded-2xl p-4 mb-4">
        <p className="text-xs text-muted-foreground mb-1">Твой тариф</p>
        <p className="font-bold text-foreground">Pro Importer 🚀</p>
      </div>

      {/* Logout */}
      <Button 
        variant="ghost" 
        onClick={onLogout}
        className="w-full justify-start text-muted-foreground hover:text-destructive"
      >
        <LogOut size={20} className="mr-3" />
        Выйти
      </Button>
    </div>
  );

  const MobileHeader = () => (
    <div className="lg:hidden sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
          <Star className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground">China Club</span>
      </div>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="p-2 bg-muted rounded-lg"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  );

  const MobileMenu = () => (
    mobileMenuOpen && (
      <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-20 p-6 animate-fade-in">
        <div className="space-y-4">
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 p-4 bg-muted rounded-2xl font-bold text-lg"
          >
            <Layout size={24} />
            Главная
          </button>
          <button
            onClick={() => { setActiveTab('knowledge'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 p-4 bg-muted rounded-2xl font-bold text-lg"
          >
            <BookOpen size={24} />
            Обучение
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-2xl font-bold text-lg"
          >
            <LogOut size={24} />
            Выйти
          </button>
        </div>
      </div>
    )
  );

  const DashboardContent = () => (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in-up">
      {/* Welcome Hero */}
      <div className="gradient-primary rounded-3xl p-8 lg:p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.4)_0%,transparent_50%)]" />
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Привет, {user.name}! 🚀
          </h1>
          <p className="text-primary-foreground/80 mb-6 max-w-md">
            Продолжай обучение и стань настоящим профи в импорте из Китая
          </p>
          <Button
            onClick={() => setActiveTab('knowledge')}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold shadow-lg"
          >
            Продолжить обучение
            <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Progress Card */}
        <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
          <h2 className="text-lg font-bold text-foreground mb-6">Общий прогресс</h2>
          <div className="flex items-center justify-center">
            <ProgressRing radius={80} stroke={10} progress={progressPercentage} />
          </div>
          <p className="text-center text-muted-foreground mt-4">
            {completedModules.length} из 15 модулей
          </p>
        </div>

        {/* Achievements Card */}
        <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="text-warning" size={20} />
            <h2 className="text-lg font-bold text-foreground">Твои достижения</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = progressPercentage >= achievement.requiredProgress;
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl flex flex-col items-center text-center transition-all ${
                    isUnlocked
                      ? `${achievement.bgClass} border border-border`
                      : 'bg-muted opacity-50'
                  }`}
                >
                  <span className="text-2xl mb-1">{achievement.emoji}</span>
                  <span className={`text-sm font-medium ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {achievement.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1">
        <MobileHeader />
        <MobileMenu />
        {activeTab === 'dashboard' && <DashboardContent />}
        {activeTab === 'knowledge' && (
          <KnowledgeBase
            completedModules={completedModules}
            onToggleModule={onToggleModule}
          />
        )}
      </div>
    </div>
  );
}
