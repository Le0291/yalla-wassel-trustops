import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DriverLogin() {
  const [email, setEmail] = useState('mahmoud@yallawassel.com');
  const [password, setPassword] = useState('password123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'DRIVER') navigate('/driver');
      else setError('This account does not have driver access.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoDrivers = [
    { name: 'Mahmoud Salem', email: 'mahmoud@yallawassel.com', zone: 'West Amman' },
    { name: 'Yousef Daher', email: 'yousef@yallawassel.com', zone: 'West Amman' },
    { name: 'Hamza Najjar', email: 'hamza@yallawassel.com', zone: 'Central Amman' },
    { name: 'Wael Odeh', email: 'wael@yallawassel.com', zone: 'East Amman' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group text-sm">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-600 rounded-xl p-2.5">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Driver Login</h1>
              <p className="text-xs text-gray-400 mt-0.5">Yalla Wassel TrustOps</p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in as Driver'}
            </button>
          </form>

          <div className="mt-5 p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 mb-2">Quick login — click to select:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {demoDrivers.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => setEmail(d.email)}
                  className={`text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    email === d.email
                      ? 'bg-emerald-100 text-emerald-800 font-semibold'
                      : 'hover:bg-emerald-100/60 text-emerald-700'
                  }`}
                >
                  <div className="font-medium">{d.name.split(' ')[0]}</div>
                  <div className="text-emerald-500/80">{d.zone}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-mono">Password: password123</p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            A dispatcher?{' '}
            <Link to="/login/dispatcher" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Dispatcher login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
