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
  Sparkles,
  Search,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/hooks/useAuth';
import { ProgressRing } from './ProgressRing';
import { KnowledgeBase } from './KnowledgeBase';
import { SettingsPage } from './SettingsPage';
import { AdminPanel } from './AdminPanel';
import { DeliveryModule } from './DeliveryModule';
import { OrderForMeModule } from './OrderForMeModule';
import { PickForMeModule } from './PickForMeModule';
import { AdminRequests } from './AdminRequests';
import { AmbassadorModule } from './AmbassadorModule';
import { KiraChat } from './KiraChat';
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

// Removed auto-calculation - now level comes from DB

export function Dashboard({ 
  user, 
  onLogout, 
  completedModules, 
  progressPercentage,
  onToggleModule 
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'knowledge' | 'delivery' | 'order' | 'pick' | 'ambassador' | 'settings' | 'admin' | 'requests' | 'kira'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [hasKira, setHasKira] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!(user.email === ADMIN_EMAIL || user.email === 'terra_ai_team@kitay.club')) return;
    const fetchUnviewed = async () => {
      const [{ count: c1 }, { count: c2 }, { count: c3 }, { count: c4 }] = await Promise.all([
        supabase.from('deliveries').select('*', { count: 'exact', head: true }).is('admin_viewed_at', null).neq('status', 'warehouse'),
        supabase.from('order_requests').select('*', { count: 'exact', head: true }).is('admin_viewed_at', null),
        supabase.from('ambassador_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).is('admin_viewed_at', null),
        supabase.from('pick_requests').select('*', { count: 'exact', head: true }).is('admin_viewed_at', null),
      ]);
      setUnviewedCount((c1 || 0) + (c2 || 0) + (c3 || 0) + (c4 || 0));
    };
    fetchUnviewed();
    const interval = setInterval(fetchUnviewed, 30000);
    return () => clearInterval(interval);
  }, [user.email]);

  const [displayName, setDisplayName] = useState(user.name);

  // Removed auto-calculation - level comes from DB

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

  // Check if user has Kira access
  useEffect(() => {
    if (isAdmin) { setHasKira(true); return; }
    const checkKira = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('has_kira')
        .eq('user_id', user.id)
        .single();
      if (data?.has_kira) setHasKira(true);
    };
    checkKira();
  }, [user.id, isAdmin]);

  const navItems = [
    { id: 'dashboard' as const, icon: Layout, label: 'Главная', badge: 0, highlight: false },
    { id: 'knowledge' as const, icon: BookOpen, label: 'База знаний', badge: 0, highlight: false },
    { id: 'settings' as const, icon: UserIcon, label: 'Личный кабинет', badge: 0, highlight: false },
    { id: 'delivery' as const, icon: Truck, label: 'Доставка', badge: 0, highlight: false },
    { id: 'order' as const, icon: ShoppingBag, label: 'Закажите мне', badge: 0, highlight: false },
    { id: 'pick' as const, icon: Search, label: 'Подберите мне', badge: 0, highlight: false },
    ...(hasKira ? [
      { id: 'kira' as const, icon: MessageCircle, label: 'Кира — байер', badge: 0, highlight: false },
    ] : []),
    ...(isAdmin ? [
      { id: 'requests' as const, icon: ClipboardList, label: 'Заявки', badge: unviewedCount, highlight: false },
      { id: 'admin' as const, icon: Shield, label: 'Пользователи', badge: 0, highlight: false },
    ] : []),
    { id: 'ambassador' as const, icon: Sparkles, label: 'Стать амбассадором', badge: 0, highlight: true },
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
      <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-16 p-4 sm:p-6 animate-fade-in overflow-y-auto">
        <div className="space-y-2 sm:space-y-3 max-w-md mx-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl font-semibold text-base sm:text-lg relative ${
                item.highlight
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : activeTab === item.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted'
              }`}
            >
              <item.icon size={22} />
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
            className="w-full flex items-center gap-3 p-3.5 sm:p-4 bg-destructive/10 text-destructive rounded-2xl font-semibold text-base sm:text-lg"
          >
            <LogOut size={22} />
            Выйти
          </button>
        </div>
      </div>
    ) : null
  );

  const DashboardContent = () => {
    const [trackDeliveries, setTrackDeliveries] = useState<any[]>([]);
    const [trackOrders, setTrackOrders] = useState<any[]>([]);
    const [loadingTracking, setLoadingTracking] = useState(true);

    useEffect(() => {
      const fetchTracking = async () => {
        const [{ data: d }, { data: o }] = await Promise.all([
          supabase.from('deliveries').select('id, product_name, status, tracking_number, created_at').eq('user_id', user.id).neq('status', 'warehouse').order('created_at', { ascending: false }).limit(10),
          supabase.from('order_requests').select('id, product_name, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        ]);
        setTrackDeliveries(d || []);
        setTrackOrders(o || []);
        setLoadingTracking(false);
      };
      fetchTracking();
    }, [user.id]);

    const DELIVERY_STATUSES = [
      { key: 'processing', label: 'В обработке', icon: '📋' },
      { key: 'formed', label: 'Сформирована', icon: '📦' },
      { key: 'sent_to_moscow', label: 'В Москву', icon: '✈️' },
      { key: 'arrived_moscow', label: 'В Москве', icon: '🏙️' },
      { key: 'transferred_tk', label: 'В ТК', icon: '🚛' },
      { key: 'in_transit', label: 'В пути', icon: '🚚' },
      { key: 'delivered', label: 'Получена', icon: '✅' },
    ];

    const ORDER_STATUSES = [
      { key: 'pending', label: 'В обработке', icon: '📋' },
      { key: 'confirmed', label: 'Подтверждён', icon: '✔️' },
      { key: 'purchased', label: 'Выкуплен', icon: '🛒' },
      { key: 'shipped_china', label: 'По Китаю', icon: '📮' },
      { key: 'at_warehouse', label: 'На складе', icon: '🏭' },
      { key: 'formed', label: 'Сформирован', icon: '📦' },
      { key: 'sent_to_moscow', label: 'В Москву', icon: '✈️' },
      { key: 'arrived_moscow', label: 'В Москве', icon: '🏙️' },
      { key: 'transferred_tk', label: 'В ТК', icon: '🚛' },
      { key: 'delivered', label: 'Получен', icon: '✅' },
    ];

    const getStatusIndex = (status: string, statuses: { key: string }[]) => {
      const idx = statuses.findIndex(s => s.key === status);
      return idx >= 0 ? idx : 0;
    };

    const activeDeliveries = trackDeliveries.filter(d => d.status !== 'delivered');
    const activeOrders = trackOrders.filter(o => o.status !== 'delivered');
    const hasTracking = activeDeliveries.length > 0 || activeOrders.length > 0;

    return (
      <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 animate-fade-in-up">
        <div className="gradient-primary rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.4)_0%,transparent_50%)]" />
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Привет, {displayName}! 🚀
            </h1>
            <p className="text-primary-foreground/80 mb-4 sm:mb-6 max-w-md text-sm sm:text-base">
              Продолжай обучение и стань настоящим профи в импорте из Китая
            </p>
            <Button
              onClick={() => setActiveTab('knowledge')}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold shadow-lg text-sm sm:text-base"
            >
              Продолжить обучение
              <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        </div>

        {!loadingTracking && hasTracking && (
          <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-soft border border-border space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="text-primary" size={20} />
              <h2 className="text-lg font-bold text-foreground">Мои посылки</h2>
              <span className="text-xs text-muted-foreground ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {activeDeliveries.length + activeOrders.length} в пути
              </span>
            </div>

            {activeDeliveries.map(d => {
              const idx = getStatusIndex(d.status, DELIVERY_STATUSES);
              const progress = Math.round(((idx + 1) / DELIVERY_STATUSES.length) * 100);
              return (
                <div key={d.id} className="space-y-2.5 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground text-sm truncate">{d.product_name}</span>
                    {d.tracking_number && (
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0">{d.tracking_number}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {DELIVERY_STATUSES.map((s, i) => (
                      <div key={s.key} className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                        i <= idx ? 'bg-primary' : 'bg-border'
                      } ${i === idx ? 'animate-pulse' : ''}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-primary font-medium">
                      {DELIVERY_STATUSES[idx].icon} {DELIVERY_STATUSES[idx].label}
                    </p>
                    <span className="text-[11px] text-muted-foreground">{progress}%</span>
                  </div>
                </div>
              );
            })}

            {activeOrders.map(o => {
              const idx = getStatusIndex(o.status, ORDER_STATUSES);
              const progress = Math.round(((idx + 1) / ORDER_STATUSES.length) * 100);
              return (
                <div key={o.id} className="space-y-2.5 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground text-sm truncate">{o.product_name}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {ORDER_STATUSES.map((s, i) => (
                      <div key={s.key} className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                        i <= idx ? 'bg-primary' : 'bg-border'
                      } ${i === idx ? 'animate-pulse' : ''}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-primary font-medium">
                      {ORDER_STATUSES[idx].icon} {ORDER_STATUSES[idx].label}
                    </p>
                    <span className="text-[11px] text-muted-foreground">{progress}%</span>
                  </div>
                </div>
              );
            })}

            <Button variant="outline" size="sm" onClick={() => setActiveTab('delivery')} className="w-full mt-2">
              Все посылки <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-soft border border-border">
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

          <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-soft border border-border">
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
  };

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
        <div className={activeTab === 'dashboard' ? '' : 'hidden'}><DashboardContent /></div>
        <div className={activeTab === 'knowledge' ? '' : 'hidden'}>
          <KnowledgeBase
            completedModules={completedModules}
            onToggleModule={onToggleModule}
            userEmail={user.email}
          />
        </div>
        <div className={activeTab === 'delivery' ? '' : 'hidden'}><DeliveryModule userId={user.id} /></div>
        <div className={activeTab === 'order' ? '' : 'hidden'}><OrderForMeModule userId={user.id} /></div>
        <div className={activeTab === 'pick' ? '' : 'hidden'}><PickForMeModule userId={user.id} /></div>
        <div className={activeTab === 'ambassador' ? '' : 'hidden'}><AmbassadorModule userId={user.id} /></div>
        <div className={activeTab === 'settings' ? '' : 'hidden'}>
          <SettingsPage userName={displayName} onSaveName={handleSaveName} userId={user.id} />
        </div>
        {hasKira && <div className={activeTab === 'kira' ? '' : 'hidden'}><KiraChat userId={user.id} /></div>}
        {isAdmin && <div className={activeTab === 'requests' ? '' : 'hidden'}><AdminRequests /></div>}
        {isAdmin && <div className={activeTab === 'admin' ? '' : 'hidden'}><AdminPanel /></div>}
      </div>
    </div>
  );
}