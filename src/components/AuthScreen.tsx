import { useState } from 'react';
import { Star, Mail, Key, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (name: string, email: string, password: string) => Promise<boolean>;
}

export function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onLogin(formData.email, formData.password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated overflow-hidden animate-fade-in-up">
        {/* Header with gradient */}
        <div className="gradient-primary p-10 text-center relative overflow-hidden">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:20px_20px]" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-primary-foreground/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <Star className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary-foreground mb-1 tracking-tight">
              Китай для НОВЫХ
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              Закрытое сообщество для закупок из Китая для жителей новых регионов России
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-12 py-6 rounded-xl border-input focus:border-primary focus:ring-2 focus:ring-primary/20 bg-muted/50 focus:bg-card"
                required
              />
            </div>

            <div className="relative group">
              <Key className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <Input
                type="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-12 py-6 rounded-xl border-input focus:border-primary focus:ring-2 focus:ring-primary/20 bg-muted/50 focus:bg-card"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 gradient-primary text-primary-foreground font-bold text-lg rounded-xl shadow-glow hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  Войти в кабинет
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
