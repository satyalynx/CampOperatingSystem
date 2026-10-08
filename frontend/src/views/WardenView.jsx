import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  History, 
  Home, 
  DoorOpen, 
  AlertTriangle, 
  Check, 
  Filter, 
  FileText,
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
  const [loading, setLoading] = useState(false);

  // High-Density Side-Panel State
  const [selectedSidePanelTicket, setSelectedSidePanelTicket] = useState(null);
  const [selectedAuditRequest, setSelectedAuditRequest] = useState(null);

  useEffect(() => {
    loadWardenData();
  }, [currentUser]);

  const loadWardenData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'Open' || r.status === 'In Progress').length;
  const escalatedCount = requests.filter((r) => r.escalated).length;

  return (
    <div className="space-y-6">
      {/* Warden Scope Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-800/60 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Hostel Warden Operations
            </span>
            <span className="text-xs text-slate-400">Strictly Scoped</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {currentUser?.hostel || 'Hostel Operations'} Triage Desk
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Officer In-Charge: <strong className="text-white">{currentUser?.name}</strong> • High-Density Queue & Side-Panel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Pending Triage</div>
            <div className="text-xl font-black text-amber-400">{pendingCount}</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">SLA Breached</div>
            <div className="text-xl font-black text-rose-400">{escalatedCount}</div>
          </div>
        </div>
      </div>

      {/* Repeat Issues Facility Warning Banner */}
      {repeatIssues.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/80 rounded-3xl p-5 space-y-3 shadow-lg shadow-rose-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Root Cause Facility Alert: Recurring Issues Detected</span>
            </div>
            <span className="text-[10px] bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded-full font-bold">
              {repeatIssues.length} recurring location(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {repeatIssues.map((ri, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-rose-800/60 rounded-2xl p-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white">
                    {ri.hostel} • Room {ri.room}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[10px]">
                    {ri.complaint_count} Complaints
                  </span>
                </div>
                <div className="text-slate-300 font-medium">Category: <strong className="text-indigo-300">{ri.category}</strong></div>
                <div className="text-[11px] text-slate-400 truncate">
                  Latest: {ri.titles_list?.[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('triage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'triage'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>High-Density Request Queue ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'rooms'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Rooms & Assets Register ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gatelogs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'gatelogs'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((rm) => (
              <div key={rm.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Room {rm.room_number}</h3>
                    <div className="text-xs text-slate-400">Floor {rm.floor} • {rm.hostel}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                    Occupancy: {rm.occupied_count} / {rm.capacity}
                  </span>
                </div>

                {rm.notes && (
                  <p className="text-xs text-amber-300/80 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-xl">
                    Note: {rm.notes}
                  </p>
                )}

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Room Assets</div>
                  {rm.assets?.map((ast) => (
                    <div key={ast.id} className="bg-slate-800/50 p-2 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{ast.asset_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ast.serial_number}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        ast.status === 'Operational' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
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
        <div className="space-y-3">
          {gateLogs.map((gl) => (
            <div key={gl.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase ${
                  gl.type === 'Entry' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                }`}>
                  {gl.type}
                </span>
                <div>
                  <div className="font-bold text-white">{gl.student_name} ({gl.roll_no})</div>
                  <div className="text-[11px] text-slate-400">{gl.gate} • {gl.remarks}</div>
                </div>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                {new Date(gl.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
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
            // Refresh selected ticket in side-panel
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
