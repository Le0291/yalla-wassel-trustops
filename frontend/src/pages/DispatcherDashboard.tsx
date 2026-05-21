import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, LogOut, X, RefreshCw, Search, MapPin,
  Truck, Users, BarChart3, Settings, UserPlus, Trash2,
  Package, AlertTriangle, CheckCircle, Clock, MoreVertical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Order, Driver, OrderStatus } from '../types';

// ── helpers ────────────────────────────────────────────────────────────────

const STATUS_CHIP: Record<string, string> = {
  WAITING:        'chip chip-waiting',
  ASSIGNED:       'chip chip-assigned',
  ACCEPTED:       'chip chip-accepted',
  PICKED_UP:      'chip chip-transit',
  ON_THE_WAY:     'chip chip-transit',
  DELIVERED:      'chip chip-delivered',
  ISSUE_REPORTED: 'chip chip-issue',
};
const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Pending', ASSIGNED: 'Assigned', ACCEPTED: 'Accepted',
  PICKED_UP: 'Picked Up', ON_THE_WAY: 'Out for Delivery',
  DELIVERED: 'Completed', ISSUE_REPORTED: 'Issue',
};
const DRIVER_CHIP: Record<string, string> = {
  AVAILABLE:   'chip chip-available',
  ON_DELIVERY: 'chip chip-on-delivery',
  ON_BREAK:    'chip chip-on-break',
  OFF_DUTY:    'chip chip-off-duty',
};
const DRIVER_LABEL: Record<string, string> = {
  AVAILABLE: 'Available', ON_DELIVERY: 'In-Transit', ON_BREAK: 'On Break', OFF_DUTY: 'Offline',
};

// ── Modal shell ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-xl shadow-modal w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 h-auto"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Create order ───────────────────────────────────────────────────────────

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ senderBusiness: '', customerName: '', customerPhone: '', deliveryArea: '', address: '', priority: 'NORMAL', estimatedWindow: '', dispatcherNote: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await api.post('/orders', form); onCreated(); onClose(); }
    catch { setError('Could not create order.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="New order" onClose={onClose}>
      {error && <p className="text-error text-body-md mb-3 bg-error-container/30 px-3 py-2 rounded-lg">{error}</p>}
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Business *</label><input className="input" value={form.senderBusiness} onChange={e => set('senderBusiness', e.target.value)} required placeholder="Pharmacy Reem" /></div>
          <div><label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="NORMAL">Normal</option><option value="URGENT">Urgent ⚡</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Customer *</label><input className="input" value={form.customerName} onChange={e => set('customerName', e.target.value)} required /></div>
          <div><label className="label">Phone</label><input className="input" value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} placeholder="07x…" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Delivery area *</label><input className="input" value={form.deliveryArea} onChange={e => set('deliveryArea', e.target.value)} required placeholder="Abdoun" /></div>
          <div><label className="label">Time window</label><input className="input" value={form.estimatedWindow} onChange={e => set('estimatedWindow', e.target.value)} placeholder="2–4 PM" /></div>
        </div>
        <div><label className="label">Note for driver</label><input className="input" value={form.dispatcherNote} onChange={e => set('dispatcherNote', e.target.value)} /></div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Creating…' : 'Create order'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Assign driver ──────────────────────────────────────────────────────────

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
    <Modal title={`Assign rider — #${order.orderNumber}`} onClose={onClose}>
      <p className="text-body-md text-on-surface-variant mb-4">{order.senderBusiness} → {order.customerName} · {order.deliveryArea}</p>
      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
        {available.length === 0 && <p className="text-body-md text-on-surface-variant text-center py-6">No available riders right now</p>}
        {available.map(d => (
          <label key={d.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected === d.id ? 'border-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container-low'}`}>
            <input type="radio" name="driver" checked={selected === d.id} onChange={() => setSelected(d.id)} className="accent-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-body-md text-on-surface">{d.name}</span>
                <span className={DRIVER_CHIP[d.driverStatus]}>{DRIVER_LABEL[d.driverStatus]}</span>
              </div>
              <div className="text-label-sm text-on-surface-variant mt-0.5">{d.zone} · {d.activeOrders} active</div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={assign} className="btn-primary flex-1" disabled={!selected || loading}>{loading ? 'Assigning…' : 'Assign rider'}</button>
      </div>
    </Modal>
  );
}

// ── Add driver ─────────────────────────────────────────────────────────────

const AMMAN_ZONES = ['West Amman', 'Central Amman', 'East Amman', 'North Amman', 'South Amman'];

function AddDriverModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', zone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await api.post('/drivers', form); onCreated(); onClose(); }
    catch (err: any) { setError(err?.response?.data?.error || 'Could not add rider.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Add new rider" onClose={onClose}>
      {error && <p className="text-error text-body-md mb-3 bg-error-container/30 px-3 py-2 rounded-lg">{error}</p>}
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">Full name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Ahmad Al-Nabulsi" /></div>
        <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="ahmad@yallawassel.com" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="07x…" /></div>
          <div><label className="label">Zone</label>
            <select className="input" value={form.zone} onChange={e => set('zone', e.target.value)}>
              <option value="">Any zone</option>
              {AMMAN_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
        <p className="text-label-sm text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
          Default password: <span className="font-mono text-on-surface">123</span>
        </p>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Adding…' : 'Add rider'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

type View = 'orders' | 'riders';

export default function DispatcherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeView, setActiveView] = useState<View>('orders');
  const [showCreate, setShowCreate] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [o, d] = await Promise.all([api.get('/orders'), api.get('/drivers')]);
      setOrders(o.data); setDrivers(d.data);
    } catch { /* ignore */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const changeStatus = async (id: string, status: OrderStatus) => {
    try { await api.put(`/orders/${id}/status`, { status }); fetchAll(true); setOpenMenuId(null); }
    catch { /* ignore */ }
  };

  const deleteDriver = async (id: string) => {
    if (!window.confirm('Remove this rider? Their active orders return to queue.')) return;
    try { await api.delete(`/drivers/${id}`); fetchAll(true); }
    catch { /* ignore */ }
  };

  const filtered = orders.filter(o => {
    const matchStatus =
      statusFilter === 'ALL' ? true :
      statusFilter === 'PENDING' ? o.status === 'WAITING' :
      statusFilter === 'ACTIVE' ? ['ASSIGNED','ACCEPTED','PICKED_UP','ON_THE_WAY'].includes(o.status) :
      statusFilter === 'COMPLETED' ? o.status === 'DELIVERED' :
      statusFilter === 'URGENT' ? o.priority === 'URGENT' : true;
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderNumber.includes(q) || o.customerName.toLowerCase().includes(q) ||
      o.senderBusiness.toLowerCase().includes(q) || o.deliveryArea.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = {
    pending:  orders.filter(o => o.status === 'WAITING').length,
    active:   orders.filter(o => ['ASSIGNED','ACCEPTED','PICKED_UP','ON_THE_WAY'].includes(o.status)).length,
    issues:   orders.filter(o => o.status === 'ISSUE_REPORTED').length,
    done:     orders.filter(o => o.status === 'DELIVERED').length,
  };

  const navItems: { id: View | 'analytics'; label: string; icon: React.ReactNode }[] = [
    { id: 'orders',    label: 'Orders Management', icon: <Truck className="w-5 h-5" /> },
    { id: 'riders',    label: 'Rider Management',  icon: <Users className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics',          icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings' as any, label: 'Settings',    icon: <Settings className="w-5 h-5" /> },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
        <p className="text-body-md text-on-surface-variant">Loading…</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-surface-container-lowest border-r border-outline-variant overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-outline-variant">
          <img src="/logo-mark.png" alt="Yalla Wassel" className="h-10 w-auto" />
          <div>
            <p className="text-headline-md font-bold text-primary leading-tight">Dispatcher Hub</p>
            <p className="text-label-sm text-on-surface-variant">Operational Control</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = item.id === activeView;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'analytics') { navigate('/reports'); return; }
                  setActiveView(item.id as View);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-label-sm transition-colors ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-sm font-semibold text-on-surface truncate">{user?.name}</p>
              <p className="text-[10px] text-on-surface-variant">Dispatcher</p>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} className="text-on-surface-variant hover:text-error transition-colors p-1" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-16 border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-headline-md font-bold text-primary">
              {activeView === 'orders' ? 'Active Orders' : 'Rider Management'}
            </h1>
            {activeView === 'orders' && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  className="input pl-9 w-72"
                  placeholder="Search order ID or customer…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}
            {activeView === 'riders' && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input className="input pl-9 w-64" placeholder="Search by name or zone…" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchAll(true)} className={`btn-ghost p-2 h-auto ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            {activeView === 'orders' && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> New Order
              </button>
            )}
            {activeView === 'riders' && (
              <button onClick={() => setShowAddDriver(true)} className="btn-primary">
                <UserPlus className="w-4 h-4" /> Add New Rider
              </button>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── ORDERS VIEW ── */}
          {activeView === 'orders' && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Pending',    value: stats.pending, icon: <Clock className="w-5 h-5" />,         iconBg: 'bg-primary/10',           iconColor: 'text-primary' },
                  { label: 'In Transit', value: stats.active,  icon: <Truck className="w-5 h-5" />,         iconBg: 'bg-tertiary/10',          iconColor: 'text-tertiary' },
                  { label: 'Issues',     value: stats.issues,  icon: <AlertTriangle className="w-5 h-5" />, iconBg: 'bg-error-container/40',   iconColor: 'text-error' },
                  { label: 'Completed',  value: stats.done,    icon: <CheckCircle className="w-5 h-5" />,   iconBg: 'bg-surface-container-highest', iconColor: 'text-on-surface-variant' },
                ].map(s => (
                  <div key={s.label} className="card p-4 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                      <span className={s.iconColor}>{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-label-sm text-on-surface-variant">{s.label}</p>
                      <p className="text-headline-md font-bold text-on-surface">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="card overflow-hidden">
                {/* Filters */}
                <div className="px-5 py-3 border-b border-outline-variant flex flex-wrap items-center gap-3">
                  <div className="flex gap-2 flex-wrap">
                    {[['ALL','All Statuses'],['PENDING','Pending'],['ACTIVE','In Transit'],['COMPLETED','Completed'],['URGENT','Urgent ⚡']].map(([v,l]) => (
                      <button key={v} onClick={() => setStatusFilter(v)}
                        className={`px-3 py-1 rounded-lg text-label-sm transition-colors ${statusFilter === v ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <span className="ml-auto text-label-sm text-on-surface-variant hidden sm:block">
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low/60">
                        {['Order ID','Time','Customer','Rider Assigned','Destination','Status','Actions'].map(h => (
                          <th key={h} className="px-5 py-3 text-label-sm text-on-surface-variant border-b border-outline-variant uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {filtered.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-14 text-on-surface-variant">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-body-md">No orders match this filter</p>
                        </td></tr>
                      ) : filtered.map(o => (
                        <tr key={o.id} className={`hover:bg-surface-container-lowest transition-colors group ${o.status === 'ISSUE_REPORTED' ? 'bg-error-container/5' : ''}`}>
                          <td className="px-5 py-3.5 text-data-mono font-bold text-primary whitespace-nowrap">
                            #{o.orderNumber}
                            {o.priority === 'URGENT' && <span className="ml-1 text-[10px] font-bold text-error">⚡</span>}
                          </td>
                          <td className="px-5 py-3.5 text-body-md text-on-surface-variant whitespace-nowrap">
                            {new Date(o.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3.5 text-body-md">{o.customerName}</td>
                          <td className="px-5 py-3.5">
                            {o.driver ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-on-secondary-container">
                                  {o.driver.name.slice(0,2).toUpperCase()}
                                </div>
                                <span className="text-body-md">{o.driver.name}</span>
                              </div>
                            ) : (
                              <span className="text-body-md text-on-surface-variant italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-body-md">
                            <div className="flex items-center gap-1 text-on-surface-variant">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {o.deliveryArea}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={STATUS_CHIP[o.status]}>{STATUS_LABEL[o.status]}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            {!o.driverId && (
                              <button onClick={() => setAssignOrder(o)} className="text-primary text-label-sm hover:underline">Assign Rider</button>
                            )}
                            {o.driverId && o.status !== 'DELIVERED' && (
                              <div className="relative">
                                <button onClick={() => setOpenMenuId(openMenuId === o.id ? null : o.id)} className="btn-ghost p-1 h-auto">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {openMenuId === o.id && (
                                  <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-hover z-20 w-40 py-1">
                                    {(['WAITING','ASSIGNED','ACCEPTED','PICKED_UP','ON_THE_WAY','DELIVERED'] as OrderStatus[])
                                      .filter(s => s !== o.status)
                                      .map(st => (
                                        <button key={st} onClick={() => changeStatus(o.id, st)}
                                          className="w-full text-left px-3 py-2 text-body-md hover:bg-surface-container transition-colors text-on-surface">
                                          {STATUS_LABEL[st]}
                                        </button>
                                      ))}
                                    <div className="border-t border-outline-variant mt-1 pt-1">
                                      <button onClick={() => setAssignOrder(o)} className="w-full text-left px-3 py-2 text-body-md hover:bg-surface-container transition-colors text-primary">
                                        Reassign rider
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── RIDERS VIEW ── */}
          {activeView === 'riders' && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Riders',  value: drivers.length,                                          iconBg: 'bg-surface-container-highest',  icon: <Users className="w-5 h-5 text-on-surface-variant" /> },
                  { label: 'Available',     value: drivers.filter(d=>d.driverStatus==='AVAILABLE').length,  iconBg: 'bg-green-50',                   icon: <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse block" /> },
                  { label: 'In Transit',    value: drivers.filter(d=>d.driverStatus==='ON_DELIVERY').length,iconBg: 'bg-secondary-container/40',     icon: <Truck className="w-5 h-5 text-on-secondary-container" /> },
                  { label: 'Off Duty',      value: drivers.filter(d=>d.driverStatus==='OFF_DUTY').length,   iconBg: 'bg-surface-container-highest',  icon: <Users className="w-5 h-5 text-on-surface-variant" /> },
                ].map(s => (
                  <div key={s.label} className="card p-4 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.iconBg}`}>{s.icon}</div>
                    <div>
                      <p className="text-label-sm text-on-surface-variant">{s.label}</p>
                      <p className="text-headline-md font-bold text-on-surface">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Riders grid */}
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {drivers.map(d => (
                  <div key={d.id} className="card p-5 flex flex-col border-l-4 border-l-primary hover:shadow-hover transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary-container text-sm">
                          {d.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-body-lg text-on-surface">{d.name}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-on-surface-variant">
                            <MapPin className="w-3 h-3" />
                            <span className="text-label-sm">{d.zone}</span>
                          </div>
                        </div>
                      </div>
                      <span className={DRIVER_CHIP[d.driverStatus]}>{DRIVER_LABEL[d.driverStatus]}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-body-md">
                        <span className="text-on-surface-variant">Active orders</span>
                        <span className="font-medium text-on-surface">{d.activeOrders}</span>
                      </div>
                      <div className="flex justify-between text-body-md">
                        <span className="text-on-surface-variant">Done today</span>
                        <span className="font-medium text-on-surface">{d.completedToday}</span>
                      </div>
                      {d.phone && (
                        <div className="flex justify-between text-body-md">
                          <span className="text-on-surface-variant">Phone</span>
                          <span className="font-mono text-data-mono text-on-surface">{d.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex gap-2">
                      <button onClick={() => { setActiveView('orders'); setSearch(d.name.split(' ')[0]); }}
                        className="flex-1 py-2 bg-surface-container text-primary text-label-sm rounded-lg hover:bg-primary hover:text-on-primary transition-all">
                        View Orders
                      </button>
                      <button onClick={() => deleteDriver(d.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new rider ghost card */}
                <button onClick={() => setShowAddDriver(true)}
                  className="card p-5 flex flex-col items-center justify-center gap-3 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all min-h-[200px] group">
                  <div className="w-11 h-11 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <span className="text-label-sm text-on-surface-variant group-hover:text-primary">Onboard New Rider</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {showCreate    && <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={() => fetchAll(true)} />}
      {showAddDriver && <AddDriverModal   onClose={() => setShowAddDriver(false)} onCreated={() => fetchAll(true)} />}
      {assignOrder   && <AssignModal order={assignOrder} drivers={drivers} onClose={() => setAssignOrder(null)} onDone={() => fetchAll(true)} />}
    </div>
  );
}
