import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, UserX, UserCheck, RefreshCw, Eye, EyeOff, AlertCircle, KeyRound } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string | null;
  username: string;
  display_name: string | null;
  is_active: boolean;
  registered_at: string | null;
  created_at: string | null;
  unique_code: string | null;
}

interface AmbassadorInfo {
  user_id: string;
  referral_link: string | null;
  is_active: boolean;
}

interface CreatedUser {
  username: string;
  password: string;
  display_name: string;
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbassadorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [form, setForm] = useState({ username: '', password: '', display_name: '' });
  const [resetForm, setResetForm] = useState<{ username: string; password: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [editingCode, setEditingCode] = useState<{ userId: string; code: string } | null>(null);
  const [editingLink, setEditingLink] = useState<{ userId: string; link: string } | null>(null);
  const [savingField, setSavingField] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    // Wait for session to be ready before querying
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Сессия не готова. Попробуйте обновить страницу.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data as UserProfile[]);
    if (error) setError(`Ошибка загрузки: ${error.message}`);
    setLoading(false);
  };

  useEffect(() => {
    // Small delay to ensure auth session is restored
    const timer = setTimeout(() => loadUsers(), 300);
    return () => clearTimeout(timer);
  }, []);

  const createUser = async (e: React.FormEvent) => {
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
        },
      });

      if (error) throw new Error(error.message || 'Ошибка создания');
      if (data?.error) throw new Error(data.error);

      setCreatedUser({
        username: normalizedUsername,
        password: form.password,
        display_name: form.display_name || normalizedUsername,
      });
      setSuccess(`Пользователь "${normalizedUsername}" создан!`);
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

  const resetPassword = async (username: string, newPassword: string) => {
    setResetting(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Не авторизован');

      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { username, new_password: newPassword },
      });

      if (error) throw new Error(error.message);
      if (data?.results?.[0]?.error) throw new Error(data.results[0].error);

      setSuccess(`Пароль для "${username}" сброшен на: ${newPassword}`);
      setResetForm(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResetting(false);
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
        {createdUser && (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
            <p className="font-bold text-foreground text-sm">📋 Данные для входа:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Логин:</span>
              <span className="font-mono font-bold text-foreground">{createdUser.username}</span>
              <span className="text-muted-foreground">Пароль:</span>
              <span className="font-mono font-bold text-foreground">{createdUser.password}</span>
              {createdUser.display_name && (
                <>
                  <span className="text-muted-foreground">Имя:</span>
                  <span className="text-foreground">{createdUser.display_name}</span>
                </>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                navigator.clipboard.writeText(`Логин: ${createdUser.username}\nПароль: ${createdUser.password}`);
              }}
            >
              📋 Скопировать
            </Button>
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
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
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
                <div className="flex items-center gap-2">
                  {resetForm?.username === u.username ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={resetForm.password}
                        onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                        placeholder="Новый пароль"
                        className="w-32 h-8 text-sm bg-muted/50"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={resetting || !resetForm.password}
                        onClick={() => resetPassword(u.username, resetForm.password)}
                        className="text-primary"
                      >
                        {resetting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" /> : '✓'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setResetForm(null)}>✕</Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetForm({ username: u.username, password: '' })}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <KeyRound size={16} />
                    </Button>
                  )}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
