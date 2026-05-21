import { useNavigate } from 'react-router-dom';
import { Truck, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">

      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-lg tracking-tight">Yalla Wassel</span>
        </div>
        <button
          onClick={() => navigate('/track')}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Track an order
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-3xl mx-auto w-full">

        <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-300 text-sm mb-8">
          Same-day delivery · Amman, Jordan 🇯🇴
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Manage your drivers<br />
          <span className="text-indigo-400">without watching them.</span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed mb-12">
          Yalla Wassel replaces WhatsApp chaos and paper notes with a simple system built on milestones, proof of delivery, and mutual trust.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto">
          <button
            onClick={() => navigate('/login/dispatcher')}
            className="group flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20"
          >
            I'm a dispatcher
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/login/driver')}
            className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 text-white px-8 py-4 rounded-2xl text-base font-semibold border border-white/10 transition-all hover:-translate-y-0.5"
          >
            I'm a driver
          </button>
          <button
            onClick={() => navigate('/track')}
            className="flex items-center justify-center text-slate-400 hover:text-indigo-300 px-6 py-4 rounded-2xl text-base transition-colors"
          >
            Track my order →
          </button>
        </div>
      </main>

      {/* Simple trust section */}
      <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { emoji: '🚫', title: 'No GPS tracking', desc: 'Drivers update their own milestones. Trust is earned, not enforced.' },
            { emoji: '✅', title: 'Proof of delivery', desc: 'Recipient name and notes — accountability without cameras.' },
            { emoji: '⚖️', title: 'Fair workload', desc: 'See who has too many orders and who needs more. Keep it balanced.' },
          ].map((item) => (
            <div key={item.title} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
              <div className="text-2xl mb-3">{item.emoji}</div>
              <h3 className="font-semibold text-white mb-1.5">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center pb-8 text-slate-600 text-sm">
        Built for a hackathon · Amman, Jordan
      </footer>
    </div>
  );
}
