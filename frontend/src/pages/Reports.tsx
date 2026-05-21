import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { ReportsData } from '../types';

const STATUS_CLS: Record<string, string> = {
  AVAILABLE:   'bg-emerald-100 text-emerald-700',
  ON_DELIVERY: 'bg-blue-100 text-blue-700',
  ON_BREAK:    'bg-amber-100 text-amber-700',
  OFF_DUTY:    'bg-gray-100 text-gray-500',
};
const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available', ON_DELIVERY: 'On delivery', ON_BREAK: 'On break', OFF_DUTY: 'Off duty',
};

export default function Reports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try { const r = await api.get('/reports'); setData(r.data); }
    catch { /* ignore */ } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dispatcher')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-900 text-sm">Reports</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetch(true)} className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { logout(); navigate('/'); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">How is the team doing?</h1>
          <p className="text-sm text-gray-400 mt-0.5">Based on driver self-reported milestones — no location data</p>
        </div>

        {/* Summary */}
        {s && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total orders', value: s.totalOrders, color: 'text-gray-800' },
              { label: 'Completed', value: s.completedOrders, color: 'text-emerald-600' },
              { label: 'Avg per driver', value: s.avgOrders, color: 'text-blue-600' },
              { label: 'Fairness', value: `${s.fairnessScore}%`, color: s.fairnessScore >= 70 ? 'text-emerald-600' : 'text-amber-600' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Fairness note */}
        {s && (
          <div className={`rounded-2xl border p-4 text-sm ${s.fairnessScore >= 70 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
            {s.fairnessScore >= 70
              ? `⚖️ Workload is well balanced — drivers have between ${s.minOrders} and ${s.maxOrders} orders each.`
              : `⚖️ Workload is unbalanced — consider redistributing. Range: ${s.minOrders}–${s.maxOrders} orders per driver.`
            }
          </div>
        )}

        {/* Driver cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Per driver</h2>
          <div className="space-y-3">
            {data?.drivers.map(({ driver, total, completed, active, issues, completedToday, completionRate }) => (
              <div key={driver.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-indigo-600 text-sm">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{driver.name}</p>
                      <p className="text-xs text-gray-400">{driver.zone}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_CLS[driver.driverStatus] || ''}`}>
                    {STATUS_LABEL[driver.driverStatus]}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Total', value: total, color: 'text-gray-700' },
                    { label: 'Done', value: completed, color: 'text-emerald-600' },
                    { label: 'Active', value: active, color: 'text-blue-600' },
                    { label: 'Today', value: completedToday, color: 'text-indigo-600' },
                  ].map(m => (
                    <div key={m.label} className="text-center bg-gray-50 rounded-xl py-2">
                      <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                      <div className="text-xs text-gray-400">{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${completionRate >= 80 ? 'bg-emerald-500' : completionRate >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                      style={{ width: `${completionRate}%` }} />
                  </div>
                  <span className={`text-sm font-semibold w-10 text-right ${completionRate >= 80 ? 'text-emerald-600' : completionRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                    {completionRate}%
                  </span>
                  {issues > 0 && (
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                      {issues} issue{issues > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-600 flex items-start gap-3">
          <span className="text-lg flex-shrink-0">🤝</span>
          <p>These numbers come entirely from what drivers report themselves — no GPS, no tracking. That's how trust works.</p>
        </div>
      </main>
    </div>
  );
}
