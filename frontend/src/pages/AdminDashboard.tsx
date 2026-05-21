import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, RefreshCw, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface DispatcherAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dispatchers, setDispatchers] = useState<DispatcherAccount[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  const fetchDispatchers = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/admin/dispatchers');
      setDispatchers(data);
    } catch {
      setError('Could not load dispatchers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDispatchers(); }, [fetchDispatchers]);

  const createDispatcher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.post('/admin/dispatchers', form);
      setForm({ name: '', email: '', phone: '', password: '' });
      setMessage('Dispatcher account created.');
      fetchDispatchers(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not create dispatcher.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo-mark.png" alt="Yalla Wassel" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-bold text-on-surface text-sm">Yalla Wassel Admin</p>
              <p className="text-xs text-on-surface-variant">Signed in as {user?.name || 'Admin'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchDispatchers(true)} className={`btn-ghost ${refreshing ? 'animate-spin' : ''}`} title="Refresh dispatchers">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-headline-md font-semibold text-on-surface">Admin page</h1>
            <p className="text-body-md text-on-surface-variant mt-0.5">Add dispatchers and manage dispatcher access.</p>
          </div>
          <div className="card px-4 py-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-body-md font-semibold text-on-surface">{dispatchers.length}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[360px,1fr] gap-5 items-start">
          <section className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-on-surface">Add dispatcher</h2>
            </div>

            {message && <p className="text-green-700 text-body-md mb-4 bg-green-100 px-3 py-2 rounded-lg">{message}</p>}
            {error && <p className="text-error text-body-md mb-4 bg-error-container px-3 py-2 rounded-lg">{error}</p>}

            <form onSubmit={createDispatcher} className="space-y-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Sara Al-Sharif" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="dispatcher@yallawassel.com" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0799123456" />
              </div>
              <div>
                <label className="label">Password *</label>
                <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={3} placeholder="At least 3 characters" />
              </div>
              <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
                <Plus className="w-4 h-4" />
                {saving ? 'Creating...' : 'Create dispatcher'}
              </button>
            </form>
          </section>

          <section className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-on-surface">Dispatchers</h2>
              </div>
              <span className="text-xs text-on-surface-variant">{dispatchers.length} total</span>
            </div>

            {dispatchers.length === 0 ? (
              <div className="text-center py-14 text-on-surface-variant">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No dispatchers yet</p>
              </div>
            ) : (
              <div>
                {dispatchers.map(dispatcher => (
                  <div key={dispatcher.id} className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant last:border-0">
                    <div className="w-9 h-9 bg-primary-fixed text-on-primary-fixed rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {dispatcher.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface text-body-md truncate">{dispatcher.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{dispatcher.email}{dispatcher.phone ? ` - ${dispatcher.phone}` : ''}</p>
                    </div>
                    <span className="chip chip-assigned">Dispatcher</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
