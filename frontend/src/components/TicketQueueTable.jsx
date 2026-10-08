import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  Filter, 
  Layers 
} from 'lucide-react';

export default function TicketQueueTable({ 
  tickets, 
  onSelectTicket, 
  selectedTicketId 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredTickets = tickets.filter((t) => {
    if (typeFilter !== 'All' && t.type !== typeFilter.toLowerCase()) return false;
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchStudent = t.student_name.toLowerCase().includes(q);
      const matchRoom = (t.room || '').toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      if (!matchTitle && !matchStudent && !matchRoom && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-3 p-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tickets by title, student, room, #id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            {['All', 'Complaint', 'Leave', 'Document'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  typeFilter === type
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Approved">Approved</option>
            <option value="Closed">Closed</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
            <tr>
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Type / Category</th>
              <th className="py-2.5 px-3">Summary</th>
              <th className="py-2.5 px-3">Student & Location</th>
              <th className="py-2.5 px-3">SLA Status</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                  No requests matching filters.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className={`cursor-pointer transition hover:bg-slate-800/50 ${
                      isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : ''
                    } ${t.fraud_flag === 1 ? 'bg-rose-950/20' : t.escalated ? 'bg-rose-950/10' : ''}`}
                  >
                    {/* ID */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      #{t.id}
                    </td>

                    {/* Type & Category */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {t.type}
                        </span>
                        <span className="text-[11px] font-medium text-slate-300">
                          {t.category}
                        </span>
                        {t.amenity_type === 'shared_amenity' && (
                          <span className="text-[9px] font-semibold text-emerald-300 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-800">
                            Shared
                          </span>
                        )}
                        {t.upvotes_count > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/80">
                            👍 {t.upvotes_count}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Summary */}
                    <td className="py-2.5 px-3 max-w-[220px]">
                      <div className="font-semibold text-slate-200 truncate">{t.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{t.description}</div>
                    </td>

                    {/* Student & Location */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{t.student_name}</div>
                      <div className="text-[10px] text-slate-400">{t.hostel} • Rm {t.room}</div>
                    </td>

                    {/* SLA Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {t.escalated ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 animate-pulse flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                            <span>BREACHED (Tier {t.escalation_level ?? 1})</span>
                          </span>
                          <div className="text-[9px] text-rose-400 truncate max-w-[130px]">
                            {t.escalation_target || 'Chief Warden'}
                          </div>
                        </div>
                      ) : t.status === 'Open' || t.status === 'In Progress' ? (
                        <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{t.sla_remaining_hours}h left</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Completed</span>
                      )}
                    </td>

                    {/* Status & Verification Loop */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.status === 'Closed' || t.status === 'Resolved' || t.status === 'Approved'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : t.status === 'Pending Verification'
                            ? 'bg-purple-950 text-purple-300 border-purple-700'
                            : t.status === 'Escalated'
                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                            : t.status === 'Rejected'
                            ? 'bg-rose-950/60 text-rose-400 border-rose-800'
                            : 'bg-amber-950 text-amber-300 border-amber-700'
                        }`}>
                          {t.status}
                        </span>

                        {t.fraud_flag === 1 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-600 animate-pulse">
                            🚨 FRAUD FLAGGED
                          </span>
                        )}

                        {t.status === 'Pending Verification' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800">
                            ⏳ Needs Inspection
                          </span>
                        )}

                        {(t.status === 'Resolved' || t.status === 'Closed') && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                            t.student_verified === 1
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : t.student_verified === -1
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {t.student_verified === 1 ? '✓ Verified' : t.student_verified === -1 ? '⚠️ Disputed' : '⏳ Pending Verif.'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Arrow */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
                        title="Open in Side Panel"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
