import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, RefreshCw, Eye, EyeOff, AlertCircle, KeyRound, Truck, ShoppingBag, Search, UserX, UserCheck } from 'lucide-react';

interface ClientProfile {
  id: string;
  user_id: string | null;
  username: string;
  display_name: string | null;
  is_active: boolean;
  has_delivery: boolean;
  has_order: boolean;
  has_pick: boolean;
  created_at: string | null;
}

export function ClientsPanel() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', display_name: '' });
  const [createdUser, setCreatedUser] = useState<{ username: string; password: string; display_name: string } | null>(null);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [resetForm, setResetForm] = useState<{ username: string; password: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('id, user_id, username, display_name, is_active, has_delivery, has_order, has_pick, created_at')
      .eq('is_client', true)
      .order('created_at', { ascending: false });
    setClients((data || []) as ClientProfile[]);
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(loadClients, 300);
    return () => clearTimeout(t);
  }, []);

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    setCreatedUser(null);

    try {
      const normalizedUsername = form.username.trim().toLowerCase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Не авторизован');

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          username: normalizedUsername,
          password: form.password,
          display_name: form.display_name || normalizedUsername,
          is_client: true,
        },
      });

      if (error) throw new Error(error.message || 'Ошибка создания');
      if (data?.error) throw new Error(data.error);

      // Mark as client
      await supabase
        .from('user_profiles')
        .update({ is_client: true })
        .eq('username', normalizedUsername);

      setCreatedUser({ username: normalizedUsername, password: form.password, display_name: form.display_name || normalizedUsername });
      setSuccess(`Клиент "${normalizedUsername}" создан!`);
      setForm({ username: '', password: '', display_name: '' });
      await loadClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleModule = async (userId: string, field: 'has_delivery' | 'has_order' | 'has_pick', current: boolean, label: string, username: string) => {
    await supabase.from('user_profiles').update({ [field]: !current }).eq('user_id', userId);
    setSuccess(`${label} ${!current ? 'подключена' : 'отключена'} для "${username}"`);
    await loadClients();
  };

  const toggleActive = async (username: string, currentActive: boolean) => {
    setTogglingUser(username);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Не авторизован');
      const { data, error } = await supabase.functions.invoke('toggle-user-active', {
        body: { username, is_active: !currentActive },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setSuccess(`Клиент "${username}" ${!currentActive ? 'активирован' : 'деактивирован'}`);
      await loadClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingUser(null);
    }
  };

  const resetPassword = async (username: string, newPassword: string) => {
    setResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Не авторизован');
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { username, new_password: newPassword },
      });
      if (error) throw new Error(error.message);
      if (data?.results?.[0]?.error) throw new Error(data.results[0].error);
      setSuccess(`Пароль для "${username}" сброшен`);
      setResetForm(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  };

  const moduleButtons = (c: ClientProfile) => {
    if (!c.user_id) return null;
    return (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm"
          onClick={() => toggleModule(c.user_id!, 'has_delivery', c.has_delivery, 'Доставка', c.username)}
          className={c.has_delivery ? 'text-emerald-600 hover:text-emerald-600' : 'text-muted-foreground hover:text-emerald-600'}
          title={c.has_delivery ? 'Отключить Доставку' : 'Подключить Доставку'}
        >
          <Truck size={16} />
          {c.has_delivery && <span className="ml-0.5 text-xs">✓</span>}
        </Button>
        <Button variant="ghost" size="sm"
          onClick={() => toggleModule(c.user_id!, 'has_order', c.has_order, 'Выкуп', c.username)}
          className={c.has_order ? 'text-orange-600 hover:text-orange-600' : 'text-muted-foreground hover:text-orange-600'}
          title={c.has_order ? 'Отключить Выкуп' : 'Подключить Выкуп'}
        >
          <ShoppingBag size={16} />
          {c.has_order && <span className="ml-0.5 text-xs">✓</span>}
        </Button>
        <Button variant="ghost" size="sm"
          onClick={() => toggleModule(c.user_id!, 'has_pick', c.has_pick, 'Подбор', c.username)}
          className={c.has_pick ? 'text-cyan-600 hover:text-cyan-600' : 'text-muted-foreground hover:text-cyan-600'}
          title={c.has_pick ? 'Отключить Подбор' : 'Подключить Подбор'}
        >
          <Search size={16} />
          {c.has_pick && <span className="ml-0.5 text-xs">✓</span>}
        </Button>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-foreground">Клиенты</h1>
      <p className="text-muted-foreground text-sm -mt-4">Пользователи только для логистики — без базы знаний и обучения</p>

      {/* Create Client Form */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="text-primary" size={20} />
          <h2 className="text-lg font-bold text-foreground">Добавить клиента</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm">
            ✅ {success}
          </div>
        )}
        {createdUser && (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
            <p className="font-bold text-foreground text-sm">📋 Данные для входа:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Логин:</span>
              <span className="font-mono font-bold text-foreground">{createdUser.username}</span>
              <span className="text-muted-foreground">Пароль:</span>
              <span className="font-mono font-bold text-foreground">{createdUser.password}</span>
            </div>
            <Button variant="outline" size="sm" className="mt-2"
              onClick={() => navigator.clipboard.writeText(`Логин: ${createdUser.username}\nПароль: ${createdUser.password}`)}
            >
              📋 Скопировать
            </Button>
          </div>
        )}

        <form onSubmit={createClient} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Логин *</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="client_name" autoCapitalize="none" required className="bg-muted/50" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Пароль *</label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" required minLength={6} className="bg-muted/50 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Имя</label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Имя клиента" className="bg-muted/50" />
            </div>
          </div>
          <Button type="submit" disabled={creating} className="gradient-primary text-primary-foreground">
            {creating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" /> : <UserPlus size={16} className="mr-2" />}
            Создать клиента
          </Button>
        </form>
      </div>

      {/* Clients List */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Все клиенты ({clients.length})</h2>
          <Button variant="ghost" size="sm" onClick={loadClients} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        ) : clients.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Клиентов пока нет</p>
        ) : (
          <div className="space-y-3">
            {clients.map((c) => (
              <div key={c.id} className={`p-4 rounded-xl border transition-all ${
                c.is_active ? 'border-border bg-muted/30' : 'border-destructive/20 bg-destructive/5 opacity-60'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{c.username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.is_active ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {c.is_active ? 'Активен' : 'Деактивирован'}
                      </span>
                      {c.has_delivery && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">🚚 Доставка</span>}
                      {c.has_order && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">🛒 Выкуп</span>}
                      {c.has_pick && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">🔍 Подбор</span>}
                    </div>
                    {c.display_name && c.display_name !== c.username && (
                      <p className="text-sm text-muted-foreground">{c.display_name}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {resetForm?.username === c.username ? (
                      <div className="flex items-center gap-2">
                        <Input type="text" value={resetForm.password}
                          onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                          placeholder="Новый пароль" className="w-32 h-8 text-sm bg-muted/50" />
                        <Button variant="ghost" size="sm" disabled={resetting || !resetForm.password}
                          onClick={() => resetPassword(c.username, resetForm.password)} className="text-primary">
                          {resetting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" /> : '✓'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setResetForm(null)}>✕</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setResetForm({ username: c.username, password: '' })}
                        className="text-muted-foreground hover:text-foreground" title="Сбросить пароль">
                        <KeyRound size={16} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm"
                      onClick={() => toggleActive(c.username, c.is_active)}
                      disabled={togglingUser === c.username}
                      className={c.is_active ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}>
                      {togglingUser === c.username ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                      ) : c.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </Button>
                    {moduleButtons(c)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
