import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Plus, Trash2, Send, Upload, Image, Link2, ChevronDown, ChevronUp, Edit2, Check, X, Save } from 'lucide-react';
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

interface OrderRequest {
  id: string;
  product_name: string;
  product_link: string | null;
  qr_image_url: string | null;
  info_image_url: string | null;
  status: string;
  created_at: string;
}

interface OrderForMeModuleProps {
  userId: string;
}

export function OrderForMeModule({ userId }: OrderForMeModuleProps) {
  const [profiles, setProfiles] = useState<ShippingProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<ShippingProfile | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [profilesExpanded, setProfilesExpanded] = useState(true);

  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [productName, setProductName] = useState('');
  const [productLink, setProductLink] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [infoFile, setInfoFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [infoPreview, setInfoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const qrInputRef = useRef<HTMLInputElement>(null);
  const infoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
    loadOrders();
  }, []);

  // --- Profiles (reuse from shipping_profiles) ---
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

  // --- Orders ---
  const loadOrders = async () => {
    const { data } = await supabase
      .from('order_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as unknown as OrderRequest[]);
  };

  const handleFileSelect = (file: File | null, type: 'qr' | 'info') => {
    if (!file) return;
    if (type === 'qr') {
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    } else {
      setInfoFile(file);
      setInfoPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('order-images').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data } = supabase.storage.from('order-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const submitOrder = async () => {
    if (!productName.trim()) {
      toast({ title: 'Введите название товара', variant: 'destructive' });
      return;
    }
    if (!selectedProfile) {
      toast({ title: 'Выберите профиль отправки', variant: 'destructive' });
      return;
    }
    setLoading(true);

    let qrUrl: string | null = null;
    let infoUrl: string | null = null;

    if (qrFile) qrUrl = await uploadImage(qrFile, 'qr');
    if (infoFile) infoUrl = await uploadImage(infoFile, 'info');

    const { error } = await supabase.from('order_requests').insert({
      user_id: userId,
      recipient_name: selectedProfile.recipient_name,
      recipient_phone: selectedProfile.recipient_phone,
      delivery_type: selectedProfile.delivery_type,
      transport_company: selectedProfile.transport_company || null,
      delivery_address: selectedProfile.delivery_address || null,
      packaging_type: selectedProfile.packaging_type || null,
      packaging_price: selectedProfile.packaging_price || null,
      product_name: productName.trim(),
      product_link: productLink.trim() || null,
      qr_image_url: qrUrl,
      info_image_url: infoUrl,
      status: 'pending',
    });

    setLoading(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Заказ оформлен ✅' });
      setProductName('');
      setProductLink('');
      setQrFile(null);
      setInfoFile(null);
      setQrPreview(null);
      setInfoPreview(null);
      loadOrders();
    }
  };

  const deleteOrder = async (id: string) => {
    await supabase.from('order_requests').delete().eq('id', id);
    loadOrders();
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status !== 'pending');

  return (
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-accent/30 border border-accent/40 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Закажите мне</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          🛒 Этот модуль для тех, кому нужна помощь в оформлении заказа и доставки.
          Заполните данные, добавьте товар со ссылкой и фото — мы оформим всё за вас!
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

      {/* Order form */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShoppingBag size={20} className="text-primary" />
          Оформить заказ
        </h2>

        <div className="space-y-1">
          <Label className="text-xs">Название товара *</Label>
          <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Например: Кроссовки Nike Air Max" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Ссылка на товар</Label>
          <div className="relative">
            <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={productLink} onChange={e => setProductLink(e.target.value)} placeholder="https://..." className="pl-9" />
          </div>
        </div>

        {/* QR image upload */}
        <div className="space-y-2">
          <Label className="text-xs">Скриншот QR-кода товара</Label>
          <input
            ref={qrInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0] || null, 'qr')}
          />
          {qrPreview ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border">
              <img src={qrPreview} alt="QR" className="w-full h-full object-cover" />
              <button
                onClick={() => { setQrFile(null); setQrPreview(null); }}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => qrInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Upload size={24} />
              <span className="text-sm">Нажмите для загрузки фото</span>
            </button>
          )}
        </div>

        {/* Info image upload */}
        <div className="space-y-2">
          <Label className="text-xs">Скриншот с информацией по товару</Label>
          <input
            ref={infoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0] || null, 'info')}
          />
          {infoPreview ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border">
              <img src={infoPreview} alt="Info" className="w-full h-full object-cover" />
              <button
                onClick={() => { setInfoFile(null); setInfoPreview(null); }}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => infoInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Image size={24} />
              <span className="text-sm">Нажмите для загрузки фото</span>
            </button>
          )}
        </div>

        {selectedProfile ? (
          <p className="text-xs text-muted-foreground text-center">
            Получатель: <strong className="text-foreground">{selectedProfile.recipient_name}</strong>
          </p>
        ) : (
          <p className="text-xs text-destructive text-center">⚠️ Выберите профиль получателя выше</p>
        )}

        <Button onClick={submitOrder} disabled={loading || !selectedProfile} className="w-full font-bold" size="lg">
          <Send size={18} className="mr-2" />
          Оформить заказ
        </Button>
      </div>

      {/* Pending orders */}
      {pendingOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">📋 Мои заказы ({pendingOrders.length})</h2>
          {pendingOrders.map(order => (
            <OrderCard key={order.id} order={order} onDelete={deleteOrder} />
          ))}
        </div>
      )}

      {/* Completed */}
      {completedOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Check size={20} className="text-green-500" />
            Выполненные ({completedOrders.length})
          </h2>
          {completedOrders.map(order => (
            <OrderCard key={order.id} order={order} onDelete={deleteOrder} completed />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onDelete, completed }: { order: OrderRequest; onDelete: (id: string) => void; completed?: boolean }) {
  return (
    <div className={`bg-card rounded-xl border border-border p-4 space-y-2 ${completed ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{order.product_name}</p>
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
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            completed
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          }`}>
            {completed ? 'Выполнен' : 'В обработке'}
          </span>
          {!completed && (
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
