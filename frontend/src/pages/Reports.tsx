import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, BarChart3, Users, TrendingUp, CheckCircle, AlertTriangle, Package, RefreshCw, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { ReportsData } from '../types';

const DRIVER_STATUS_META: Record<string, { label: string; cls: string }> = {
  AVAILABLE:   { label: 'Available',   cls: 'bg-emerald-100 text-emerald-700' },
  ON_DELIVERY: { label: 'On Delivery', cls: 'bg-blue-100 text-blue-700' },
  ON_BREAK:    { label: 'On Break',    cls: 'bg-amber-100 text-amber-700' },
  OFF_DUTY:    { label: 'Off Duty',    cls: 'bg-gray-100 text-gray-500' },
};

export default function Reports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data: res } = await api.get('/reports');
      setData(res);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading reports…</p>
      </div>
    </div>
  );

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dispatcher')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-gray-900 text-sm">Performance Reports</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchReports(true)} className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0)}
              </div>
              <span className="font-medium">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Driver Performance</h1>
          <p className="text-gray-500 text-sm mt-0.5">Accountability through milestones — no location tracking</p>
        </div>

        {/* Summary Cards */}
        {s && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total Orders', value: s.totalOrders, icon: Package, color: 'bg-indigo-100 text-indigo-600' },
              { label: 'Completed', value: s.completedOrders, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
              { label: 'Avg / Driver', value: `${s.avgOrders}`, icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
              { label: 'Fairness Score', value: `${s.fairnessScore}%`, icon: Scale, color: s.fairnessScore >= 70 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600' },
              { label: 'Active Drivers', value: data?.drivers.length || 0, icon: Users, color: 'bg-purple-100 text-purple-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`rounded-xl p-2 ${color}`}><Icon className="w-4 h-4" /></div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fairness Info */}
        {s && (
          <div className={`rounded-2xl border p-4 flex items-start gap-3 ${s.fairnessScore >= 70 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            <Scale className={`w-5 h-5 flex-shrink-0 mt-0.5 ${s.fairnessScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div>
              <p className={`font-semibold text-sm ${s.fairnessScore >= 70 ? 'text-emerald-800' : 'text-amber-800'}`}>
                Workload Fairness: {s.fairnessScore}%
              </p>
              <p className={`text-xs mt-0.5 ${s.fairnessScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                Max orders: {s.maxOrders} · Min orders: {s.minOrders} · Average: {s.avgOrders} per driver.{' '}
                {s.fairnessScore >= 70 ? 'Workload is well balanced across the team.' : 'Consider redistributing orders for better balance.'}
              </p>
            </div>
          </div>
        )}

        {/* Driver Performance Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" /> Driver Performance Table
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{data?.drivers.length || 0} drivers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  {['Driver', 'Zone', 'Status', 'Total', 'Completed', 'Active', 'Issues', 'Done Today', 'Rate'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.drivers.map(({ driver, total, completed, active, issues, completedToday, completionRate }) => (
                  <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{driver.name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{driver.zone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${DRIVER_STATUS_META[driver.driverStatus]?.cls}`}>
                        {DRIVER_STATUS_META[driver.driverStatus]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{total}</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium">{completed}</td>
                    <td className="px-4 py-3 text-blue-700 font-medium">{active}</td>
                    <td className="px-4 py-3">
                      {issues > 0
                        ? <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{issues}</span>
                        : <span className="text-gray-400">0</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{completedToday}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${completionRate >= 80 ? 'bg-emerald-500' : completionRate >= 50 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${completionRate}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${completionRate >= 80 ? 'text-emerald-600' : completionRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!data?.drivers || data.drivers.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No driver data available</p>
            </div>
          )}
        </div>

        {/* Trust note */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-indigo-900 text-sm">Accountability Without Surveillance</p>
            <p className="text-indigo-600 text-xs mt-1 leading-relaxed">
              These metrics are based entirely on driver self-reported milestones and proof of delivery submissions.
              No GPS data, no location tracking — trust is built through transparency, not monitoring.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
