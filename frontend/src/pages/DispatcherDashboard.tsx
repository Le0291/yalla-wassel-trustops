import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, LayoutDashboard, Users, AlertTriangle, BarChart3, LogOut, Plus,
  RefreshCw, ChevronDown, X, CheckCircle, Clock, Package, Zap,
  MapPin, Phone, Search, Filter, UserCheck, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Order, Driver, OrderStatus, Priority } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  WAITING:        { label: 'Waiting',       cls: 'bg-gray-100 text-gray-700' },
  ASSIGNED:       { label: 'Assigned',      cls: 'bg-blue-100 text-blue-700' },
  ACCEPTED:       { label: 'Accepted',      cls: 'bg-violet-100 text-violet-700' },
  PICKED_UP:      { label: 'Picked Up',     cls: 'bg-amber-100 text-amber-700' },
  ON_THE_WAY:     { label: 'On the Way',    cls: 'bg-orange-100 text-orange-700' },
  DELIVERED:      { label: 'Delivered',     cls: 'bg-emerald-100 text-emerald-700' },
  ISSUE_REPORTED: { label: 'Issue',         cls: 'bg-red-100 text-red-700' },
};

const DRIVER_STATUS_META = {
  AVAILABLE:   { label: 'Available',   cls: 'bg-emerald-100 text-emerald-700' },
  ON_DELIVERY: { label: 'On Delivery', cls: 'bg-blue-100 text-blue-700' },
  ON_BREAK:    { label: 'On Break',    cls: 'bg-amber-100 text-amber-700' },
  OFF_DUTY:    { label: 'Off Duty',    cls: 'bg-gray-100 text-gray-500' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>{m.label}</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return priority === 'URGENT'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700"><Zap className="w-3 h-3" />Urgent</span>
    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-100">Normal</span>;
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Create Order Modal ───────────────────────────────────────────────────────

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ senderBusiness: '', customerName: '', customerPhone: '', deliveryArea: '', address: '', priority: 'NORMAL', estimatedWindow: '', dispatcherNote: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/orders', form);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Failed to create order');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="New Order" onClose={onClose}>
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Sender Business *</label>
            <input className="input" value={form.senderBusiness} onChange={(e) => set('senderBusiness', e.target.value)} required placeholder="e.g. Pharmacy Reem" />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Customer Name *</label>
            <input className="input" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} required placeholder="Full name" />
          </div>
          <div>
            <label className="label">Customer Phone</label>
            <input className="input" value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder="07x xxxxxxx" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Delivery Area *</label>
            <input className="input" value={form.deliveryArea} onChange={(e) => set('deliveryArea', e.target.value)} required placeholder="e.g. Abdoun" />
          </div>
          <div>
            <label className="label">Est. Window</label>
            <input className="input" value={form.estimatedWindow} onChange={(e) => set('estimatedWindow', e.target.value)} placeholder="2:00 – 4:00 PM" />
          </div>
        </div>
        <div>
          <label className="label">Address (optional)</label>
          <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street / building details" />
        </div>
        <div>
          <label className="label">Dispatcher Note (optional)</label>
          <input className="input" value={form.dispatcherNote} onChange={(e) => set('dispatcherNote', e.target.value)} placeholder="Any instructions for driver" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Creating…' : 'Create Order'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Assign Driver Modal ──────────────────────────────────────────────────────

function AssignDriverModal({ order, drivers, onClose, onAssigned }: { order: Order; drivers: Driver[]; onClose: () => void; onAssigned: () => void }) {
  const [selectedId, setSelectedId] = useState('');
  const [suggested, setSuggested] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/drivers/suggested?zone=${encodeURIComponent(order.deliveryArea)}`)
      .then((r) => { if (r.data) { setSuggested(r.data); setSelectedId(r.data.id); } })
      .catch(() => {});
  }, [order.deliveryArea]);

  const available = drivers.filter((d) => d.driverStatus === 'AVAILABLE' || d.driverStatus === 'ON_DELIVERY');

  const assign = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await api.put(`/orders/${order.id}/assign`, { driverId: selectedId });
      onAssigned();
      onClose();
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <Modal title={`Assign Driver — Order #${order.orderNumber}`} onClose={onClose}>
      <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
        <span className="font-medium text-gray-900">{order.senderBusiness}</span> → {order.customerName} · {order.deliveryArea}
      </div>

      {suggested && (
        <div className="mb-4 p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
          <UserCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-indigo-800">Suggested: {suggested.name}</span>
            <span className="text-indigo-500 ml-2">({suggested.zone} · {suggested.activeOrders} active orders)</span>
          </div>
        </div>
      )}

      <label className="label">Select Driver</label>
      <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
        {available.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">No available drivers right now</p>}
        {available.map((d) => (
          <label key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedId === d.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="driver" value={d.id} checked={selectedId === d.id} onChange={() => setSelectedId(d.id)} className="accent-indigo-600" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm">{d.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DRIVER_STATUS_META[d.driverStatus]?.cls || 'bg-gray-100 text-gray-600'}`}>{DRIVER_STATUS_META[d.driverStatus]?.label}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{d.zone} · {d.activeOrders} active · {d.completedToday} done today</div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={assign} className="btn-primary flex-1" disabled={!selectedId || loading}>{loading ? 'Assigning…' : 'Assign Driver'}</button>
      </div>
    </Modal>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────

function NoteModal({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: () => void }) {
  const [note, setNote] = useState(order.dispatcherNote || '');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await api.put(`/orders/${order.id}`, { dispatcherNote: note });
      onSaved();
      onClose();
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <Modal title={`Note for Order #${order.orderNumber}`} onClose={onClose}>
      <textarea
        className="input h-32 resize-none mb-4"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note for the driver or for your reference…"
        autoFocus
      />
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={save} className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save Note'}</button>
      </div>
    </Modal>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`rounded-xl p-2.5 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'overview' | 'orders' | 'drivers' | 'alerts';

export default function DispatcherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);
  const [noteOrder, setNoteOrder] = useState<Order | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [oRes, dRes] = await Promise.all([api.get('/orders'), api.get('/drivers')]);
      setOrders(oRes.data);
      setDrivers(dRes.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => { logout(); navigate('/'); };

  // Stats
  const stats = {
    total: orders.length,
    waiting: orders.filter((o) => o.status === 'WAITING').length,
    inProgress: orders.filter((o) => ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    issues: orders.filter((o) => o.status === 'ISSUE_REPORTED').length,
    urgent: orders.filter((o) => o.priority === 'URGENT' && o.status !== 'DELIVERED').length,
  };

  // Filtered orders
  const filtered = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && o.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.orderNumber.includes(q) || o.customerName.toLowerCase().includes(q) ||
        o.senderBusiness.toLowerCase().includes(q) || o.deliveryArea.toLowerCase().includes(q);
    }
    return true;
  });

  // Alerts
  const alerts = orders.filter((o) => o.status === 'ISSUE_REPORTED' || (o.status === 'WAITING' && o.priority === 'URGENT'));

  const resolveIssue = async (order: Order, issueId: string) => {
    try {
      await api.put(`/orders/${order.id}/issue/${issueId}/resolve`, { resolvedNote: 'Resolved by dispatcher', newStatus: 'ASSIGNED' });
      fetchData(true);
    } catch { /* ignore */ }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: Package, badge: orders.length },
    { key: 'drivers', label: 'Drivers', icon: Users, badge: drivers.length },
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: alerts.length || undefined },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 rounded-lg p-1.5">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Yalla Wassel</span>
            <span className="hidden sm:inline text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">TrustOps</span>
          </div>

          <nav className="flex items-center gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <t.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${t.key === 'alerts' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{t.badge}</span>
                )}
              </button>
            ))}
            <button onClick={() => navigate('/reports')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => fetchData(true)} className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${refreshing ? 'animate-spin' : ''}`} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0)}
              </div>
              <span className="font-medium">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Today's Overview</h1>
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> New Order
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Total Orders" value={stats.total} icon={Package} color="bg-indigo-100 text-indigo-600" />
              <StatCard label="Waiting" value={stats.waiting} icon={Clock} color="bg-gray-100 text-gray-600" />
              <StatCard label="In Progress" value={stats.inProgress} icon={Truck} color="bg-blue-100 text-blue-600" />
              <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" />
              <StatCard label="Issues" value={stats.issues} icon={AlertTriangle} color="bg-red-100 text-red-600" />
              <StatCard label="Urgent Active" value={stats.urgent} icon={Zap} color="bg-amber-100 text-amber-600" />
            </div>

            {alerts.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Needs Attention ({alerts.length})
                </h2>
                <div className="space-y-2">
                  {alerts.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={o.status} />
                        <div>
                          <span className="font-medium text-gray-900 text-sm">#{o.orderNumber}</span>
                          <span className="text-gray-500 text-sm ml-2">— {o.customerName} · {o.deliveryArea}</span>
                        </div>
                        {o.priority === 'URGENT' && <PriorityBadge priority="URGENT" />}
                      </div>
                      <div className="flex gap-2">
                        {!o.driverId && (
                          <button onClick={() => setAssignOrder(o)} className="btn-primary text-xs py-1 px-3">Assign</button>
                        )}
                        {o.issues.length > 0 && (
                          <button onClick={() => resolveIssue(o, o.issues[0].id)} className="btn-secondary text-xs py-1 px-3">Resolve</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent Orders</h2>
                <button onClick={() => setTab('orders')} className="text-sm text-indigo-600 hover:text-indigo-500">View all →</button>
              </div>
              <div className="overflow-x-auto">
                <OrdersTable orders={orders.slice(0, 8)} drivers={drivers} onAssign={setAssignOrder} onNote={setNoteOrder} onRefresh={() => fetchData(true)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {tab === 'orders' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-900">All Orders</h1>
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> New Order
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Search by #, name, business, area…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-gray-400" />
                <select className="input py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select className="input py-2" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="ALL">All Priority</option>
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="card overflow-hidden">
              {filtered.length === 0
                ? <div className="text-center py-16 text-gray-400"><Package className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No orders match your filters</p></div>
                : <div className="overflow-x-auto"><OrdersTable orders={filtered} drivers={drivers} onAssign={setAssignOrder} onNote={setNoteOrder} onRefresh={() => fetchData(true)} /></div>
              }
            </div>
          </div>
        )}

        {/* ── Drivers ── */}
        {tab === 'drivers' && (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-xl font-bold text-gray-900">Driver Roster</h1>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((d) => (
                <div key={d.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{d.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" /> {d.zone || '—'}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${DRIVER_STATUS_META[d.driverStatus]?.cls}`}>
                      {DRIVER_STATUS_META[d.driverStatus]?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <Phone className="w-3.5 h-3.5" /> {d.phone || '—'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                      <div className="text-lg font-bold text-blue-700">{d.activeOrders}</div>
                      <div className="text-xs text-blue-500">Active</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                      <div className="text-lg font-bold text-emerald-700">{d.completedToday}</div>
                      <div className="text-xs text-emerald-500">Done Today</div>
                    </div>
                  </div>
                </div>
              ))}
              {drivers.length === 0 && (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No drivers found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Alerts ── */}
        {tab === 'alerts' && (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-xl font-bold text-gray-900">Alerts & Exceptions</h1>

            {alerts.length === 0
              ? (
                <div className="card text-center py-16 text-gray-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p className="font-medium text-gray-600">All clear — no active alerts</p>
                  <p className="text-sm mt-1">Issues and urgent unassigned orders will appear here</p>
                </div>
              )
              : (
                <div className="space-y-3">
                  {orders.filter((o) => o.status === 'ISSUE_REPORTED').map((o) => (
                    <div key={o.id} className="card p-5 border-l-4 border-red-500">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="font-semibold text-gray-900">Issue Reported — Order #{o.orderNumber}</span>
                            <PriorityBadge priority={o.priority} />
                          </div>
                          <p className="text-sm text-gray-600">{o.senderBusiness} → {o.customerName} · {o.deliveryArea}</p>
                          {o.driver && <p className="text-sm text-gray-500 mt-0.5">Driver: {o.driver.name}</p>}
                          {o.issues.map((iss) => (
                            <div key={iss.id} className="mt-2 p-2 bg-red-50 rounded-lg text-sm">
                              <span className="font-medium text-red-700">Reason: {iss.reason}</span>
                              {iss.description && <span className="text-red-600 ml-2">— {iss.description}</span>}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => setAssignOrder(o)} className="btn-secondary text-xs py-1.5 px-3">Reassign</button>
                          {o.issues[0] && (
                            <button onClick={() => resolveIssue(o, o.issues[0].id)} className="btn-primary text-xs py-1.5 px-3">Resolve</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.filter((o) => o.status === 'WAITING' && o.priority === 'URGENT').map((o) => (
                    <div key={o.id} className="card p-5 border-l-4 border-amber-500">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold text-gray-900">Urgent Unassigned — Order #{o.orderNumber}</span>
                          </div>
                          <p className="text-sm text-gray-600">{o.senderBusiness} → {o.customerName} · {o.deliveryArea}</p>
                        </div>
                        <button onClick={() => setAssignOrder(o)} className="btn-primary text-xs py-1.5 px-3 flex-shrink-0">Assign Now</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={() => fetchData(true)} />}
      {assignOrder && <AssignDriverModal order={assignOrder} drivers={drivers} onClose={() => setAssignOrder(null)} onAssigned={() => fetchData(true)} />}
      {noteOrder && <NoteModal order={noteOrder} onClose={() => setNoteOrder(null)} onSaved={() => fetchData(true)} />}
    </div>
  );
}

// ─── Orders Table (shared) ────────────────────────────────────────────────────

function OrdersTable({ orders, drivers, onAssign, onNote, onRefresh }: {
  orders: Order[];
  drivers: Driver[];
  onAssign: (o: Order) => void;
  onNote: (o: Order) => void;
  onRefresh: () => void;
}) {
  const changeStatus = async (order: Order, status: OrderStatus) => {
    try {
      await api.put(`/orders/${order.id}/status`, { status });
      onRefresh();
    } catch { /* ignore */ }
  };

  const statusOptions: OrderStatus[] = ['WAITING', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'];

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          {['#', 'Business', 'Customer', 'Area', 'Priority', 'Status', 'Driver', 'Actions'].map((h) => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
            <td className="px-4 py-3 font-mono text-gray-700 font-semibold whitespace-nowrap">#{o.orderNumber}</td>
            <td className="px-4 py-3 font-medium text-gray-900 max-w-[120px] truncate">{o.senderBusiness}</td>
            <td className="px-4 py-3 text-gray-700 max-w-[100px] truncate">{o.customerName}</td>
            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
              <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{o.deliveryArea}</div>
            </td>
            <td className="px-4 py-3"><PriorityBadge priority={o.priority} /></td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <StatusBadge status={o.status} />
                {o.issues.length > 0 && !o.issues[0].resolved && (
                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Has unresolved issue" />
                )}
              </div>
            </td>
            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
              {o.driver ? (
                <div>
                  <div className="font-medium text-gray-900">{o.driver.name}</div>
                  <div className="text-xs text-gray-400">{o.driver.zone}</div>
                </div>
              ) : <span className="text-gray-400 text-xs">Unassigned</span>}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => onAssign(o)} title="Assign driver" className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                  <UserCheck className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onNote(o)} title="Add note" className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <div className="relative group">
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[140px] py-1">
                    {statusOptions.filter((s) => s !== o.status).map((s) => (
                      <button key={s} onClick={() => changeStatus(o, s)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s === 'DELIVERED' ? 'bg-emerald-500' : s === 'ISSUE_REPORTED' ? 'bg-red-500' : 'bg-blue-400'}`} />
                        {STATUS_META[s]?.label || s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
