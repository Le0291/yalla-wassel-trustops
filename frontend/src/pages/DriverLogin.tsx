import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_DRIVERS = [
  { name: 'Mahmoud', email: 'mahmoud@yallawassel.com', zone: 'West Amman' },
  { name: 'Yousef',  email: 'yousef@yallawassel.com',  zone: 'West Amman' },
  { name: 'Hamza',   email: 'hamza@yallawassel.com',   zone: 'Central Amman' },
  { name: 'Amjad',   email: 'amjad@yallawassel.com',   zone: 'Central Amman' },
  { name: 'Wael',    email: 'wael@yallawassel.com',    zone: 'East Amman' },
  { name: 'Khaled',  email: 'khaled@yallawassel.com',  zone: 'East Amman' },
];

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
      else setError("This account isn't a driver account.");
    } catch {
      setError('Wrong email or password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-2 mb-8">
          <Truck className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-gray-900">Yalla Wassel</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Driver login</h1>
          <p className="text-sm text-gray-400 mb-5">Pick up and deliver orders</p>

          {/* Quick pick */}
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-2">Quick select (demo):</p>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_DRIVERS.map(d => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => setEmail(d.email)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition-colors text-center ${
                    email === d.email
                      ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4 font-mono">Password for all drivers: password123</p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          A dispatcher? <Link to="/login/dispatcher" className="text-indigo-600 hover:text-indigo-500 font-medium">Dispatcher login →</Link>
        </p>
      </div>
    </div>
  );
}
