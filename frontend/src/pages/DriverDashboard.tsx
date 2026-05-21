import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, LogOut, RefreshCw, Package, CheckCircle, AlertTriangle,
  MapPin, Building2, Phone, Clock, ChevronRight, X, Camera, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Order, OrderStatus, DriverStatus } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string; bg: string }> = {
  WAITING:        { label: 'Waiting',    cls: 'bg-gray-100 text-gray-700',     bg: 'bg-gray-50' },
  ASSIGNED:       { label: 'Assigned',   cls: 'bg-blue-100 text-blue-700',     bg: 'bg-blue-50' },
  ACCEPTED:       { label: 'Accepted',   cls: 'bg-violet-100 text-violet-700', bg: 'bg-violet-50' },
  PICKED_UP:      { label: 'Picked Up',  cls: 'bg-amber-100 text-amber-700',   bg: 'bg-amber-50' },
  ON_THE_WAY:     { label: 'On the Way', cls: 'bg-orange-100 text-orange-700', bg: 'bg-orange-50' },
  DELIVERED:      { label: 'Delivered',  cls: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-50' },
  ISSUE_REPORTED: { label: 'Issue',      cls: 'bg-red-100 text-red-700',       bg: 'bg-red-50' },
};

const DRIVER_STATUS_OPTIONS: { value: DriverStatus; label: string; cls: string }[] = [
  { value: 'AVAILABLE',   label: 'Available',   cls: 'bg-emerald-500' },
  { value: 'ON_DELIVERY', label: 'On Delivery', cls: 'bg-blue-500' },
  { value: 'ON_BREAK',    label: 'On Break',    cls: 'bg-amber-500' },
  { value: 'OFF_DUTY',    label: 'Off Duty',    cls: 'bg-gray-400' },
];

// Next status flow for drivers
const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; cls: string }[]>> = {
  ASSIGNED:   [{ status: 'ACCEPTED',   label: 'Accept Order',  cls: 'bg-violet-600 hover:bg-violet-500 text-white' }],
  ACCEPTED:   [{ status: 'PICKED_UP',  label: 'Picked Up',     cls: 'bg-amber-500 hover:bg-amber-400 text-white' }],
  PICKED_UP:  [{ status: 'ON_THE_WAY', label: 'On the Way',    cls: 'bg-orange-500 hover:bg-orange-400 text-white' }],
  ON_THE_WAY: [],  // needs proof form
};

const ISSUE_REASONS = [
  'Customer not answering',
  'Wrong address',
  'Traffic delay',
  'Package not ready',
  'Other',
];

// ─── Modals ───────────────────────────────────────────────────────────────────

function IssueModal({ order, onClose, onSubmitted }: { order: Order; onClose: () => void; onSubmitted: () => void }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await api.post(`/orders/${order.id}/issue`, { reason, description });
      onSubmitted();
      onClose();
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Report Issue</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Order <span className="font-semibold text-gray-700">#{order.orderNumber}</span> — {order.senderBusiness}</p>

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">What happened?</p>
          <div className="space-y-2">
            {ISSUE_REASONS.map((r) => (
              <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${reason === r ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-red-500" />
                <span className="text-sm font-medium text-gray-700">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="label">Additional details (optional)</label>
          <textarea
            className="input h-20 resize-none"
            placeholder="Add more context if needed…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={!reason || loading} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
            {loading ? 'Reporting…' : 'Report Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProofModal({ order, onClose, onSubmitted }: { order: Order; onClose: () => void; onSubmitted: () => void }) {
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!recipientName.trim()) return;
    setLoading(true);
    try {
      await api.post(`/orders/${order.id}/proof`, { recipientName, notes });
      onSubmitted();
      onClose();
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Confirm Delivery</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-5 text-sm">
          <p className="font-semibold text-emerald-800">#{order.orderNumber} — {order.senderBusiness}</p>
          <p className="text-emerald-600 mt-0.5">Delivered to: {order.deliveryArea}</p>
        </div>

        <div className="mb-4">
          <label className="label">Recipient Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Name of person who received" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} autoFocus />
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Delivery Notes (optional)</label>
          <textarea className="input h-20 resize-none" placeholder="e.g. Left at reception, handed to security…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="mb-5 p-3.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center gap-3 text-gray-400">
          <Camera className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-500">Photo Upload</p>
            <p className="text-xs">Photo attachment coming soon</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={!recipientName.trim() || loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
            {loading ? 'Confirming…' : 'Confirm Delivered ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DriverDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);

  // Modals
  const [issueOrder, setIssueOrder] = useState<Order | null>(null);
  const [proofOrder, setProofOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (order: Order, status: OrderStatus) => {
    try {
      await api.put(`/orders/${order.id}/status`, { status });
      fetchOrders(true);
    } catch { /* ignore */ }
  };

  const updateDriverStatus = async (driverStatus: DriverStatus) => {
    if (!user) return;
    try {
      await api.put(`/drivers/${user.id}/status`, { driverStatus });
      updateUser({ ...user, driverStatus });
      setStatusDropdown(false);
    } catch { /* ignore */ }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const active = orders.filter((o) => !['DELIVERED'].includes(o.status));
  const completed = orders.filter((o) => o.status === 'DELIVERED');

  const currentStatus = DRIVER_STATUS_OPTIONS.find((s) => s.value === user?.driverStatus);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading your orders…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-600 rounded-lg p-1.5">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-gray-900 text-sm">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.zone}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Driver status selector */}
            <div className="relative">
              <button
                onClick={() => setStatusDropdown(!statusDropdown)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${currentStatus ? `${currentStatus.cls} text-white` : 'bg-gray-200 text-gray-600'}`}
              >
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                {currentStatus?.label || 'Status'}
                <ChevronRight className={`w-3 h-3 transition-transform ${statusDropdown ? 'rotate-90' : ''}`} />
              </button>
              {statusDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 w-44 py-1">
                  {DRIVER_STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => updateDriverStatus(s.value)}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 ${user?.driverStatus === s.value ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${s.cls}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => fetchOrders(true)} className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Today's stats strip */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Package className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-700">{active.length}</span>
          <span className="text-xs text-gray-400">Active</span>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-700">{completed.length}</span>
          <span className="text-xs text-gray-400">Done today</span>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-4 pb-8" onClick={() => setStatusDropdown(false)}>
        {/* Active orders */}
        {active.length === 0 && completed.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">No orders assigned yet</p>
            <p className="text-sm mt-1">Your dispatcher will assign orders to you shortly</p>
          </div>
        )}

        {active.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Active Orders</h2>
            <div className="space-y-3">
              {active.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                  onReportIssue={() => setIssueOrder(order)}
                  onConfirmDelivery={() => setProofOrder(order)}
                />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Completed Today</h2>
            <div className="space-y-2">
              {completed.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 opacity-70">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 text-sm">#{order.orderNumber}</span>
                      <span className="text-gray-400 text-sm">—</span>
                      <span className="text-gray-600 text-sm truncate">{order.senderBusiness}</span>
                    </div>
                    <div className="text-xs text-gray-400">{order.customerName} · {order.deliveryArea}</div>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Done</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      {issueOrder && <IssueModal order={issueOrder} onClose={() => setIssueOrder(null)} onSubmitted={() => fetchOrders(true)} />}
      {proofOrder && <ProofModal order={proofOrder} onClose={() => setProofOrder(null)} onSubmitted={() => fetchOrders(true)} />}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order, onUpdateStatus, onReportIssue, onConfirmDelivery }: {
  order: Order;
  onUpdateStatus: (order: Order, status: OrderStatus) => void;
  onReportIssue: () => void;
  onConfirmDelivery: () => void;
}) {
  const meta = STATUS_META[order.status];
  const nextSteps = NEXT_STATUS[order.status] || [];

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
      {/* Priority bar */}
      {order.priority === 'URGENT' && (
        <div className="bg-red-500 px-4 py-1.5 flex items-center gap-1.5">
          <span className="text-white text-xs font-bold">⚡ URGENT</span>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-base">#{order.orderNumber}</span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${meta?.cls}`}>{meta?.label}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              {order.senderBusiness}
            </div>
          </div>
          {order.estimatedWindow && (
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-lg px-2 py-1">
              <Clock className="w-3 h-3" />
              {order.estimatedWindow}
            </div>
          )}
        </div>

        {/* Customer & location */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{order.deliveryArea}</span>
            {order.address && <span className="text-gray-400 text-xs">· {order.address}</span>}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {order.customerName}
            {order.customerPhone && (
              <a href={`tel:${order.customerPhone}`} className="text-indigo-600 text-xs flex items-center gap-0.5 hover:text-indigo-500">
                <Phone className="w-3 h-3" /> {order.customerPhone}
              </a>
            )}
          </div>
        </div>

        {/* Dispatcher note */}
        {order.dispatcherNote && (
          <div className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-3 border border-amber-100">
            📋 {order.dispatcherNote}
          </div>
        )}

        {/* Issue shown */}
        {order.status === 'ISSUE_REPORTED' && order.issues.length > 0 && (
          <div className="text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2 mb-3 border border-red-100 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Issue reported: {order.issues[0].reason}</span>
          </div>
        )}

        {/* Action buttons */}
        {order.status !== 'DELIVERED' && order.status !== 'ISSUE_REPORTED' && (
          <div className="flex gap-2">
            {/* Progress button */}
            {nextSteps.map((next) => (
              <button
                key={next.status}
                onClick={() => onUpdateStatus(order, next.status)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors ${next.cls}`}
              >
                {next.label}
              </button>
            ))}

            {/* Deliver button for ON_THE_WAY */}
            {order.status === 'ON_THE_WAY' && (
              <button
                onClick={onConfirmDelivery}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Delivered
              </button>
            )}

            {/* Report issue */}
            {['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status) && (
              <button
                onClick={onReportIssue}
                className="py-2.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                title="Report issue"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {order.status === 'DELIVERED' && order.proof && (
          <div className="text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" />
            Delivered · Signed by {order.proof.recipientName}
          </div>
        )}
      </div>
    </div>
  );
}
