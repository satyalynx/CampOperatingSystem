import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Send, 
  QrCode, 
  History, 
  Calendar, 
  Utensils, 
  DollarSign, 
  DoorOpen, 
  Bell, 
  Check, 
  AlertTriangle, 
  BookOpen, 
  Filter,
  ThumbsUp,
  FileCheck
} from 'lucide-react';
import { api } from '../api';
import SimilarTicketsBox from '../components/SimilarTicketsBox';
import AuditModal from '../components/AuditModal';
import QrModal from '../components/QrModal';
import TicketDetailPanel from '../components/TicketDetailPanel';

export default function StudentView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [requests, setRequests] = useState([]);
  const [communityRequests, setCommunityRequests] = useState([]);
  const [requestScope, setRequestScope] = useState('my'); // 'my' | 'community'
  const [notices, setNotices] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [fees, setFees] = useState([]);
  const [messMenu, setMessMenu] = useState([]);
  const [messFeedbacks, setMessFeedbacks] = useState([]);
  const [gateHistory, setGateHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Panels
  const [selectedSidePanelTicket, setSelectedSidePanelTicket] = useState(null);
  const [selectedAuditRequest, setSelectedAuditRequest] = useState(null);
  const [selectedQrRequest, setSelectedQrRequest] = useState(null);

  // New Request Form State
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [formType, setFormType] = useState('complaint'); // complaint, leave, document
  const [formCategory, setFormCategory] = useState('Plumbing');
  const [formAmenityType, setFormAmenityType] = useState('individual'); // individual | shared_amenity
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Mess Feedback Form State
  const [fbMeal, setFbMeal] = useState('Lunch');
  const [fbDay, setFbDay] = useState('Thursday');
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [reqs, commReqs, nots, att, tt, f, menu, fb, gh] = await Promise.all([
        api.getRequests(),
        api.getRequests({ community: true }),
        api.getNotices(),
        api.getStudentAttendance(),
        api.getStudentTimetable(),
        api.getStudentFees(),
        api.getMessMenu(),
        api.getMyMessFeedback(),
        api.getMyGateHistory(),
      ]);
      setRequests(reqs || []);
      setCommunityRequests(commReqs || []);
      setNotices(nots || []);
      setAttendance(att);
      setTimetable(tt || []);
      setFees(f || []);
      setMessMenu(menu || []);
      setMessFeedbacks(fb || []);
      setGateHistory(gh || []);
    } catch (err) {
      console.error('Error loading student data', err);
    } finally {
      setLoading(false);
    }
  };

  const reloadRequests = async () => {
    try {
      const [reqs, commReqs] = await Promise.all([
        api.getRequests(),
        api.getRequests({ community: true }),
      ]);
      setRequests(reqs || []);
      setCommunityRequests(commReqs || []);
    } catch (err) {
      console.error('Error reloading requests', err);
    }
  };

  const handleUpvoteRequest = async (reqId) => {
    try {
      await api.upvoteRequest(reqId);
      await reloadRequests();
    } catch (err) {
      alert(`Upvote failed: ${err.message}`);
    }
  };

  const handleVerifyResolution = async (reqId, confirmed) => {
    try {
      let note = 'Confirmed resolved by student';
      if (!confirmed) {
        const input = window.prompt('Please enter the reason for rejecting proof (Zero-Trust Anti-Fraud: auto-escalates directly to Level 3 Dean / Director):');
        if (input === null) return;
        note = input.trim() || 'Proof rejected: Issue remains unresolved or proof is fraudulent';
      }
      await api.verifyRequest(reqId, confirmed, note);
      await reloadRequests();
    } catch (err) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  const handleTypeSelect = (type) => {
    setFormType(type);
    if (type === 'complaint') {
      setFormCategory('Plumbing');
    } else if (type === 'leave') {
      setFormCategory('Outing');
      setFormAmenityType('individual');
    } else if (type === 'document') {
      setFormCategory('Bonafide');
      setFormAmenityType('individual');
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.createRequest({
        type: formType,
        category: formCategory,
        title: formTitle,
        description: formDescription,
        priority: formPriority,
        amenity_type: formAmenityType,
      });
      if (res.duplicate_intercepted) {
        setSuccessMessage(`⚡ Duplicate Intercepted & Upvoted: ${res.message}`);
      } else {
        setSuccessMessage(`✓ Request filed successfully under ${formType.toUpperCase()} SLA workflow!`);
      }
      setFormTitle('');
      setFormDescription('');
      setShowNewRequestForm(false);
      const updatedReqs = await api.getRequests();
      setRequests(updatedReqs || []);
      const updatedComm = await api.getRequests({ community: true });
      setCommunityRequests(updatedComm || []);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      alert(`Error submitting request: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkNoticeRead = async (noticeId) => {
    try {
      await api.markNoticeRead(noticeId);
      const updatedNots = await api.getNotices();
      setNotices(updatedNots);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNoticeAction = async (noticeId) => {
    try {
      await api.markNoticeAction(noticeId);
      const updatedNots = await api.getNotices();
      setNotices(updatedNots);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitMessFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.submitMessFeedback({
        day: fbDay,
        meal: fbMeal,
        rating: Number(fbRating),
        comment: fbComment,
      });
      setFbComment('');
      const updatedFb = await api.getMyMessFeedback();
      setMessFeedbacks(updatedFb || []);
      alert('Mess feedback recorded successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const displayList = requestScope === 'community' ? communityRequests : requests;
  const filteredRequests = displayList.filter((r) => {
    if (typeFilter !== 'All' && r.type !== typeFilter.toLowerCase()) return false;
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'Open' || r.status === 'In Progress').length;
  const escalatedCount = requests.filter((r) => r.escalated).length;
  const unreadNoticesCount = notices.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-950/70 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'requests', label: 'Request Desk', icon: FileText, badge: pendingCount },
          { id: 'attendance', label: 'Attendance', icon: CheckCircle2, alert: attendance?.is_overall_low },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'fees', label: 'Fees & Dues', icon: DollarSign },
          { id: 'mess', label: 'Hostel & Mess', icon: Utensils },
          { id: 'gate', label: 'Gate History', icon: DoorOpen },
          { id: 'notices', label: 'Targeted Notices', icon: Bell, badge: unreadNoticesCount },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white text-indigo-700' : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.alert && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Requests</span>
              <div className="text-2xl font-extrabold text-white">{pendingCount}</div>
              <p className="text-[11px] text-slate-500">Awaiting resolution / pass</p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1 transition ${
              escalatedCount > 0
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 escalated-pulse'
                : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Escalated Tickets</span>
                {escalatedCount > 0 && <ShieldAlert className="w-4 h-4 text-rose-400" />}
              </div>
              <div className="text-2xl font-extrabold text-rose-300">{escalatedCount}</div>
              <p className="text-[11px] text-slate-400">Breached SLA → Dean Office</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unread Notices</span>
              <div className="text-2xl font-extrabold text-indigo-400">{unreadNoticesCount}</div>
              <p className="text-[11px] text-slate-500">Targeted to your profile</p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1 ${
              attendance?.is_overall_low
                ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Attendance Rate</span>
                {attendance?.is_overall_low && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="text-2xl font-extrabold text-white">{attendance?.overall_percentage || 0}%</div>
              <p className="text-[11px] text-slate-400">
                {attendance?.is_overall_low ? '⚠️ Under 75% Threshold!' : 'Satisfactory (≥ 75%)'}
              </p>
            </div>
          </div>

          {/* Quick Actions & Recent Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recent Requests */}
            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Recent Requests</span>
                </h3>
                <button
                  onClick={() => { setActiveTab('requests'); setShowNewRequestForm(true); }}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Raise Request</span>
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No requests raised yet. Use "Raise Request" to submit complaints, leaves, or document certificates.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.slice(0, 4).map((req) => (
                    <div key={req.id} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {req.type}
                          </span>
                          <span className="font-semibold text-slate-200 truncate">{req.title}</span>
                          {req.escalated ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 animate-pulse">
                              SLA BREACH
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{req.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          req.status === 'Resolved' || req.status === 'Approved'
                            ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                            : req.status === 'Escalated'
                            ? 'bg-rose-950/70 text-rose-400 border-rose-800'
                            : 'bg-amber-950/70 text-amber-400 border-amber-800'
                        }`}>
                          {req.status}
                        </span>
                        <button
                          onClick={() => setSelectedAuditRequest(req)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                          title="View audit trail"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Targeted Notices Glance */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <span>Notice Board</span>
              </h3>

              <div className="space-y-3">
                {notices.slice(0, 3).map((not) => (
                  <div key={not.id} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-200 leading-tight">{not.title}</span>
                      {!not.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{not.body}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                      <span>{not.posted_by}</span>
                      {!not.is_read && (
                        <button
                          onClick={() => handleMarkNoticeRead(not.id)}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REQUEST DESK */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Header & New Request Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
            <div>
              <h2 className="text-lg font-bold text-white">Unified Request Desk</h2>
              <p className="text-xs text-slate-400">
                SLA-enforced workflows for Hostel Complaints (48h), Leave/Gatepasses (2h), and Certificates (72h).
              </p>
            </div>
            <button
              onClick={() => setShowNewRequestForm(!showNewRequestForm)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showNewRequestForm ? 'Close Form' : 'Raise New Request'}</span>
            </button>
          </div>

          {/* New Request Creation Card */}
          {showNewRequestForm && (
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">File Operational Request</h3>
                  <p className="text-xs text-slate-400">Select workflow category and submit details.</p>
                </div>
                {/* Workflow SLA Tag */}
                <div className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 font-semibold">
                  SLA: {formType === 'complaint' ? '48 Hours' : formType === 'leave' ? '2 Hours' : '72 Hours'}
                </div>
              </div>

              {/* Workflow Type Selector */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'complaint', label: 'Hostel Complaint', sla: '48h SLA', color: 'border-amber-500/50' },
                  { id: 'leave', label: 'Leave / Gatepass', sla: '2h SLA', color: 'border-emerald-500/50' },
                  { id: 'document', label: 'Document / Cert', sla: '72h SLA', color: 'border-indigo-500/50' },
                ].map((wt) => (
                  <button
                    key={wt.id}
                    type="button"
                    onClick={() => handleTypeSelect(wt.id)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      formType === wt.id
                        ? 'bg-slate-800 border-indigo-500 text-white ring-2 ring-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{wt.label}</div>
                    <div className="text-[10px] text-indigo-400 font-mono mt-0.5">{wt.sla}</div>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {formType === 'complaint' && (
                        <>
                          <option value="Plumbing">Plumbing</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Internet/WiFi">Internet / WiFi</option>
                          <option value="Carpentry">Carpentry & Furniture</option>
                          <option value="Sanitation">Sanitation & Washroom</option>
                          <option value="Cleanliness">Room & Corridor Cleaning</option>
                        </>
                      )}
                      {formType === 'leave' && (
                        <>
                          <option value="Outing">Weekend Home Outing</option>
                          <option value="Medical">Medical / Hospital Consultation</option>
                          <option value="Emergency">Family Emergency</option>
                          <option value="Academic">Academic Conference / Event</option>
                        </>
                      )}
                      {formType === 'document' && (
                        <>
                          <option value="Bonafide">Bonafide Certificate</option>
                          <option value="Transcript">Official Grade Transcript</option>
                          <option value="Character Certificate">Character Certificate</option>
                          <option value="Fee Receipt">Duplicate Fee Receipt</option>
                          <option value="ID Card">ID Card Reissue</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Priority Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High (Urgent Facility Issue)</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                {/* Amenity Scope Selector (For Complaints) */}
                {formType === 'complaint' && (
                  <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        Amenity Scope (Zero-Trust Duplicate Protection)
                      </label>
                      <span className="text-[10px] text-indigo-400 font-mono">
                        Auto-Upvote Engine
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        formAmenityType === 'individual'
                          ? 'bg-slate-800 border-indigo-500 text-white ring-1 ring-indigo-500'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="amenityType"
                          checked={formAmenityType === 'individual'}
                          onChange={() => setFormAmenityType('individual')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-200">Individual Room Issue</div>
                          <div className="text-[10px] text-slate-400">Personal room assets & fixtures</div>
                        </div>
                      </label>
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        formAmenityType === 'shared_amenity'
                          ? 'bg-slate-800 border-indigo-500 text-white ring-1 ring-indigo-500'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="amenityType"
                          checked={formAmenityType === 'shared_amenity'}
                          onChange={() => setFormAmenityType('shared_amenity')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-200">Shared Campus Amenity</div>
                          <div className="text-[10px] text-indigo-400">Auto-intercepts duplicates into upvotes</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Similar-Ticket Institutional Precedent Box */}
                <SimilarTicketsBox type={formType} category={formCategory} />

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Request Summary / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Water tap dripping continuously in room 204"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Detailed Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific location, details, dates or reason..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestForm(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Scope Selector: My Requests vs Campus Community Upvote Board */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRequestScope('my')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  requestScope === 'my'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                My Filed Requests ({requests.length})
              </button>
              <button
                onClick={() => setRequestScope('community')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  requestScope === 'community'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-indigo-300" />
                <span>Campus Upvote Board ({communityRequests.length})</span>
              </button>
            </div>

            {requestScope === 'community' && (
              <span className="text-[11px] text-indigo-300 font-medium px-2">
                ⚡ Student upvotes dynamically compress resolution SLA windows!
              </span>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 font-semibold">Filter:</span>
              <div className="flex items-center gap-1">
                {['All', 'Complaint', 'Leave', 'Document'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      typeFilter === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
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

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
                No requests found matching your filters.
              </div>
            ) : (
              filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className={`bg-slate-900/80 border rounded-3xl p-5 space-y-4 transition ${
                    req.fraud_flag === 1
                      ? 'border-rose-600 shadow-lg shadow-rose-950/40 bg-rose-950/20'
                      : req.escalated
                      ? 'border-rose-700/80 shadow-lg shadow-rose-950/30'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {req.type}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {req.category}
                      </span>
                      <span className="text-xs font-mono text-slate-500">#{req.id}</span>

                      {/* Shared Amenity Tag */}
                      {req.amenity_type === 'shared_amenity' && (
                        <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          🏢 Shared Amenity
                        </span>
                      )}

                      {/* Community Upvotes Tag */}
                      {req.upvotes_count > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-indigo-400" />
                          <span>{req.upvotes_count} Upvotes (Limit: {req.sla_limit_hours}h)</span>
                        </span>
                      )}
                      
                      {/* Live SLA Countdown Badge */}
                      {req.escalated ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 animate-pulse flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span>SLA BREACH ESCALATED ({req.escalation_target || 'Chief Warden'})</span>
                        </span>
                      ) : req.status === 'Open' || req.status === 'In Progress' ? (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Auto-escalates in {req.sla_remaining_hours}h</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {req.fraud_flag === 1 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-950 text-rose-300 border border-rose-600 animate-pulse">
                          🚨 FRAUD FLAGGED
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        req.status === 'Closed' || req.status === 'Resolved' || req.status === 'Approved'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : req.status === 'Pending Verification'
                          ? 'bg-purple-950 text-purple-300 border-purple-700'
                          : req.status === 'Escalated'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : req.status === 'Rejected'
                          ? 'bg-rose-950/50 text-rose-400 border-rose-800'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{req.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{req.description}</p>
                  </div>

                  {/* Two-Way Student Verification Loop Card (If Pending Verification, Resolved or Closed) */}
                  {(req.status === 'Pending Verification' || req.status === 'Resolved' || req.status === 'Closed') && (
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                      {req.status === 'Closed' || req.student_verified === 1 ? (
                        <div className="flex items-center gap-2 text-emerald-300 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span><strong>Resolution Verified & Closed by Student:</strong> "{req.student_verification_note || 'Issue resolved.'}"</span>
                        </div>
                      ) : req.student_verified === -1 ? (
                        <div className="flex items-center gap-2 text-rose-300 text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span><strong>Resolution Disputed as Fraudulent / Inadequate:</strong> "{req.student_verification_note}" (Escalated to Level 3 Dean / Director)</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-xs text-purple-300 space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-purple-200">
                              <FileCheck className="w-4 h-4 text-purple-400" />
                              <span>Staff Resolution Submitted — Awaiting Your Inspection</span>
                            </div>
                            <p className="text-[11px] text-slate-300">
                              Staff cannot close this ticket without your confirmation. Please inspect the location and confirm resolution or dispute as fraudulent:
                            </p>
                          </div>

                          {req.proof_image_url && (
                            <div className="space-y-1">
                              <img
                                src={req.proof_image_url}
                                alt="Resolution Proof"
                                className="w-full max-h-48 object-cover rounded-xl border border-purple-800/60 shadow"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                Proof Photo URL: <a href={req.proof_image_url} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{req.proof_image_url}</a>
                              </div>
                            </div>
                          )}

                          {req.resolution_proof && (
                            <div className="text-xs text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                              <strong className="text-emerald-400">Staff Work Notes:</strong> {req.resolution_proof}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              onClick={() => handleVerifyResolution(req.id, true)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ Accept & Close Ticket</span>
                            </button>
                            <button
                              onClick={() => handleVerifyResolution(req.id, false)}
                              className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                              title="Auto-escalates directly to Level 3 Dean / Director of Campus Operations"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                              <span>🚨 Reject as Fraudulent / Inadequate</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>Assigned: <strong className="text-slate-300">{req.assigned_staff_name || 'System Admin'}</strong></span>
                      <span>•</span>
                      <span>Created: {new Date(req.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Community Upvote Button */}
                      {req.type === 'complaint' && req.status !== 'Resolved' && req.status !== 'Rejected' && (
                        <button
                          onClick={() => handleUpvoteRequest(req.id)}
                          disabled={req.has_upvoted}
                          className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition ${
                            req.has_upvoted
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              : 'bg-indigo-600/80 hover:bg-indigo-500 text-white shadow'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{req.has_upvoted ? 'Upvoted' : 'Upvote (+1)'}</span>
                        </button>
                      )}

                      {/* Verified Digital Pass QR for approved leave requests */}
                      {req.type === 'leave' && req.status === 'Approved' && (
                        <button
                          onClick={() => setSelectedQrRequest(req)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition shadow"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>View Digital Pass</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedSidePanelTicket(req)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <span>Inspect Ticket</span>
                      </button>

                      <button
                        onClick={() => setSelectedAuditRequest(req)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Audit Trail</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Academic Attendance Visibility</h2>
              <p className="text-xs text-slate-400">Official course attendance records and threshold alerts.</p>
            </div>
            <div className={`px-4 py-2 rounded-2xl border text-center ${
              attendance?.is_overall_low
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}>
              <div className="text-xs uppercase font-semibold">Cumulative Rate</div>
              <div className="text-2xl font-black">{attendance?.overall_percentage}%</div>
            </div>
          </div>

          {attendance?.is_overall_low && (
            <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Attendance Warning: Sub-75% Requirement</strong>
                <span>
                  One or more registered courses is currently beneath the statutory 75% examination eligibility criteria.
                  Please attend forthcoming scheduled lectures to prevent debarment.
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attendance?.records?.map((rec) => (
              <div key={rec.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                      {rec.subject_code}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{rec.subject}</h3>
                  </div>
                  <span className={`text-base font-extrabold ${rec.is_low_attendance ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {rec.percentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${rec.is_low_attendance ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, rec.percentage)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Attended: <strong className="text-white">{rec.present}</strong> / {rec.total} classes</span>
                  {rec.is_low_attendance && (
                    <span className="text-rose-400 font-semibold text-[11px]">Low Attendance</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white">Today's Class Schedule & Cancellations</h2>
            <p className="text-xs text-slate-400">Real-time timetable visibility eliminates notice-board checking.</p>
          </div>

          <div className="space-y-3">
            {timetable.map((cls) => (
              <div
                key={cls.id}
                className={`p-4 rounded-2xl border transition ${
                  cls.is_cancelled
                    ? 'bg-rose-950/20 border-rose-800/80'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs font-mono font-bold text-indigo-400 bg-slate-800/80 py-1.5 px-2 rounded-xl text-center border border-slate-700">
                      {cls.start_time}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{cls.subject}</div>
                      <div className="text-xs text-slate-400">{cls.faculty} • {cls.room}</div>
                    </div>
                  </div>

                  {cls.is_cancelled ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1 self-start sm:self-auto">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>CLASS CANCELLED</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-emerald-400 border border-slate-700 self-start sm:self-auto">
                      On Schedule
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FEES */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white">Fee Dues & Financial Clearance</h2>
            <p className="text-xs text-slate-400">Institutional tuition and hostel fee status.</p>
          </div>

          <div className="space-y-3">
            {fees.map((fee) => (
              <div key={fee.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{fee.term}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Due Date: {new Date(fee.due_date).toLocaleDateString()}
                    {fee.payment_date && ` • Paid on ${new Date(fee.payment_date).toLocaleDateString()}`}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-base font-extrabold text-white">
                    ₹{fee.amount.toLocaleString()}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    fee.status === 'Paid'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : fee.status === 'Overdue'
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : 'bg-amber-950 text-amber-300 border-amber-700'
                  }`}>
                    {fee.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: HOSTEL & MESS */}
      {activeTab === 'mess' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white">Campus Mess & Dining Operations</h2>
            <p className="text-xs text-slate-400">Weekly dietary menu and student meal quality feedback.</p>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {messMenu.slice(0, 4).map((m) => (
              <div key={m.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {m.day_of_week} • {m.meal_type}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">{m.items}</p>
              </div>
            ))}
          </div>

          {/* Meal Feedback Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Submit Meal Quality Feedback</h3>
            <form onSubmit={handleSubmitMessFeedback} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Day</label>
                  <select
                    value={fbDay}
                    onChange={(e) => setFbDay(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Meal</label>
                  <select
                    value={fbMeal}
                    onChange={(e) => setFbMeal(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rating (1 to 5 Stars)</label>
                  <select
                    value={fbRating}
                    onChange={(e) => setFbRating(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars (Excellent)</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars (Good)</option>
                    <option value="3">⭐⭐⭐ 3 Stars (Average)</option>
                    <option value="2">⭐⭐ 2 Stars (Needs Improvement)</option>
                    <option value="1">⭐ 1 Star (Poor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Comments</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rice was well cooked, but vegetable salt was high."
                  value={fbComment}
                  onChange={(e) => setFbComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 7: GATE HISTORY */}
      {activeTab === 'gate' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white">Campus Security Gate Movement History</h2>
            <p className="text-xs text-slate-400">Verified security logs of turnstile and gate accesses.</p>
          </div>

          <div className="space-y-3">
            {gateHistory.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                No security gate logs recorded.
              </div>
            ) : (
              gateHistory.map((g) => (
                <div key={g.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      g.type === 'Entry' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    }`}>
                      {g.type}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{g.gate}</div>
                      <div className="text-[11px] text-slate-400">{g.remarks}</div>
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(g.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 8: NOTICES */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white">Targeted Institutional Notice Board</h2>
            <p className="text-xs text-slate-400">
              Filtered exclusively for your hostel ({currentUser?.hostel}), branch ({currentUser?.branch}), and batch.
            </p>
          </div>

          <div className="space-y-4">
            {notices.map((n) => (
              <div
                key={n.id}
                className={`bg-slate-900/80 border rounded-3xl p-5 space-y-3 transition ${
                  !n.is_read ? 'border-indigo-600/80 shadow-lg shadow-indigo-950/20' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                        NEW UNREAD
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">By {n.posted_by}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{n.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{n.body}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <div className="text-[11px] text-slate-400">
                    Target: {n.target_hostel} • {n.target_branch} • {n.target_batch}
                  </div>

                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkNoticeRead(n.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-xl font-medium text-xs transition"
                      >
                        Mark as Read
                      </button>
                    )}

                    {n.actionable ? (
                      n.is_actioned ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 text-xs">
                          <Check className="w-3.5 h-3.5" /> Action Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkNoticeAction(n.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-xl font-semibold text-xs transition shadow"
                        >
                          Acknowledge & Complete Action
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
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
            await loadAllData();
            try {
              const updated = await api.getRequestDetail(selectedSidePanelTicket.id);
              setSelectedSidePanelTicket(updated);
            } catch (err) {
              console.error(err);
            }
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

      {/* Verified Digital Pass QR Modal */}
      {selectedQrRequest && (
        <QrModal
          request={selectedQrRequest}
          onClose={() => setSelectedQrRequest(null)}
        />
      )}
    </div>
  );
}
