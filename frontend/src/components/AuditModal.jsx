import React, { useEffect, useState } from 'react';
import { X, Clock, ShieldAlert, CheckCircle2, User, Activity } from 'lucide-react';
import { api } from '../api';

export default function AuditModal({ request, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (request?.id) {
      loadLogs();
    }
  }, [request]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getRequestLogs(request.id);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('ESCALATED')) {
      return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    }
    if (action.includes('RESOLVED') || action.includes('APPROVED')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    if (action.includes('CREATED')) {
      return <Activity className="w-4 h-4 text-indigo-400" />;
    }
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                {request.type}
              </span>
              <span className="text-xs text-slate-400 font-mono">#{request.id}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">{request.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs space-y-1">
            <div className="text-slate-400">Current Status: <span className="font-semibold text-white">{request.status}</span></div>
            <div className="text-slate-400">Raised By: <span className="font-semibold text-white">{request.student_name}</span> ({request.hostel}, Rm {request.room})</div>
            <div className="text-slate-400">Assigned To: <span className="font-semibold text-white">{request.assigned_staff_name || 'Unassigned'}</span></div>
          </div>

          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit History & Lifecycle Events</h4>

          {loading ? (
            <div className="text-center py-8 text-slate-500 text-xs">Loading immutable audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No audit logs recorded for this ticket.</div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {logs.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                      <User className="w-3.5 h-3.5" />
                      <span>{log.actor_name}</span>
                    </div>

                    {log.previous_status && log.new_status && (
                      <div className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 text-[10px]">
                          {log.previous_status}
                        </span>
                        <span>→</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          log.new_status === 'Escalated' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          log.new_status === 'Resolved' || log.new_status === 'Approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}>
                          {log.new_status}
                        </span>
                      </div>
                    )}

                    {log.note && (
                      <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                        {log.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
