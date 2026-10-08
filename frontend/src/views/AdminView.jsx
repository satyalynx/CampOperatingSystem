import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Bell, 
  RotateCcw, 
  Play, 
  Plus, 
  DoorOpen, 
  Building, 
  FileText, 
  History, 
  Sparkles,
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
  const [loading, setLoading] = useState(false);

  // High-Density Side-Panel State
  const [selectedSidePanelTicket, setSelectedSidePanelTicket] = useState(null);
  const [selectedAuditRequest, setSelectedAuditRequest] = useState(null);

  // Engine Actions & Feedback
  const [escalationEngineResult, setEscalationEngineResult] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

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

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

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
    <div className="space-y-6">
      {/* Admin Action Message Toast */}
      {actionMessage && (
        <div className="bg-indigo-950/80 border border-indigo-700 text-indigo-200 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xl">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Executive Header & Quick Controls */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border border-purple-800/60 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Institution Executive Command Center
            </span>
            <span className="text-xs text-slate-400">Chief Administrative Office</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            CampOS Central Operations Dashboard
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Full Institutional Visibility • SLA Accountability Matrix • High-Density Queue & Side-Panel
          </p>
        </div>

        {/* Action Controls for Demo & Presentation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunEscalationEngine}
            className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
            title="Execute server-side deterministic SLA auto-escalation check"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run SLA Engine Now</span>
          </button>

          <button
            onClick={handleResetDemoData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
            title="Reset database to initial demo state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart3 },
          { id: 'queue', label: 'High-Density Queue Table', icon: TableIcon, count: requests.length },
          { id: 'accountability', label: 'Staff Accountability Matrix', icon: Users },
          { id: 'repeats', label: 'Repeat Issues Engine', icon: AlertTriangle, count: repeatIssues.length },
          { id: 'notices', label: 'Notices & Engagement', icon: Bell },
          { id: 'rooms', label: 'Campus Rooms & Assets', icon: Building },
          { id: 'gatelogs', label: 'Security Gate Operations', icon: DoorOpen },
          { id: 'mess', label: 'Mess Quality Feedback', icon: UtensilsCrossed },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white text-purple-700' : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Real-time KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Campus Requests</span>
              <div className="text-2xl font-black text-white">{dashboard?.total_requests || 0}</div>
              <p className="text-[11px] text-slate-500">Unified model entries</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Open / In Progress</span>
              <div className="text-2xl font-black text-amber-400">
                {(dashboard?.open_requests || 0) + (dashboard?.in_progress_requests || 0)}
              </div>
              <p className="text-[11px] text-slate-500">Currently active</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Resolved / Approved</span>
              <div className="text-2xl font-black text-emerald-400">{dashboard?.resolved_requests || 0}</div>
              <p className="text-[11px] text-slate-500">Successfully handled</p>
            </div>

            <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-2xl space-y-1 escalated-pulse">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">SLA Breached (Escalated)</span>
              <div className="text-2xl font-black text-rose-300">{dashboard?.escalated_requests || 0}</div>
              <p className="text-[11px] text-slate-400">Surfaced to Dean</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Avg Resolution Time</span>
              <div className="text-2xl font-black text-white">{dashboard?.avg_resolution_hours || 0}h</div>
              <p className="text-[11px] text-slate-500">≈ {dashboard?.avg_resolution_days || 0} days</p>
            </div>
          </div>

          {/* Ageing & Facility Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ageing Analysis */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Ageing Ticket Analysis</span>
              </h3>
              <div className="space-y-3 pt-1">
                <div className="bg-slate-800/40 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Pending &gt; 48 Hours:</span>
                  <span className="font-extrabold text-amber-400 text-sm">{dashboard?.ageing_over_48h || 0}</span>
                </div>
                <div className="bg-slate-800/40 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Pending &gt; 7 Days:</span>
                  <span className="font-extrabold text-rose-400 text-sm">{dashboard?.ageing_over_7d || 0}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Requests breaching the standard 48-hour resolution threshold are promoted for immediate administrative review.
                </p>
              </div>
            </div>

            {/* Requests by Type */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Workload by Type</span>
              </h3>
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Hostel Complaints (48h SLA)</span>
                  <strong className="text-white">{dashboard?.by_type?.complaint || 0}</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Leave / Gatepasses (2h SLA)</span>
                  <strong className="text-white">{dashboard?.by_type?.leave || 0}</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Document Certificates (72h SLA)</span>
                  <strong className="text-white">{dashboard?.by_type?.document || 0}</strong>
                </div>
              </div>
            </div>

            {/* Systemic Repeat Issues Summary */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Systemic Facility Defects</span>
              </h3>
              <div className="bg-rose-950/30 border border-rose-800/60 rounded-2xl p-4 text-center space-y-1">
                <div className="text-3xl font-black text-rose-300">{dashboard?.repeat_issues_count || 0}</div>
                <div className="text-xs font-semibold text-rose-200">Flagged Recurring Locations</div>
                <p className="text-[10px] text-slate-400 pt-1">Room + category combinations occurring ≥ 2 times</p>
              </div>
              <button
                onClick={() => setActiveTab('repeats')}
                className="w-full text-center py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
            <h3 className="text-base font-bold text-white">Staff SLA Escalation & Workload Accountability</h3>
            <p className="text-xs text-slate-400">
              Measurable institutional accountability metric tracking assigned workload and SLA breaches per officer.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-4">Staff Officer</th>
                    <th className="p-4">Assigned Scope</th>
                    <th className="p-4 text-center">Pending Workload</th>
                    <th className="p-4 text-center">SLA Breaches (Escalations)</th>
                    <th className="p-4 text-center">Total Lifetime Handled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {dashboard?.staff_accountability?.map((stf) => (
                    <tr key={stf.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>{stf.name}</span>
                      </td>
                      <td className="p-4 text-slate-300">{stf.hostel || 'Institution-Wide'}</td>
                      <td className="p-4 text-center font-bold text-amber-400">
                        {stf.pending_workload}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold ${
                          stf.escalations_count > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {stf.escalations_count}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-semibold text-slate-400">
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
            <h3 className="text-base font-bold text-white">Facility Repeat-Issue Detection Engine</h3>
            <p className="text-xs text-slate-400">
              Automated aggregation grouping complaints by Room + Category to surface systemic infrastructure faults (threshold: ≥ 2 complaints).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repeatIssues.map((ri, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-rose-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                      Systemic Fault Flagged
                    </span>
                    <h4 className="text-lg font-black text-white">{ri.hostel} • Room {ri.room}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-rose-400">{ri.complaint_count}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Complaints</div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-2xl text-xs space-y-1">
                  <div className="text-slate-400">Category: <strong className="text-white">{ri.category}</strong></div>
                  <div className="text-slate-400">Latest Occurrence: <strong className="text-slate-300">{new Date(ri.latest_complaint_at).toLocaleString()}</strong></div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Complaint Titles:</div>
                  <div className="space-y-1.5">
                    {ri.titles_list?.map((t, tIdx) => (
                      <div key={tIdx} className="bg-slate-800/40 border border-slate-700/60 p-2.5 rounded-xl text-xs text-slate-200">
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
        <div className="space-y-6">
          {/* Notice Composer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Compose Targeted Notice</span>
            </h3>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Hostel</label>
                  <select
                    value={targetHostel}
                    onChange={(e) => setTargetHostel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="All">All Hostels (Institution-Wide)</option>
                    <option value="Girls Block A">Girls Block A Only</option>
                    <option value="Boys Block B">Boys Block B Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Batch</label>
                  <select
                    value={targetBatch}
                    onChange={(e) => setTargetBatch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="All">All Batches</option>
                    <option value="2022-2026">2022-2026</option>
                    <option value="2023-2027">2023-2027</option>
                    <option value="2024-2028">2024-2028</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Branch</label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="All">All Branches</option>
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="MECH">Mechanical (MECH)</option>
                    <option value="ECE">Electronics (ECE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Hostel Floor Meeting this Friday"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notice Body Content</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Official notice instructions and specifics..."
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actionableCheck"
                  checked={isActionable}
                  onChange={(e) => setIsActionable(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="actionableCheck" className="text-xs text-slate-300 font-medium">
                  Requires Student Acknowledgment / Completion Action
                </label>
              </div>

              <button
                type="submit"
                disabled={postingNotice}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                {postingNotice ? 'Publishing...' : 'Publish Targeted Notice'}
              </button>
            </form>
          </div>

          {/* Notices Engagement Tracking Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden p-5 space-y-4">
            <h3 className="text-base font-bold text-white">Live Notice Engagement Analytics</h3>
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{n.title}</h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Target: {n.target_hostel} • {n.target_branch} • {n.target_batch} • By {n.posted_by}
                      </div>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Read and Action Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700/60">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 font-medium">Read Receipts ({n.read_count || 0} / {n.total_eligible || 1})</span>
                        <strong className="text-indigo-400">{n.read_rate || 0}%</strong>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${n.read_rate || 0}%` }} />
                      </div>
                    </div>

                    {n.actionable ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300 font-medium">Actions Completed ({n.action_count || 0} / {n.total_eligible || 1})</span>
                          <strong className="text-emerald-400">{n.action_rate || 0}%</strong>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${n.action_rate || 0}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 flex items-center">
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Campus Rooms & Asset Inventory</h3>
              <p className="text-xs text-slate-400">Institutional record of accommodation and physical hardware.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((rm) => (
              <div key={rm.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">Room {rm.room_number}</h4>
                    <div className="text-xs text-slate-400">{rm.hostel} • Floor {rm.floor}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    Occupancy: {rm.occupied_count} / {rm.capacity}
                  </span>
                </div>

                {rm.notes && (
                  <p className="text-xs text-amber-300/80 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-xl">
                    Note: {rm.notes}
                  </p>
                )}

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Associated Hardware / Assets</div>
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

      {/* TAB 7: SECURITY GATE OPERATIONS */}
      {activeTab === 'gatelogs' && (
        <div className="space-y-6">
          {/* Security Guard Gate Logger Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Record Student Gate Movement (Security Terminal)</h3>
            <form onSubmit={handleCreateGateLog} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student</label>
                <select
                  value={glStudentId}
                  onChange={(e) => setGlStudentId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="std-1">Rahul Verma (22CSE045)</option>
                  <option value="std-2">Priya Sharma (22CSE046)</option>
                  <option value="std-3">Amit Patel (23MECH012)</option>
                  <option value="std-4">Sneha Roy (23ECE088)</option>
                  <option value="std-5">Rohan Das (24CSE099)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Movement Type</label>
                <select
                  value={glType}
                  onChange={(e) => setGlType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="Entry">Entry (Inbound)</option>
                  <option value="Exit">Exit (Outbound)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Security Post / Gate</label>
                <input
                  type="text"
                  required
                  value={glGate}
                  onChange={(e) => setGlGate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Log Movement Event
              </button>
            </form>
          </div>

          {/* Master Gate Logs Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-base font-bold text-white">Campus Gate Access Register</h3>
            <div className="space-y-2">
              {gateLogs.map((gl) => (
                <div key={gl.id} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between text-xs">
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
          </div>
        </div>
      )}

      {/* TAB 8: MESS FEEDBACK */}
      {activeTab === 'mess' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
            <h3 className="text-base font-bold text-white">Mess Quality & Feedback Analytics</h3>
            <p className="text-xs text-slate-400">Aggregated student satisfaction ratings across meals.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {messFeedback?.meal_summary?.map((ms, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">{ms.meal}</span>
                <div className="text-2xl font-black text-amber-400">
                  {Number(ms.avg_rating).toFixed(1)} ★
                </div>
                <div className="text-[10px] text-slate-500">{ms.total_reviews} reviews</div>
              </div>
            ))}
          </div>

          {/* Recent Reviews */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white">Recent Student Meal Feedback</h4>
            <div className="space-y-2.5">
              {messFeedback?.recent_reviews?.map((rv) => (
                <div key={rv.id} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{rv.student_name}</span>
                    <span className="text-amber-400 font-bold">{rv.rating} ★</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{rv.day} • {rv.meal}</div>
                  {rv.comment && <p className="text-slate-300 italic">"{rv.comment}"</p>}
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
