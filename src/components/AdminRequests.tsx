import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  RefreshCw, Truck, ShoppingBag, Package, User, Phone, MapPin,
  Calendar, ExternalLink, ChevronLeft, MessageCircle, Eye, Sparkles,
  DollarSign, Users, Link2, Check, Search, Palette, Ruler, Hash, Image as ImageIcon
} from 'lucide-react';

function AmbassadorDetail({ ambassador: a, profiles, onBack, onActivate, onUpdateBalance, onUpdateStats, formatDate }: {
  ambassador: { id: string; user_id: string; referral_link: string | null; balance_usd: number; is_active: boolean; referrals_channel: number; referrals_club: number; referrals_orders: number; created_at: string };
  profiles: Record<string, { username: string; display_name: string | null }>;
  onBack: () => void;
  onActivate: (id: string, link: string) => void;
  onUpdateBalance: (id: string, balance: number) => void;
  onUpdateStats: (id: string, field: string, value: number) => void;
  formatDate: (d: string) => string;
}) {
  const [editLink, setEditLink] = useState(a.referral_link || '');
  const [editBalance, setEditBalance] = useState(a.balance_usd.toString());
  const [editChannel, setEditChannel] = useState(a.referrals_channel.toString());
  const [editClub, setEditClub] = useState(a.referrals_club.toString());
  const [editOrders, setEditOrders] = useState(a.referrals_orders.toString());
  const p = profiles[a.user_id];

  return (
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft size={18} /> Назад к амбассадорам
      </button>
      <div className="bg-card rounded-2xl p-6 border border-border shadow-soft space-y-5">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold text-foreground">Амбассадор</h2>
          <Badge className={a.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}>
            {a.is_active ? 'Активен' : 'Ожидает'}
          </Badge>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase">Пользователь</p>
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-muted-foreground" />
            <span className="font-medium">{p?.display_name || p?.username || 'Неизвестный'}</span>
          </div>
          {p?.username && (
            <div className="flex items-center gap-2 text-sm">
              <MessageCircle size={14} className="text-muted-foreground" />
              <span className="text-primary font-mono">@{p.username}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-semibold uppercase">Реферальная ссылка</label>
          <div className="flex gap-2">
            <Input value={editLink} onChange={e => setEditLink(e.target.value)} placeholder="https://t.me/..." className="flex-1" />
            <Button size="sm" onClick={() => onActivate(a.id, editLink)}>
              <Check size={16} className="mr-1" /> {a.is_active ? 'Обновить' : 'Активировать'}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-semibold uppercase">Баланс (USD)</label>
          <div className="flex gap-2">
            <Input type="number" step="0.01" value={editBalance} onChange={e => setEditBalance(e.target.value)} className="w-32" />
            <Button size="sm" variant="outline" onClick={() => onUpdateBalance(a.id, parseFloat(editBalance) || 0)}>Сохранить</Button>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-semibold uppercase">Статистика рефералов</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'В канал', val: editChannel, set: setEditChannel, field: 'referrals_channel' },
              { label: 'В клуб', val: editClub, set: setEditClub, field: 'referrals_club' },
              { label: 'Заказы', val: editOrders, set: setEditOrders, field: 'referrals_orders' },
            ].map(s => (
              <div key={s.field} className="space-y-1">
                <label className="text-xs text-muted-foreground">{s.label}</label>
                <div className="flex gap-1">
                  <Input type="number" value={s.val} onChange={e => s.set(e.target.value)} className="w-full" />
                  <Button size="icon" variant="ghost" onClick={() => onUpdateStats(a.id, s.field, parseInt(s.val) || 0)}><Check size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-3 py-2">
          <Calendar size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Дата заявки</p>
            <p className="text-sm font-medium text-foreground">{formatDate(a.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'В обработке' },
  { value: 'payment_link', label: 'Отправлена ссылка на оплату' },
  { value: 'paid', label: 'Оплачено' },
  { value: 'ordered', label: 'Товар заказан' },
  { value: 'packed', label: 'Посылка сформирована' },
  { value: 'sent_to_moscow', label: 'Посылка отправлена в Москву' },
  { value: 'arrived_moscow', label: 'Прибытие в Москву' },
  { value: 'handed_to_tk', label: 'Посылка передана в ТК' },
  { value: 'in_transit', label: 'Едет к вам в город' },
  { value: 'received', label: 'Посылка получена' },
];

const DELIVERY_STATUSES = [
  { value: 'sent', label: 'В обработке' },
  { value: 'packed', label: 'Посылка сформирована' },
  { value: 'sent_to_moscow', label: 'Посылка отправлена в Москву' },
  { value: 'arrived_moscow', label: 'Прибытие в Москву' },
  { value: 'handed_to_tk', label: 'Посылка передана в ТК' },
  { value: 'in_transit', label: 'Едет к вам в город' },
  { value: 'received', label: 'Посылка получена' },
];

interface Delivery {
  id: string;
  user_id: string;
  product_name: string;
  tracking_number: string | null;
  recipient_name: string;
  recipient_phone: string;
  is_redirect: boolean;
  transport_company: string | null;
  delivery_address: string | null;
  packaging_type: string | null;
  packaging_price: number | null;
  status: string;
  created_at: string;
  admin_viewed_at: string | null;
}

interface OrderRequest {
  id: string;
  user_id: string;
  product_name: string;
  product_link: string | null;
  price_cny: number | null;
  qr_image_url: string | null;
  info_image_url: string | null;
  recipient_name: string;
  recipient_phone: string;
  delivery_type: string;
  transport_company: string | null;
  delivery_address: string | null;
  packaging_type: string | null;
  packaging_price: number | null;
  status: string;
  created_at: string;
  admin_viewed_at: string | null;
}

interface AmbassadorProfile {
  id: string;
  user_id: string;
  referral_link: string | null;
  balance_usd: number;
  is_active: boolean;
  referrals_channel: number;
  referrals_club: number;
  referrals_orders: number;
  created_at: string;
  admin_viewed_at: string | null;
}

interface PickRequest {
  id: string;
  user_id: string;
  product_link: string;
  price_rub: number;
  image_url: string | null;
  color: string;
  size: string;
  quantity: number;
  status: string;
  created_at: string;
  admin_viewed_at: string | null;
}

interface Profile {
  username: string;
  display_name: string | null;
}

type Tab = 'deliveries' | 'orders' | 'ambassadors' | 'picks';

export function AdminRequests() {
  const [tab, setTab] = useState<Tab>('deliveries');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [picks, setPicks] = useState<PickRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRequest | null>(null);
  const [selectedAmbassador, setSelectedAmbassador] = useState<AmbassadorProfile | null>(null);
  const [selectedPick, setSelectedPick] = useState<PickRequest | null>(null);

  const loadProfiles = async () => {
    const { data } = await supabase.from('user_profiles').select('user_id, username, display_name');
    if (data) {
      const map: Record<string, Profile> = {};
      data.forEach((p) => {
        if (p.user_id) map[p.user_id] = { username: p.username, display_name: p.display_name };
      });
      setProfiles(map);
    }
  };

  const loadDeliveries = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .neq('status', 'warehouse')
      .order('created_at', { ascending: false });
    if (data) setDeliveries(data as Delivery[]);
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from('order_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as OrderRequest[]);
  };

  const loadAmbassadors = async () => {
    const { data } = await supabase
      .from('ambassador_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAmbassadors(data as AmbassadorProfile[]);
  };

  const loadPicks = async () => {
    const { data } = await supabase
      .from('pick_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPicks(data as PickRequest[]);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadProfiles(), loadDeliveries(), loadOrders(), loadAmbassadors(), loadPicks()]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const markViewed = async (table: 'deliveries' | 'order_requests' | 'pick_requests', id: string) => {
    await supabase.from(table).update({ admin_viewed_at: new Date().toISOString() }).eq('id', id);
  };

  const openPick = (p: PickRequest) => {
    setSelectedPick(p);
    if (!p.admin_viewed_at) {
      markViewed('pick_requests', p.id);
      setPicks(prev => prev.map(x => x.id === p.id ? { ...x, admin_viewed_at: new Date().toISOString() } : x));
    }
  };

  const openDelivery = (d: Delivery) => {
    setSelectedDelivery(d);
    if (!d.admin_viewed_at) {
      markViewed('deliveries', d.id);
      setDeliveries(prev => prev.map(x => x.id === d.id ? { ...x, admin_viewed_at: new Date().toISOString() } : x));
    }
  };

  const openOrder = (o: OrderRequest) => {
    setSelectedOrder(o);
    if (!o.admin_viewed_at) {
      markViewed('order_requests', o.id);
      setOrders(prev => prev.map(x => x.id === o.id ? { ...x, admin_viewed_at: new Date().toISOString() } : x));
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const isNew = (viewed: string | null) => !viewed;

  const newDeliveriesCount = deliveries.filter(d => isNew(d.admin_viewed_at)).length;
  const newOrdersCount = orders.filter(o => isNew(o.admin_viewed_at)).length;

  const statusLabel: Record<string, string> = {
    sent: 'Отправлена', warehouse: 'На складе', pending: 'В обработке', completed: 'Выполнен',
    payment_link: 'Ссылка на оплату', paid: 'Оплачено', ordered: 'Товар заказан',
    packed: 'Посылка сформирована', sent_to_moscow: 'Отправлена в Москву',
    arrived_moscow: 'Прибытие в Москву', handed_to_tk: 'Передана в ТК',
    in_transit: 'Едет к вам', received: 'Получена',
    found: 'Подобран', approved: 'Подтверждён', rejected: 'Отклонён',
  };
  const statusColor: Record<string, string> = {
    sent: 'bg-blue-500/10 text-blue-600', warehouse: 'bg-yellow-500/10 text-yellow-600',
    pending: 'bg-orange-500/10 text-orange-600', completed: 'bg-green-500/10 text-green-600',
    payment_link: 'bg-purple-500/10 text-purple-600', paid: 'bg-emerald-500/10 text-emerald-600',
    ordered: 'bg-cyan-500/10 text-cyan-600', packed: 'bg-indigo-500/10 text-indigo-600',
    sent_to_moscow: 'bg-blue-500/10 text-blue-600', arrived_moscow: 'bg-teal-500/10 text-teal-600',
    handed_to_tk: 'bg-sky-500/10 text-sky-600', in_transit: 'bg-amber-500/10 text-amber-600',
    received: 'bg-green-500/10 text-green-600',
    found: 'bg-blue-500/10 text-blue-600', approved: 'bg-emerald-500/10 text-emerald-600',
    rejected: 'bg-red-500/10 text-red-600',
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    await supabase.from('order_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status: newStatus });
  };

  const updateDeliveryStatus = async (id: string, newStatus: string) => {
    await supabase.from('deliveries').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    if (selectedDelivery?.id === id) setSelectedDelivery({ ...selectedDelivery, status: newStatus });
  };

  const activateAmbassador = async (id: string, link: string) => {
    await supabase.from('ambassador_profiles').update({ is_active: true, referral_link: link, updated_at: new Date().toISOString() }).eq('id', id);
    setAmbassadors(prev => prev.map(a => a.id === id ? { ...a, is_active: true, referral_link: link } : a));
    if (selectedAmbassador?.id === id) setSelectedAmbassador({ ...selectedAmbassador, is_active: true, referral_link: link });
  };

  const updateAmbassadorStats = async (id: string, field: string, value: number) => {
    await supabase.from('ambassador_profiles').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id);
    setAmbassadors(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    if (selectedAmbassador?.id === id) setSelectedAmbassador({ ...selectedAmbassador, [field]: value } as AmbassadorProfile);
  };

  const updateAmbassadorBalance = async (id: string, balance: number) => {
    await supabase.from('ambassador_profiles').update({ balance_usd: balance, updated_at: new Date().toISOString() }).eq('id', id);
    setAmbassadors(prev => prev.map(a => a.id === id ? { ...a, balance_usd: balance } : a));
    if (selectedAmbassador?.id === id) setSelectedAmbassador({ ...selectedAmbassador, balance_usd: balance } as AmbassadorProfile);
  };

  const newAmbassadorsCount = ambassadors.filter(a => a.is_active && !a.admin_viewed_at).length;
  const newPicksCount = picks.filter(p => isNew(p.admin_viewed_at)).length;

  const PICK_STATUSES = [
    { value: 'pending', label: 'В обработке' },
    { value: 'found', label: 'Подобран' },
    { value: 'approved', label: 'Подтверждён' },
    { value: 'ordered', label: 'Заказан' },
    { value: 'completed', label: 'Завершён' },
    { value: 'rejected', label: 'Отклонён' },
  ];

  const updatePickStatus = async (id: string, newStatus: string) => {
    await supabase.from('pick_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    setPicks(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    if (selectedPick?.id === id) setSelectedPick({ ...selectedPick, status: newStatus });
  };

  const ProfileInfo = ({ userId }: { userId: string }) => {
    const p = profiles[userId];
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <User size={14} className="text-muted-foreground" />
          <span className="font-medium">{p?.display_name || p?.username || 'Неизвестный'}</span>
        </div>
        {p?.username && (
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle size={14} className="text-muted-foreground" />
            <span className="text-primary font-mono">@{p.username}</span>
          </div>
        )}
      </div>
    );
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
        <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground">{value}</p>
        </div>
      </div>
    );
  };

  // Pick detail view
  if (selectedPick) {
    const p = selectedPick;
    return (
      <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up">
        <button onClick={() => setSelectedPick(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} /> Назад к заявкам
        </button>
        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft space-y-5">
          <h2 className="text-xl font-bold text-foreground">Заявка на подбор</h2>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Статус</p>
            <Select value={p.status} onValueChange={(v) => updatePickStatus(p.id, v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PICK_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase">Пользователь</p>
            <ProfileInfo userId={p.user_id} />
          </div>

          {p.product_link && (
            <a href={p.product_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 rounded-xl p-3">
              <ExternalLink size={16} /> Ссылка на товар
            </a>
          )}

          {p.image_url && (
            <a href={p.image_url} target="_blank" rel="noopener noreferrer" className="block">
              <p className="text-xs text-muted-foreground mb-1">Скриншот товара</p>
              <img src={p.image_url} alt="Product" className="max-h-48 rounded-xl border border-border object-contain" />
            </a>
          )}

          {p.price_rub > 0 && (
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">Стоимость</p>
              <p className="text-2xl font-bold text-primary">₽{p.price_rub}</p>
            </div>
          )}

          <div className="space-y-0">
            <InfoRow icon={Palette} label="Цвет" value={p.color || undefined} />
            <InfoRow icon={Ruler} label="Размер" value={p.size || undefined} />
            <InfoRow icon={Hash} label="Количество" value={`${p.quantity} шт`} />
            <InfoRow icon={Calendar} label="Дата создания" value={formatDate(p.created_at)} />
          </div>
        </div>
      </div>
    );
  }

  // Ambassador detail view
  if (selectedAmbassador) {
    return (
      <AmbassadorDetail
        ambassador={selectedAmbassador}
        profiles={profiles}
        onBack={() => setSelectedAmbassador(null)}
        onActivate={activateAmbassador}
        onUpdateBalance={updateAmbassadorBalance}
        onUpdateStats={updateAmbassadorStats}
        formatDate={formatDate}
      />
    );
  }
  if (selectedDelivery) {
    const d = selectedDelivery;
    return (
      <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up">
        <button onClick={() => setSelectedDelivery(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} /> Назад к заявкам
        </button>
        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-foreground">{d.product_name}</h2>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Статус посылки</p>
            <Select value={d.status} onValueChange={(v) => updateDeliveryStatus(d.id, v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase">Пользователь</p>
            <ProfileInfo userId={d.user_id} />
          </div>

          <div className="space-y-0">
            <InfoRow icon={Package} label="Трек-номер" value={d.tracking_number} />
            <InfoRow icon={User} label="ФИО получателя" value={d.recipient_name} />
            <InfoRow icon={Phone} label="Телефон" value={d.recipient_phone} />
            <InfoRow icon={Truck} label="Транспортная компания" value={d.transport_company} />
            <InfoRow icon={MapPin} label="Адрес доставки" value={d.delivery_address} />
            {d.packaging_type && (
              <InfoRow icon={Package} label="Упаковка" value={`${d.packaging_type} — $${d.packaging_price}`} />
            )}
            <InfoRow icon={Calendar} label="Дата создания" value={formatDate(d.created_at)} />
          </div>

          <p className="text-xs text-muted-foreground">
            {d.is_redirect ? '📦 Перенаправка' : '🏠 Самовывоз'}
          </p>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    const o = selectedOrder;
    return (
      <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up">
        <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} /> Назад к заявкам
        </button>
        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-foreground">{o.product_name}</h2>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Статус заказа</p>
            <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase">Пользователь</p>
            <ProfileInfo userId={o.user_id} />
          </div>

          {o.price_cny != null && o.price_cny > 0 && (
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">Стоимость</p>
              <p className="text-2xl font-bold text-primary">¥{o.price_cny}</p>
            </div>
          )}

          {o.product_link && (
            <a href={o.product_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 rounded-xl p-3">
              <ExternalLink size={16} /> Ссылка на товар
            </a>
          )}

          <div className="flex gap-4">
            {o.qr_image_url && (
              <a href={o.qr_image_url} target="_blank" rel="noopener noreferrer" className="block">
                <p className="text-xs text-muted-foreground mb-1">QR код</p>
                <img src={o.qr_image_url} alt="QR" className="w-32 h-32 rounded-xl border border-border object-cover" />
              </a>
            )}
            {o.info_image_url && (
              <a href={o.info_image_url} target="_blank" rel="noopener noreferrer" className="block">
                <p className="text-xs text-muted-foreground mb-1">Информация</p>
                <img src={o.info_image_url} alt="Info" className="w-32 h-32 rounded-xl border border-border object-cover" />
              </a>
            )}
          </div>

          <div className="space-y-0">
            <InfoRow icon={User} label="ФИО получателя" value={o.recipient_name} />
            <InfoRow icon={Phone} label="Телефон" value={o.recipient_phone} />
            <InfoRow icon={Truck} label="Транспортная компания" value={o.transport_company} />
            <InfoRow icon={MapPin} label="Адрес доставки" value={o.delivery_address} />
            {o.packaging_type && (
              <InfoRow icon={Package} label="Упаковка" value={`${o.packaging_type} — $${o.packaging_price}`} />
            )}
            <InfoRow icon={Calendar} label="Дата создания" value={formatDate(o.created_at)} />
          </div>

          <p className="text-xs text-muted-foreground">
            {o.delivery_type === 'redirect' ? '📦 Перенаправка' : '🏠 Самовывоз'}
          </p>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Заявки</h1>
        <Button variant="ghost" size="sm" onClick={loadAll} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
        <button
          onClick={() => setTab('deliveries')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all relative ${
            tab === 'deliveries' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck size={16} />
          Посылки ({deliveries.length})
          {newDeliveriesCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
              {newDeliveriesCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all relative ${
            tab === 'orders' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingBag size={16} />
          Закажите мне ({orders.length})
          {newOrdersCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
              {newOrdersCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setTab('picks')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all relative ${
            tab === 'picks' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search size={16} />
          Подбор ({picks.length})
          {newPicksCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
              {newPicksCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setTab('ambassadors')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all relative ${
            tab === 'ambassadors' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles size={16} />
          Амбассадоры ({ambassadors.length})
          {newAmbassadorsCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
              {newAmbassadorsCount}
            </Badge>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : tab === 'deliveries' ? (
        <div className="space-y-3">
          {deliveries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет заявок на доставку</p>
          ) : deliveries.map((d) => (
            <button
              key={d.id}
              onClick={() => openDelivery(d)}
              className={`w-full text-left bg-card rounded-2xl p-4 border shadow-soft transition-all hover:shadow-md ${
                isNew(d.admin_viewed_at) ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {isNew(d.admin_viewed_at) && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                  <div>
                    <p className="font-bold text-foreground">{d.product_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">@{profiles[d.user_id]?.username || '?'} · {formatDate(d.created_at)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[d.status] || 'bg-muted text-muted-foreground'}`}>
                  {statusLabel[d.status] || d.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : tab === 'orders' ? (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет заявок на выкуп</p>
          ) : orders.map((o) => (
            <button
              key={o.id}
              onClick={() => openOrder(o)}
              className={`w-full text-left bg-card rounded-2xl p-4 border shadow-soft transition-all hover:shadow-md ${
                isNew(o.admin_viewed_at) ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {isNew(o.admin_viewed_at) && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                  <div>
                    <p className="font-bold text-foreground">{o.product_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">@{profiles[o.user_id]?.username || '?'} · {o.price_cny ? `¥${o.price_cny} · ` : ''}{formatDate(o.created_at)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[o.status] || 'bg-muted text-muted-foreground'}`}>
                  {statusLabel[o.status] || o.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : tab === 'picks' ? (
        <div className="space-y-3">
          {picks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет заявок на подбор</p>
          ) : picks.map((p) => (
            <button
              key={p.id}
              onClick={() => openPick(p)}
              className={`w-full text-left bg-card rounded-2xl p-4 border shadow-soft transition-all hover:shadow-md ${
                isNew(p.admin_viewed_at) ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                {p.image_url && <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-border shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isNew(p.admin_viewed_at) && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                      <p className="font-bold text-foreground truncate">@{profiles[p.user_id]?.username || '?'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[p.status] || 'bg-muted text-muted-foreground'}`}>
                      {statusLabel[p.status] || p.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.price_rub > 0 ? `₽${p.price_rub} · ` : ''}{p.color ? `${p.color} · ` : ''}{p.size ? `${p.size} · ` : ''}{p.quantity} шт · {formatDate(p.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
      {ambassadors.filter(a => a.is_active).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет активаций амбассадоров</p>
          ) : ambassadors.filter(a => a.is_active).map((a) => (
            <button
              key={a.id}
              onClick={() => openAmbassador(a)}
              className={`w-full text-left bg-card rounded-2xl p-4 border shadow-soft transition-all hover:shadow-md ${
                isNew(a.admin_viewed_at) ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {isNew(a.admin_viewed_at) && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                  <div>
                    <p className="font-bold text-foreground">@{profiles[a.user_id]?.username || '?'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Активировал(а) программу · {formatDate(a.created_at)}
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600">Активирован</Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
