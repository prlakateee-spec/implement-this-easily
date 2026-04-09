import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import {
  Gift, Copy, Check, Users, ShoppingBag, Percent, Package,
  Sparkles, Star, TrendingUp, ArrowRight, Calculator, Weight,
} from 'lucide-react';

interface AmbassadorModuleProps {
  userId: string;
}

interface AmbassadorProfile {
  id: string;
  referral_link: string | null;
  balance_usd: number;
  is_active: boolean;
  referrals_channel: number;
  referrals_club: number;
  referrals_orders: number;
}

const BONUS_TIERS = [
  { icon: Users, amount: '$0.3', description: 'за каждого подписчика в канал, пришедшего по твоей ссылке', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: ShoppingBag, amount: '$2', description: 'если человек вступает в клуб или делает заказ через нашу команду', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Percent, amount: '-10%', description: 'скидка для твоего друга: 900₽ вместо 1000₽ за первый месяц в клубе', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Package, amount: 'до 30%', description: 'стоимости доставки можно закрыть бонусами', color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

const PRICE_PER_KG = 6.5;

function DeliveryCalculator({ balance }: { balance: number }) {
  const [weight, setWeight] = useState(5);
  const [targetSubs, setTargetSubs] = useState(50);
  const [targetClub, setTargetClub] = useState(5);

  const deliveryCost = weight * PRICE_PER_KG;
  const maxDiscount = deliveryCost * 0.3;
  const canCover = Math.min(balance, maxDiscount);
  const finalCost = deliveryCost - canCover;

  const potentialEarnings = targetSubs * 0.3 + targetClub * 2;
  const potentialCover = Math.min(potentialEarnings, deliveryCost * 0.3);

  return (
    <Card className="border-border overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Калькулятор доставки
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Посчитай сколько сэкономишь на доставке</p>
      </div>
      <CardContent className="p-5 space-y-6">
        {/* Weight input */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Weight className="w-4 h-4 text-muted-foreground" /> Вес посылки
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Math.max(0.1, Number(e.target.value) || 0))}
                className="w-20 h-8 text-right text-sm font-bold text-primary"
                min={0.1}
                step={0.5}
              />
              <span className="text-sm text-muted-foreground">кг</span>
            </div>
          </div>
          <Slider value={[weight]} onValueChange={([v]) => setWeight(v)} min={1} max={50} step={0.5} />
        </div>

        {/* Cost breakdown */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Стоимость доставки ({weight} кг × $6.5)</span>
            <span className="font-bold text-foreground">${deliveryCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Макс. скидка бонусами (30%)</span>
            <span className="font-medium text-amber-500">-${maxDiscount.toFixed(2)}</span>
          </div>
          {balance > 0 && (
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">Твой баланс покрывает</span>
              <span className="font-bold text-emerald-500">-${canCover.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base border-t border-border pt-2">
            <span className="font-bold text-foreground">Итого к оплате</span>
            <span className="font-bold text-primary">${finalCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Earnings simulator */}
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-bold text-foreground">🎯 Сколько нужно привести?</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-muted-foreground">Подписчиков в канал</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={targetSubs}
                  onChange={(e) => setTargetSubs(Math.max(0, Number(e.target.value) || 0))}
                  className="w-20 h-8 text-right text-sm font-bold text-blue-500"
                  min={0}
                />
                <span className="text-xs text-muted-foreground">= ${(targetSubs * 0.3).toFixed(1)}</span>
              </div>
            </div>
            <Slider value={[targetSubs]} onValueChange={([v]) => setTargetSubs(v)} min={0} max={500} step={10} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-muted-foreground">В клуб / заказов</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={targetClub}
                  onChange={(e) => setTargetClub(Math.max(0, Number(e.target.value) || 0))}
                  className="w-20 h-8 text-right text-sm font-bold text-emerald-500"
                  min={0}
                />
                <span className="text-xs text-muted-foreground">= ${(targetClub * 2).toFixed(0)}</span>
              </div>
            </div>
            <Slider value={[targetClub]} onValueChange={([v]) => setTargetClub(v)} min={0} max={50} step={1} />
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Ты заработаешь</p>
            <p className="text-3xl font-bold text-foreground">${potentialEarnings.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Покроешь <span className="font-bold text-primary">${potentialCover.toFixed(2)}</span> из ${deliveryCost.toFixed(2)} доставки
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AmbassadorModule({ userId }: AmbassadorModuleProps) {
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => { fetchProfile(); }, [userId]);

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
    if (profile && !profile.is_active) {
      // Profile exists (admin pre-created with link) — just activate
      const { error } = await supabase.from('ambassador_profiles').update({ is_active: true }).eq('user_id', userId);
      if (error) {
        toast({ title: 'Ошибка', description: 'Не удалось активировать программу', variant: 'destructive' });
      } else {
        toast({ title: '🎉 Программа активирована!', description: 'Теперь ты амбассадор!' });
        fetchProfile();
      }
    } else {
      // No profile at all — create new
      const { error } = await supabase.from('ambassador_profiles').insert({ user_id: userId, is_active: true });
      if (error) {
        toast({ title: 'Ошибка', description: 'Не удалось активировать программу', variant: 'destructive' });
      } else {
        toast({ title: '🎉 Программа активирована!', description: 'Теперь ты амбассадор! Реферальную ссылку добавит администратор.' });
        fetchProfile();
      }
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

  // Not yet an ambassador or not activated — show CTA
  if (!profile || !profile.is_active) {
    return (
      <div className="p-6 lg:p-10 space-y-8 animate-fade-in-up max-w-3xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-1">
          <div className="rounded-[22px] bg-card p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
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
                полноценную валюту для оплаты доставки из Китая в Москву!
              </p>
              <Button onClick={handleRequest} disabled={requesting} size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xl px-10 py-7 rounded-2xl shadow-lg hover:shadow-xl transition-all animate-pulse hover:animate-none">
                {requesting ? 'Активация...' : (<><Star className="w-6 h-6 mr-2" />🔥 Активировать программу амбассадора<ArrowRight className="w-6 h-6 ml-2" /></>)}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">Нажми чтобы сразу стать частью команды!</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" /> Бонусная система
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

        {/* Preview calculator */}
        <DeliveryCalculator balance={0} />
      </div>
    );
  }

  // Profile exists but not active — still show dashboard (self-activated)
  // No more "pending" state since users activate themselves

  // Active ambassador dashboard
  return (
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up max-w-3xl mx-auto">
      {/* Balance card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-8 lg:p-10 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.4)_0%,transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 text-white/80 text-sm">
            <TrendingUp className="w-4 h-4" /> Мой баланс амбассадора
          </div>
          <div className="text-5xl lg:text-6xl font-bold mb-2">${profile.balance_usd.toFixed(2)}</div>
          <p className="text-white/70 text-sm">Обновляется 1 раз в неделю</p>
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
              <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0 h-12 w-12 rounded-xl">
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{profile.referrals_channel}</p>
            <p className="text-xs text-muted-foreground">В канал</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <ShoppingBag className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{profile.referrals_club}</p>
            <p className="text-xs text-muted-foreground">В клуб</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Package className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{profile.referrals_orders}</p>
            <p className="text-xs text-muted-foreground">Заказов</p>
          </CardContent>
        </Card>
      </div>

      {/* Calculator */}
      <DeliveryCalculator balance={profile.balance_usd} />

      {/* Bonus tiers reminder */}
      <div className="space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" /> Как начисляются бонусы
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
