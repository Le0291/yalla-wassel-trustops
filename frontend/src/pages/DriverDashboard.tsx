import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Bell, User, X, MapPin, Building2, Clock, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Order, OrderStatus, DriverStatus } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greet(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name.split(' ')[0]}`;
}

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  ASSIGNED:  { label: 'Accept Order',     next: 'ACCEPTED'  },
  ACCEPTED:  { label: "I've Picked It Up", next: 'PICKED_UP' },
  PICKED_UP: { label: "I'm On My Way",    next: 'ON_THE_WAY' },
};

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Waiting', ASSIGNED: 'Assigned to you', ACCEPTED: 'You accepted',
  PICKED_UP: 'Picked up', ON_THE_WAY: 'On the way', DELIVERED: 'Delivered', ISSUE_REPORTED: 'Problem reported',
};

const STATUS_CHIP: Record<string, string> = {
  ASSIGNED: 'chip chip-assigned', ACCEPTED: 'chip chip-accepted',
  PICKED_UP: 'chip chip-transit', ON_THE_WAY: 'chip chip-transit',
  DELIVERED: 'chip chip-delivered', ISSUE_REPORTED: 'chip chip-issue',
};

const MY_STATUS_OPTIONS: { value: DriverStatus; label: string }[] = [
  { value: 'AVAILABLE',   label: 'Available'   },
  { value: 'ON_DELIVERY', label: 'On Delivery' },
  { value: 'ON_BREAK',    label: 'On Break'    },
  { value: 'OFF_DUTY',    label: 'Off Duty'    },
];

const ISSUE_REASONS = ['Customer not answering', 'Wrong address', 'Traffic delay', 'Package not ready', 'Other'];

// ─── Delivery proof sheet ─────────────────────────────────────────────────────

function ProofSheet({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try { await api.post(`/orders/${order.id}/proof`, { recipientName: name, notes }); onDone(); onClose(); }
    catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-surface-container-lowest rounded-t-2xl w-full max-w-lg p-6 pb-8 animate-fade-in shadow-modal">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-headline-md font-semibold text-on-surface">Confirm Delivery</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-primary/10 rounded-xl p-4 mb-5">
          <p className="font-semibold text-primary text-body-md">#{order.orderNumber} · {order.senderBusiness}</p>
          <p className="text-on-surface-variant text-body-md mt-0.5">Delivering to {order.deliveryArea}</p>
        </div>
        <div className="mb-4">
          <label className="label">Who received it? *</label>
          <input className="input" placeholder="Recipient's name" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="mb-6">
          <label className="label">Notes (optional)</label>
          <input className="input" placeholder="e.g. left at reception…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button onClick={submit} disabled={!name.trim() || loading} className="btn-primary w-full justify-center h-12">
          {loading ? 'Saving…' : '✓ Mark as Delivered'}
        </button>
      </div>
    </div>
  );
}

// ─── Issue sheet ──────────────────────────────────────────────────────────────

function IssueSheet({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try { await api.post(`/orders/${order.id}/issue`, { reason, description: details }); onDone(); onClose(); }
    catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-surface-container-lowest rounded-t-2xl w-full max-w-lg p-6 pb-8 animate-fade-in shadow-modal">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-headline-md font-semibold text-on-surface">Report a Problem</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-body-md text-on-surface-variant mb-4">Order <strong className="text-on-surface">#{order.orderNumber}</strong> — what happened?</p>
        <div className="space-y-2 mb-4">
          {ISSUE_REASONS.map(r => (
            <label key={r} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${reason === r ? 'border-error bg-error/5' : 'border-outline-variant'}`}>
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-red-600 w-4 h-4" />
              <span className="text-body-md text-on-surface">{r}</span>
            </label>
          ))}
        </div>
        <div className="mb-5">
          <input className="input" placeholder="Extra details (optional)" value={details} onChange={e => setDetails(e.target.value)} />
        </div>
        <button onClick={submit} disabled={!reason || loading}
          className="w-full h-12 bg-error hover:opacity-90 disabled:opacity-40 text-white font-semibold rounded-lg transition-all text-label-sm">
          {loading ? 'Reporting…' : 'Report Problem'}
        </button>
      </div>
    </div>
  );
}

// ─── Active Order Card ────────────────────────────────────────────────────────

function ActiveOrderCard({ order, onAction, onProof, onIssue }: {
  order: Order;
  onAction: (o: Order, status: OrderStatus) => void;
  onProof: (o: Order) => void;
  onIssue: (o: Order) => void;
}) {
  const next = NEXT_ACTION[order.status];

  return (
    <div className="bg-surface-container-lowest border-l-4 border-l-primary border border-outline-variant rounded-xl overflow-hidden shadow-card">
      {order.priority === 'URGENT' && (
        <div className="bg-error px-4 py-1.5">
          <span className="text-white text-label-sm font-semibold tracking-wide">⚡ URGENT</span>
        </div>
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className={STATUS_CHIP[order.status] || 'chip chip-assigned'}>
              {STATUS_LABEL[order.status] || order.status}
            </span>
            <p className="text-data-mono text-on-surface-variant mt-2">#{order.orderNumber}</p>
          </div>
          {order.customerPhone && (
            <a href={`tel:${order.customerPhone}`}
              className="flex items-center gap-2 text-primary text-label-sm hover:underline">
              📞 Contact Customer
            </a>
          )}
        </div>

        <div className="space-y-5 mb-8">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary mt-1 flex-shrink-0" />
              <div className="w-0.5 flex-1 bg-outline-variant my-1" />
            </div>
            <div className="flex-1 pb-2">
              <p className="text-label-sm text-on-surface-variant">Pickup</p>
              <p className="text-body-lg font-semibold text-on-surface">{order.senderBusiness}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-label-sm text-on-surface-variant">Drop-off</p>
              <p className="text-body-lg font-semibold text-on-surface">{order.deliveryArea}</p>
              {order.address && <p className="text-body-md text-on-surface-variant mt-0.5">{order.address}</p>}
            </div>
          </div>
        </div>

        {order.dispatcherNote && (
          <div className="text-body-md bg-secondary-container text-on-secondary-container rounded-xl px-3 py-2 mb-4">
            📋 {order.dispatcherNote}
          </div>
        )}

        {order.status === 'ISSUE_REPORTED' && (
          <div className="text-body-md bg-error-container text-error rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Problem reported: {order.issues?.[0]?.reason || 'Waiting for dispatcher to resolve'}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {next && (
            <button onClick={() => onAction(order, next.next)}
              className="col-span-2 btn-primary justify-center h-12 text-label-sm">
              <CheckCircle className="w-4 h-4" /> {next.label}
            </button>
          )}
          {order.status === 'ON_THE_WAY' && (
            <button onClick={() => onProof(order)}
              className="col-span-2 btn-primary justify-center h-12">
              <CheckCircle className="w-4 h-4" /> Complete Delivery
            </button>
          )}
          {['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status) && (
            <button onClick={() => onIssue(order)}
              className="col-span-2 btn-secondary justify-center h-10 text-error border-error/30 hover:bg-error/5">
              Report a Problem
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DriverDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [proofOrder, setProofOrder] = useState<Order | null>(null);
  const [issueOrder, setIssueOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try { const { data } = await api.get('/orders'); setOrders(data); }
    catch { /* ignore */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (order: Order, status: OrderStatus) => {
    try { await api.put(`/orders/${order.id}/status`, { status }); fetchOrders(true); }
    catch { /* ignore */ }
  };

  const updateMyStatus = async (s: DriverStatus) => {
    if (!user) return;
    try { await api.put(`/drivers/${user.id}/status`, { driverStatus: s }); updateUser({ ...user, driverStatus: s }); setStatusOpen(false); }
    catch { /* ignore */ }
  };

  const active = orders.filter(o => o.status !== 'DELIVERED');
  const done   = orders.filter(o => o.status === 'DELIVERED');

  const statusChipClass: Record<DriverStatus, string> = {
    AVAILABLE:   'chip chip-available',
    ON_DELIVERY: 'chip chip-on-delivery',
    ON_BREAK:    'chip chip-on-break',
    OFF_DUTY:    'chip chip-off-duty',
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-surface" onClick={() => setStatusOpen(false)}>

      {/* Top Nav */}
      <header className="bg-surface border-b border-outline-variant fixed top-0 w-full z-50 h-16 flex justify-between items-center px-4 md:px-8">
        <div className="flex items-center gap-4">
          <img src="/logo-mark.png" alt="Yalla Wassel" className="h-8 w-8 object-contain" />
          <h1 className="text-headline-md font-bold text-primary hidden sm:block">Yalla Wassel</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Status pill */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setStatusOpen(v => !v)}
              className={`${statusChipClass[user?.driverStatus as DriverStatus] || 'chip chip-off-duty'} cursor-pointer pr-2`}
            >
              {MY_STATUS_OPTIONS.find(s => s.value === user?.driverStatus)?.label || 'Off Duty'}
              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-modal z-20 w-44 py-1 overflow-hidden animate-fade-in">
                {MY_STATUS_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => updateMyStatus(s.value)}
                    className={`w-full text-left px-4 py-2.5 text-body-md transition-colors flex items-center gap-2 ${user?.driverStatus === s.value ? 'font-semibold text-primary bg-primary/5' : 'text-on-surface hover:bg-surface-container-low'}`}>
                    <span className={`w-2 h-2 rounded-full ${statusChipClass[s.value].includes('available') ? 'bg-green-600' : s.value === 'ON_DELIVERY' ? 'bg-primary' : s.value === 'ON_BREAK' ? 'bg-orange-500' : 'bg-outline'}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => fetchOrders(true)} className={`p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button onClick={() => { logout(); navigate('/'); }} className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-surface-container-low transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="pt-24 pb-24 px-4 md:px-8 max-w-[1440px] mx-auto">

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{greet(user?.name || '')}</p>
            <h2 className="text-headline-lg text-on-surface">My Assignments</h2>
          </div>
          {/* Daily stats summary pill */}
          <div className="card p-4 flex items-center gap-6 min-w-[280px]">
            <div className="flex-1">
              <p className="text-label-sm text-on-surface-variant">Today</p>
              <p className="text-headline-md font-bold text-primary">
                {active.length} active · {done.length} done
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
              <User className="w-5 h-5 text-on-secondary-container" />
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Active + Upcoming */}
          <div className="lg:col-span-8 space-y-8">

            {/* Active Orders */}
            <section>
              <h3 className="text-label-sm text-on-surface-variant mb-4 uppercase tracking-widest">
                Active {active.length > 0 ? `(${active.length})` : ''}
              </h3>

              {active.length === 0 && done.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-4xl mb-3">🛵</p>
                  <p className="font-semibold text-on-surface text-body-lg">No orders yet</p>
                  <p className="text-body-md text-on-surface-variant mt-1">Your dispatcher will send orders shortly</p>
                </div>
              ) : active.length === 0 ? (
                <div className="card p-8 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-on-surface">All caught up!</p>
                  <p className="text-body-md text-on-surface-variant mt-1">No active orders right now</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {active.map(o => (
                    <ActiveOrderCard key={o.id} order={o}
                      onAction={updateOrderStatus} onProof={setProofOrder} onIssue={setIssueOrder} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: Stats snapshot + completed */}
          <div className="lg:col-span-4 space-y-8">

            {/* Dark stats card */}
            <section className="bg-on-secondary-fixed text-white p-6 rounded-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-label-sm text-secondary-fixed-dim uppercase tracking-widest mb-4">Today's Snapshot</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{done.length}</p>
                    <p className="text-xs text-secondary-fixed-dim">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{active.length}</p>
                    <p className="text-xs text-secondary-fixed-dim">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{user?.zone || '—'}</p>
                    <p className="text-xs text-secondary-fixed-dim">Zone</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{MY_STATUS_OPTIONS.find(s => s.value === user?.driverStatus)?.label || '—'}</p>
                    <p className="text-xs text-secondary-fixed-dim">Status</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary opacity-20 rounded-full blur-3xl" />
            </section>

            {/* Completed today */}
            {done.length > 0 && (
              <section>
                <h3 className="text-label-sm text-on-surface-variant mb-4 uppercase tracking-widest">Completed Today</h3>
                <div className="card divide-y divide-outline-variant overflow-hidden">
                  {done.map(o => (
                    <div key={o.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-data-mono text-xs text-on-surface-variant">#{o.orderNumber}</p>
                        <p className="text-body-md font-semibold text-on-surface">{o.senderBusiness}</p>
                        <p className="text-xs text-on-surface-variant">{o.deliveryArea}</p>
                      </div>
                      <span className="chip chip-delivered">Done ✓</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface border-t border-outline-variant shadow-lg">
        <button className="flex flex-col items-center justify-center text-primary font-bold transition-all hover:bg-surface-container-low px-4 py-1 rounded-lg">
          <CheckCircle className="w-5 h-5 mb-0.5" />
          <span className="text-label-sm">My Orders</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all px-4 py-1 rounded-lg">
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-label-sm">History</span>
        </button>
        <button onClick={() => { logout(); navigate('/'); }}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all px-4 py-1 rounded-lg">
          <LogOut className="w-5 h-5 mb-0.5" />
          <span className="text-label-sm">Sign Out</span>
        </button>
      </nav>

      {proofOrder && <ProofSheet order={proofOrder} onClose={() => setProofOrder(null)} onDone={() => fetchOrders(true)} />}
      {issueOrder && <IssueSheet order={issueOrder} onClose={() => setIssueOrder(null)} onDone={() => fetchOrders(true)} />}
    </div>
  );
}
