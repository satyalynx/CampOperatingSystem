import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  LogOut, 
  ChevronDown, 
  Sparkles, 
  Building2, 
  Bell, 
  Layers 
} from 'lucide-react';

export default function Navbar({ currentUser, onSwitchUser, onLogout, demoAccounts }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/60 text-purple-300 border-purple-700/60';
      case 'warden':
        return 'bg-indigo-900/60 text-indigo-300 border-indigo-700/60';
      default:
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">CampOS</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Campus Operating System</p>
            </div>
          </div>

          {/* Right Section: Persona Switcher & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Evaluator Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-medium transition shadow-sm"
                title="Quickly switch between evaluation personas"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-slate-400">Switch Persona:</span>
                <span className="font-semibold text-white">{currentUser?.name?.split(' ')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md border capitalize font-semibold ${getRoleBadgeColor(currentUser?.role)}`}>
                  {currentUser?.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
                    Evaluator Role Switcher
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Students</p>
                    <button
                      onClick={() => onSwitchUser('student', 'u-std-1')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-300"
                    >
                      <div>
                        <div className="font-semibold text-white">Rahul Verma</div>
                        <div className="text-[10px] text-slate-400">CSE • Girls Block A (Rm 204)</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">Student</span>
                    </button>
                    <button
                      onClick={() => onSwitchUser('student', 'u-std-2')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-300"
                    >
                      <div>
                        <div className="font-semibold text-white">Priya Sharma</div>
                        <div className="text-[10px] text-slate-400">CSE • Girls Block A (Rm 204)</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">Student</span>
                    </button>
                    <button
                      onClick={() => onSwitchUser('student', 'u-std-3')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-300"
                    >
                      <div>
                        <div className="font-semibold text-white">Amit Patel</div>
                        <div className="text-[10px] text-slate-400">MECH • Boys Block B (Rm 105)</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">Student</span>
                    </button>
                  </div>

                  <div className="py-1 border-t border-slate-800">
                    <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Wardens</p>
                    <button
                      onClick={() => onSwitchUser('warden', 'u-stf-1')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-300"
                    >
                      <div>
                        <div className="font-semibold text-white">Warden Sharma</div>
                        <div className="text-[10px] text-slate-400">Scoped to Girls Block A</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">Warden</span>
                    </button>
                    <button
                      onClick={() => onSwitchUser('warden', 'u-stf-2')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-300"
                    >
                      <div>
                        <div className="font-semibold text-white">Warden Mehta</div>
                        <div className="text-[10px] text-slate-400">Scoped to Boys Block B</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">Warden</span>
                    </button>
                  </div>

                  <div className="py-1 border-t border-slate-800">
                    <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Administration</p>
                    <button
                      onClick={() => onSwitchUser('admin', 'u-stf-3')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-300"
                    >
                      <div>
                        <div className="font-semibold text-white">Dr. A. K. Satpathy</div>
                        <div className="text-[10px] text-slate-400">Dean / Chief Admin (Full Scope)</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Current User Chip */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-1 text-xs">
              <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                {currentUser?.name?.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-200 leading-tight">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-400">
                  {currentUser?.hostel ? `${currentUser.hostel} ${currentUser.room ? `(Rm ${currentUser.room})` : ''}` : 'Administration'}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 p-2 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
