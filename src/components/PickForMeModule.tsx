import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Trash2, ExternalLink, ShoppingCart, ChevronLeft, Image as ImageIcon, Palette, Ruler, Hash, X
} from 'lucide-react';
import { toast } from 'sonner';

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

  useEffect(() => { load(); }, [userId]);

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
    const ext = file.name.split('.').pop();
    const path = `pick/${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage.from('order-images').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('order-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    const validItems = cart.filter(item => item.link.trim());
    if (validItems.length === 0) { toast.error('Добавьте хотя бы один товар со ссылкой'); return; }
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

  // Group requests by batch_id
  const grouped = requests.reduce<Record<string, PickRequest[]>>((acc, r) => {
    const key = r.batch_id || r.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  if (showForm) {
    return (
      <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up">
        <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} /> Назад
        </button>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Новая заявка на подбор</h2>
            <Badge variant="secondary" className="text-sm">{cart.length} товар(ов)</Badge>
          </div>

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

              <div className="grid grid-cols-3 gap-3">
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
                <label className="text-xs font-medium text-foreground flex items-center gap-1"><ImageIcon size={12} /> Скриншот</label>
                <label className="flex items-center justify-center border-2 border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors">
                  {item.imagePreview ? (
                    <img src={item.imagePreview} alt="Preview" className="max-h-24 rounded-lg object-contain" />
                  ) : (
                    <p className="text-xs text-muted-foreground">Нажмите для загрузки</p>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange(idx, e)} />
                </label>
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
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up">
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
            return (
              <div key={batchKey} className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={15} className="text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Заявка · {items.length} товар(ов)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDate(items[0].created_at)}</span>
                    {allPending && (
                      <button onClick={() => deleteBatch(batchKey)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
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
