import { useState } from 'react';
import { 
  Layout, 
  BookOpen, 
  LogOut, 
  ChevronRight, 
  Star, 
  Menu, 
  X,
  User as UserIcon,
  Sun,
  Moon,
  Link2,
  Shield
} from 'lucide-react';
import { User } from '@/hooks/useAuth';
import { ProgressRing } from './ProgressRing';
import { KnowledgeBase } from './KnowledgeBase';
import { SettingsPage } from './SettingsPage';
import { AdminPanel } from './AdminPanel';
import { DeliveryModule } from './DeliveryModule';
import { TOTAL_MODULES, ADMIN_EMAIL } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  completedModules: string[];
  progressPercentage: number;
  onToggleModule: (moduleId: string) => void;
}

function getUserLevel(registeredAt?: string): number {
  if (!registeredAt) return 1;
  const months = Math.floor((Date.now() - new Date(registeredAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
  return Math.max(1, months + 1);
}

export function Dashboard({ 
  user, 
  onLogout, 
  completedModules, 
  progressPercentage,
  onToggleModule 
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'knowledge' | 'delivery' | 'settings' | 'admin'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user.name);

  const userLevel = getUserLevel(user.registeredAt);

  const handleSaveName = async (name: string) => {
    setDisplayName(name);
    // Save to DB
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase
      .from('user_profiles')
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
  };

  const isAdmin = user.email === ADMIN_EMAIL || user.email === 'terra_ai_team@kitay.club';

  const navItems = [
    { id: 'dashboard' as const, icon: Layout, label: 'Главная' },
    { id: 'knowledge' as const, icon: BookOpen, label: 'База знаний' },
    { id: 'delivery' as const, icon: Truck, label: 'Доставка' },
    { id: 'settings' as const, icon: UserIcon, label: 'Личный кабинет' },
    ...(isAdmin ? [{ id: 'admin' as const, icon: Shield, label: 'Пользователи' }] : []),
  ];

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
      title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
    >
      {theme === 'light' ? <Moon size={18} className="text-muted-foreground" /> : <Sun size={18} className="text-warning" />}
    </button>
  );

  const Sidebar = () => (
    <div className="hidden lg:flex flex-col w-72 bg-card border-r border-border p-6 h-screen sticky top-0">
      <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
          <Star className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl text-foreground">Китай для НОВЫХ</span>
      </button>

      <nav className="space-y-2 flex-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === item.id
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="bg-muted rounded-2xl p-4 mb-4">
        <p className="text-xs text-muted-foreground mb-1">Твой уровень</p>
        <p className="font-bold text-foreground">Уровень {userLevel} 🚀</p>
      </div>

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
        <span className="font-bold text-foreground">Китай для НОВЫХ</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-muted rounded-lg">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </div>
  );

  const MobileMenu = () => (
    mobileMenuOpen ? (
      <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-20 p-6 animate-fade-in">
        <div className="space-y-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 p-4 bg-muted rounded-2xl font-bold text-lg"
            >
              <item.icon size={24} />
              {item.label}
            </button>
          ))}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-2xl font-bold text-lg"
          >
            <LogOut size={24} />
            Выйти
          </button>
        </div>
      </div>
    ) : null
  );

  const DashboardContent = () => (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in-up">
      <div className="gradient-primary rounded-3xl p-8 lg:p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.4)_0%,transparent_50%)]" />
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Привет, {displayName}! 🚀
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
          <h2 className="text-lg font-bold text-foreground mb-2">Общий прогресс</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              Уровень {userLevel}
            </span>
            <span className="text-xs text-muted-foreground">
              1 уровень = 1 месяц в клубе
            </span>
          </div>
          <div className="flex items-center justify-center">
            <ProgressRing radius={80} stroke={10} progress={progressPercentage} />
          </div>
          <p className="text-center text-muted-foreground mt-4">
            {completedModules.length} из {TOTAL_MODULES} модулей
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Link2 className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-foreground">Мои подборки</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Сохраняй полезные ссылки в Личном кабинете</p>
          <Button
            onClick={() => setActiveTab('settings')}
            variant="outline"
            className="w-full"
          >
            Перейти к подборкам
          </Button>
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
        {/* Desktop theme toggle */}
        <div className="hidden lg:flex justify-end p-4 pb-0">
          <ThemeToggle />
        </div>
        {activeTab === 'dashboard' && <DashboardContent />}
        {activeTab === 'knowledge' && (
          <KnowledgeBase
            completedModules={completedModules}
            onToggleModule={onToggleModule}
            userEmail={user.email}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPage userName={displayName} onSaveName={handleSaveName} userId={user.id} />
        )}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </div>
    </div>
  );
}