import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, UserX, UserCheck, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string | null;
  username: string;
  display_name: string | null;
  is_active: boolean;
  registered_at: string | null;
  created_at: string | null;
}

interface CreatedUser {
  username: string;
  password: string;
  display_name: string;
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [form, setForm] = useState({ username: '', password: '', display_name: '' });

  const loadUsers = async () => {
    setLoading(true);
    // Admin can see all profiles via edge function or direct query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data as UserProfile[]);
    if (error) setError(error.message);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Не авторизован');

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          username: form.username,
          password: form.password,
          display_name: form.display_name || form.username,
        },
      });

      if (error) throw new Error(error.message || 'Ошибка создания');
      if (data?.error) throw new Error(data.error);

      setCreatedUser({
        username: form.username,
        password: form.password,
        display_name: form.display_name || form.username,
      });
      setSuccess(`Пользователь "${form.username}" создан!`);
      setForm({ username: '', password: '', display_name: '' });
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (username: string, currentActive: boolean) => {
    setTogglingUser(username);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Не авторизован');

      const { data, error } = await supabase.functions.invoke('toggle-user-active', {
        body: { username, is_active: !currentActive },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setSuccess(`Пользователь "${username}" ${!currentActive ? 'активирован' : 'деактивирован'}`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingUser(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-foreground">Управление пользователями</h1>

      {/* Create User Form */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="text-primary" size={20} />
          <h2 className="text-lg font-bold text-foreground">Добавить пользователя</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm">
            ✅ {success}
          </div>
        )}

        <form onSubmit={createUser} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Логин *</label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="username"
                required
                className="bg-muted/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Пароль *</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-muted/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Имя</label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Отображаемое имя"
                className="bg-muted/50"
              />
            </div>
          </div>
          <Button type="submit" disabled={creating} className="gradient-primary text-primary-foreground">
            {creating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
            ) : (
              <UserPlus size={16} className="mr-2" />
            )}
            Создать пользователя
          </Button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Все пользователи ({users.length})</h2>
          <Button variant="ghost" size="sm" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Пользователей пока нет</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  u.is_active
                    ? 'border-border bg-muted/30'
                    : 'border-destructive/20 bg-destructive/5 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground truncate">{u.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.is_active
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {u.is_active ? 'Активен' : 'Деактивирован'}
                    </span>
                  </div>
                  {u.display_name && u.display_name !== u.username && (
                    <p className="text-sm text-muted-foreground">{u.display_name}</p>
                  )}
                  {u.created_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Создан: {new Date(u.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActive(u.username, u.is_active)}
                  disabled={togglingUser === u.username}
                  className={u.is_active ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}
                >
                  {togglingUser === u.username ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  ) : u.is_active ? (
                    <>
                      <UserX size={16} className="mr-1" />
                      Деактивировать
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} className="mr-1" />
                      Активировать
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
