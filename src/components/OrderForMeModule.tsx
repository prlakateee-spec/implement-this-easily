import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Plus, Trash2, Send, Upload, Image, Link2, ChevronDown, ChevronUp, Edit2, Check, X, Save, ShoppingCart } from 'lucide-react';
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

interface CartItem {
  id: string;
  product_name: string;
  product_link: string;
  price_cny: string;
  qrFile: File | null;
  infoFile: File | null;
  qrPreview: string | null;
  infoPreview: string | null;
}

interface OrderRequest {
  id: string;
  product_name: string;
  product_link: string | null;
  price_cny: number | null;
  qr_image_url: string | null;
  info_image_url: string | null;
  status: string;
  created_at: string;
}

interface OrderForMeModuleProps {
  userId: string;
}

let itemIdCounter = 0;
const newCartItem = (): CartItem => ({
  id: `cart-${++itemIdCounter}`,
  product_name: '',
  product_link: '',
  price_cny: '',
  qrFile: null,
  infoFile: null,
  qrPreview: null,
  infoPreview: null,
});

export function OrderForMeModule({ userId }: OrderForMeModuleProps) {
  const [profiles, setProfiles] = useState<ShippingProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<ShippingProfile | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [profilesExpanded, setProfilesExpanded] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([newCartItem()]);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [uniqueCode, setUniqueCode] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
    loadOrders();
    supabase.from('user_profiles').select('unique_code').eq('user_id', userId).maybeSingle()
      .then(({ data }) => { if (data?.unique_code) setUniqueCode(data.unique_code); });
  }, []);

  // --- Profiles ---
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

  const startEdit = (p: ShippingProfile) => { setEditingProfile({ ...p }); setIsAddingNew(false); };
  const startAddNew = () => { setEditingProfile({ ...emptyProfile }); setIsAddingNew(true); };
  const cancelEdit = () => { setEditingProfile(null); setIsAddingNew(false); };

  const handlePackagingChange = (value: string) => {
    if (!editingProfile) return;
    const opt = PACKAGING_OPTIONS.find(o => o.label === value);
    setEditingProfile({ ...editingProfile, packaging_type: value, packaging_price: opt?.price || 0 });
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // --- Cart ---
  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addCartItem = () => {
    setCart(prev => [...prev, newCartItem()]);
  };

  const removeCartItem = (id: string) => {
    setCart(prev => {
      const next = prev.filter(item => item.id !== id);
      return next.length === 0 ? [newCartItem()] : next;
    });
  };

  const handleCartFileSelect = (itemId: string, file: File | null, type: 'qr' | 'info') => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'qr') {
      updateCartItem(itemId, { qrFile: file, qrPreview: preview });
    } else {
      updateCartItem(itemId, { infoFile: file, infoPreview: preview });
    }
  };

  // --- Orders ---
  const loadOrders = async () => {
    const { data } = await supabase
      .from('order_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as unknown as OrderRequest[]);
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('order-images').upload(path, file);
    if (error) { console.error('Upload error:', error); return null; }
    const { data } = supabase.storage.from('order-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const submitOrder = async () => {
    const validItems = cart.filter(item => item.product_name.trim());
    if (validItems.length === 0) {
      toast({ title: 'Добавьте хотя бы один товар с названием', variant: 'destructive' });
      return;
    }
    if (!selectedProfile) {
      toast({ title: 'Выберите профиль получателя', variant: 'destructive' });
      return;
    }
    setLoading(true);

    for (const item of validItems) {
      let qrUrl: string | null = null;
      let infoUrl: string | null = null;
      if (item.qrFile) qrUrl = await uploadImage(item.qrFile, 'qr');
      if (item.infoFile) infoUrl = await uploadImage(item.infoFile, 'info');

      const priceCny = parseFloat(item.price_cny) || 0;

      await supabase.from('order_requests').insert({
        user_id: userId,
        recipient_name: selectedProfile.recipient_name,
        recipient_phone: selectedProfile.recipient_phone,
        delivery_type: selectedProfile.delivery_type,
        transport_company: selectedProfile.transport_company || null,
        delivery_address: selectedProfile.delivery_address || null,
        packaging_type: selectedProfile.packaging_type || null,
        packaging_price: selectedProfile.packaging_price || null,
        product_name: item.product_name.trim(),
        product_link: item.product_link.trim() || null,
        price_cny: priceCny,
        qr_image_url: qrUrl,
        info_image_url: infoUrl,
        status: 'pending',
      });
    }

    setLoading(false);
    toast({ title: `Заказ оформлен ✅ (${validItems.length} товаров)` });
    setCart([newCartItem()]);
    loadOrders();
  };

  const deleteOrder = async (id: string) => {
    await supabase.from('order_requests').delete().eq('id', id);
    loadOrders();
  };

  const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'В обработке', payment_link: 'Отправлена ссылка на оплату', paid: 'Оплачено',
    ordered: 'Товар заказан', packed: 'Посылка сформирована', sent_to_moscow: 'Отправлена в Москву',
    arrived_moscow: 'Прибытие в Москву', handed_to_tk: 'Передана в ТК',
    in_transit: 'Едет к вам в город', received: 'Посылка получена', completed: 'Выполнен',
  };

  const totalCny = cart.reduce((sum, item) => sum + (parseFloat(item.price_cny) || 0), 0);
  const activeOrders = orders.filter(o => o.status !== 'received' && o.status !== 'completed');
  const doneOrders = orders.filter(o => o.status === 'received' || o.status === 'completed');

  return (
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-accent/30 border border-accent/40 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Закажите мне</h1>
          </div>
          {uniqueCode && (
            <div className="bg-card border border-border rounded-xl px-3 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Мой код</p>
              <p className="font-mono font-bold text-primary text-sm">{uniqueCode}</p>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          🛒 Этот модуль для тех, кому нужна помощь в оформлении заказа и доставки.
          Добавьте все товары, заполните данные — мы оформим всё за вас!
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
            Данные получателя
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
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {selectedProfileId === p.id && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium mr-1 self-start">
                        Выбран
                      </span>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEdit(p); }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteProfile(p.id!); }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {!editingProfile && (
              <Button variant="outline" onClick={startAddNew} className="w-full">
                <Plus size={16} className="mr-2" /> Добавить адрес доставки
              </Button>
            )}

            {editingProfile && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-4 border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ФИО получателя</Label>
                    <Input value={editingProfile.recipient_name} onChange={e => setEditingProfile({ ...editingProfile, recipient_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Телефон</Label>
                    <Input value={editingProfile.recipient_phone} onChange={e => setEditingProfile({ ...editingProfile, recipient_phone: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Тип доставки</Label>
                  <RadioGroup
                    value={editingProfile.delivery_type}
                    onValueChange={v => setEditingProfile({ ...editingProfile, delivery_type: v as 'pickup' | 'redirect' })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2"><RadioGroupItem value="pickup" id="ep-pickup" /><Label htmlFor="ep-pickup">Самовывоз</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="redirect" id="ep-redirect" /><Label htmlFor="ep-redirect">Переадресовка</Label></div>
                  </RadioGroup>
                </div>

                {editingProfile.delivery_type === 'redirect' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Транспортная компания</Label>
                      <Select value={editingProfile.transport_company} onValueChange={v => setEditingProfile({ ...editingProfile, transport_company: v })}>
                        <SelectTrigger><SelectValue placeholder="Выберите ТК" /></SelectTrigger>
                        <SelectContent>{TRANSPORT_COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Адрес получения</Label>
                      <Input value={editingProfile.delivery_address} onChange={e => setEditingProfile({ ...editingProfile, delivery_address: e.target.value })} placeholder="город, улица, дом" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Тип упаковки</Label>
                      <Select value={editingProfile.packaging_type} onValueChange={handlePackagingChange}>
                        <SelectTrigger><SelectValue placeholder="Выберите упаковку" /></SelectTrigger>
                        <SelectContent>{PACKAGING_OPTIONS.map(o => <SelectItem key={o.label} value={o.label}>{o.label} — {o.price}$</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => saveProfile(editingProfile)} disabled={loading} className="flex-1">
                    <Save size={16} className="mr-2" /> Сохранить
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}><X size={16} /></Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart — add multiple items */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            Корзина товаров
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {cart.length}
            </span>
          </h2>
        </div>

        <div className="space-y-4">
          {cart.map((item, idx) => (
            <CartItemCard
              key={item.id}
              item={item}
              index={idx}
              total={cart.length}
              onUpdate={(updates) => updateCartItem(item.id, updates)}
              onRemove={() => removeCartItem(item.id)}
              onFileSelect={(file, type) => handleCartFileSelect(item.id, file, type)}
            />
          ))}
        </div>

        <Button onClick={addCartItem} variant="outline" className="w-full border-primary text-primary bg-primary/10 hover:bg-primary/20 font-bold" size="lg">
          <Plus size={18} className="mr-2" /> Добавить ещё товар в корзину
        </Button>

        {totalCny > 0 && (
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-sm text-muted-foreground">Общая сумма:</p>
            <p className="text-xl font-bold text-foreground">¥{totalCny.toFixed(2)}</p>
          </div>
        )}

        <div className="border-t border-border pt-4 mt-2 space-y-2">
          {selectedProfile ? (
            <p className="text-xs text-muted-foreground text-center">
              Получатель: <strong className="text-foreground">{selectedProfile.recipient_name}</strong>
            </p>
          ) : (
            <p className="text-xs text-destructive text-center">⚠️ Выберите профиль получателя выше</p>
          )}

          <Button onClick={submitOrder} disabled={loading || !selectedProfile} className="w-full font-bold" size="lg">
            <Send size={18} className="mr-2" />
            Оформить заказ ({cart.filter(i => i.product_name.trim()).length} товаров)
          </Button>
        </div>
      </div>

      {/* Pending orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">📋 Мои заказы ({activeOrders.length})</h2>
          {activeOrders.map(order => (
            <OrderCard key={order.id} order={order} onDelete={deleteOrder} statusLabels={ORDER_STATUS_LABELS} />
          ))}
        </div>
      )}

      {doneOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Check size={20} className="text-primary" />
            Выполненные ({doneOrders.length})
          </h2>
          {doneOrders.map(order => (
            <OrderCard key={order.id} order={order} onDelete={deleteOrder} completed statusLabels={ORDER_STATUS_LABELS} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Cart item card ---
function CartItemCard({
  item, index, total, onUpdate, onRemove, onFileSelect,
}: {
  item: CartItem;
  index: number;
  total: number;
  onUpdate: (updates: Partial<CartItem>) => void;
  onRemove: () => void;
  onFileSelect: (file: File | null, type: 'qr' | 'info') => void;
}) {
  const qrRef = useRef<HTMLInputElement>(null);
  const infoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-muted/20 rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Товар #{index + 1}</span>
        {total > 1 && (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Название товара *</Label>
        <Input value={item.product_name} onChange={e => onUpdate({ product_name: e.target.value })} placeholder="Например: Кроссовки Nike Air Max" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Ссылка на товар</Label>
          <div className="relative">
            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={item.product_link} onChange={e => onUpdate({ product_link: e.target.value })} placeholder="https://..." className="pl-8" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Стоимость (¥ юань)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.price_cny}
            onChange={e => onUpdate({ price_cny: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* QR */}
        <div className="space-y-1">
          <Label className="text-xs">QR-код</Label>
          <input ref={qrRef} type="file" accept="image/*" className="hidden"
            onChange={e => onFileSelect(e.target.files?.[0] || null, 'qr')} />
          {item.qrPreview ? (
            <div className="relative w-full aspect-square max-w-[120px] rounded-lg overflow-hidden border border-border">
              <img src={item.qrPreview} alt="QR" className="w-full h-full object-cover" />
              <button onClick={() => onUpdate({ qrFile: null, qrPreview: null })}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <X size={10} />
              </button>
            </div>
          ) : (
            <button onClick={() => qrRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
              <Upload size={18} />
              <span className="text-xs">Загрузить</span>
            </button>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1">
          <Label className="text-xs">Инфо о товаре</Label>
          <input ref={infoRef} type="file" accept="image/*" className="hidden"
            onChange={e => onFileSelect(e.target.files?.[0] || null, 'info')} />
          {item.infoPreview ? (
            <div className="relative w-full aspect-square max-w-[120px] rounded-lg overflow-hidden border border-border">
              <img src={item.infoPreview} alt="Info" className="w-full h-full object-cover" />
              <button onClick={() => onUpdate({ infoFile: null, infoPreview: null })}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <X size={10} />
              </button>
            </div>
          ) : (
            <button onClick={() => infoRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
              <Image size={18} />
              <span className="text-xs">Загрузить</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Order card ---
function OrderCard({ order, onDelete, completed, statusLabels }: { order: OrderRequest; onDelete: (id: string) => void; completed?: boolean; statusLabels: Record<string, string> }) {
  const statusColorMap: Record<string, string> = {
    pending: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    payment_link: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    paid: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    ordered: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
    packed: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
    sent_to_moscow: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    arrived_moscow: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    handed_to_tk: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    in_transit: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    received: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  };

  return (
    <div className={`bg-card rounded-xl border border-border p-4 space-y-2 ${completed ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{order.product_name}</p>
          {order.price_cny != null && order.price_cny > 0 && (
            <p className="text-xs font-medium text-primary">¥{order.price_cny}</p>
          )}
          {order.product_link && (
            <a href={order.product_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">
              {order.product_link}
            </a>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(order.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColorMap[order.status] || 'bg-muted text-muted-foreground'}`}>
            {statusLabels[order.status] || order.status}
          </span>
          {!completed && order.status === 'pending' && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(order.id)}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
      {(order.qr_image_url || order.info_image_url) && (
        <div className="flex gap-2">
          {order.qr_image_url && (
            <a href={order.qr_image_url} target="_blank" rel="noopener noreferrer">
              <img src={order.qr_image_url} alt="QR" className="w-16 h-16 rounded-lg object-cover border border-border" />
            </a>
          )}
          {order.info_image_url && (
            <a href={order.info_image_url} target="_blank" rel="noopener noreferrer">
              <img src={order.info_image_url} alt="Info" className="w-16 h-16 rounded-lg object-cover border border-border" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
