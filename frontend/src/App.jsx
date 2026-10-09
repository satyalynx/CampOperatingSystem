import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import CampusBackground from './components/CampusBackground';
import StudentView from './views/StudentView';
import WardenView from './views/WardenView';
import AdminView from './views/AdminView';
import LoginModal from './views/LoginModal';
import { Layers } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const autoDemoLogin = useCallback(async () => {
    try {
      const data = await api.demoSwitch('student', 'u-std-1');
      setCurrentUser(data.user);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('campos_token');
      if (token) {
        try {
          const user = await api.getMe();
          setCurrentUser(user);
        } catch {
          // Token expired or invalid, auto-login default demo student
          await autoDemoLogin();
        }
      } else {
        await autoDemoLogin();
      }
    } catch (err) {
      console.error("Auth init error:", err);
    } finally {
      setLoading(false);
    }
  }, [autoDemoLogin]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const handleSwitchUser = async (role, userId) => {
    try {
      setLoading(true);
      const data = await api.demoSwitch(role, userId);
      setCurrentUser(data.user);
    } catch (err) {
      alert(`Failed to switch persona: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-600 text-xs font-semibold relative">
        <CampusBackground />
        <div className="relative z-10 text-center space-y-3.5 sb-card p-6 max-w-sm w-full mx-4 shadow-soft-sm">
          <div className="w-10 h-10 mx-auto rounded-lg bg-slate-900 flex items-center justify-center shadow-2xs">
            <Layers className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">Initializing CampOS Engine...</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Deterministic SLA & Multi-Role Architecture</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginModal onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#FF5733]/20 selection:text-[#FF5733] relative">
      {/* SpaceBasic Authentic Campus Architectural Background Silhouette */}
      <CampusBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* SpaceBasic Pure Light Mode Navigation */}
        <Navbar
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {currentUser.role === 'student' && <StudentView currentUser={currentUser} />}
          {currentUser.role === 'warden' && <WardenView currentUser={currentUser} />}
          {currentUser.role === 'admin' && <AdminView currentUser={currentUser} />}
        </main>

        {/* SpaceBasic Pure Light Mode Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight">CampOS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Operating System v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deterministic SLA Escalation Engine: Complaint 48h • Gatepass 2h • Document 72h • Immutable Audit Logs
            </p>
            <div className="text-[11px] text-slate-400 font-mono">
              BPUT Hackathon PS07 Solution Prototype
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
