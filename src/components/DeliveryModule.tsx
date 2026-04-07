import { useState, useEffect } from 'react';
import { Package, Truck, Plus, Save, Send, Trash2, Warehouse, ChevronDown, ChevronUp, Edit2, Check } from 'lucide-react';
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
  const [profile, setProfile] = useState<ShippingProfile>({ ...emptyProfile });
  const [profileSaved, setProfileSaved] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(true);

  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [newName, setNewName] = useState('');
  const [newTrack, setNewTrack] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
    loadItems();
  }, []);

  // --- Shipping profile ---
  const loadProfile = async () => {
    const { data } = await supabase
      .from('shipping_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      setProfile({
        recipient_name: data.recipient_name || '',
        recipient_phone: data.recipient_phone || '',
        delivery_type: (data.delivery_type as 'pickup' | 'redirect') || 'pickup',
        transport_company: data.transport_company || '',
        delivery_address: data.delivery_address || '',
        packaging_type: data.packaging_type || '',
        packaging_price: Number(data.packaging_price) || 0,
      });
      setProfileSaved(true);
      setProfileExpanded(false);
    }
  };

  const saveProfile = async () => {
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

    const { error } = profileSaved
      ? await supabase.from('shipping_profiles').update({ ...payload, updated_at: new Date().toISOString() }).eq('user_id', userId)
      : await supabase.from('shipping_profiles').insert(payload);

    setLoading(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Данные отправки сохранены ✅' });
      setProfileSaved(true);
      setEditingProfile(false);
      setProfileExpanded(false);
    }
  };

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
    const { error } = await supabase.from('deliveries').insert({
      user_id: userId,
      product_name: newName.trim(),
      tracking_number: newTrack.trim() || null,
      recipient_name: profile.recipient_name || '-',
      recipient_phone: profile.recipient_phone || '-',
      is_redirect: profile.delivery_type === 'redirect',
      transport_company: profile.transport_company || null,
      delivery_address: profile.delivery_address || null,
      packaging_type: profile.packaging_type || null,
      packaging_price: profile.packaging_price || null,
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
    if (!profileSaved) {
      toast({ title: 'Сначала сохраните данные отправки', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const ids = warehouseItems.map(i => i.id);
    await supabase
      .from('deliveries')
      .update({
        status: 'sent',
        recipient_name: profile.recipient_name,
        recipient_phone: profile.recipient_phone,
        is_redirect: profile.delivery_type === 'redirect',
        transport_company: profile.transport_company || null,
        delivery_address: profile.delivery_address || null,
        packaging_type: profile.packaging_type || null,
        packaging_price: profile.packaging_price || null,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);
    setLoading(false);
    toast({ title: 'Посылка отправлена 🚀' });
    loadItems();
  };

  const handlePackagingChange = (value: string) => {
    const opt = PACKAGING_OPTIONS.find(o => o.label === value);
    setProfile(p => ({ ...p, packaging_type: value, packaging_price: opt?.price || 0 }));
  };

  const warehouseItems = items.filter(i => i.status === 'warehouse');
  const sentItems = items.filter(i => i.status === 'sent');

  return (
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Доставка</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          📦 <strong>Куда отправить посылку:</strong> Склад консолидации в Китае.
          Заполните данные отправки один раз, затем добавляйте товары на склад и отправляйте.
        </p>
      </div>

      {/* Shipping profile */}
      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        <button
          onClick={() => {
            if (profileSaved && !editingProfile) {
              setProfileExpanded(!profileExpanded);
            } else {
              setProfileExpanded(!profileExpanded);
            }
          }}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Send size={20} className="text-primary" />
            Данные отправки
            {profileSaved && !editingProfile && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                Сохранено
              </span>
            )}
          </h2>
          {profileExpanded ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
        </button>

        {profileExpanded && (
          <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
            {profileSaved && !editingProfile ? (
              /* Read-only view */
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">ФИО:</span> <span className="font-medium text-foreground">{profile.recipient_name}</span></p>
                <p><span className="text-muted-foreground">Телефон:</span> <span className="font-medium text-foreground">{profile.recipient_phone}</span></p>
                <p><span className="text-muted-foreground">Способ:</span> <span className="font-medium text-foreground">{profile.delivery_type === 'pickup' ? 'Самовывоз' : 'Переадресовка'}</span></p>
                {profile.delivery_type === 'redirect' && (
                  <>
                    {profile.transport_company && <p><span className="text-muted-foreground">ТК:</span> <span className="font-medium text-foreground">{profile.transport_company}</span></p>}
                    {profile.delivery_address && <p><span className="text-muted-foreground">Адрес:</span> <span className="font-medium text-foreground">{profile.delivery_address}</span></p>}
                    {profile.packaging_type && <p><span className="text-muted-foreground">Упаковка:</span> <span className="font-medium text-foreground">{profile.packaging_type} ({profile.packaging_price}$)</span></p>}
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="mt-2">
                  <Edit2 size={14} className="mr-1" /> Изменить
                </Button>
              </div>
            ) : (
              /* Edit form */
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ФИО получателя *</Label>
                    <Input value={profile.recipient_name} onChange={e => setProfile(p => ({ ...p, recipient_name: e.target.value }))} placeholder="Иванов Иван Иванович" />
                  </div>
                  <div className="space-y-2">
                    <Label>Номер телефона *</Label>
                    <Input value={profile.recipient_phone} onChange={e => setProfile(p => ({ ...p, recipient_phone: e.target.value }))} placeholder="+7 (999) 123-45-67" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Способ получения</Label>
                  <RadioGroup value={profile.delivery_type} onValueChange={(v) => setProfile(p => ({ ...p, delivery_type: v as 'pickup' | 'redirect' }))} className="flex gap-4">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-xl flex-1 cursor-pointer">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="cursor-pointer font-medium">Самовывоз</Label>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-xl flex-1 cursor-pointer">
                      <RadioGroupItem value="redirect" id="redirect" />
                      <Label htmlFor="redirect" className="cursor-pointer font-medium">Переадресовка</Label>
                    </div>
                  </RadioGroup>
                </div>

                {profile.delivery_type === 'redirect' && (
                  <div className="grid gap-4 pl-1 border-l-2 border-primary/30 ml-2">
                    <div className="space-y-2 pl-4">
                      <Label>Транспортная компания</Label>
                      <Select value={profile.transport_company} onValueChange={v => setProfile(p => ({ ...p, transport_company: v }))}>
                        <SelectTrigger><SelectValue placeholder="Выберите ТК" /></SelectTrigger>
                        <SelectContent>
                          {TRANSPORT_COMPANIES.map(tc => (<SelectItem key={tc} value={tc}>{tc}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 pl-4">
                      <Label>Адрес получения</Label>
                      <Input value={profile.delivery_address} onChange={e => setProfile(p => ({ ...p, delivery_address: e.target.value }))} placeholder="Домашний адрес в формате: город, улица, дом" className="placeholder:text-muted-foreground/60" />
                    </div>
                    <div className="space-y-2 pl-4">
                      <Label>Тип упаковки</Label>
                      <Select value={profile.packaging_type} onValueChange={handlePackagingChange}>
                        <SelectTrigger><SelectValue placeholder="Выберите упаковку" /></SelectTrigger>
                        <SelectContent>
                          {PACKAGING_OPTIONS.map(opt => (<SelectItem key={opt.label} value={opt.label}>{opt.label} — {opt.price}$</SelectItem>))}
                        </SelectContent>
                      </Select>
                      {profile.packaging_type && <p className="text-sm text-primary font-medium">Стоимость упаковки: {profile.packaging_price}$</p>}
                    </div>
                  </div>
                )}

                <Button onClick={saveProfile} disabled={loading} className="w-full font-bold">
                  <Save size={18} className="mr-2" />
                  {loading ? 'Сохранение...' : 'Сохранить данные отправки'}
                </Button>
              </div>
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

        {/* Add item row */}
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

        {/* Items list */}
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

        {/* Send button */}
        {warehouseItems.length > 0 && (
          <Button onClick={sendAll} disabled={loading} className="w-full font-bold" size="lg">
            <Send size={18} className="mr-2" />
            Отправить посылку ({warehouseItems.length} {warehouseItems.length === 1 ? 'товар' : warehouseItems.length < 5 ? 'товара' : 'товаров'})
          </Button>
        )}
      </div>

      {/* Sent items history */}
      {sentItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Check size={20} className="text-green-500" />
            Отправленные ({sentItems.length})
          </h2>
          {sentItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border opacity-70">
              <Package size={16} className="text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{item.product_name}</p>
                {item.tracking_number && <p className="text-xs text-muted-foreground font-mono">{item.tracking_number}</p>}
              </div>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                Отправлено
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
