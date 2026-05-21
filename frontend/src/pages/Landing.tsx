import { useNavigate } from 'react-router-dom';
import { Truck, Shield, BarChart3, Clock, CheckCircle, Users, ArrowRight, MapPin } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-500 rounded-xl p-2">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-lg">Yalla Wassel</span>
            <span className="text-indigo-400 text-xs font-semibold ml-1.5 uppercase tracking-wider">TrustOps</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/track')} className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
            Track Order
          </button>
          <button onClick={() => navigate('/login/driver')} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
            Driver Login
          </button>
          <button
            onClick={() => navigate('/login/dispatcher')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Dispatcher
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-indigo-300 text-sm font-medium">Same-day delivery · Amman, Jordan 🇯🇴</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
          Accountability<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Without Surveillance
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Smart delivery management that respects drivers, delights customers, and empowers dispatchers —
          milestone tracking instead of GPS, trust instead of cameras.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/login/dispatcher')}
            className="group inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5"
          >
            Dispatcher Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/login/driver')}
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-8 py-4 rounded-2xl text-base font-semibold border border-white/10 transition-all hover:-translate-y-0.5"
          >
            Driver App
          </button>
          <button
            onClick={() => navigate('/track')}
            className="inline-flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 px-8 py-4 rounded-2xl text-base font-medium transition-colors"
          >
            Track My Order →
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section className="max-w-7xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          {[
            { value: '6', label: 'Active Drivers' },
            { value: '3', label: 'Delivery Zones' },
            { value: '0', label: 'GPS Trackers' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/60 px-6 py-5 text-center">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-3">Built on Trust, Not Tracking</h2>
        <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto">
          Every feature is designed to create accountability through transparency, not surveillance.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="bg-indigo-500/10 border border-indigo-500/10 rounded-xl p-3 w-fit mb-4">
                <f.icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block flex-1 h-px bg-indigo-500/20" />
                )}
              </div>
              <h4 className="font-semibold text-white mb-1.5">{step.title}</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-3xl px-8 py-12 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready for a demo?</h2>
          <p className="text-slate-400 mb-6">Login with demo credentials and explore the full system.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login/dispatcher')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Open Dispatcher Dashboard
            </button>
            <button
              onClick={() => navigate('/login/driver')}
              className="bg-white/10 hover:bg-white/15 text-white px-8 py-3 rounded-xl font-medium border border-white/10 transition-colors"
            >
              Open Driver App
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 rounded-lg p-1.5">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Yalla Wassel TrustOps</span>
          </div>
          <p className="text-slate-500 text-sm">Hackathon MVP · Amman, Jordan · Built with ❤️</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: Shield, title: 'Driver Dignity', desc: 'No GPS surveillance. Drivers self-report milestones, building a culture of mutual trust and accountability.' },
  { icon: BarChart3, title: 'Workload Fairness', desc: 'Smart suggestions ensure orders are distributed fairly across drivers by zone, availability, and current load.' },
  { icon: CheckCircle, title: 'Proof of Delivery', desc: 'Structured confirmation with recipient name and notes — accountability without cameras or invasive tech.' },
  { icon: Clock, title: 'Real-time Status', desc: 'Customers track their order with just an order number. No app download, no login required.' },
  { icon: Users, title: 'Team Visibility', desc: "Dispatchers see the full picture: who's busy, who's available, and what needs urgent attention." },
  { icon: Truck, title: 'Exception Alerts', desc: 'Issues, delays, and unaccepted orders surface immediately so dispatchers can intervene before problems escalate.' },
];

const steps = [
  { title: 'Create Order', desc: 'Dispatcher creates an order with business, customer, area, and priority level.' },
  { title: 'Assign Driver', desc: 'System suggests the best driver by zone and workload. Dispatcher confirms with one click.' },
  { title: 'Driver Delivers', desc: 'Driver updates milestones: accepted → picked up → on the way → delivered.' },
  { title: 'Proof & Done', desc: 'Driver submits recipient name as proof. Customer order is confirmed complete.' },
];
