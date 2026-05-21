import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Truck, CheckCircle, Clock, Package, AlertTriangle, ArrowLeft, Phone, MapPin, Building2 } from 'lucide-react';
import api from '../lib/api';

interface TrackResult {
  orderNumber: string;
  senderBusiness: string;
  deliveryArea: string;
  status: string;
  priority: string;
  estimatedWindow?: string;
  createdAt: string;
  updatedAt: string;
  driver: { firstName: string; phone?: string } | null;
  statusHistory: { status: string; timestamp: string; note?: string }[];
}

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType; desc: string }> = {
  WAITING:        { label: 'Waiting',       cls: 'text-gray-600 bg-gray-100',      icon: Clock,         desc: 'Your order is queued and will be assigned to a driver soon.' },
  ASSIGNED:       { label: 'Assigned',      cls: 'text-blue-700 bg-blue-100',      icon: Truck,         desc: 'A driver has been assigned and will pick up your order shortly.' },
  ACCEPTED:       { label: 'Accepted',      cls: 'text-violet-700 bg-violet-100',  icon: Package,       desc: 'Your driver has accepted the order and is heading to pick it up.' },
  PICKED_UP:      { label: 'Picked Up',     cls: 'text-amber-700 bg-amber-100',    icon: Package,       desc: 'Your order has been picked up and is on its way!' },
  ON_THE_WAY:     { label: 'On the Way',    cls: 'text-orange-700 bg-orange-100',  icon: Truck,         desc: 'Your driver is on the way to your location.' },
  DELIVERED:      { label: 'Delivered',     cls: 'text-emerald-700 bg-emerald-100', icon: CheckCircle,  desc: 'Your order has been successfully delivered. Enjoy!' },
  ISSUE_REPORTED: { label: 'Issue',         cls: 'text-red-700 bg-red-100',        icon: AlertTriangle, desc: 'There is a delay or issue with this order. Our team is working on it.' },
};

const STATUS_ORDER = ['WAITING', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'];

export default function CustomerTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = orderNumber.trim();
    if (!num) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);
    try {
      const { data } = await api.get(`/track/${num}`);
      setResult(data);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Could not find that order. Please check the number and try again.');
    } finally { setLoading(false); }
  };

  const meta = result ? STATUS_META[result.status] : null;
  const StatusIcon = meta?.icon || Package;
  const currentStep = result ? STATUS_ORDER.indexOf(result.status) : -1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 rounded-lg p-1.5">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Yalla Wassel</span>
        </div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Track Your Order</h1>
          <p className="text-slate-400">Enter your order number to see real-time status</p>
        </div>

        {/* Search */}
        <form onSubmit={track} className="w-full mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. 1001"
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 rounded-2xl px-4 py-4 pl-12 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !orderNumber.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-semibold transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? '…' : 'Track'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-300 font-medium">{error}</p>
            <p className="text-red-400/60 text-sm mt-1">Try: 1001, 1002, 1003, 1004, 1005, 1006</p>
          </div>
        )}

        {/* Result */}
        {result && meta && (
          <div className="w-full space-y-4 animate-fade-in">
            {/* Main status card */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Order Number</p>
                  <h2 className="text-3xl font-bold text-gray-900 font-mono">#{result.orderNumber}</h2>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${meta.cls}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="font-semibold text-sm">{meta.label}</span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-5">{meta.desc}</p>

              {/* Progress steps */}
              {result.status !== 'ISSUE_REPORTED' && (
                <div className="mb-5">
                  <div className="flex items-center justify-between">
                    {STATUS_ORDER.slice(0, -1).map((s, i) => (
                      <div key={s} className="flex items-center flex-1">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${i <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                        {i < STATUS_ORDER.length - 2 && (
                          <div className={`flex-1 h-0.5 mx-0.5 transition-colors ${i < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    ))}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${currentStep >= STATUS_ORDER.length - 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">Waiting</span>
                    <span className="text-xs text-gray-400">Delivered</span>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Sender:</span>
                  <span className="font-medium text-gray-900">{result.senderBusiness}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Delivery area:</span>
                  <span className="font-medium text-gray-900">{result.deliveryArea}</span>
                </div>
                {result.estimatedWindow && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Estimated window:</span>
                    <span className="font-medium text-gray-900">{result.estimatedWindow}</span>
                  </div>
                )}
                {result.driver && (
                  <div className="flex items-center gap-3 text-sm">
                    <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Driver:</span>
                    <span className="font-medium text-gray-900">{result.driver.firstName}</span>
                    {result.driver.phone && (
                      <a href={`tel:${result.driver.phone}`} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-500 ml-1">
                        <Phone className="w-3.5 h-3.5" />{result.driver.phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Status timeline */}
            {result.statusHistory.length > 0 && (
              <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-3 text-sm">Order Timeline</h3>
                <div className="space-y-3">
                  {result.statusHistory.map((h, i) => {
                    const hm = STATUS_META[h.status];
                    const HIcon = hm?.icon || Package;
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${hm?.cls || 'bg-gray-100 text-gray-600'}`}>
                            <HIcon className="w-3.5 h-3.5" />
                          </div>
                          {i < result.statusHistory.length - 1 && <div className="w-px flex-1 bg-white/10 my-1" />}
                        </div>
                        <div className="pb-1">
                          <p className="text-white text-sm font-medium">{hm?.label || h.status}</p>
                          {h.note && <p className="text-slate-400 text-xs mt-0.5">{h.note}</p>}
                          <p className="text-slate-500 text-xs mt-0.5">
                            {new Date(h.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty initial state */}
        {!searched && !result && (
          <div className="text-center text-slate-500 py-8">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Enter your order number above to track your delivery</p>
            <p className="text-xs mt-1 opacity-60">You can find the number in your order confirmation</p>
          </div>
        )}
      </main>
    </div>
  );
}
