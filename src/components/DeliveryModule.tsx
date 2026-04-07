import { useState, useEffect } from 'react';
import { Package, Truck, Plus, Save, Send, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TRANSPORT_COMPANIES = [
  'Желдорэкспедиция',
  'Мейджик транс',
  'Байкал сервис',
  'Деловые Линии',
  'Мега транс',
  'ПЭК',
  'КСЭ',
  'СДЭК',
  'Кит',
  'Энергия',
  'Возовоз',
  'Виктория',
  'Азбука логистики',
  'Байт транзит',
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

interface DeliveryForm {
  product_name: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_type: 'pickup' | 'redirect';
  transport_company: string;
  delivery_address: string;
  packaging_type: string;
  packaging_price: number;
}

const emptyForm: DeliveryForm = {
  product_name: '',
  tracking_number: '',
  recipient_name: '',
  recipient_phone: '',
  delivery_type: 'pickup',
  transport_company: '',
  delivery_address: '',
  packaging_type: '',
  packaging_price: 0,
};

interface SavedDelivery extends DeliveryForm {
  id: string;
  status: string;
  created_at: string;
}

interface DeliveryModuleProps {
  userId: string;
}

export function DeliveryModule({ userId }: DeliveryModuleProps) {
  const [form, setForm] = useState<DeliveryForm>({ ...emptyForm });
  const [saved, setSaved] = useState<SavedDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setSaved(data as unknown as SavedDelivery[]);
  };

  const handlePackagingChange = (value: string) => {
    const opt = PACKAGING_OPTIONS.find(o => o.label === value);
    setForm(f => ({ ...f, packaging_type: value, packaging_price: opt?.price || 0 }));
  };

  const handleSave = async () => {
    if (!form.product_name.trim() || !form.recipient_name.trim() || !form.recipient_phone.trim()) {
      toast({ title: 'Заполните обязательные поля', description: 'Название товара, ФИО и телефон обязательны', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('deliveries').insert({
      user_id: userId,
      product_name: form.product_name.trim(),
      tracking_number: form.tracking_number.trim() || null,
      recipient_name: form.recipient_name.trim(),
      recipient_phone: form.recipient_phone.trim(),
      is_redirect: form.delivery_type === 'redirect',
      transport_company: form.transport_company || null,
      delivery_address: form.delivery_address.trim() || null,
      packaging_type: form.packaging_type || null,
      packaging_price: form.packaging_price || null,
      status: 'draft',
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Сохранено ✅' });
      setForm({ ...emptyForm });
      loadDeliveries();
    }
  };

  const handleSend = async (id: string) => {
    await supabase.from('deliveries').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', id);
    toast({ title: 'Посылка отправлена 🚀' });
    loadDeliveries();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('deliveries').delete().eq('id', id);
    toast({ title: 'Удалено' });
    loadDeliveries();
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in-up max-w-3xl mx-auto">
      {/* Header info */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Доставка</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          📦 <strong>Куда отправить посылку:</strong> Склад консолидации в Китае.
          Адрес и контакты склада будут предоставлены после оформления заявки.
          Заполните форму ниже, чтобы оформить отправку вашего товара.
        </p>
      </div>

      {/* Form */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border space-y-5">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Plus size={20} className="text-primary" />
          Новая посылка
        </h2>

        <div className="grid gap-4">
          {/* Product + tracking */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Название товара *</Label>
              <Input
                value={form.product_name}
                onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                placeholder="Например: Кроссовки Nike"
              />
            </div>
            <div className="space-y-2">
              <Label>Трек-номер</Label>
              <Input
                value={form.tracking_number}
                onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))}
                placeholder="Введите трек-номер"
              />
            </div>
          </div>

          {/* Recipient */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ФИО получателя *</Label>
              <Input
                value={form.recipient_name}
                onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className="space-y-2">
              <Label>Номер телефона *</Label>
              <Input
                value={form.recipient_phone}
                onChange={e => setForm(f => ({ ...f, recipient_phone: e.target.value }))}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>

          {/* Delivery type: Самовывоз / Переадресовка */}
          <div className="space-y-2">
            <Label>Способ получения</Label>
            <RadioGroup
              value={form.delivery_type}
              onValueChange={(v) => setForm(f => ({ ...f, delivery_type: v as 'pickup' | 'redirect' }))}
              className="flex gap-4"
            >
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

          {/* Conditional fields for redirect */}
          {form.delivery_type === 'redirect' && (
            <div className="grid gap-4 pl-1 border-l-2 border-primary/30 ml-2">
              {/* Transport company */}
              <div className="space-y-2 pl-4">
                <Label>Транспортная компания</Label>
                <Select value={form.transport_company} onValueChange={v => setForm(f => ({ ...f, transport_company: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите ТК" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSPORT_COMPANIES.map(tc => (
                      <SelectItem key={tc} value={tc}>{tc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Address */}
              <div className="space-y-2 pl-4">
                <Label>Адрес получения</Label>
                <Input
                  value={form.delivery_address}
                  onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
                  placeholder="Домашний адрес в формате: город, улица, дом"
                  className="placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Packaging */}
              <div className="space-y-2 pl-4">
                <Label>Тип упаковки</Label>
                <Select value={form.packaging_type} onValueChange={handlePackagingChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите упаковку" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGING_OPTIONS.map(opt => (
                      <SelectItem key={opt.label} value={opt.label}>
                        {opt.label} — {opt.price}$
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.packaging_type && (
                  <p className="text-sm text-primary font-medium">
                    Стоимость упаковки: {form.packaging_price}$
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full font-bold">
          <Save size={18} className="mr-2" />
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>

      {/* Saved deliveries */}
      {saved.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Package size={20} className="text-primary" />
            Мои посылки ({saved.length})
          </h2>
          {saved.map(d => (
            <div key={d.id} className="bg-card rounded-2xl p-5 shadow-soft border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground truncate">{d.product_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      d.status === 'sent' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {d.status === 'sent' ? 'Отправлено' : 'Черновик'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    {d.tracking_number && <p>Трек: <span className="text-foreground font-mono">{d.tracking_number}</span></p>}
                    <p>{d.recipient_name} • {d.recipient_phone}</p>
                    {d.transport_company && <p>ТК: {d.transport_company}</p>}
                    {d.packaging_type && <p>Упаковка: {d.packaging_type} ({d.packaging_price}$)</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {d.status === 'draft' && (
                    <Button size="sm" onClick={() => handleSend(d.id)} className="font-medium">
                      <Send size={14} className="mr-1" />
                      Отправить
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id)} className="text-destructive hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
