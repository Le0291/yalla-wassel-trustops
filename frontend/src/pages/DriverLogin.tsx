import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_DRIVERS = [
  { name: 'Mahmoud Salem',   email: 'mahmoud@yallawassel.com', zone: 'West Amman'    },
  { name: 'Yousef Daher',    email: 'yousef@yallawassel.com',  zone: 'West Amman'    },
  { name: 'Hamza Najjar',    email: 'hamza@yallawassel.com',   zone: 'Central Amman' },
  { name: 'Amjad Tarzi',     email: 'amjad@yallawassel.com',   zone: 'Central Amman' },
  { name: 'Wael Odeh',       email: 'wael@yallawassel.com',    zone: 'East Amman'    },
  { name: 'Khaled Al Rifai', email: 'khaled@yallawassel.com',  zone: 'East Amman'    },
];

export default function DriverLogin() {
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
      if (user.role === 'DRIVER') navigate('/driver');
      else setError("This account isn't a driver account.");
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
          <h1 className="text-headline-md font-semibold text-on-surface mb-1">Driver login</h1>
          <p className="text-body-md text-on-surface-variant mb-5">Pick up and deliver orders</p>

          {error && (
            <div className="bg-error-container text-error rounded-xl px-4 py-3 text-body-md mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dropdown quick-select */}
            <div>
              <label className="label">Select driver</label>
              <div className="relative">
                <select
                  className="input appearance-none pr-10 cursor-pointer"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                >
                  <option value="">Choose a driver…</option>
                  {DEMO_DRIVERS.map(d => (
                    <option key={d.email} value={d.email}>
                      {d.name} — {d.zone}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 bg-surface-container-low border border-outline-variant rounded-xl">
            <p className="text-body-md text-on-surface-variant mb-2 font-medium">
              Demo drivers — all use password <span className="font-mono text-on-surface">123</span>
            </p>
            <div className="space-y-1">
              {DEMO_DRIVERS.map(d => (
                <div key={d.email} className="flex items-center justify-between">
                  <span className="text-body-md text-on-surface font-medium">{d.name}</span>
                  <span className="font-mono text-on-surface-variant text-xs">{d.email.split('@')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-body-md text-on-surface-variant mt-5">
          A dispatcher? <Link to="/login/dispatcher" className="text-primary hover:opacity-80 font-medium">Dispatcher login →</Link>
        </p>
      </div>
    </div>
  );
}
