import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Gift,
  Copy,
  Check,
  DollarSign,
  Users,
  ShoppingBag,
  Percent,
  Package,
  Sparkles,
  Star,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface AmbassadorModuleProps {
  userId: string;
}

interface AmbassadorProfile {
  id: string;
  referral_link: string | null;
  balance_usd: number;
  is_active: boolean;
}

const BONUS_TIERS = [
  {
    icon: Users,
    amount: '$0.1',
    description: 'за каждого подписчика в канал, пришедшего по твоей ссылке',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: ShoppingBag,
    amount: '$2',
    description: 'если человек вступает в клуб или делает заказ через нашу команду',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Percent,
    amount: '-10%',
    description: 'скидка для твоего друга: 900₽ вместо 1000₽ за первый месяц в клубе',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Package,
    amount: 'до 30%',
    description: 'стоимости доставки можно закрыть бонусами',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
];

export function AmbassadorModule({ userId }: AmbassadorModuleProps) {
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('ambassador_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  };

  const handleRequest = async () => {
    setRequesting(true);
    const { error } = await supabase
      .from('ambassador_profiles')
      .insert({ user_id: userId });
    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить заявку', variant: 'destructive' });
    } else {
      toast({ title: '🎉 Заявка отправлена!', description: 'Администратор активирует вашу ссылку в ближайшее время' });
      fetchProfile();
    }
    setRequesting(false);
  };

  const copyLink = () => {
    if (profile?.referral_link) {
      navigator.clipboard.writeText(profile.referral_link);
      setCopied(true);
      toast({ title: 'Ссылка скопирована!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not yet an ambassador — show CTA
  if (!profile) {
    return (
      <div className="p-6 lg:p-10 space-y-8 animate-fade-in-up max-w-3xl mx-auto">
        {/* Hero CTA */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-1">
          <div className="rounded-[22px] bg-card p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-rose-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Стань амбассадором</h1>
                  <p className="text-muted-foreground text-sm">Зарабатывай реальные бонусы 💰</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed max-w-xl">
                Рассказывай о проекте <span className="font-semibold text-foreground">«Китай для НОВЫХ»</span> и получай
                не просто бонусы, а полноценную валюту для оплаты доставки из Китая в Москву!
              </p>

              <Button
                onClick={handleRequest}
                disabled={requesting}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                {requesting ? 'Отправка...' : (
                  <>
                    <Star className="w-5 h-5 mr-2" />
                    Хочу стать амбассадором
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Bonus tiers */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            Бонусная система
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {BONUS_TIERS.map((tier, i) => (
              <Card key={i} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl ${tier.bg} flex items-center justify-center shrink-0`}>
                      <tier.icon className={`w-5 h-5 ${tier.color}`} />
                    </div>
                    <div>
                      <span className={`text-lg font-bold ${tier.color}`}>{tier.amount}</span>
                      <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Example */}
        <Card className="border-border bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              🧐 Как это работает на деле?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Допустим, ты собрала посылку на <strong className="text-foreground">10 кг</strong>. Доставка из Китая в Москву — примерно <strong className="text-foreground">$65 (≈5 850₽)</strong>.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-card rounded-xl p-3 border border-border">
                <span className="text-lg">1️⃣</span>
                <p className="text-sm text-muted-foreground">
                  Если у тебя <strong className="text-foreground">$19.5</strong> (30% от $65) — списываешь их. Доставка обходится в <strong className="text-emerald-500">4 095₽</strong> вместо 5 850₽!
                </p>
              </div>
              <div className="flex items-start gap-3 bg-card rounded-xl p-3 border border-border">
                <span className="text-lg">2️⃣</span>
                <p className="text-sm text-muted-foreground">
                  Если накопилось <strong className="text-foreground">$5-10</strong> — списываешь частично и платишь меньше, или копишь дальше!
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 italic">
              📦 Любая сумма в долларах на твоем счету — это реальная скидка на вес твоей посылки!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ambassador profile exists but not yet activated
  if (!profile.is_active) {
    return (
      <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up max-w-3xl mx-auto">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Заявка отправлена! 🎉</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Администратор активирует твой профиль амбассадора и добавит персональную реферальную ссылку в ближайшее время.
            </p>
            <Badge variant="secondary" className="mt-4">Ожидает активации</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active ambassador — show dashboard
  return (
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up max-w-3xl mx-auto">
      {/* Balance card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-8 lg:p-10 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.4)_0%,transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 text-white/80 text-sm">
            <TrendingUp className="w-4 h-4" />
            Мой баланс амбассадора
          </div>
          <div className="text-5xl lg:text-6xl font-bold mb-2">
            ${profile.balance_usd.toFixed(2)}
          </div>
          <p className="text-white/70 text-sm">
            Обновляется 1 раз в неделю
          </p>
        </div>
      </div>

      {/* Referral link */}
      {profile.referral_link && (
        <Card className="border-border">
          <CardContent className="p-5">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Твоя реферальная ссылка</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm text-foreground break-all font-mono">
                {profile.referral_link}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                className="shrink-0 h-12 w-12 rounded-xl"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bonus tiers reminder */}
      <div className="space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" />
          Как начисляются бонусы
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {BONUS_TIERS.map((tier, i) => (
            <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <div className={`w-9 h-9 rounded-lg ${tier.bg} flex items-center justify-center shrink-0`}>
                <tier.icon className={`w-4 h-4 ${tier.color}`} />
              </div>
              <div>
                <span className={`text-sm font-bold ${tier.color}`}>{tier.amount}</span>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
