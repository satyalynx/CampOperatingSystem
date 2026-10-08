import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import StudentView from './views/StudentView';
import WardenView from './views/WardenView';
import AdminView from './views/AdminView';
import LoginModal from './views/LoginModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState([]);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('campos_token');
      if (token) {
        try {
          const user = await api.getMe();
          setCurrentUser(user);
        } catch {
          // Token expired or invalid, auto-login with default demo student
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
  };

  const autoDemoLogin = async () => {
    try {
      const data = await api.demoSwitch('student', 'u-std-1');
      setCurrentUser(data.user);
    } catch {
      setCurrentUser(null);
    }
  };

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-semibold">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div>Initializing CampOS Operating System...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginModal onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        demoAccounts={demoAccounts}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'student' && <StudentView currentUser={currentUser} />}
        {currentUser.role === 'warden' && <WardenView currentUser={currentUser} />}
        {currentUser.role === 'admin' && <AdminView currentUser={currentUser} />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 space-y-1">
        <div className="font-semibold text-slate-400">
          CampOS — Campus Operating System
        </div>
        <p className="text-[11px] text-slate-600">
          Deterministic SLA Escalation Engine: Complaint 48h • Leave 2h • Document 72h • Institutional Precedent Matching
        </p>
      </footer>
    </div>
  );
}
