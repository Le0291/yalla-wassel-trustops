import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, LogOut, X, UserCheck, RefreshCw, BarChart3, Search, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Order, Driver, OrderStatus, Priority } from '../types';

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  WAITING:        { label: 'Waiting',        dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600' },
  ASSIGNED:       { label: 'Assigned',       dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  ACCEPTED:       { label: 'Accepted',       dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
  PICKED_UP:      { label: 'Picked up',      dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  ON_THE_WAY:     { label: 'On the way',     dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
  DELIVERED:      { label: 'Delivered ✓',    dot: 'bg-emerald-500',badge: 'bg-emerald-100 text-emerald-700' },
  ISSUE_REPORTED: { label: 'Problem ⚠️',     dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
};

const DRIVER_STATUS: Record<string, string> = {
  AVAILABLE:   'bg-emerald-100 text-emerald-700',
  ON_DELIVERY: 'bg-blue-100 text-blue-700',
  ON_BREAK:    'bg-amber-100 text-amber-700',
  OFF_DUTY:    'bg-gray-100 text-gray-500',
};
const DRIVER_LABEL: Record<string, string> = {
  AVAILABLE: 'Available', ON_DELIVERY: 'On delivery', ON_BREAK: 'On break', OFF_DUTY: 'Off duty',
};

function greet(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name.split(' ')[0]} 👋`;
}

// ─── Tiny Modal shell ──────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Create order form ─────────────────────────────────────────────────────

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ senderBusiness: '', customerName: '', customerPhone: '', deliveryArea: '', address: '', priority: 'NORMAL', estimatedWindow: '', dispatcherNote: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/orders', form);
      onCreated();
      onClose();
    } catch { setError('Could not create order. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="New order" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Business *</label><input className="input" value={form.senderBusiness} onChange={e => set('senderBusiness', e.target.value)} required placeholder="Pharmacy Reem" /></div>
          <div><label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent ⚡</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Customer name *</label><input className="input" value={form.customerName} onChange={e => set('customerName', e.target.value)} required /></div>
          <div><label className="label">Phone</label><input className="input" value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} placeholder="07x…" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Delivery area *</label><input className="input" value={form.deliveryArea} onChange={e => set('deliveryArea', e.target.value)} required placeholder="Abdoun" /></div>
          <div><label className="label">Time window</label><input className="input" value={form.estimatedWindow} onChange={e => set('estimatedWindow', e.target.value)} placeholder="2 – 4 PM" /></div>
        </div>
        <div><label className="label">Note for driver</label><input className="input" value={form.dispatcherNote} onChange={e => set('dispatcherNote', e.target.value)} placeholder="Any special instructions…" /></div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Creating…' : 'Create order'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Assign driver modal ───────────────────────────────────────────────────

function AssignModal({ order, drivers, onClose, onDone }: { order: Order; drivers: Driver[]; onClose: () => void; onDone: () => void }) {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const available = drivers.filter(d => d.driverStatus === 'AVAILABLE' || d.driverStatus === 'ON_DELIVERY');

  const assign = async () => {
    if (!selected) return;
    setLoading(true);
    try { await api.put(`/orders/${order.id}/assign`, { driverId: selected }); onDone(); onClose(); }
    catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <Modal title={`Assign driver — #${order.orderNumber}`} onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">{order.senderBusiness} → {order.customerName} · {order.deliveryArea}</p>
      <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
        {available.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No available drivers right now</p>}
        {available.map(d => (
          <label key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected === d.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="driver" checked={selected === d.id} onChange={() => setSelected(d.id)} className="accent-indigo-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">{d.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DRIVER_STATUS[d.driverStatus] || ''}`}>{DRIVER_LABEL[d.driverStatus]}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{d.zone} · {d.activeOrders} active orders</div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={assign} className="btn-primary flex-1" disabled={!selected || loading}>{loading ? 'Assigning…' : 'Assign'}</button>
      </div>
    </Modal>
  );
}

// ─── Order row ─────────────────────────────────────────────────────────────

function OrderRow({ order, onAssign, onStatusChange }: { order: Order; onAssign: () => void; onStatusChange: (id: string, status: OrderStatus) => void }) {
  const s = STATUS[order.status];
  const [showMenu, setShowMenu] = useState(false);
  const nextStatuses: OrderStatus[] = ['WAITING', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'].filter(x => x !== order.status) as OrderStatus[];

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      {/* Status dot */}
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s?.dot || 'bg-gray-300'}`} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</span>
          {order.priority === 'URGENT' && <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">⚡ Urgent</span>}
          <span className="text-gray-400 text-xs hidden sm:inline">·</span>
          <span className="text-gray-700 text-sm hidden sm:inline">{order.senderBusiness}</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3" />{order.deliveryArea} · {order.customerName}
          {order.driver && <span className="ml-1 text-indigo-400">· {order.driver.name}</span>}
        </div>
      </div>

      {/* Status badge */}
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap hidden sm:inline ${s?.badge || ''}`}>{s?.label}</span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!order.driverId && (
          <button onClick={onAssign} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
            Assign
          </button>
        )}
        {order.driverId && order.status !== 'DELIVERED' && (
          <div className="relative">
            <button onClick={() => setShowMenu(v => !v)} className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Update
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-36 py-1" onMouseLeave={() => setShowMenu(false)}>
                {nextStatuses.map(st => (
                  <button key={st} onClick={() => { onStatusChange(order.id, st); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS[st]?.dot}`} />
                    {STATUS[st]?.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export default function DispatcherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [o, d] = await Promise.all([api.get('/orders'), api.get('/drivers')]);
      setOrders(o.data); setDrivers(d.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const changeStatus = async (id: string, status: OrderStatus) => {
    try { await api.put(`/orders/${id}/status`, { status }); fetchAll(true); }
    catch { /* ignore */ }
  };

  const problems = orders.filter(o => o.status === 'ISSUE_REPORTED' || (o.status === 'WAITING' && o.priority === 'URGENT'));

  const filtered = orders.filter(o => {
    if (filter === 'URGENT') return o.priority === 'URGENT' && o.status !== 'DELIVERED';
    if (filter === 'UNASSIGNED') return !o.driverId;
    if (filter === 'ACTIVE') return ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status);
    if (filter === 'DONE') return o.status === 'DELIVERED';
    return true;
  }).filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.orderNumber.includes(q) || o.customerName.toLowerCase().includes(q) || o.senderBusiness.toLowerCase().includes(q) || o.deliveryArea.toLowerCase().includes(q);
  });

  const stats = {
    total: orders.length,
    active: orders.filter(o => ['ASSIGNED','ACCEPTED','PICKED_UP','ON_THE_WAY'].includes(o.status)).length,
    done: orders.filter(o => o.status === 'DELIVERED').length,
    waiting: orders.filter(o => o.status === 'WAITING').length,
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-gray-900 text-sm">Yalla Wassel</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/reports')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Reports</span>
            </button>
            <button onClick={() => fetchAll(true)} className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{greet(user?.name || 'Sara')}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {stats.total} orders today · {stats.active} in progress · {stats.done} delivered
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> New order
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-700' },
            { label: 'Waiting', value: stats.waiting, color: 'text-amber-600' },
            { label: 'Active', value: stats.active, color: 'text-blue-600' },
            { label: 'Done', value: stats.done, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {problems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-red-700">⚠️ Needs your attention ({problems.length})</p>
            {problems.map(o => (
              <div key={o.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                <div>
                  <span className="font-medium text-gray-900 text-sm">#{o.orderNumber}</span>
                  <span className="text-gray-400 text-sm ml-2">{o.senderBusiness} · {o.deliveryArea}</span>
                  {o.issues[0] && <div className="text-xs text-red-500 mt-0.5">{o.issues[0].reason}</div>}
                </div>
                <button onClick={() => setAssignOrder(o)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors ml-3 flex-shrink-0">
                  {o.driverId ? 'Reassign' : 'Assign now'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-50 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input className="input pl-9 text-sm" placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[['ALL','All'],['UNASSIGNED','Unassigned'],['ACTIVE','Active'],['URGENT','Urgent ⚡'],['DONE','Done ✓']].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filter === v ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">No orders here</p>
              <p className="text-sm mt-1">Try a different filter or create a new order</p>
            </div>
          ) : (
            <div>
              {filtered.map(o => (
                <OrderRow key={o.id} order={o} onAssign={() => setAssignOrder(o)} onStatusChange={changeStatus} />
              ))}
            </div>
          )}
        </div>

        {/* Drivers */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">DRIVERS ({drivers.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {drivers.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-indigo-600 text-sm flex-shrink-0">
                  {d.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{d.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DRIVER_STATUS[d.driverStatus] || ''}`}>{DRIVER_LABEL[d.driverStatus]}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{d.zone} · {d.activeOrders} active · {d.completedToday} done today
                  </div>
                </div>
                {d.driverStatus === 'AVAILABLE' && (
                  <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" title="Available" />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={() => fetchAll(true)} />}
      {assignOrder && <AssignModal order={assignOrder} drivers={drivers} onClose={() => setAssignOrder(null)} onDone={() => fetchAll(true)} />}
    </div>
  );
}
