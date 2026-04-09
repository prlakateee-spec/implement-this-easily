import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Trash2, ExternalLink, ShoppingCart, ChevronLeft, Image as ImageIcon, Palette, Ruler, Hash
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
}

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

  const [link, setLink] = useState('');
  const [priceRub, setPriceRub] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `pick/${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('order-images').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('order-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!link.trim()) { toast.error('Укажите ссылку на товар'); return; }
    setSubmitting(true);
    let imageUrl: string | null = null;
    if (imageFile) imageUrl = await uploadImage(imageFile);

    const { error } = await supabase.from('pick_requests').insert({
      user_id: userId,
      product_link: link.trim(),
      price_rub: parseFloat(priceRub) || 0,
      image_url: imageUrl,
      color: color.trim(),
      size: size.trim(),
      quantity: parseInt(quantity) || 1,
    });

    if (error) { toast.error('Ошибка при отправке'); setSubmitting(false); return; }
    toast.success('Заявка отправлена!');
    setLink(''); setPriceRub(''); setColor(''); setSize(''); setQuantity('1');
    setImageFile(null); setImagePreview(null); setShowForm(false);
    load();
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('pick_requests').delete().eq('id', id);
    setRequests(prev => prev.filter(r => r.id !== id));
    toast.success('Заявка удалена');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (showForm) {
    return (
      <div className="p-6 lg:p-10 space-y-6 animate-fade-in-up">
        <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} /> Назад
        </button>
        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft space-y-5">
          <h2 className="text-xl font-bold text-foreground">Новая заявка на подбор</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Ссылка на товар *</label>
            <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Стоимость (₽)</label>
            <Input type="number" value={priceRub} onChange={e => setPriceRub(e.target.value)} placeholder="0" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Palette size={14} /> Цвет</label>
              <Input value={color} onChange={e => setColor(e.target.value)} placeholder="Красный" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Ruler size={14} /> Размер</label>
              <Input value={size} onChange={e => setSize(e.target.value)} placeholder="M / 42 / ..." />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Hash size={14} /> Количество</label>
            <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><ImageIcon size={14} /> Скриншот товара</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нажмите для загрузки</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Отправка...' : 'Отправить заявку'}
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
      ) : requests.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">У вас пока нет заявок на подбор</p>
          <Button onClick={() => setShowForm(true)} variant="outline">Создать первую заявку</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
            return (
              <div key={r.id} className="bg-card rounded-2xl p-4 border border-border shadow-soft">
                <div className="flex items-start gap-3">
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-border shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <a href={r.product_link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline truncate flex items-center gap-1">
                        <ExternalLink size={13} /> Ссылка на товар
                      </a>
                      <Badge className={`${st.color} text-[11px] shrink-0`}>{st.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      {r.price_rub > 0 && <span>₽{r.price_rub}</span>}
                      {r.color && <span className="flex items-center gap-0.5"><Palette size={11} /> {r.color}</span>}
                      {r.size && <span className="flex items-center gap-0.5"><Ruler size={11} /> {r.size}</span>}
                      <span className="flex items-center gap-0.5"><Hash size={11} /> {r.quantity} шт</span>
                      <span>{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
