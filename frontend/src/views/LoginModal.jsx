import React, { useState } from 'react';
import { Layers, ShieldCheck, User, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../api';

export default function LoginModal({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleManualLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const data = await api.login(email, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (role, userId) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.demoSwitch(role, userId);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">CampOS</h1>
          <p className="text-xs text-slate-400">
            Campus Operating System • Unified Operations & SLA Escalation
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-300 px-4 py-2.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Standard Email/Password Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="name@campos.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Evaluator Quick Access Personas */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>One-Click Evaluator Personas (Live JWT)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Select any pre-configured test persona below to instantly obtain verified JWT tokens:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickPersona('student', 'u-std-1')}
              className="w-full bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <div className="font-bold text-white">Rahul Verma</div>
                <div className="text-[10px] text-slate-400">Student • Girls Block A (Rm 204)</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                Student
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPersona('warden', 'u-stf-1')}
              className="w-full bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <div className="font-bold text-white">Warden Sharma</div>
                <div className="text-[10px] text-slate-400">Warden • Scoped to Girls Block A</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800 font-bold">
                Warden
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPersona('admin', 'u-stf-3')}
              className="w-full bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <div className="font-bold text-white">Dr. A. K. Satpathy</div>
                <div className="text-[10px] text-slate-400">Chief Admin / Dean of Student Affairs</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950 text-purple-400 border border-purple-800 font-bold">
                Chief Admin
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500">
          CampOS v2.0 • BPUT Hackathon PS07 Solution Architecture
        </p>
      </div>
    </div>
  );
}
