import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Search, Package } from 'lucide-react';
import api from '../lib/api';

interface TrackResult {
  orderNumber: string;
  senderBusiness: string;
  deliveryArea: string;
  status: string;
  estimatedWindow?: string;
  driver: { firstName: string; phone?: string } | null;
  statusHistory: { status: string; timestamp: string; note?: string }[];
}

const STATUS_INFO: Record<string, { emoji: string; label: string; desc: string; color: string }> = {
  WAITING:        { emoji: '🕐', label: 'Waiting',        desc: "Your order is in the queue — we'll assign a driver shortly.", color: 'text-gray-600' },
  ASSIGNED:       { emoji: '🚗', label: 'Driver assigned', desc: "A driver is heading to pick up your order.",                 color: 'text-blue-600' },
  ACCEPTED:       { emoji: '👍', label: 'Order accepted',  desc: 'Your driver has confirmed and is on the way to pick it up.', color: 'text-violet-600' },
  PICKED_UP:      { emoji: '📦', label: 'Picked up',       desc: "Your order has been picked up and is on its way!",           color: 'text-amber-600' },
  ON_THE_WAY:     { emoji: '🛵', label: 'On the way',      desc: "Your driver is heading to you right now.",                   color: 'text-orange-600' },
  DELIVERED:      { emoji: '✅', label: 'Delivered!',      desc: "Your order was delivered successfully. Enjoy!",              color: 'text-emerald-600' },
  ISSUE_REPORTED: { emoji: '⚠️', label: 'Small delay',     desc: "There's a small issue — our team is working on it.",        color: 'text-red-600' },
};

const STEPS = ['WAITING', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'];

export default function CustomerTracking() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = input.trim();
    if (!num) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.get(`/track/${num}`);
      setResult(data);
    } catch {
      setError("We couldn't find that order. Double-check the number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const info = result ? STATUS_INFO[result.status] : null;
  const stepIndex = result ? STEPS.indexOf(result.status) : -1;

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">

      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white text-sm">Yalla Wassel</span>
        </div>
        <Link to="/" className="text-slate-400 hover:text-white text-sm transition-colors">← Home</Link>
      </nav>

      <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-16 max-w-md mx-auto w-full">

        <div className="text-center mb-10">
          <p className="text-3xl mb-3">🛵</p>
          <h1 className="text-2xl font-bold text-white">Where's my order?</h1>
          <p className="text-slate-400 text-sm mt-2">Enter your order number below</p>
        </div>

        {/* Search */}
        <form onSubmit={track} className="w-full flex gap-2 mb-8">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Order number (e.g. 1001)"
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-slate-500 rounded-2xl px-5 py-4 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-4 rounded-2xl font-semibold transition-colors">
            {loading ? '…' : <Search className="w-5 h-5" />}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center mb-6">
            <p className="text-red-300 font-medium">{error}</p>
            <p className="text-red-400/50 text-xs mt-1">Try: 1001, 1002, 1003, 1004, 1005</p>
          </div>
        )}

        {/* Result */}
        {result && info && (
          <div className="w-full space-y-4 animate-fade-in">

            {/* Main card */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">{info.emoji}</div>
                <h2 className={`text-xl font-bold ${info.color}`}>{info.label}</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">{info.desc}</p>
              </div>

              {/* Progress bar */}
              {result.status !== 'ISSUE_REPORTED' && (
                <div className="flex items-center gap-0 mb-6">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${i <= stepIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                      {i < STEPS.length - 1 && <div className={`flex-1 h-1 transition-colors ${i < stepIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>
              )}

              {/* Order details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order</span>
                  <span className="font-bold text-gray-900 font-mono">#{result.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">From</span>
                  <span className="font-medium text-gray-900">{result.senderBusiness}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Delivering to</span>
                  <span className="font-medium text-gray-900">{result.deliveryArea}</span>
                </div>
                {result.estimatedWindow && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected</span>
                    <span className="font-medium text-gray-900">{result.estimatedWindow}</span>
                  </div>
                )}
                {result.driver && (
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <span className="text-gray-400">Driver</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{result.driver.firstName}</span>
                      {result.driver.phone && (
                        <a href={`tel:${result.driver.phone}`} className="text-indigo-600 hover:text-indigo-500 font-medium">
                          📞 Call
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            {result.statusHistory.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-white text-sm font-semibold mb-4">Order timeline</p>
                <div className="space-y-4">
                  {result.statusHistory.map((h, i) => {
                    const hi = STATUS_INFO[h.status];
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-sm flex-shrink-0">{hi?.emoji || '📦'}</div>
                          {i < result.statusHistory.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                        </div>
                        <div className="pb-1">
                          <p className="text-white text-sm font-medium">{hi?.label || h.status}</p>
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

        {/* Initial empty state */}
        {!result && !error && (
          <div className="text-center text-slate-600">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Your order number is in your confirmation message</p>
          </div>
        )}
      </main>
    </div>
  );
}
