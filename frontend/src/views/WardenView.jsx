import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, 
  DoorOpen, 
  AlertTriangle, 
  Table as TableIcon
} from 'lucide-react';
import { api } from '../api';
import AuditModal from '../components/AuditModal';
import TicketDetailPanel from '../components/TicketDetailPanel';
import TicketQueueTable from '../components/TicketQueueTable';

export default function WardenView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('triage');
  const [requests, setRequests] = useState([]);
  const [repeatIssues, setRepeatIssues] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [gateLogs, setGateLogs] = useState([]);

  // High-Density Side-Panel State
  const [selectedSidePanelTicket, setSelectedSidePanelTicket] = useState(null);
  const [selectedAuditRequest, setSelectedAuditRequest] = useState(null);

  const loadWardenData = useCallback(async () => {
    try {
      const [reqs, repeats, rms, logs] = await Promise.all([
        api.getRequests(),
        api.getRepeatIssues(),
        api.getRooms(),
        api.getGateLogs(),
      ]);
      setRequests(reqs || []);
      setRepeatIssues(repeats || []);
      setRooms(rms || []);
      setGateLogs(logs || []);
    } catch (err) {
      console.error('Error loading warden data', err);
    }
  }, []);

  useEffect(() => {
    loadWardenData();
  }, [loadWardenData, currentUser]);

  const pendingCount = requests.filter((r) => r.status === 'Open' || r.status === 'In Progress').length;
  const escalatedCount = requests.filter((r) => r.escalated).length;

  return (
    <div className="space-y-5">
      
      {/* Warden Scoped Operations Banner (SpaceBasic SaaS Style) */}
      <div className="sb-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Hostel Warden Operations
            </span>
            <span className="text-xs text-slate-400 font-medium">Strictly Scoped Triage</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            {currentUser?.hostel || 'Hostel Operations'} Triage Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Officer In-Charge: <strong className="text-slate-800 font-medium">{currentUser?.name}</strong> • High-Density Queue & Mandatory Proof Enforcement
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="sb-card p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Pending Triage</div>
            <div className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">{pendingCount}</div>
          </div>
          <div className="sb-card p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">SLA Breached</div>
            <div className={`text-xl font-bold tracking-tight mt-0.5 ${escalatedCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{escalatedCount}</div>
          </div>
        </div>
      </div>

      {/* Repeat Issues Facility Warning Banner */}
      {repeatIssues.length > 0 && (
        <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Root Cause Facility Alert: Recurring Defects Detected (Threshold ≥ 2)</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200">
              {repeatIssues.length} recurring location(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {repeatIssues.map((ri, idx) => (
              <div key={idx} className="sb-card p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {ri.hostel} • Room {ri.room}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-red-600 bg-white border border-red-200 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {ri.complaint_count} Complaints
                  </span>
                </div>
                <div className="text-slate-500 font-medium">Category: <strong className="text-slate-700">{ri.category}</strong></div>
                <div className="text-[11px] text-slate-400 truncate">
                  Latest: {ri.titles_list?.[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SpaceBasic Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('triage')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition ${
            activeTab === 'triage'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>High-Density Request Queue ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition ${
            activeTab === 'rooms'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Rooms & Assets Register ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gatelogs')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition ${
            activeTab === 'gatelogs'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5" />
          <span>Hostel Gate Logs ({gateLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: HIGH-DENSITY REQUEST QUEUE TABLE */}
      {activeTab === 'triage' && (
        <div className="space-y-4">
          <TicketQueueTable
            tickets={requests}
            onSelectTicket={(ticket) => setSelectedSidePanelTicket(ticket)}
            selectedTicketId={selectedSidePanelTicket?.id}
          />
        </div>
      )}

      {/* TAB 2: ROOMS & ASSETS */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {rooms.map((rm) => (
              <div key={rm.id} className="sb-card-interactive p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Room {rm.room_number}</h3>
                    <div className="text-xs text-slate-500">Floor {rm.floor} • {rm.hostel}</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Occupancy: {rm.occupied_count} / {rm.capacity}
                  </span>
                </div>

                {rm.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                    Note: {rm.notes}
                  </p>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assigned Room Assets</div>
                  {rm.assets?.map((ast) => (
                    <div key={ast.id} className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-800">{ast.asset_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ast.serial_number}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-700 bg-white border border-slate-200 shadow-2xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${ast.status === 'Operational' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {ast.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GATE LOGS */}
      {activeTab === 'gatelogs' && (
        <div className="sb-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-900">
            Turnstile Entry & Exit Logs ({currentUser?.hostel})
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {gateLogs.length === 0 ? (
              <div className="py-10 text-center text-slate-400">No gate turnstile logs recorded.</div>
            ) : (
              gateLogs.map((gl) => (
                <div key={gl.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-white border border-slate-200 shadow-2xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${gl.type === 'Entry' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      {gl.type}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{gl.student_name} ({gl.roll_no})</div>
                      <div className="text-[11px] text-slate-500">{gl.gate} • {gl.remarks}</div>
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(gl.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Ticket Detail Side-Panel Drawer */}
      {selectedSidePanelTicket && (
        <TicketDetailPanel
          ticket={selectedSidePanelTicket}
          currentUser={currentUser}
          onClose={() => setSelectedSidePanelTicket(null)}
          onStatusUpdated={async () => {
            await loadWardenData();
            const updated = await api.getRequestDetail(selectedSidePanelTicket.id);
            setSelectedSidePanelTicket(updated);
          }}
        />
      )}

      {/* Audit Modal */}
      {selectedAuditRequest && (
        <AuditModal
          request={selectedAuditRequest}
          onClose={() => setSelectedAuditRequest(null)}
        />
      )}
    </div>
  );
}
