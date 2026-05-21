import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { ReportsData } from '../types';

const STATUS_CHIP: Record<string, string> = {
  AVAILABLE:   'chip chip-available',
  ON_DELIVERY: 'chip chip-on-delivery',
  ON_BREAK:    'chip chip-on-break',
  OFF_DUTY:    'chip chip-off-duty',
};
const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available', ON_DELIVERY: 'On Delivery', ON_BREAK: 'On Break', OFF_DUTY: 'Off Duty',
};

export default function Reports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try { const r = await api.get('/reports'); setData(r.data); }
    catch { /* ignore */ } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-background text-on-surface">

      {/* Header */}
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dispatcher')}
              className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-body-md transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <span className="text-outline-variant">|</span>
            <span className="font-semibold text-on-surface text-body-md">Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => load(true)}
              className={`p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { logout(); navigate('/'); }}
              className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Page title */}
        <div className="border-b border-outline-variant pb-6">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Dispatcher View</p>
          <h1 className="text-headline-lg text-on-surface">Team Analytics</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Based on driver self-reported milestones — no location data</p>
        </div>

        {/* Summary stat cards */}
        {s && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders',   value: s.totalOrders,     cls: 'text-on-surface' },
              { label: 'Completed',      value: s.completedOrders, cls: 'text-green-700'  },
              { label: 'Avg / Driver',   value: s.avgOrders,       cls: 'text-primary'    },
              { label: 'Fairness Score', value: `${s.fairnessScore}%`, cls: s.fairnessScore >= 70 ? 'text-green-700' : 'text-orange-600' },
            ].map(item => (
              <div key={item.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${item.cls}`}>{item.value}</div>
                <div className="text-label-sm text-on-surface-variant mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Fairness banner */}
        {s && (
          <div className={`rounded-xl border p-4 text-body-md ${
            s.fairnessScore >= 70
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-orange-50 border-orange-200 text-orange-800'
          }`}>
            {s.fairnessScore >= 70
              ? `⚖️ Workload is well balanced — drivers have between ${s.minOrders} and ${s.maxOrders} orders each.`
              : `⚖️ Workload is unbalanced — consider redistributing. Range: ${s.minOrders}–${s.maxOrders} orders per driver.`
            }
          </div>
        )}

        {/* Driver breakdown */}
        <div>
          <h2 className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">Per Driver</h2>
          <div className="space-y-3">
            {data?.drivers.map(({ driver, total, completed, active, issues, completedToday, completionRate }) => (
              <div key={driver.id} className="card p-5">

                {/* Driver header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary text-on-primary rounded-full flex items-center justify-center font-bold text-body-md">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface text-body-md">{driver.name}</p>
                      <p className="text-xs text-on-surface-variant">{driver.zone}</p>
                    </div>
                  </div>
                  <span className={STATUS_CHIP[driver.driverStatus] || 'chip chip-off-duty'}>
                    {STATUS_LABEL[driver.driverStatus]}
                  </span>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Total',  value: total,          cls: 'text-on-surface' },
                    { label: 'Done',   value: completed,      cls: 'text-green-700'  },
                    { label: 'Active', value: active,         cls: 'text-primary'    },
                    { label: 'Today',  value: completedToday, cls: 'text-on-surface' },
                  ].map(m => (
                    <div key={m.label} className="text-center bg-surface-container rounded-xl py-2">
                      <div className={`text-lg font-bold ${m.cls}`}>{m.value}</div>
                      <div className="text-xs text-on-surface-variant">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Completion bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-surface-container-highest rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 50 ? 'bg-orange-400' : 'bg-error'}`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className={`text-body-md font-semibold w-10 text-right ${completionRate >= 80 ? 'text-green-700' : completionRate >= 50 ? 'text-orange-600' : 'text-error'}`}>
                    {completionRate}%
                  </span>
                  {issues > 0 && (
                    <span className="chip chip-issue">{issues} issue{issues > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust note */}
        <div className="card bg-secondary-container border-none p-4 text-body-md text-on-secondary-container flex items-start gap-3">
          <span className="text-lg flex-shrink-0">🤝</span>
          <p>These numbers come entirely from what drivers report themselves — no GPS, no tracking. That's how trust works.</p>
        </div>
      </main>
    </div>
  );
}
