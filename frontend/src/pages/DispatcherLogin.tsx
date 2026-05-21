import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Eye, EyeOff, ArrowLeft, AlertCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DispatcherLogin() {
  const [email, setEmail] = useState('dispatcher@yallawassel.com');
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
      if (user.role === 'DISPATCHER') navigate('/dispatcher');
      else setError('This account does not have dispatcher access.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group text-sm">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 rounded-xl p-2.5">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dispatcher Login</h1>
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
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in as Dispatcher'}
            </button>
          </form>

          <div className="mt-5 p-3.5 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 mb-1">Demo credentials</p>
            <p className="text-xs text-indigo-600 font-mono">dispatcher@yallawassel.com</p>
            <p className="text-xs text-indigo-600 font-mono">password123</p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            A driver?{' '}
            <Link to="/login/driver" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Driver login →
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Truck className="w-4 h-4 text-slate-500" />
          <span className="text-slate-500 text-sm">Yalla Wassel TrustOps</span>
        </div>
      </div>
    </div>
  );
}
