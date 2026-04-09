import { useState, useEffect } from 'react';
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
  Shield,
  Truck,
  ShoppingBag,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/hooks/useAuth';
import { ProgressRing } from './ProgressRing';
import { KnowledgeBase } from './KnowledgeBase';
import { SettingsPage } from './SettingsPage';
import { AdminPanel } from './AdminPanel';
import { DeliveryModule } from './DeliveryModule';
import { OrderForMeModule } from './OrderForMeModule';
import { AdminRequests } from './AdminRequests';
import { AmbassadorModule } from './AmbassadorModule';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'knowledge' | 'delivery' | 'order' | 'ambassador' | 'settings' | 'admin' | 'requests'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!(user.email === ADMIN_EMAIL || user.email === 'terra_ai_team@kitay.club')) return;
    const fetchUnviewed = async () => {
      const [{ count: c1 }, { count: c2 }, { count: c3 }] = await Promise.all([
        supabase.from('deliveries').select('*', { count: 'exact', head: true }).is('admin_viewed_at', null).neq('status', 'warehouse'),
        supabase.from('order_requests').select('*', { count: 'exact', head: true }).is('admin_viewed_at', null),
        supabase.from('ambassador_profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
      ]);
      setUnviewedCount((c1 || 0) + (c2 || 0) + (c3 || 0));
    };
    fetchUnviewed();
    const interval = setInterval(fetchUnviewed, 30000);
    return () => clearInterval(interval);
  }, [user.email]);

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
    { id: 'dashboard' as const, icon: Layout, label: 'Главная', badge: 0, highlight: false },
    { id: 'knowledge' as const, icon: BookOpen, label: 'База знаний', badge: 0, highlight: false },
    { id: 'delivery' as const, icon: Truck, label: 'Доставка', badge: 0, highlight: false },
    { id: 'order' as const, icon: ShoppingBag, label: 'Закажите мне', badge: 0, highlight: false },
    { id: 'ambassador' as const, icon: Sparkles, label: 'Стать амбассадором', badge: 0, highlight: true },
    { id: 'settings' as const, icon: UserIcon, label: 'Личный кабинет', badge: 0, highlight: false },
    ...(isAdmin ? [
      { id: 'requests' as const, icon: ClipboardList, label: 'Заявки', badge: unviewedCount, highlight: false },
      { id: 'admin' as const, icon: Shield, label: 'Пользователи', badge: 0, highlight: false },
    ] : []),
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium relative ${
              activeTab === item.id
                ? item.highlight
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'bg-secondary text-secondary-foreground'
                : item.highlight
                  ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 hover:from-amber-500/20 hover:to-orange-500/20'
                  : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <item.icon size={20} />
            {item.label}
            {item.badge > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-[11px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
                {item.badge}
              </span>
            )}
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
              className="w-full flex items-center gap-3 p-4 bg-muted rounded-2xl font-bold text-lg relative"
            >
              <item.icon size={24} />
              {item.label}
              {item.badge > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold min-w-[22px] h-[22px] flex items-center justify-center rounded-full px-1.5">
                  {item.badge}
                </span>
              )}
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
        {activeTab === 'delivery' && (
          <DeliveryModule userId={user.id} />
        )}
        {activeTab === 'order' && (
          <OrderForMeModule userId={user.id} />
        )}
        {activeTab === 'ambassador' && (
          <AmbassadorModule userId={user.id} />
        )}
        {activeTab === 'settings' && (
          <SettingsPage userName={displayName} onSaveName={handleSaveName} userId={user.id} />
        )}
        {activeTab === 'requests' && isAdmin && <AdminRequests />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </div>
    </div>
  );
}