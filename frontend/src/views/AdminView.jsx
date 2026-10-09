import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  Users, 
  Bell, 
  RotateCcw, 
  Play, 
  Plus, 
  DoorOpen, 
  Building, 
  FileText, 
  UtensilsCrossed, 
  Table as TableIcon 
} from 'lucide-react';
import { api } from '../api';
import AuditModal from '../components/AuditModal';
import TicketDetailPanel from '../components/TicketDetailPanel';
import TicketQueueTable from '../components/TicketQueueTable';

export default function AdminView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [repeatIssues, setRepeatIssues] = useState([]);
  const [notices, setNotices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [gateLogs, setGateLogs] = useState([]);
  const [messFeedback, setMessFeedback] = useState(null);

  // High-Density Side-Panel State
  const [selectedSidePanelTicket, setSelectedSidePanelTicket] = useState(null);
  const [selectedAuditRequest, setSelectedAuditRequest] = useState(null);

  // Engine Actions & Feedback
  const [actionMessage, setActionMessage] = useState('');
  const [escalationEngineResult, setEscalationEngineResult] = useState(null);

  // Notice Composer Form
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [targetHostel, setTargetHostel] = useState('All');
  const [targetBatch, setTargetBatch] = useState('All');
  const [targetBranch, setTargetBranch] = useState('All');
  const [isActionable, setIsActionable] = useState(false);
  const [postingNotice, setPostingNotice] = useState(false);

  // Gate Log Entry Form
  const [glStudentId, setGlStudentId] = useState('std-1');
  const [glType, setGlType] = useState('Entry');
  const [glGate, setGlGate] = useState('Campus Main Gate 1');
  const [glRemarks, setGlRemarks] = useState('Routine campus return');

  const loadAdminData = useCallback(async () => {
    try {
      const [dash, reqs, repeats, nots, rms, logs, mfb] = await Promise.all([
        api.getAdminDashboard(),
        api.getRequests(),
        api.getRepeatIssues(),
        api.getNotices(),
        api.getRooms(),
        api.getGateLogs(),
        api.getAdminMessFeedback(),
      ]);
      setDashboard(dash);
      setRequests(reqs || []);
      setRepeatIssues(repeats || []);
      setNotices(nots || []);
      setRooms(rms || []);
      setGateLogs(logs || []);
      setMessFeedback(mfb);
    } catch (err) {
      console.error('Error loading admin data', err);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleRunEscalationEngine = async () => {
    try {
      const res = await api.triggerEscalationCheck();
      setEscalationEngineResult(res);
      setActionMessage(`SLA Engine evaluated: ${res.escalated_count} overdue request(s) auto-escalated.`);
      await loadAdminData();
      setTimeout(() => setActionMessage(''), 5000);
    } catch (err) {
      alert(`Error running SLA engine: ${err.message}`);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm("Reset CampOS to pristine demonstration dataset?")) return;
    try {
      await api.resetDemoData();
      setActionMessage("✓ CampOS database reset to clean demonstration seed data!");
      await loadAdminData();
      setTimeout(() => setActionMessage(''), 5000);
    } catch (err) {
      alert(`Error resetting data: ${err.message}`);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      setPostingNotice(true);
      await api.createNotice({
        title: noticeTitle,
        body: noticeBody,
        target_hostel: targetHostel,
        target_batch: targetBatch,
        target_branch: targetBranch,
        actionable: isActionable,
      });
      setNoticeTitle('');
      setNoticeBody('');
      setActionMessage("✓ Targeted notice published successfully.");
      await loadAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert(`Error publishing notice: ${err.message}`);
    } finally {
      setPostingNotice(false);
    }
  };

  const handleCreateGateLog = async (e) => {
    e.preventDefault();
    try {
      await api.createGateLog({
        student_id: glStudentId,
        type: glType,
        gate: glGate,
        remarks: glRemarks,
      });
      setActionMessage("✓ Campus gate movement successfully recorded.");
      await loadAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert(`Error logging gate movement: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Admin Action Message Toast */}
      {actionMessage && (
        <div className="bg-white border border-slate-200 border-l-4 border-l-blue-500 text-slate-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-slate-400 hover:text-slate-700 ml-2 font-bold">✕</button>
        </div>
      )}

      {/* SLA Engine Execution Detail (if triggered) */}
      {escalationEngineResult && (
        <div className="bg-white border border-slate-200 border-l-4 border-l-orange-500 text-slate-800 p-4 rounded-xl text-xs space-y-2 shadow-2xs">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-slate-900">
              <AlertTriangle className="w-4 h-4 text-[#FF5733]" />
              SLA Engine Verification Run Completed
            </span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 border border-slate-200 font-semibold">
              {escalationEngineResult.escalated_count} Request(s) Escalated
            </span>
          </div>
          {escalationEngineResult.escalated_requests?.length > 0 && (
            <div className="space-y-1 pt-1">
              {escalationEngineResult.escalated_requests.map((er) => (
                <div key={er.id} className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-800">#{er.id} • {er.title} ({er.student_name})</span>
                  <span className="text-red-600 font-semibold font-mono">Overdue: {er.elapsed_hours}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Executive Header & Quick Controls (SpaceBasic SaaS Style) */}
      <div className="sb-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Executive Command Center
            </span>
            <span className="text-xs text-slate-400 font-medium">Chief Administrative Office</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            CampOS Central Operations Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full Institutional Visibility • Zero-Breach SLA Enforcement • High-Density Queue & Side-Panel
          </p>
        </div>

        {/* Action Controls for Demo & Presentation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunEscalationEngine}
            className="bg-[#FF5733] hover:bg-[#E0482B] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Execute server-side deterministic SLA auto-escalation check"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run SLA Engine Now</span>
          </button>

          <button
            onClick={handleResetDemoData}
            className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-200 shadow-2xs active:scale-95"
            title="Reset database to initial demo state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* SpaceBasic Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/80 rounded-xl border border-slate-200 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart3 },
          { id: 'queue', label: 'High-Density Queue', icon: TableIcon, count: requests.length },
          { id: 'accountability', label: 'Staff Accountability', icon: Users },
          { id: 'repeats', label: 'Repeat Issues Engine', icon: AlertTriangle, count: repeatIssues.length },
          { id: 'notices', label: 'Targeted Notices', icon: Bell },
          { id: 'rooms', label: 'Rooms & Assets', icon: Building },
          { id: 'gatelogs', label: 'Security Gate Logs', icon: DoorOpen },
          { id: 'mess', label: 'Mess Feedback', icon: UtensilsCrossed },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-slate-200/80 text-slate-700">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {/* Real-time KPI Cards (SpaceBasic Monochrome Elevated Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="sb-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Requests</span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{dashboard?.total_requests || 0}</div>
              <p className="text-[11px] text-slate-500">Institution-wide tickets</p>
            </div>

            <div className="sb-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Queue</span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {(dashboard?.open_requests || 0) + (dashboard?.in_progress_requests || 0)}
              </div>
              <p className="text-[11px] text-slate-500">Currently in triage</p>
            </div>

            <div className="sb-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resolved / Closed</span>
              <div className="text-2xl font-bold text-emerald-600 tracking-tight">{dashboard?.resolved_requests || 0}</div>
              <p className="text-[11px] text-slate-500">Student verified</p>
            </div>

            <div className="sb-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SLA Breached</span>
              <div className={`text-2xl font-bold tracking-tight ${(dashboard?.escalated_requests || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {dashboard?.escalated_requests || 0}
              </div>
              <p className="text-[11px] text-slate-500">Auto-escalated to Dean</p>
            </div>

            <div className="sb-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Resolution</span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{dashboard?.avg_resolution_hours || 0}h</div>
              <p className="text-[11px] text-slate-500">≈ {dashboard?.avg_resolution_days || 0} days</p>
            </div>
          </div>

          {/* Ageing & Facility Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Ageing Analysis */}
            <div className="sb-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Ageing Ticket Analysis</span>
              </h3>
              <div className="space-y-2 pt-1">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Pending &gt; 48 Hours:</span>
                  <span className="font-bold text-amber-600 font-mono text-sm">{dashboard?.ageing_over_48h || 0}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Pending &gt; 7 Days:</span>
                  <span className="font-bold text-red-600 font-mono text-sm">{dashboard?.ageing_over_7d || 0}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Requests breaching standard resolution limits are escalated directly to Dean of Student Affairs under Zero-Breach protocols.
                </p>
              </div>
            </div>

            {/* Requests by Type */}
            <div className="sb-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Workload by Category</span>
              </h3>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Hostel Complaints (48h SLA)</span>
                  <strong className="text-slate-900 font-mono">{dashboard?.by_type?.complaint || 0}</strong>
                </div>
                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Leave / Gatepasses (2h SLA)</span>
                  <strong className="text-slate-900 font-mono">{dashboard?.by_type?.leave || 0}</strong>
                </div>
                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Document Requests (72h SLA)</span>
                  <strong className="text-slate-900 font-mono">{dashboard?.by_type?.document || 0}</strong>
                </div>
              </div>
            </div>

            {/* Systemic Repeat Issues Summary */}
            <div className="sb-card p-4 space-y-3 border-l-4 border-l-red-500">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>Systemic Facility Defects</span>
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center space-y-1">
                <div className="text-2xl font-bold text-red-600 font-mono">{dashboard?.repeat_issues_count || 0}</div>
                <div className="text-xs font-semibold text-slate-800">Flagged Recurring Locations</div>
                <p className="text-[10px] text-slate-500 pt-0.5">Room + category combinations occurring ≥ 2 times</p>
              </div>
              <button
                onClick={() => setActiveTab('repeats')}
                className="w-full text-center py-1 text-xs text-[#FF5733] hover:text-[#E0482B] font-semibold"
              >
                Inspect repeat issues list →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HIGH-DENSITY QUEUE TABLE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <TicketQueueTable
            tickets={requests}
            onSelectTicket={(ticket) => setSelectedSidePanelTicket(ticket)}
            selectedTicketId={selectedSidePanelTicket?.id}
          />
        </div>
      )}

      {/* TAB 3: STAFF ACCOUNTABILITY MATRIX */}
      {activeTab === 'accountability' && (
        <div className="space-y-4">
          <div className="sb-card p-4">
            <h3 className="text-sm font-bold text-slate-900">Staff SLA Escalation & Workload Accountability</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Measurable institutional accountability metric tracking assigned workload vs. SLA breaches per officer.
            </p>
          </div>

          <div className="sb-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/70 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5">Staff Officer</th>
                    <th className="py-2.5 px-3.5">Assigned Scope</th>
                    <th className="py-2.5 px-3.5 text-center">Pending Workload</th>
                    <th className="py-2.5 px-3.5 text-center">SLA Breaches</th>
                    <th className="py-2.5 px-3.5 text-center">Lifetime Handled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboard?.staff_accountability?.map((stf) => (
                    <tr key={stf.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5 font-medium text-slate-900 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{stf.name}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 font-medium">{stf.hostel || 'Institution-Wide'}</td>
                      <td className="py-2.5 px-3.5 text-center font-mono font-medium text-slate-800">
                        {stf.pending_workload}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700 bg-white border border-slate-200 shadow-2xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${stf.escalations_count > 0 ? 'bg-red-500' : 'bg-slate-300'}`} />
                          {stf.escalations_count}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-mono text-slate-600">
                        {stf.total_handled}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPEAT ISSUES ENGINE */}
      {activeTab === 'repeats' && (
        <div className="space-y-4">
          <div className="sb-card p-4">
            <h3 className="text-sm font-bold text-slate-900">Facility Repeat-Issue Detection Engine</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated aggregation grouping complaints by Room + Category to surface systemic infrastructure faults (threshold: ≥ 2 complaints).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {repeatIssues.map((ri, idx) => (
              <div key={idx} className="sb-card-interactive p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-red-600 bg-white px-2 py-0.5 rounded-md border border-red-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Systemic Fault Flagged
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{ri.hostel} • Room {ri.room}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-600 font-mono">{ri.complaint_count}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Complaints</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs space-y-0.5">
                  <div className="text-slate-600">Category: <strong className="text-slate-900 font-medium">{ri.category}</strong></div>
                  <div className="text-slate-600">Latest: <strong className="text-slate-800 font-medium">{new Date(ri.latest_complaint_at).toLocaleString()}</strong></div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Registered Complaints:</div>
                  <div className="space-y-1">
                    {ri.titles_list?.map((t, tIdx) => (
                      <div key={tIdx} className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-slate-700">
                        • {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NOTICES & ENGAGEMENT */}
      {activeTab === 'notices' && (
        <div className="space-y-5">
          {/* Notice Composer */}
          <div className="sb-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#FF5733]" />
              <span>Compose Targeted Notice</span>
            </h3>

            <form onSubmit={handleCreateNotice} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hostel</label>
                  <select
                    value={targetHostel}
                    onChange={(e) => setTargetHostel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="All">All Hostels (Institution-Wide)</option>
                    <option value="Girls Block A">Girls Block A Only</option>
                    <option value="Boys Block B">Boys Block B Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Batch</label>
                  <select
                    value={targetBatch}
                    onChange={(e) => setTargetBatch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="All">All Batches</option>
                    <option value="2022-2026">2022-2026</option>
                    <option value="2023-2027">2023-2027</option>
                    <option value="2024-2028">2024-2028</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Branch</label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="All">All Branches</option>
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="MECH">Mechanical (MECH)</option>
                    <option value="ECE">Electronics (ECE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Hostel Floor Meeting this Friday"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Body Content</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Official notice instructions and specifics..."
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actionableCheck"
                  checked={isActionable}
                  onChange={(e) => setIsActionable(e.target.checked)}
                  className="rounded border-slate-300 text-[#FF5733] focus:ring-0"
                />
                <label htmlFor="actionableCheck" className="text-xs text-slate-700 font-medium">
                  Requires Student Acknowledgment / Completion Action
                </label>
              </div>

              <button
                type="submit"
                disabled={postingNotice}
                className="bg-[#FF5733] hover:bg-[#E0482B] text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition active:scale-95"
              >
                {postingNotice ? 'Publishing...' : 'Publish Targeted Notice'}
              </button>
            </form>
          </div>

          {/* Notices Engagement Tracking Table */}
          <div className="sb-card p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Notice Engagement Analytics</h3>
            <div className="space-y-2.5">
              {notices.map((n) => (
                <div key={n.id} className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <h4 className="font-semibold text-slate-900">{n.title}</h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Target: {n.target_hostel} • {n.target_branch} • {n.target_batch} • By {n.posted_by}
                      </div>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Read and Action Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1.5 border-t border-slate-200">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">Read Receipts ({n.read_count || 0} / {n.total_eligible || 1})</span>
                        <strong className="text-slate-800 font-mono">{n.read_rate || 0}%</strong>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-slate-800 h-full rounded-full" style={{ width: `${n.read_rate || 0}%` }} />
                      </div>
                    </div>

                    {n.actionable ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-600 font-medium">Actions Completed ({n.action_count || 0} / {n.total_eligible || 1})</span>
                          <strong className="text-emerald-600 font-mono">{n.action_rate || 0}%</strong>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${n.action_rate || 0}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 flex items-center">
                        Informational Notice (No action required)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ROOMS & ASSETS */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="sb-card p-4">
            <h3 className="text-sm font-bold text-slate-900">Campus Rooms & Asset Inventory</h3>
            <p className="text-xs text-slate-500 mt-0.5">Institutional record of accommodation and physical hardware.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {rooms.map((rm) => (
              <div key={rm.id} className="sb-card-interactive p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Room {rm.room_number}</h4>
                    <div className="text-xs text-slate-500">{rm.hostel} • Floor {rm.floor}</div>
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

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Associated Hardware / Assets</div>
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

      {/* TAB 7: SECURITY GATE OPERATIONS */}
      {activeTab === 'gatelogs' && (
        <div className="space-y-4">
          {/* Security Guard Gate Logger Form */}
          <div className="sb-card p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Record Student Gate Movement (Security Terminal)</h3>
            <form onSubmit={handleCreateGateLog} className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student</label>
                <select
                  value={glStudentId}
                  onChange={(e) => setGlStudentId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="std-1">Rahul Verma (22CSE045)</option>
                  <option value="std-2">Priya Sharma (22CSE046)</option>
                  <option value="std-3">Amit Patel (23MECH012)</option>
                  <option value="std-4">Sneha Roy (23ECE088)</option>
                  <option value="std-5">Rohan Das (24CSE099)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type</label>
                <select
                  value={glType}
                  onChange={(e) => setGlType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="Entry">Entry (Inbound)</option>
                  <option value="Exit">Exit (Outbound)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Security Post / Gate</label>
                <input
                  type="text"
                  required
                  value={glGate}
                  onChange={(e) => setGlGate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  required
                  value={glRemarks}
                  onChange={(e) => setGlRemarks(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#FF5733] hover:bg-[#E0482B] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-2xs active:scale-95"
                >
                  Log Movement Event
                </button>
              </div>
            </form>
          </div>

          {/* Master Gate Logs Table */}
          <div className="sb-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-900">
              Campus Gate Access Register
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {gateLogs.map((gl) => (
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: MESS FEEDBACK */}
      {activeTab === 'mess' && (
        <div className="space-y-4">
          <div className="sb-card p-4">
            <h3 className="text-sm font-bold text-slate-900">Mess Quality & Feedback Analytics</h3>
            <p className="text-xs text-slate-500 mt-0.5">Aggregated student satisfaction ratings across meals.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {messFeedback?.meal_summary?.map((ms, idx) => (
              <div key={idx} className="sb-card-interactive p-4 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{ms.meal}</span>
                <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  {Number(ms.avg_rating).toFixed(1)} ★
                </div>
                <div className="text-[11px] text-slate-500">{ms.total_reviews} reviews</div>
              </div>
            ))}
          </div>

          {/* Recent Reviews */}
          <div className="sb-card p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Student Meal Feedback</h4>
            <div className="space-y-2">
              {messFeedback?.recent_reviews?.map((rv) => (
                <div key={rv.id} className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{rv.student_name}</span>
                    <span className="text-amber-600 font-bold font-mono">{rv.rating} ★</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{rv.day} • {rv.meal}</div>
                  {rv.comment && <p className="text-slate-600 italic text-[11px]">"{rv.comment}"</p>}
                </div>
              ))}
            </div>
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
            await loadAdminData();
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
