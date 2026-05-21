import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DispatcherLogin() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'DISPATCHER') navigate('/dispatcher');
      else setError("This account isn't a dispatcher account.");
    } catch {
      setError('Wrong email or password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/logo-mark.png" alt="Yalla Wassel" className="h-16 w-16 object-contain" />
          <span className="font-bold text-on-surface text-lg">Yalla Wassel</span>
        </div>

        <div className="card p-7">
          <h1 className="text-headline-md font-semibold text-on-surface mb-1">Dispatcher login</h1>
          <p className="text-body-md text-on-surface-variant mb-6">Manage orders and drivers</p>

          {error && (
            <div className="bg-error-container text-error rounded-xl px-4 py-3 text-body-md mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="dispatcher@yallawassel.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 p-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md text-on-surface-variant">
            Demo — email: <span className="font-mono text-on-surface">dispatcher@yallawassel.com</span><br />
            password: <span className="font-mono text-on-surface">123</span>
          </div>
        </div>

        <p className="text-center text-body-md text-on-surface-variant mt-5">
          A driver? <Link to="/login/driver" className="text-primary hover:opacity-80 font-medium">Driver login →</Link>
        </p>
      </div>
    </div>
  );
}
