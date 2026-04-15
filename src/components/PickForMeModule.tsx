import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Trash2, ExternalLink, ShoppingCart, ChevronLeft, Image as ImageIcon,
  Palette, Ruler, Hash, X, ChevronDown, ChevronUp, Edit2, Save, Check, User
} from 'lucide-react';
import { toast } from 'sonner';

const TRANSPORT_COMPANIES = [
  'Желдорэкспедиция', 'Мейджик транс', 'Байкал сервис', 'Деловые Линии',
  'Мега транс', 'ПЭК', 'КСЭ', 'СДЭК', 'Кит', 'Энергия', 'Возовоз',
  'Виктория', 'Азбука логистики', 'Байт транзит', 'Салют',
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

interface PickRequest {
  id: string;
  product_link: string;
  price_rub: number;
  image_url: string | null;
  color: string;
  size: string;
  quantity: number;
  status: string;
  created_at: string;
  batch_id?: string | null;
  recipient_name?: string;
  recipient_phone?: string;
  delivery_type?: string;
}

interface CartItem {
  link: string;
  priceRub: string;
  color: string;
  size: string;
  quantity: string;
  imageFile: File | null;
  imagePreview: string | null;
}

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

const emptyItem = (): CartItem => ({ link: '', priceRub: '', color: '', size: '', quantity: '1', imageFile: null, imagePreview: null });

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'В обработке', color: 'bg-orange-500/10 text-orange-600' },
  found: { label: 'Подобран', color: 'bg-blue-500/10 text-blue-600' },
  approved: { label: 'Подтверждён', color: 'bg-emerald-500/10 text-emerald-600' },
  rejected: { label: 'Отклонён', color: 'bg-red-500/10 text-red-600' },
  ordered: { label: 'Заказан', color: 'bg-cyan-500/10 text-cyan-600' },
  completed: { label: 'Завершён', color: 'bg-green-500/10 text-green-600' },
};

interface Props {
  userId: string;
}

export function PickForMeModule({ userId }: Props) {
  const [requests, setRequests] = useState<PickRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);

  // Shipping profiles
  const [profiles, setProfiles] = useState<ShippingProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<ShippingProfile | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [profilesExpanded, setProfilesExpanded] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pick_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setRequests((data as PickRequest[]) || []);
    setLoading(false);
  };

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

  useEffect(() => { load(); loadProfiles(); }, [userId]);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  const saveProfile = async (profile: ShippingProfile) => {
    if (!profile.recipient_name.trim() || !profile.recipient_phone.trim()) {
      toast.error('Заполните ФИО и телефон');
      return;
    }
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
    toast.success('Данные сохранены ✅');
    setEditingProfile(null);
    setIsAddingNew(false);
    await loadProfiles();
  };

  const deleteProfile = async (id: string) => {
    await supabase.from('shipping_profiles').delete().eq('id', id);
    if (selectedProfileId === id) setSelectedProfileId(null);
    toast.success('Профиль удалён');
    await loadProfiles();
  };

  const handlePackagingChange = (value: string) => {
    if (!editingProfile) return;
    const opt = PACKAGING_OPTIONS.find(o => o.label === value);
    setEditingProfile({ ...editingProfile, packaging_type: value, packaging_price: opt?.price || 0 });
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCart(prev => prev.map((item, i) => i === index ? { ...item, imageFile: file, imagePreview: reader.result as string } : item));
    };
    reader.readAsDataURL(file);
  };

  const removeCartItem = (index: number) => {
    if (cart.length <= 1) return;
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/pick/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from('order-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        console.error('Storage upload error:', error);
        toast.error('Не удалось загрузить фото: ' + error.message);
        return null;
      }
      const { data } = supabase.storage.from('order-images').getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error('Upload exception:', err);
      toast.error('Ошибка при загрузке фото');
      return null;
    }
  };

  const handleSubmit = async () => {
    const validItems = cart.filter(item => item.link.trim());
    if (validItems.length === 0) { toast.error('Добавьте хотя бы один товар со ссылкой'); return; }
    if (!selectedProfile) { toast.error('Выберите профиль получателя'); return; }
    setSubmitting(true);

    const batchId = crypto.randomUUID();
    const rows = [];

    for (const item of validItems) {
      let imageUrl: string | null = null;
      if (item.imageFile) imageUrl = await uploadImage(item.imageFile);
      rows.push({
        user_id: userId,
        product_link: item.link.trim(),
        price_rub: parseFloat(item.priceRub) || 0,
        image_url: imageUrl,
        color: item.color.trim(),
        size: item.size.trim(),
        quantity: parseInt(item.quantity) || 1,
        batch_id: batchId,
        recipient_name: selectedProfile.recipient_name,
        recipient_phone: selectedProfile.recipient_phone,
        delivery_type: selectedProfile.delivery_type,
        transport_company: selectedProfile.transport_company || null,
        delivery_address: selectedProfile.delivery_address || null,
        packaging_type: selectedProfile.packaging_type || null,
        packaging_price: selectedProfile.packaging_price || null,
      });
    }

    const { error } = await supabase.from('pick_requests').insert(rows);
    if (error) { toast.error('Ошибка при отправке'); setSubmitting(false); return; }

    toast.success(`Заявка на ${rows.length} товар(ов) отправлена!`);
    setCart([emptyItem()]);
    setShowForm(false);
    load();
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('pick_requests').delete().eq('id', id);
    setRequests(prev => prev.filter(r => r.id !== id));
    toast.success('Удалено');
  };

  const deleteBatch = async (batchId: string) => {
    const batchItems = requests.filter(r => r.batch_id === batchId && r.status === 'pending');
    if (batchItems.length === 0) return;
    for (const item of batchItems) {
      await supabase.from('pick_requests').delete().eq('id', item.id);
    }
    setRequests(prev => prev.filter(r => r.batch_id !== batchId));
    toast.success('Заявка удалена');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const grouped = requests.reduce<Record<string, PickRequest[]>>((acc, r) => {
    const key = r.batch_id || r.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // --- Profile editing form ---
  const renderProfileForm = (profile: ShippingProfile) => (
    <div className="space-y-3 bg-muted/30 rounded-xl p-4 border border-border">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">ФИО получателя *</Label>
          <Input value={profile.recipient_name} onChange={e => setEditingProfile({ ...profile, recipient_name: e.target.value })} placeholder="Иванов Иван Иванович" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Телефон *</Label>
          <Input value={profile.recipient_phone} onChange={e => setEditingProfile({ ...profile, recipient_phone: e.target.value })} placeholder="+7 999 123-45-67" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Тип доставки</Label>
        <RadioGroup value={profile.delivery_type} onValueChange={v => setEditingProfile({ ...profile, delivery_type: v as 'pickup' | 'redirect' })}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="pickup" id="pick-pickup" /><Label htmlFor="pick-pickup" className="text-xs">Самовывоз</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="redirect" id="pick-redirect" /><Label htmlFor="pick-redirect" className="text-xs">Переадресация</Label></div>
          </div>
        </RadioGroup>
      </div>
      {profile.delivery_type === 'redirect' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Транспортная компания</Label>
            <Select value={profile.transport_company} onValueChange={v => setEditingProfile({ ...profile, transport_company: v })}>
              <SelectTrigger><SelectValue placeholder="Выберите ТК" /></SelectTrigger>
              <SelectContent>{TRANSPORT_COMPANIES.map(tc => <SelectItem key={tc} value={tc}>{tc}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Адрес доставки</Label>
            <Input value={profile.delivery_address} onChange={e => setEditingProfile({ ...profile, delivery_address: e.target.value })} placeholder="Город, улица, дом..." />
          </div>
        </>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => saveProfile(profile)}><Save size={14} className="mr-1" /> Сохранить</Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditingProfile(null); setIsAddingNew(false); }}><X size={14} className="mr-1" /> Отмена</Button>
      </div>
    </div>
  );

  if (showForm) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6 animate-fade-in-up">
        <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} /> Назад
        </button>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Новая заявка на подбор</h2>
            <Badge variant="secondary" className="text-sm">{cart.length} товар(ов)</Badge>
          </div>

          {/* Shipping profile section */}
          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <button
              onClick={() => setProfilesExpanded(!profilesExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User size={15} className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Данные получателя</span>
              </div>
              {profilesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {profilesExpanded && (
              <div className="p-4 space-y-3">
                {profiles.length > 0 && (
                  <div className="space-y-2">
                    {profiles.map(p => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedProfileId === p.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}
                        onClick={() => setSelectedProfileId(p.id!)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.recipient_name}</p>
                          <p className="text-xs text-muted-foreground">{p.recipient_phone} · {p.delivery_type === 'pickup' ? 'Самовывоз' : p.transport_company || 'Переадресация'}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {selectedProfileId === p.id && <Check size={14} className="text-primary" />}
                          <button onClick={e => { e.stopPropagation(); setEditingProfile({ ...p }); setIsAddingNew(false); }} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                          <button onClick={e => { e.stopPropagation(); deleteProfile(p.id!); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {editingProfile && !isAddingNew && renderProfileForm(editingProfile)}
                {isAddingNew && editingProfile && renderProfileForm(editingProfile)}
                {!editingProfile && (
                  <Button variant="outline" size="sm" onClick={() => { setEditingProfile({ ...emptyProfile }); setIsAddingNew(true); }} className="w-full">
                    <Plus size={14} className="mr-1" /> Добавить получателя
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Cart items */}
          {cart.map((item, idx) => (
            <div key={idx} className="bg-card rounded-2xl p-5 border border-border shadow-soft space-y-4 relative">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">Товар {idx + 1}</p>
                {cart.length > 1 && (
                  <button onClick={() => removeCartItem(idx)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ссылка на товар *</label>
                <Input value={item.link} onChange={e => updateCartItem(idx, 'link', e.target.value)} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Стоимость (₽)</label>
                <Input type="number" value={item.priceRub} onChange={e => updateCartItem(idx, 'priceRub', e.target.value)} placeholder="0" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1"><Palette size={12} /> Цвет</label>
                  <Input value={item.color} onChange={e => updateCartItem(idx, 'color', e.target.value)} placeholder="Красный" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1"><Ruler size={12} /> Размер</label>
                  <Input value={item.size} onChange={e => updateCartItem(idx, 'size', e.target.value)} placeholder="M / 42" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1"><Hash size={12} /> Кол-во</label>
                  <Input type="number" min="1" value={item.quantity} onChange={e => updateCartItem(idx, 'quantity', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`pick-image-${idx}`} className="text-xs font-medium text-foreground flex items-center gap-1"><ImageIcon size={12} /> Скриншот</Label>
                <label
                  htmlFor={`pick-image-${idx}`}
                  className="flex items-center justify-center border-2 border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {item.imagePreview ? (
                    <img src={item.imagePreview} alt="Preview" className="max-h-24 rounded-lg object-contain" />
                  ) : (
                    <p className="text-xs text-muted-foreground">Нажмите для загрузки</p>
                  )}
                </label>
                <input id={`pick-image-${idx}`} type="file" accept="image/*" className="sr-only" onChange={e => handleImageChange(idx, e)} />
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={() => setCart(prev => [...prev, emptyItem()])} className="w-full">
            <Plus size={16} className="mr-1.5" /> Добавить ещё товар
          </Button>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Отправка...' : `Отправить заявку (${cart.filter(i => i.link.trim()).length} товар(ов))`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Подберите мне</h1>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus size={16} className="mr-1.5" /> Новая заявка
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">У вас пока нет заявок на подбор</p>
          <Button onClick={() => setShowForm(true)} variant="outline">Создать первую заявку</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([batchKey, items]) => {
            const allPending = items.every(i => i.status === 'pending');
            const first = items[0];
            return (
              <div key={batchKey} className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={15} className="text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Заявка · {items.length} товар(ов)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDate(items[0].created_at)}</span>
                    <button onClick={() => deleteBatch(batchKey)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {first.recipient_name && (
                  <div className="px-4 py-2 bg-muted/10 border-b border-border text-xs text-muted-foreground flex items-center gap-2">
                    <User size={12} />
                    <span>{first.recipient_name} · {first.recipient_phone}</span>
                    {first.delivery_type === 'redirect' && <span>· Переадресация</span>}
                  </div>
                )}
                <div className="divide-y divide-border">
                  {items.map(r => {
                    const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
                    return (
                      <div key={r.id} className="flex items-start gap-3 p-4">
                        {r.image_url && (
                          <img src={r.image_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <a href={r.product_link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline truncate flex items-center gap-1">
                              <ExternalLink size={13} /> Ссылка
                            </a>
                            <Badge className={`${st.color} text-[11px] shrink-0`}>{st.label}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {r.price_rub > 0 && <span>₽{r.price_rub}</span>}
                            {r.color && <span className="flex items-center gap-0.5"><Palette size={10} /> {r.color}</span>}
                            {r.size && <span className="flex items-center gap-0.5"><Ruler size={10} /> {r.size}</span>}
                            <span className="flex items-center gap-0.5"><Hash size={10} /> {r.quantity} шт</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
