import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, ChevronDown, X, MapPin, Building2, Clock, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Order, OrderStatus, DriverStatus } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greet(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name.split(' ')[0]}`;
}

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; cls: string; next: OrderStatus }>> = {
  ASSIGNED:   { label: 'Accept this order',  cls: 'bg-indigo-600 hover:bg-indigo-500 text-white', next: 'ACCEPTED' },
  ACCEPTED:   { label: "I've picked it up",  cls: 'bg-amber-500 hover:bg-amber-400 text-white',  next: 'PICKED_UP' },
  PICKED_UP:  { label: "I'm on my way",      cls: 'bg-orange-500 hover:bg-orange-400 text-white', next: 'ON_THE_WAY' },
};

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Waiting', ASSIGNED: 'Assigned to you', ACCEPTED: 'You accepted',
  PICKED_UP: 'Picked up', ON_THE_WAY: 'On the way', DELIVERED: 'Delivered ✓', ISSUE_REPORTED: 'Problem reported',
};

const MY_STATUS_OPTIONS: { value: DriverStatus; label: string; emoji: string; cls: string }[] = [
  { value: 'AVAILABLE',   label: 'Available',   emoji: '🟢', cls: 'bg-emerald-500' },
  { value: 'ON_DELIVERY', label: 'On delivery', emoji: '🔵', cls: 'bg-blue-500' },
  { value: 'ON_BREAK',    label: 'On break',    emoji: '🟡', cls: 'bg-amber-500' },
  { value: 'OFF_DUTY',    label: 'Off duty',    emoji: '⚫', cls: 'bg-gray-400' },
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
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Confirm delivery</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 mb-5 text-sm">
          <p className="font-semibold text-emerald-800">#{order.orderNumber} · {order.senderBusiness}</p>
          <p className="text-emerald-600 mt-0.5">Delivered to {order.deliveryArea}</p>
        </div>
        <div className="mb-4">
          <label className="label">Who received it? *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9 text-base" placeholder="Recipient's name" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
        </div>
        <div className="mb-6">
          <label className="label">Any notes? (optional)</label>
          <input className="input" placeholder="e.g. left at reception, handed to security…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button onClick={submit} disabled={!name.trim() || loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-colors">
          {loading ? 'Saving…' : '✓ Mark as delivered'}
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
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Report a problem</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Order <strong>#{order.orderNumber}</strong> — what happened?</p>
        <div className="space-y-2 mb-4">
          {ISSUE_REASONS.map(r => (
            <label key={r} className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${reason === r ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-red-500 w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">{r}</span>
            </label>
          ))}
        </div>
        <div className="mb-5">
          <input className="input" placeholder="Extra details (optional)" value={details} onChange={e => setDetails(e.target.value)} />
        </div>
        <button onClick={submit} disabled={!reason || loading}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-colors">
          {loading ? 'Reporting…' : 'Report problem'}
        </button>
      </div>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order, onAction, onProof, onIssue }: {
  order: Order;
  onAction: (o: Order, status: OrderStatus) => void;
  onProof: (o: Order) => void;
  onIssue: (o: Order) => void;
}) {
  const next = NEXT_ACTION[order.status];

  return (
    <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${order.priority === 'URGENT' ? 'border-red-200' : 'border-gray-100'}`}>
      {order.priority === 'URGENT' && (
        <div className="bg-red-500 px-4 py-1.5">
          <span className="text-white text-xs font-bold tracking-wide">⚡ URGENT</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">#{order.orderNumber}</div>
            <div className="text-sm text-gray-500 mt-0.5">{STATUS_LABEL[order.status] || order.status}</div>
          </div>
          {order.estimatedWindow && (
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-xl px-2.5 py-1.5">
              <Clock className="w-3 h-3" /> {order.estimatedWindow}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Building2 className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span>{order.senderBusiness}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span>{order.deliveryArea}</span>
            {order.address && <span className="text-gray-400 text-xs">· {order.address}</span>}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span>{order.customerName}</span>
            {order.customerPhone && (
              <a href={`tel:${order.customerPhone}`} className="text-indigo-500 text-xs hover:text-indigo-600">
                📞 {order.customerPhone}
              </a>
            )}
          </div>
        </div>

        {/* Note from dispatcher */}
        {order.dispatcherNote && (
          <div className="text-xs bg-amber-50 text-amber-700 rounded-xl px-3 py-2 mb-4 border border-amber-100">
            📋 {order.dispatcherNote}
          </div>
        )}

        {/* Issue already reported */}
        {order.status === 'ISSUE_REPORTED' && (
          <div className="text-sm bg-red-50 text-red-600 rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2 border border-red-100">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Problem reported: {order.issues?.[0]?.reason || 'Waiting for dispatcher to resolve'}</span>
          </div>
        )}

        {/* Actions */}
        {next && (
          <div className="space-y-2">
            <button onClick={() => onAction(order, next.next)} className={`w-full py-3.5 rounded-2xl font-bold text-base transition-colors ${next.cls}`}>
              {next.label}
            </button>
            {['ACCEPTED', 'PICKED_UP'].includes(order.status) && (
              <button onClick={() => onIssue(order)} className="w-full py-2.5 rounded-2xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-100">
                Report a problem
              </button>
            )}
          </div>
        )}

        {order.status === 'ON_THE_WAY' && (
          <div className="space-y-2">
            <button onClick={() => onProof(order)} className="w-full py-3.5 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" /> Delivered — confirm it
            </button>
            <button onClick={() => onIssue(order)} className="w-full py-2.5 rounded-2xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-100">
              Report a problem
            </button>
          </div>
        )}
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

  const updateStatus = async (order: Order, status: OrderStatus) => {
    try { await api.put(`/orders/${order.id}/status`, { status }); fetchOrders(true); }
    catch { /* ignore */ }
  };

  const updateMyStatus = async (s: DriverStatus) => {
    if (!user) return;
    try { await api.put(`/drivers/${user.id}/status`, { driverStatus: s }); updateUser({ ...user, driverStatus: s }); setStatusOpen(false); }
    catch { /* ignore */ }
  };

  const active = orders.filter(o => o.status !== 'DELIVERED');
  const done = orders.filter(o => o.status === 'DELIVERED');
  const current = MY_STATUS_OPTIONS.find(s => s.value === user?.driverStatus);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto" onClick={() => setStatusOpen(false)}>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 h-14 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">{greet(user?.name || '')}</p>
          <p className="text-xs text-gray-400">{user?.zone}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* My status pill */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setStatusOpen(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-colors ${current?.cls || 'bg-gray-400'}`}>
              {current?.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 w-40 py-1.5 overflow-hidden">
                {MY_STATUS_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => updateMyStatus(s.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 ${user?.driverStatus === s.value ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span>{s.emoji}</span> {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => fetchOrders(true)} className={`p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { logout(); navigate('/'); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div className="bg-white border-b border-gray-50 px-5 py-3 flex items-center gap-5 text-sm">
        <span className="text-blue-600 font-semibold">{active.length} active</span>
        <span className="text-gray-300">·</span>
        <span className="text-emerald-600 font-semibold">{done.length} done today</span>
      </div>

      <main className="flex-1 px-4 py-5 space-y-4 pb-10" onClick={() => setStatusOpen(false)}>

        {active.length === 0 && done.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🚗</p>
            <p className="font-semibold text-gray-700">No orders yet</p>
            <p className="text-sm text-gray-400 mt-1">Your dispatcher will send orders shortly</p>
          </div>
        )}

        {active.length > 0 && (
          <div className="space-y-3">
            {active.map(o => (
              <OrderCard key={o.id} order={o} onAction={updateStatus} onProof={setProofOrder} onIssue={setIssueOrder} />
            ))}
          </div>
        )}

        {done.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Completed today</p>
            <div className="space-y-2">
              {done.map(o => (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3 opacity-60">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-700 text-sm">#{o.orderNumber}</span>
                    <span className="text-gray-400 text-sm ml-2">{o.senderBusiness} · {o.deliveryArea}</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Done ✓</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {proofOrder && <ProofSheet order={proofOrder} onClose={() => setProofOrder(null)} onDone={() => fetchOrders(true)} />}
      {issueOrder && <IssueSheet order={issueOrder} onClose={() => setIssueOrder(null)} onDone={() => fetchOrders(true)} />}
    </div>
  );
}
