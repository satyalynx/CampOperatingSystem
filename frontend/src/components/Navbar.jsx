import React, { useState } from 'react';
import { 
  LogOut, 
  ChevronDown, 
  GraduationCap,
  Shield,
  Landmark
} from 'lucide-react';

export default function Navbar({ currentUser, onSwitchUser, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return {
          dot: 'bg-purple-500',
          label: 'Director / Dean'
        };
      case 'warden':
        return {
          dot: 'bg-blue-500',
          label: 'Hostel Warden'
        };
      default:
        return {
          dot: 'bg-emerald-500',
          label: 'Resident Student'
        };
    }
  };

  const activeBadge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Logo & Brand (Monochrome Enterprise Style) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-[#FF5733] text-white font-bold text-[11px] px-2 py-0.5 rounded-md tracking-wider flex items-center justify-center">
              CAMPOS
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                BPUT Campus Operations
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-slate-400 border border-slate-200 bg-slate-50 uppercase tracking-wider hidden sm:inline">
                v2.0
              </span>
            </div>
          </div>

          {/* Linear-Style Instant Multi-Role Workspace Toggle */}
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            <button
              onClick={() => onSwitchUser('student', 'u-std-1')}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-all ${
                currentUser?.role === 'student'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <GraduationCap className={`w-3.5 h-3.5 ${currentUser?.role === 'student' ? 'text-[#FF5733]' : 'text-slate-400'}`} />
              <span>Student Workspace</span>
            </button>

            <button
              onClick={() => onSwitchUser('warden', 'u-stf-1')}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-all ${
                currentUser?.role === 'warden'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${currentUser?.role === 'warden' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Warden Console</span>
            </button>

            <button
              onClick={() => onSwitchUser('admin', 'u-stf-3')}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-all ${
                currentUser?.role === 'admin'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Landmark className={`w-3.5 h-3.5 ${currentUser?.role === 'admin' ? 'text-purple-600' : 'text-slate-400'}`} />
              <span>Director Console</span>
            </button>
          </div>

          {/* Right Section: Persona Switcher Dropdown & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium transition shadow-2xs"
                title="Switch test persona"
              >
                <span className="hidden md:inline text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Persona:</span>
                <span className="font-semibold text-slate-900">{currentUser?.name?.split(' ')[0]}</span>
                <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeBadge.dot}`} />
                  {activeBadge.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-76 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 text-xs animate-in fade-in duration-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Campus Persona Switcher
                    </span>
                    <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-medium">
                      Live JWT
                    </span>
                  </div>

                  {/* Students Group */}
                  <div className="p-1.5 border-b border-slate-100">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Students
                    </p>
                    <button
                      onClick={() => onSwitchUser('student', 'u-std-1')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between transition ${
                        currentUser?.email === 'rahul.verma@campos.edu' ? 'bg-slate-50 font-medium text-slate-900 border border-slate-200/80' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Rahul Verma</div>
                        <div className="text-[10px] text-slate-400 font-mono">Girls Block A (Rm 204) • CSE</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Student
                      </span>
                    </button>
                    <button
                      onClick={() => onSwitchUser('student', 'u-std-2')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between transition ${
                        currentUser?.email === 'priya.sharma@campos.edu' ? 'bg-slate-50 font-medium text-slate-900 border border-slate-200/80' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Priya Sharma</div>
                        <div className="text-[10px] text-slate-400 font-mono">Girls Block A (Rm 204) • CSE</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Student
                      </span>
                    </button>
                    <button
                      onClick={() => onSwitchUser('student', 'u-std-3')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between transition ${
                        currentUser?.email === 'amit.patel@campos.edu' ? 'bg-slate-50 font-medium text-slate-900 border border-slate-200/80' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Amit Patel</div>
                        <div className="text-[10px] text-slate-400 font-mono">Boys Block B (Rm 105) • EE</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Student
                      </span>
                    </button>
                  </div>

                  {/* Wardens Group */}
                  <div className="p-1.5 border-b border-slate-100">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Wardens (Scoped Desk)
                    </p>
                    <button
                      onClick={() => onSwitchUser('warden', 'u-stf-1')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between transition ${
                        currentUser?.email === 'warden.sharma@campos.edu' ? 'bg-slate-50 font-medium text-slate-900 border border-slate-200/80' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Warden Sharma</div>
                        <div className="text-[10px] text-slate-400">Girls Block A Triage Desk</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Block A
                      </span>
                    </button>
                    <button
                      onClick={() => onSwitchUser('warden', 'u-stf-2')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between transition ${
                        currentUser?.email === 'warden.mehta@campos.edu' ? 'bg-slate-50 font-medium text-slate-900 border border-slate-200/80' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Warden Mehta</div>
                        <div className="text-[10px] text-slate-400">Boys Block B Triage Desk</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Block B
                      </span>
                    </button>
                  </div>

                  {/* Apex Admin */}
                  <div className="p-1.5">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Apex Administration
                    </p>
                    <button
                      onClick={() => onSwitchUser('admin', 'u-stf-3')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between transition ${
                        currentUser?.role === 'admin' ? 'bg-slate-50 font-medium text-slate-900 border border-slate-200/80' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Dr. A. K. Satpathy</div>
                        <div className="text-[10px] text-slate-400">Dean of Student Affairs / Director</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Apex Dean
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
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
