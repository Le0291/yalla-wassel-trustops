import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Truck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const LOGIN_OPTIONS: Record<Role, {
  label: string;
  helper: string;
  email: string;
  path: string;
  icon: ReactNode;
}> = {
  ADMIN: {
    label: 'Admin',
    helper: 'Add dispatcher accounts',
    email: 'admin@yallawassel.com',
    path: '/admin',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  DISPATCHER: {
    label: 'Dispatcher',
    helper: 'Manage orders and drivers',
    email: 'dispatcher@yallawassel.com',
    path: '/dispatcher',
    icon: <Truck className="w-4 h-4" />,
  },
  DRIVER: {
    label: 'Driver',
    helper: 'Update deliveries',
    email: 'mahmoud@yallawassel.com',
    path: '/driver',
    icon: <UserRound className="w-4 h-4" />,
  },
};

export default function Landing() {
  const [role, setRole] = useState<Role>('DISPATCHER');
  const [email, setEmail] = useState(LOGIN_OPTIONS.DISPATCHER.email);
  const [password, setPassword] = useState('123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const chooseRole = (nextRole: Role) => {
    setRole(nextRole);
    setEmail(LOGIN_OPTIONS[nextRole].email);
    setPassword('123');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user.role !== role) {
        logout();
        setError(`This account is not a ${LOGIN_OPTIONS[role].label.toLowerCase()} account.`);
        return;
      }
      navigate(LOGIN_OPTIONS[user.role].path);
    } catch {
      setError('Wrong email or password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-mark.png" alt="Yalla Wassel" className="h-10 w-10 object-contain" />
            <span className="font-bold text-on-surface text-lg">Yalla Wassel</span>
          </div>
          <Link to="/track" className="text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            Track an order
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center mx-auto mb-4 shadow-card">
              {LOGIN_OPTIONS[role].icon}
            </div>
            <h1 className="text-headline-lg font-bold text-on-surface">Sign in to Yalla Wassel</h1>
            <p className="text-body-md text-on-surface-variant mt-1">{LOGIN_OPTIONS[role].helper}</p>
          </div>

          <div className="card p-6">
            <div className="grid grid-cols-3 gap-1 bg-surface-container-low rounded-lg p-1 mb-5">
              {(Object.keys(LOGIN_OPTIONS) as Role[]).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => chooseRole(option)}
                  className={`h-10 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 text-label-sm transition-colors ${
                    role === option
                      ? 'bg-surface-container-lowest text-primary shadow-card'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {LOGIN_OPTIONS[option].icon}
                  <span>{LOGIN_OPTIONS[option].label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-error-container text-error rounded-xl px-4 py-3 text-body-md mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input className="input pr-11" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                {loading ? 'Signing in...' : `Sign in as ${LOGIN_OPTIONS[role].label}`}
              </button>
            </form>

            <div className="mt-5 p-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md text-on-surface-variant">
              Demo email: <span className="font-mono text-on-surface">{LOGIN_OPTIONS[role].email}</span><br />
              Password: <span className="font-mono text-on-surface">123</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
