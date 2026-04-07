import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Truck, ShoppingBag, Package, User, Phone, MapPin, Calendar, ExternalLink, Image } from 'lucide-react';

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
  username?: string;
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
  username?: string;
}

type Tab = 'deliveries' | 'orders';

export function AdminRequests() {
  const [tab, setTab] = useState<Tab>('deliveries');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  const loadProfiles = async () => {
    const { data } = await supabase.from('user_profiles').select('user_id, username, display_name');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((p) => {
        if (p.user_id) map[p.user_id] = p.display_name || p.username;
      });
      setProfiles(map);
    }
  };

  const loadDeliveries = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .in('status', ['sent', 'warehouse'])
      .order('created_at', { ascending: false });
    if (data) setDeliveries(data);
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from('order_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadProfiles(), loadDeliveries(), loadOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      sent: 'bg-blue-500/10 text-blue-600',
      warehouse: 'bg-yellow-500/10 text-yellow-600',
      pending: 'bg-orange-500/10 text-orange-600',
      completed: 'bg-green-500/10 text-green-600',
    };
    const labels: Record<string, string> = {
      sent: 'Отправлена',
      warehouse: 'На складе',
      pending: 'Ожидает',
      completed: 'Выполнен',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-muted text-muted-foreground'}`}>
        {labels[status] || status}
      </span>
    );
  };

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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            tab === 'deliveries' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck size={16} />
          Посылки ({deliveries.length})
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            tab === 'orders' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingBag size={16} />
          Закажите мне ({orders.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : tab === 'deliveries' ? (
        <div className="space-y-4">
          {deliveries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет заявок на доставку</p>
          ) : (
            deliveries.map((d) => (
              <div key={d.id} className="bg-card rounded-2xl p-5 border border-border shadow-soft space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      👤 {profiles[d.user_id] || 'Неизвестный'}
                    </p>
                    <p className="font-bold text-foreground">{d.product_name}</p>
                  </div>
                  {statusBadge(d.status)}
                </div>

                {d.tracking_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Трек:</span>
                    <span className="font-mono text-foreground">{d.tracking_number}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    <span>{d.recipient_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    <span>{d.recipient_phone}</span>
                  </div>
                  {d.transport_company && (
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-muted-foreground" />
                      <span>{d.transport_company}</span>
                    </div>
                  )}
                  {d.delivery_address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-muted-foreground" />
                      <span>{d.delivery_address}</span>
                    </div>
                  )}
                </div>

                {d.packaging_type && (
                  <p className="text-xs text-muted-foreground">
                    📦 {d.packaging_type} — ${d.packaging_price}
                  </p>
                )}

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} /> {formatDate(d.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет заявок на выкуп</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="bg-card rounded-2xl p-5 border border-border shadow-soft space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      👤 {profiles[o.user_id] || 'Неизвестный'}
                    </p>
                    <p className="font-bold text-foreground">{o.product_name}</p>
                  </div>
                  {statusBadge(o.status)}
                </div>

                {o.price_cny != null && o.price_cny > 0 && (
                  <p className="text-sm font-semibold text-foreground">¥{o.price_cny}</p>
                )}

                {o.product_link && (
                  <a href={o.product_link} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1 hover:underline">
                    <ExternalLink size={14} /> Ссылка на товар
                  </a>
                )}

                <div className="flex gap-3">
                  {o.qr_image_url && (
                    <a href={o.qr_image_url} target="_blank" rel="noopener noreferrer"
                      className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                      <img src={o.qr_image_url} alt="QR" className="w-full h-full object-cover" />
                    </a>
                  )}
                  {o.info_image_url && (
                    <a href={o.info_image_url} target="_blank" rel="noopener noreferrer"
                      className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                      <img src={o.info_image_url} alt="Info" className="w-full h-full object-cover" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    <span>{o.recipient_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    <span>{o.recipient_phone}</span>
                  </div>
                  {o.transport_company && (
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-muted-foreground" />
                      <span>{o.transport_company}</span>
                    </div>
                  )}
                  {o.delivery_address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-muted-foreground" />
                      <span>{o.delivery_address}</span>
                    </div>
                  )}
                </div>

                {o.packaging_type && (
                  <p className="text-xs text-muted-foreground">
                    📦 {o.packaging_type} — ${o.packaging_price}
                  </p>
                )}

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} /> {formatDate(o.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
