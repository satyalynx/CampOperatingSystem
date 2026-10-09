import React, { useState } from 'react';
import { Layers, User, Lock, Sparkles, ArrowRight, GraduationCap, Shield, Landmark } from 'lucide-react';
import { api } from '../api';
import CampusBackground from '../components/CampusBackground';

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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative">
      <CampusBackground />
      <div className="max-w-md w-full sb-card p-7 space-y-5 relative z-10 shadow-soft-md">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 flex items-center justify-center shadow-2xs">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">CampOS</h1>
          <p className="text-xs text-slate-500 font-medium">
            Campus Operating System • Zero-Breach Complaint Engine
          </p>
        </div>

        {error && (
          <div className="bg-white border border-slate-200 border-l-4 border-l-red-500 text-slate-800 px-3.5 py-2.5 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleManualLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="name@campos.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#FF5733] hover:bg-[#E0482B] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* CampusAlly Instant 1-Click Evaluator Personas */}
        <div className="pt-3.5 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5733]" />
            <span>One-Click Evaluator Personas (Live JWT)</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Click any test role below to instantly authenticate into their scoped workspace:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickPersona('student', 'u-std-1')}
              className="w-full sb-card-interactive p-3 text-left flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-semibold text-slate-900">Rahul Verma</div>
                  <div className="text-[10px] text-slate-500">Student • Girls Block A (Rm 204)</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Student
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPersona('warden', 'u-stf-1')}
              className="w-full sb-card-interactive p-3 text-left flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-semibold text-slate-900">Warden Sharma</div>
                  <div className="text-[10px] text-slate-500">Warden • Scoped to Girls Block A</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Warden
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPersona('admin', 'u-stf-3')}
              className="w-full sb-card-interactive p-3 text-left flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Landmark className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-semibold text-slate-900">Dr. A. K. Satpathy</div>
                  <div className="text-[10px] text-slate-500">Chief Admin / Dean of Operations</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                Dean / Admin
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400">
          CampOS v2.0 • BPUT Hackathon PS07 Solution Prototype
        </p>
      </div>
    </div>
  );
}
