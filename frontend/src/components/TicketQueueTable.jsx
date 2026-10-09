import React, { useState } from 'react';
import { 
  Clock, 
  ChevronRight, 
  Search, 
  Layers,
  Flame
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
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchStudent = (t.student_name || '').toLowerCase().includes(q);
      const matchRoom = (t.room || '').toLowerCase().includes(q);
      const matchHostel = (t.hostel || '').toLowerCase().includes(q);
      const matchId = (t.id || '').toLowerCase().includes(q);
      const matchCategory = (t.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchStudent && !matchRoom && !matchHostel && !matchId && !matchCategory) return false;
    }
    return true;
  });

  const getStatusChip = (ticket) => {
    if (ticket.fraud_flag === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-red-700 bg-red-50 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          <span>FRAUD DISPUTED</span>
        </span>
      );
    }

    if (ticket.escalated || ticket.status === 'Escalated') {
      const target = (ticket.escalation_target || 'CHIEF WARDEN').toUpperCase();
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-red-700 bg-red-50 border border-red-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          <span>ESCALATED TO {target}</span>
        </span>
      );
    }

    switch (ticket.status) {
      case 'Closed':
      case 'Resolved':
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>{ticket.status}</span>
          </span>
        );
      case 'Pending Verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            <span>Pending Student Verification</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>In Progress</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Rejected</span>
          </span>
        );
      default: // Open
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Open</span>
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'complaint':
        return 'text-slate-700 bg-slate-100 border-slate-200';
      case 'leave':
        return 'text-slate-700 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="sb-card overflow-hidden shadow-soft-sm">
      {/* Search & Filter Header (Monochrome High-Density SaaS Style) */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter tickets by ID, title, student, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition shadow-2xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            {['All', 'Complaint', 'Leave', 'Document'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  typeFilter === type
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 shadow-2xs"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Approved">Approved</option>
            <option value="Closed">Closed</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* High-Density Master Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/70 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3.5">Ticket ID</th>
              <th className="py-2.5 px-3.5">Type & Category</th>
              <th className="py-2.5 px-3.5">Request Summary</th>
              <th className="py-2.5 px-3.5">Student / Location</th>
              <th className="py-2.5 px-3.5">SLA Clock</th>
              <th className="py-2.5 px-3.5 text-center">Lifecycle Status</th>
              <th className="py-2.5 px-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <Layers className="w-7 h-7 text-slate-300" />
                    <span>No tickets found matching the selected criteria.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicketId === t.id;

                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className={`group cursor-pointer transition-colors duration-100 ${
                      isSelected 
                        ? 'bg-slate-50/90 border-l-2 border-l-[#FF5733]' 
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* ID */}
                    <td className="py-2.5 px-3.5 font-mono font-medium text-[11px] text-slate-500 whitespace-nowrap">
                      <span className="group-hover:text-slate-900 transition-colors">#{t.id}</span>
                    </td>

                    {/* Type & Category */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded border ${getTypeBadge(t.type)}`}>
                          {t.type}
                        </span>
                        <span className="font-semibold text-xs text-slate-900">
                          {t.category}
                        </span>
                        {t.amenity_type === 'shared_amenity' && (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            Shared
                          </span>
                        )}
                        {t.upvotes_count > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium text-slate-700 bg-white border border-slate-200 shadow-2xs">
                            <Flame className="w-3 h-3 text-[#FF5733]" />
                            <span>{t.upvotes_count}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Summary */}
                    <td className="py-2.5 px-3.5 max-w-[260px]">
                      <div className="font-semibold text-slate-900 truncate group-hover:text-[#FF5733] transition-colors">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {t.description}
                      </div>
                    </td>

                    {/* Student & Location */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{t.student_name}</div>
                      <div className="text-[11px] text-slate-400">
                        {t.hostel} • Rm {t.room}
                      </div>
                    </td>

                    {/* SLA Engine Clock */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {t.escalated ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            <span>SLA Breach ({t.elapsed_hours}h)</span>
                          </span>
                          <div className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                            → {t.escalation_target || 'Chief Warden'}
                          </div>
                        </div>
                      ) : t.status === 'Open' || t.status === 'In Progress' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{t.sla_remaining_hours}h left</span>
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Limit: {t.sla_limit_hours}h ({t.elapsed_hours}h)
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>Within SLA</span>
                        </span>
                      )}
                    </td>

                    {/* Lifecycle Status */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusChip(t)}

                        {(t.status === 'Resolved' || t.status === 'Closed') && t.student_verified === 1 && (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ✓ Student Verified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Inspect Arrow */}
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                        title="Open Details & Actions"
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
