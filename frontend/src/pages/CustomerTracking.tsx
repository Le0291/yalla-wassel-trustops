import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, MapPin, Phone, MessageSquare, Bell, User } from 'lucide-react';
import api from '../lib/api';

interface TrackResult {
  orderNumber: string;
  senderBusiness: string;
  deliveryArea: string;
  address?: string;
  status: string;
  estimatedWindow?: string;
  driver: { firstName: string; phone?: string } | null;
  statusHistory: { status: string; timestamp: string; note?: string }[];
}

// Steps in display order
const STEPS: { key: string; label: string; icon: string }[] = [
  { key: 'WAITING',    label: 'Order Received', icon: '🧾' },
  { key: 'PICKED_UP',  label: 'Picked Up',      icon: '📦' },
  { key: 'ON_THE_WAY', label: 'In Transit',      icon: '🛵' },
  { key: 'DELIVERED',  label: 'Delivered',       icon: '🏠' },
];

// Map all backend statuses to a step index
const STATUS_STEP: Record<string, number> = {
  WAITING: 0, ASSIGNED: 0, ACCEPTED: 1,
  PICKED_UP: 1, ON_THE_WAY: 2, DELIVERED: 3, ISSUE_REPORTED: 2,
};

const STATUS_INFO: Record<string, { label: string; desc: string }> = {
  WAITING:        { label: 'Waiting',          desc: "Your order is in the queue — we'll assign a driver shortly." },
  ASSIGNED:       { label: 'Driver Assigned',  desc: 'A driver has been assigned and is heading to pick up your order.' },
  ACCEPTED:       { label: 'Order Accepted',   desc: 'Your driver has confirmed and is on the way to pick it up.' },
  PICKED_UP:      { label: 'Picked Up',        desc: 'Your order has been picked up and is on its way!' },
  ON_THE_WAY:     { label: 'In Transit',       desc: 'Your driver is heading to you right now.' },
  DELIVERED:      { label: 'Delivered!',       desc: 'Your order was delivered successfully. Enjoy!' },
  ISSUE_REPORTED: { label: 'Small Delay',      desc: "There's a small issue — our team is working on it." },
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function CustomerTracking() {
  const [input, setInput]   = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

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

  const stepIndex = result ? (STATUS_STEP[result.status] ?? 0) : -1;
  const info      = result ? STATUS_INFO[result.status] : null;
  const isIssue   = result?.status === 'ISSUE_REPORTED';

  // Progress bar width (0%, 33%, 66%, 100%)
  const progressPct = stepIndex >= 0 ? (stepIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-on-surface">

      {/* Top Nav */}
      <nav className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-4 md:px-8 h-16 fixed top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo-mark.png" alt="Yalla Wassel" className="h-8 w-8 object-contain" />
          <span className="text-headline-md font-bold text-primary">Yalla Wassel</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors">
            <User className="w-4 h-4" />
          </button>
          <Link to="/" className="text-label-sm text-on-surface-variant hover:text-on-surface ml-2 transition-colors">← Home</Link>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-[1440px] mx-auto">

        {/* Hero / search header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant pb-8">
          <div>
            <h1 className="text-headline-lg text-on-surface mb-1">Order Tracking</h1>
            {result ? (
              <p className="text-body-md text-on-surface-variant">
                Order ID: <span className="font-medium text-data-mono text-primary">#{result.orderNumber}</span>
              </p>
            ) : (
              <p className="text-body-md text-on-surface-variant">Enter your order number to track your delivery</p>
            )}
          </div>

          {result?.estimatedWindow && !isIssue && (
            <div className="bg-primary-container text-on-primary-container px-6 py-4 rounded-xl flex items-center gap-4 shadow-card">
              <span className="text-2xl">⏱</span>
              <div>
                <p className="text-label-sm opacity-90 uppercase tracking-wider">Estimated Arrival</p>
                <p className="text-headline-md font-semibold">{result.estimatedWindow}</p>
              </div>
            </div>
          )}
        </header>

        {/* Search bar */}
        <form onSubmit={track} className="flex gap-3 mb-10 max-w-xl">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Order number (e.g. 1001)"
            className="input flex-1 font-mono text-base"
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-6 h-10">
            {loading ? '…' : <><Search className="w-4 h-4" /> Track</>}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="card border-error/30 bg-error-container/30 p-5 text-center mb-8 max-w-xl">
            <p className="text-error font-medium text-body-md">{error}</p>
            <p className="text-on-surface-variant text-xs mt-1">Try order numbers: 1001, 1002, 1003…</p>
          </div>
        )}

        {/* Empty state */}
        {!result && !error && (
          <div className="text-center py-20 text-on-surface-variant">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-body-md">Your order number is in your confirmation message</p>
          </div>
        )}

        {/* Result */}
        {result && info && (
          <div className="animate-fade-in flex flex-col items-center">

            {/* Progress stepper */}
            <section className="w-full max-w-4xl py-10 mb-10">

              {isIssue ? (
                <div className="card bg-error-container/30 border-error/30 p-6 text-center">
                  <p className="text-2xl mb-2">⚠️</p>
                  <p className="text-headline-md font-semibold text-error">{info.label}</p>
                  <p className="text-body-md text-on-surface-variant mt-1">{info.desc}</p>
                </div>
              ) : (
                <div className="relative flex justify-between items-start">
                  {/* Track background */}
                  <div className="absolute top-[28px] left-[12.5%] right-[12.5%] h-1.5 bg-surface-container-highest rounded-full z-0" />
                  {/* Active track */}
                  <div
                    className="absolute top-[28px] left-[12.5%] h-1.5 bg-primary rounded-full z-0 transition-all duration-700 ease-in-out"
                    style={{ width: `${(progressPct / 100) * 75}%` }}
                  />

                  {STEPS.map((step, i) => {
                    const done    = i < stepIndex;
                    const current = i === stepIndex;
                    const future  = i > stepIndex;
                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center w-1/4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-card border-4 border-white mb-4 transition-all
                          ${done    ? 'bg-primary text-on-primary' : ''}
                          ${current ? 'bg-primary text-on-primary shadow-hover animate-pulse ring-4 ring-primary/20' : ''}
                          ${future  ? 'bg-surface-container-highest text-on-surface-variant' : ''}
                        `}>
                          {step.icon}
                        </div>
                        <span className={`text-sm font-semibold text-center px-2 ${current ? 'text-primary' : future ? 'text-on-surface-variant font-normal' : 'text-on-surface'}`}>
                          {step.label}
                        </span>
                        {current && (
                          <span className="text-xs text-primary font-medium mt-1">{info.label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3-card info grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">

              {/* Rider Details */}
              <section className="card p-6 shadow-card">
                <h3 className="text-label-sm text-on-surface-variant mb-5 flex items-center gap-2 uppercase tracking-widest">
                  <User className="w-4 h-4" /> Rider Details
                </h3>
                {result.driver ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-lg">
                        {initials(result.driver.firstName)}
                      </div>
                      <div>
                        <p className="text-body-lg font-bold text-on-surface">{result.driver.firstName}</p>
                        <p className="text-label-sm text-on-surface-variant">Your delivery rider</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {result.driver.phone ? (
                        <a href={`tel:${result.driver.phone}`}
                          className="flex-1 btn-primary justify-center h-10 text-label-sm">
                          <Phone className="w-4 h-4" /> Call
                        </a>
                      ) : (
                        <button disabled className="flex-1 btn-primary justify-center h-10 opacity-40" title="No phone on file">
                          <Phone className="w-4 h-4" /> Call
                        </button>
                      )}
                      <button className="flex-1 btn-secondary justify-center h-10 text-label-sm">
                        <MessageSquare className="w-4 h-4" /> Chat
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-on-surface-variant">
                    <p className="text-body-md">No rider assigned yet</p>
                  </div>
                )}
              </section>

              {/* Order Summary */}
              <section className="card p-6 shadow-card">
                <h3 className="text-label-sm text-on-surface-variant mb-5 uppercase tracking-widest">Order Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-start">
                    <p className="text-body-md font-medium text-on-surface">From</p>
                    <p className="text-body-md font-semibold text-on-surface text-right">{result.senderBusiness}</p>
                  </div>
                  <div className="flex justify-between items-start">
                    <p className="text-body-md font-medium text-on-surface">To</p>
                    <p className="text-body-md font-semibold text-on-surface text-right">{result.deliveryArea}</p>
                  </div>
                  <div className="flex justify-between items-start">
                    <p className="text-body-md font-medium text-on-surface">Status</p>
                    <span className={`chip ${isIssue ? 'chip-issue' : stepIndex >= 3 ? 'chip-delivered' : stepIndex >= 2 ? 'chip-transit' : 'chip-assigned'}`}>
                      {info.label}
                    </span>
                  </div>
                </div>
                {result.estimatedWindow && (
                  <div className="pt-4 border-t border-outline-variant">
                    <div className="flex justify-between">
                      <span className="text-body-md font-bold text-on-surface">ETA</span>
                      <span className="text-body-md font-bold text-primary">{result.estimatedWindow}</span>
                    </div>
                  </div>
                )}
              </section>

              {/* Delivery Address */}
              <section className="card p-6 shadow-card">
                <h3 className="text-label-sm text-on-surface-variant mb-5 uppercase tracking-widest">Delivery Address</h3>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-body-md font-bold text-on-surface">{result.deliveryArea}</p>
                    {result.address && (
                      <p className="text-body-md text-on-surface-variant leading-relaxed mt-1">{result.address}</p>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                {result.statusHistory.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-outline-variant">
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-3">Timeline</p>
                    <div className="space-y-3">
                      {result.statusHistory.slice().reverse().map((h, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-body-md font-medium text-on-surface">
                              {STATUS_INFO[h.status]?.label || h.status}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {new Date(h.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface border-t border-outline-variant shadow-lg">
        <button className="flex flex-col items-center justify-center text-primary font-bold px-4 py-1">
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-label-sm">Track</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1">
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-label-sm">History</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1">
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span className="text-label-sm">Support</span>
        </button>
      </footer>
    </div>
  );
}
