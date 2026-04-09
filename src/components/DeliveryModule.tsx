import { useState, useEffect } from 'react';
import { Package, Truck, Plus, Save, Send, Trash2, Warehouse, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TRANSPORT_COMPANIES = [
  'Желдорэкспедиция', 'Мейджик транс', 'Байкал сервис', 'Деловые Линии',
  'Мега транс', 'ПЭК', 'КСЭ', 'СДЭК', 'Кит', 'Энергия', 'Возовоз',
  'Виктория', 'Азбука логистики', 'Байт транзит',
];

const PACKAGING_OPTIONS = [
  { label: 'Мешок', price: 2 },
  { label: 'Коробка', price: 5 },
  { label: 'Уголки', price: 7 },
  { label: 'Коробка + уголки', price: 12 },
  { label: 'Обрешетка', price: 12 },
  { label: 'Паллет + обрешетка (за куб)', price: 30 },
  { label: 'Деревянный ящик', price: 70 },
  { label: 'Коробка + сетка', price: 15 },
  { label: 'Обрешетка + сетка', price: 22 },
];

interface ShippingProfile {
  id?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_type: 'pickup' | 'redirect';
  transport_company: string;
  delivery_address: string;
  packaging_type: string;
  packaging_price: number;
}

const emptyProfile: ShippingProfile = {
  recipient_name: '',
  recipient_phone: '',
  delivery_type: 'pickup',
  transport_company: '',
  delivery_address: '',
  packaging_type: '',
  packaging_price: 0,
};

interface WarehouseItem {
  id: string;
  product_name: string;
  tracking_number: string;
  status: string;
  created_at: string;
}

interface DeliveryModuleProps {
  userId: string;
}

export function DeliveryModule({ userId }: DeliveryModuleProps) {
  const [profiles, setProfiles] = useState<ShippingProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<ShippingProfile | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [profilesExpanded, setProfilesExpanded] = useState(true);

  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [newName, setNewName] = useState('');
  const [newTrack, setNewTrack] = useState('');
  const [loading, setLoading] = useState(false);
  const [uniqueCode, setUniqueCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
    loadItems();
    supabase.from('user_profiles').select('unique_code').eq('user_id', userId).maybeSingle()
      .then(({ data }) => { if (data?.unique_code) setUniqueCode(data.unique_code); });
  }, []);

  // --- Shipping profiles ---
  const loadProfiles = async () => {
    const { data } = await supabase
      .from('shipping_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (data && data.length > 0) {
      const mapped = data.map(d => ({
        id: d.id,
        recipient_name: d.recipient_name || '',
        recipient_phone: d.recipient_phone || '',
        delivery_type: (d.delivery_type as 'pickup' | 'redirect') || 'pickup',
        transport_company: d.transport_company || '',
        delivery_address: d.delivery_address || '',
        packaging_type: d.packaging_type || '',
        packaging_price: Number(d.packaging_price) || 0,
      }));
      setProfiles(mapped);
      if (!selectedProfileId) setSelectedProfileId(mapped[0].id!);
    }
  };

  const saveProfile = async (profile: ShippingProfile) => {
    if (!profile.recipient_name.trim() || !profile.recipient_phone.trim()) {
      toast({ title: 'Заполните ФИО и телефон', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const payload = {
      user_id: userId,
      recipient_name: profile.recipient_name.trim(),
      recipient_phone: profile.recipient_phone.trim(),
      delivery_type: profile.delivery_type,
      transport_company: profile.transport_company || null,
      delivery_address: profile.delivery_address.trim() || null,
      packaging_type: profile.packaging_type || null,
      packaging_price: profile.packaging_price || null,
    };

    if (profile.id) {
      await supabase.from('shipping_profiles').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', profile.id);
    } else {
      await supabase.from('shipping_profiles').insert(payload);
    }

    setLoading(false);
    toast({ title: 'Данные сохранены ✅' });
    setEditingProfile(null);
    setIsAddingNew(false);
    await loadProfiles();
  };

  const deleteProfile = async (id: string) => {
    await supabase.from('shipping_profiles').delete().eq('id', id);
    if (selectedProfileId === id) setSelectedProfileId(null);
    toast({ title: 'Профиль удалён' });
    await loadProfiles();
  };

  const startEdit = (p: ShippingProfile) => {
    setEditingProfile({ ...p });
    setIsAddingNew(false);
  };

  const startAddNew = () => {
    setEditingProfile({ ...emptyProfile });
    setIsAddingNew(true);
  };

  const cancelEdit = () => {
    setEditingProfile(null);
    setIsAddingNew(false);
  };

  const handlePackagingChange = (value: string, setter: (p: ShippingProfile) => void, current: ShippingProfile) => {
    const opt = PACKAGING_OPTIONS.find(o => o.label === value);
    setter({ ...current, packaging_type: value, packaging_price: opt?.price || 0 });
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // --- Warehouse items ---
  const loadItems = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setItems(data as unknown as WarehouseItem[]);
  };

  const addItem = async () => {
    if (!newName.trim()) {
      toast({ title: 'Введите название товара', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const sp = selectedProfile || emptyProfile;
    const { error } = await supabase.from('deliveries').insert({
      user_id: userId,
      product_name: newName.trim(),
      tracking_number: newTrack.trim() || null,
      recipient_name: sp.recipient_name || '-',
      recipient_phone: sp.recipient_phone || '-',
      is_redirect: sp.delivery_type === 'redirect',
      transport_company: sp.transport_company || null,
      delivery_address: sp.delivery_address || null,
      packaging_type: sp.packaging_type || null,
      packaging_price: sp.packaging_price || null,
      status: 'warehouse',
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      setNewName('');
      setNewTrack('');
      loadItems();
    }
  };

  const deleteItem = async (id: string) => {
    await supabase.from('deliveries').delete().eq('id', id);
    loadItems();
  };

  const sendAll = async () => {
    const warehouseItems = items.filter(i => i.status === 'warehouse');
    if (warehouseItems.length === 0) {
      toast({ title: 'Нет товаров для отправки', variant: 'destructive' });
      return;
    }
    if (!selectedProfile) {
      toast({ title: 'Выберите профиль отправки', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const ids = warehouseItems.map(i => i.id);
    await supabase
      .from('deliveries')
      .update({
        status: 'sent',
        recipient_name: selectedProfile.recipient_name,
        recipient_phone: selectedProfile.recipient_phone,
        is_redirect: selectedProfile.delivery_type === 'redirect',
        transport_company: selectedProfile.transport_company || null,
        delivery_address: selectedProfile.delivery_address || null,
        packaging_type: selectedProfile.packaging_type || null,
        packaging_price: selectedProfile.packaging_price || null,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);
    setLoading(false);
    toast({ title: 'Посылка отправлена 🚀' });
    loadItems();
  };

  const DELIVERY_STATUS_LABELS: Record<string, string> = {
    warehouse: 'На складе', sent: 'В обработке', packed: 'Посылка сформирована',
    sent_to_moscow: 'Отправлена в Москву', arrived_moscow: 'Прибытие в Москву',
    handed_to_tk: 'Передана в ТК', in_transit: 'Едет к вам в город', received: 'Посылка получена',
  };
  const DELIVERY_STATUS_COLORS: Record<string, string> = {
    warehouse: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    sent: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    packed: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
    sent_to_moscow: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    arrived_moscow: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    handed_to_tk: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    in_transit: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    received: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  };

  const warehouseItems = items.filter(i => i.status === 'warehouse');
  const activeItems = items.filter(i => i.status !== 'warehouse' && i.status !== 'received');
  const doneItems = items.filter(i => i.status === 'received');

  return (
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Доставка</h1>
          </div>
          {uniqueCode && (
            <div className="bg-card border border-border rounded-xl px-3 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Мой код</p>
              <p className="font-mono font-bold text-primary text-sm">{uniqueCode}</p>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          📦 <strong>Куда отправить посылку:</strong> Склад консолидации в Китае.
          Заполните данные отправки, затем добавляйте товары на склад и отправляйте.
        </p>
      </div>

      {/* Shipping profiles */}
      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        <button
          onClick={() => setProfilesExpanded(!profilesExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Send size={20} className="text-primary" />
            Данные отправки
            {profiles.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {profiles.length}
              </span>
            )}
          </h2>
          {profilesExpanded ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
        </button>

        {profilesExpanded && (
          <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
            {/* Saved profiles list */}
            {profiles.map(p => (
              <div
                key={p.id}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${
                  selectedProfileId === p.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:border-primary/40'
                }`}
                onClick={() => setSelectedProfileId(p.id!)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1 text-sm">
                    <p className="font-semibold text-foreground truncate">{p.recipient_name}</p>
                    <p className="text-muted-foreground">{p.recipient_phone}</p>
                    <p className="text-muted-foreground">
                      {p.delivery_type === 'pickup' ? '📍 Самовывоз' : `🚛 ${p.transport_company || 'Переадресовка'}`}
                    </p>
                    {p.delivery_type === 'redirect' && p.delivery_address && (
                      <p className="text-muted-foreground text-xs truncate">{p.delivery_address}</p>
                    )}
                    {p.packaging_type && (
                      <p className="text-muted-foreground text-xs">📦 {p.packaging_type} — {p.packaging_price}$</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {selectedProfileId === p.id && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium mr-1 self-start">
                        Выбран
                      </span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteProfile(p.id!); }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add new profile button */}
            {!editingProfile && (
              <Button variant="outline" onClick={startAddNew} className="w-full">
                <Plus size={16} className="mr-2" /> Добавить адрес доставки
              </Button>
            )}

            {/* Edit / Add form */}
            {editingProfile && (
              <ProfileForm
                profile={editingProfile}
                onChange={setEditingProfile}
                onSave={() => saveProfile(editingProfile)}
                onCancel={cancelEdit}
                onPackagingChange={(v) => handlePackagingChange(v, setEditingProfile, editingProfile)}
                loading={loading}
                isNew={isAddingNew}
              />
            )}
          </div>
        )}
      </div>

      {/* Мой склад */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Warehouse size={20} className="text-primary" />
          Мой склад
        </h2>

        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Название товара</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Например: Кроссовки Nike" />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Трек-номер</Label>
            <Input value={newTrack} onChange={e => setNewTrack(e.target.value)} placeholder="Трек-номер" />
          </div>
          <Button onClick={addItem} disabled={loading} size="icon" className="shrink-0 h-10 w-10">
            <Plus size={20} />
          </Button>
        </div>

        {warehouseItems.length > 0 ? (
          <div className="space-y-2">
            {warehouseItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3">
                <Package size={16} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{item.product_name}</p>
                  {item.tracking_number && <p className="text-xs text-muted-foreground font-mono">{item.tracking_number}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)} className="shrink-0 h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Добавьте товары с трек-номерами на ваш склад
          </p>
        )}

        {warehouseItems.length > 0 && (
          <div className="space-y-2">
            {selectedProfile ? (
              <p className="text-xs text-muted-foreground text-center">
                Отправка по профилю: <strong className="text-foreground">{selectedProfile.recipient_name}</strong>
              </p>
            ) : (
              <p className="text-xs text-destructive text-center">
                ⚠️ Выберите профиль отправки выше
              </p>
            )}
            <Button onClick={sendAll} disabled={loading || !selectedProfile} className="w-full font-bold" size="lg">
              <Send size={18} className="mr-2" />
              Отправить посылку ({warehouseItems.length} {warehouseItems.length === 1 ? 'товар' : warehouseItems.length < 5 ? 'товара' : 'товаров'})
            </Button>
          </div>
        )}
      </div>

      {/* Active deliveries with statuses */}
      {activeItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Truck size={20} className="text-primary" />
            В пути ({activeItems.length})
          </h2>
          {activeItems.map(item => (
            <div key={item.id} className="bg-card rounded-xl px-4 py-3 border border-border space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{item.product_name}</p>
                  {item.tracking_number && <p className="text-xs text-muted-foreground font-mono">{item.tracking_number}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${DELIVERY_STATUS_COLORS[item.status] || 'bg-muted text-muted-foreground'}`}>
                  {DELIVERY_STATUS_LABELS[item.status] || item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Received */}
      {doneItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Check size={20} className="text-primary" />
            Получено ({doneItems.length})
          </h2>
          {doneItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border opacity-70">
              <Package size={16} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{item.product_name}</p>
                {item.tracking_number && <p className="text-xs text-muted-foreground font-mono">{item.tracking_number}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DELIVERY_STATUS_COLORS.received}`}>
                Получена
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Profile Form sub-component ---------- */

function ProfileForm({
  profile,
  onChange,
  onSave,
  onCancel,
  onPackagingChange,
  loading,
  isNew,
}: {
  profile: ShippingProfile;
  onChange: (p: ShippingProfile) => void;
  onSave: () => void;
  onCancel: () => void;
  onPackagingChange: (v: string) => void;
  loading: boolean;
  isNew: boolean;
}) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-sm">{isNew ? 'Новый адрес' : 'Редактирование'}</h3>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel}>
          <X size={14} />
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>ФИО получателя *</Label>
          <Input value={profile.recipient_name} onChange={e => onChange({ ...profile, recipient_name: e.target.value })} placeholder="Иванов Иван Иванович" />
        </div>
        <div className="space-y-2">
          <Label>Номер телефона *</Label>
          <Input value={profile.recipient_phone} onChange={e => onChange({ ...profile, recipient_phone: e.target.value })} placeholder="+7 (999) 123-45-67" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Способ получения</Label>
        <RadioGroup value={profile.delivery_type} onValueChange={(v) => onChange({ ...profile, delivery_type: v as 'pickup' | 'redirect' })} className="flex gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-xl flex-1 cursor-pointer">
            <RadioGroupItem value="pickup" id={`pickup-${profile.id || 'new'}`} />
            <Label htmlFor={`pickup-${profile.id || 'new'}`} className="cursor-pointer font-medium">Самовывоз</Label>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-xl flex-1 cursor-pointer">
            <RadioGroupItem value="redirect" id={`redirect-${profile.id || 'new'}`} />
            <Label htmlFor={`redirect-${profile.id || 'new'}`} className="cursor-pointer font-medium">Переадресовка</Label>
          </div>
        </RadioGroup>
      </div>

      {profile.delivery_type === 'redirect' && (
        <div className="grid gap-4 pl-1 border-l-2 border-primary/30 ml-2">
          <div className="space-y-2 pl-4">
            <Label>Транспортная компания</Label>
            <Select value={profile.transport_company} onValueChange={v => onChange({ ...profile, transport_company: v })}>
              <SelectTrigger><SelectValue placeholder="Выберите ТК" /></SelectTrigger>
              <SelectContent>
                {TRANSPORT_COMPANIES.map(tc => (<SelectItem key={tc} value={tc}>{tc}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 pl-4">
            <Label>Адрес получения</Label>
            <Input value={profile.delivery_address} onChange={e => onChange({ ...profile, delivery_address: e.target.value })} placeholder="Домашний адрес в формате: город, улица, дом" className="placeholder:text-muted-foreground/60" />
          </div>
          <div className="space-y-2 pl-4">
            <Label>Тип упаковки</Label>
            <Select value={profile.packaging_type} onValueChange={onPackagingChange}>
              <SelectTrigger><SelectValue placeholder="Выберите упаковку" /></SelectTrigger>
              <SelectContent>
                {PACKAGING_OPTIONS.map(opt => (<SelectItem key={opt.label} value={opt.label}>{opt.label} — {opt.price}$</SelectItem>))}
              </SelectContent>
            </Select>
            {profile.packaging_type && <p className="text-sm text-primary font-medium">Стоимость упаковки: {profile.packaging_price}$</p>}
          </div>
        </div>
      )}

      <Button onClick={onSave} disabled={loading} className="w-full font-bold">
        <Save size={18} className="mr-2" />
        {loading ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </div>
  );
}
