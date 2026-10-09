import React, { useEffect, useState } from 'react';
import { X, Clock, ShieldAlert, CheckCircle2, User, Activity, Flame } from 'lucide-react';
import { api } from '../api';

export default function AuditModal({ request, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const requestId = request?.id;
  const loadLogs = React.useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const data = await api.getRequestLogs(requestId);
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionIcon = (action) => {
    if (action.includes('ESCALATED') || action.includes('FRAUD')) {
      return <ShieldAlert className="w-4 h-4 text-rose-500" />;
    }
    if (action.includes('RESOLVED') || action.includes('APPROVED') || action.includes('CLOSED')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
    if (action.includes('UPVOTE')) {
      return <Flame className="w-4 h-4 text-campus-coral" />;
    }
    if (action.includes('CREATED')) {
      return <Activity className="w-4 h-4 text-campus-brand" />;
    }
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="sb-card max-w-xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                {request.type}
              </span>
              <span className="text-xs text-slate-400 font-mono">#{request.id}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">{request.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <div className="text-slate-500">Status: <span className="font-semibold text-slate-800">{request.status}</span></div>
            <div className="text-slate-500">Raised By: <span className="font-semibold text-slate-800">{request.student_name}</span> ({request.hostel}, Rm {request.room})</div>
            <div className="text-slate-500">Assigned To: <span className="font-semibold text-slate-800">{request.assigned_staff_name || 'Unassigned'}</span></div>
          </div>

          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Immutable Lifecycle Audit Ledger
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Chronological order</span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No audit events recorded yet.</div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logs.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.actor_name} ({log.actor_role})</span>
                      {log.client_ip && (
                        <span className="text-slate-400 font-mono">• IP: {log.client_ip}</span>
                      )}
                    </div>

                    {log.previous_status && log.new_status && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                          {log.previous_status}
                        </span>
                        <span>→</span>
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-800 text-[10px] font-semibold border border-slate-200 shadow-2xs">
                          {log.new_status}
                        </span>
                      </div>
                    )}

                    {log.note && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200">
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
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
