import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusCircle, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Send, 
  Calendar, 
  Utensils, 
  DollarSign, 
  DoorOpen, 
  Bell, 
  AlertTriangle, 
  BookOpen, 
  ThumbsUp, 
  Flame, 
  Star, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { api } from '../api';
import SimilarTicketsBox from '../components/SimilarTicketsBox';
import AuditModal from '../components/AuditModal';
import QrModal from '../components/QrModal';
import TicketDetailPanel from '../components/TicketDetailPanel';
import TicketQueueTable from '../components/TicketQueueTable';

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

  // Timetable day selector
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Mess Feedback Form State
  const [fbMeal, setFbMeal] = useState('Lunch');
  const [fbDay, setFbDay] = useState('Thursday');
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState('');

  const loadAllData = useCallback(async () => {
    try {
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
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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
      await reloadRequests();
      setTimeout(() => setSuccessMessage(''), 6000);
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

  const pendingCount = requests.filter((r) => r.status === 'Open' || r.status === 'In Progress').length;
  const escalatedCount = requests.filter((r) => r.escalated).length;
  const verifiedCount = requests.filter((r) => r.student_verified === 1 || r.status === 'Closed').length;
  const upvotedCount = communityRequests.filter((r) => r.upvotes_count > 0).length;
  const unreadNoticesCount = notices.filter((n) => !n.is_read).length;

  const currentRequestsList = requestScope === 'community' ? communityRequests : requests;

  const filteredTimetable = timetable.filter(
    (t) => (t.day || '').toLowerCase() === selectedDay.toLowerCase()
  );

  return (
    <div className="space-y-5">
      
      {/* Student Welcome Banner (SpaceBasic SaaS Style) */}
      <div className="sb-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-base shadow-2xs">
            {currentUser?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700 bg-white border border-slate-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Resident Student
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: 2201-CSE-042</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              Welcome back, {currentUser?.name}
            </h1>
            <p className="text-xs text-slate-500">
              Hostel: <strong className="text-slate-700 font-medium">{currentUser?.hostel || 'Girls Block A'}</strong> • Room: <strong className="text-slate-700 font-medium">{currentUser?.room || '204'}</strong> • B.Tech Computer Science
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setActiveTab('requests');
              setShowNewRequestForm(true);
            }}
            className="px-3.5 py-2 bg-[#FF5733] hover:bg-[#E0482B] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Raise New Request</span>
          </button>
        </div>
      </div>

      {/* Success / Info Toast */}
      {successMessage && (
        <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-500 text-slate-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-slate-400 hover:text-slate-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* SpaceBasic Segmented Navigation Tabs */}
      <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-none">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF5733]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-slate-200/80 text-slate-700">
                  {tab.badge}
                </span>
              )}
              {tab.alert && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* SpaceBasic Monochrome Elevated Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            
            {/* Card 1: Active Complaints */}
            <div className="sb-card-interactive p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Complaints</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{pendingCount}</div>
              <p className="text-[11px] text-slate-500">In deterministic triage</p>
            </div>

            {/* Card 2: SLA Overdue / Breached */}
            <div className="sb-card-interactive p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SLA Overdue / Breached</span>
                <ShieldAlert className="w-4 h-4 text-slate-400" />
              </div>
              <div className={`text-2xl font-bold tracking-tight ${escalatedCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{escalatedCount}</div>
              <p className="text-[11px] text-slate-500">Auto-escalated to Dean</p>
            </div>

            {/* Card 3: High Upvote Trends */}
            <div className="sb-card-interactive p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Upvote Trends</span>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{upvotedCount}</div>
              <p className="text-[11px] text-slate-500">Accelerated resolution issues</p>
            </div>

            {/* Card 4: Student Verified */}
            <div className="sb-card-interactive p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Student Verified</span>
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{verifiedCount}</div>
              <p className="text-[11px] text-slate-500">Zero-trust confirmed closed</p>
            </div>

          </div>

          {/* Quick Actions & Recent Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Recent Requests */}
            <div className="lg:col-span-2 sb-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Recent Requests</span>
                </h3>
                <button
                  onClick={() => { setActiveTab('requests'); setShowNewRequestForm(true); }}
                  className="text-xs bg-[#FF5733] hover:bg-[#E0482B] text-white px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Raise Request</span>
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No requests raised yet. Click "Raise Request" to initiate a complaint, gatepass, or document certificate.
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.slice(0, 4).map((req) => (
                    <div 
                      key={req.id} 
                      onClick={() => setSelectedSidePanelTicket(req)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {req.type}
                          </span>
                          <span className="font-semibold text-slate-900 truncate">{req.title}</span>
                          {req.escalated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-red-700 bg-red-50 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              ESCALATED TO {(req.escalation_target || 'CHIEF WARDEN').toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{req.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {req.escalated ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-red-700 bg-red-50 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            <span>Escalated</span>
                          </span>
                        ) : req.status === 'Resolved' || req.status === 'Approved' || req.status === 'Closed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>{req.status}</span>
                          </span>
                        ) : req.status === 'Pending Verification' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                            <span>Pending Verification</span>
                          </span>
                        ) : req.status === 'In Progress' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>Open</span>
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Targeted Notices Glance */}
            <div className="sb-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-slate-500" />
                <span>Notice Board</span>
              </h3>

              <div className="space-y-2.5">
                {notices.slice(0, 3).map((not) => (
                  <div key={not.id} className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900 leading-tight">{not.title}</span>
                      {!not.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5733] shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{not.body}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>{not.posted_by}</span>
                      {!not.is_read && (
                        <button
                          onClick={() => handleMarkNoticeRead(not.id)}
                          className="text-[#FF5733] hover:underline font-semibold"
                        >
                          Mark read
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
        <div className="space-y-4">
          
          {/* Header & New Request Trigger */}
          <div className="sb-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Zero-Breach Request Desk</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                SLA-guaranteed workflows: Hostel Complaints (48h), Gatepass (2h), Certificates (72h).
              </p>
            </div>
            <button
              onClick={() => setShowNewRequestForm(!showNewRequestForm)}
              className="bg-[#FF5733] hover:bg-[#E0482B] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{showNewRequestForm ? 'Close Form' : 'Raise New Request'}</span>
            </button>
          </div>

          {/* New Request Creation Card */}
          {showNewRequestForm && (
            <div className="sb-card p-5 space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">File Operational Request</h3>
                  <p className="text-xs text-slate-500">Choose category and submit specifics.</p>
                </div>
                <div className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">
                  SLA: {formType === 'complaint' ? '48 Hours' : formType === 'leave' ? '2 Hours' : '72 Hours'}
                </div>
              </div>

              {/* Workflow Type Selector */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'complaint', label: 'Hostel Complaint', sla: '48h SLA' },
                  { id: 'leave', label: 'Leave / Gatepass', sla: '2h SLA' },
                  { id: 'document', label: 'Document / Cert', sla: '72h SLA' },
                ].map((wt) => (
                  <button
                    key={wt.id}
                    type="button"
                    onClick={() => handleTypeSelect(wt.id)}
                    className={`p-3 rounded-lg border text-left transition ${
                      formType === wt.id
                        ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900">{wt.label}</div>
                    <div className="text-[10px] text-[#FF5733] font-mono font-semibold mt-0.5">{wt.sla}</div>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High (Urgent Facility Issue)</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                {/* Amenity Scope Selector */}
                {formType === 'complaint' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        Amenity Scope (Zero-Trust Duplicate Protection)
                      </label>
                      <span className="text-[10px] text-[#FF5733] font-mono font-semibold">
                        Auto-Upvote Engine
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                        formAmenityType === 'individual'
                          ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}>
                        <input
                          type="radio"
                          name="amenityType"
                          checked={formAmenityType === 'individual'}
                          onChange={() => setFormAmenityType('individual')}
                          className="text-[#FF5733] focus:ring-[#FF5733]"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">Individual Room Issue</div>
                          <div className="text-[10px] text-slate-400">Personal room fixtures</div>
                        </div>
                      </label>
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                        formAmenityType === 'shared_amenity'
                          ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}>
                        <input
                          type="radio"
                          name="amenityType"
                          checked={formAmenityType === 'shared_amenity'}
                          onChange={() => setFormAmenityType('shared_amenity')}
                          className="text-[#FF5733] focus:ring-[#FF5733]"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">Shared Campus Amenity</div>
                          <div className="text-[10px] text-[#FF5733] font-medium">Auto-converts duplicates to +1 Upvote!</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Similar-Ticket Institutional Precedent Box */}
                <SimilarTicketsBox type={formType} category={formCategory} />

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Request Summary / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Water tap dripping continuously in Room 204"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific location, details, dates or reason..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestForm(false)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-[#FF5733] hover:bg-[#E0482B] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Scope Selector: My Requests vs Campus Community Upvote Board */}
          <div className="sb-card p-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setRequestScope('my')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  requestScope === 'my'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Filed Requests ({requests.length})
              </button>
              <button
                onClick={() => setRequestScope('community')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                  requestScope === 'community'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-[#FF5733]" />
                <span>Campus Upvote Board ({communityRequests.length})</span>
              </button>
            </div>

            {requestScope === 'community' && (
              <span className="text-[11px] text-[#FF5733] font-medium px-2 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Upvotes dynamically compress resolution deadlines
              </span>
            )}
          </div>

          {/* High-Density Request Table Component */}
          <TicketQueueTable
            tickets={currentRequestsList}
            onSelectTicket={(t) => setSelectedSidePanelTicket(t)}
            selectedTicketId={selectedSidePanelTicket?.id}
          />
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Sub-75% Warning Alert */}
          {attendance?.is_overall_low && (
            <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-xl p-4 text-slate-800 flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Low Attendance Alert (Below 75% University Threshold)</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Your overall attendance is currently at <strong className="text-slate-800">{attendance?.overall_percentage}%</strong>. Academic regulations require a minimum of 75% to appear for semester examinations.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="sb-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Attendance</span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{attendance?.overall_percentage}%</div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${attendance?.is_overall_low ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, attendance?.overall_percentage || 0)}%` }}
                />
              </div>
            </div>

            <div className="sb-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Lectures</span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{attendance?.total_lectures || 180}</div>
              <p className="text-[11px] text-slate-500">Across all registered subjects</p>
            </div>

            <div className="sb-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lectures Attended</span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{attendance?.attended_lectures || 135}</div>
              <p className="text-[11px] text-slate-500">Verified biometric lecture logs</p>
            </div>
          </div>

          {/* Subject-Wise Breakdown Table */}
          <div className="saas-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-900">
              Subject-Wise Attendance Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/70 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5">Subject Code</th>
                    <th className="py-2.5 px-3.5">Subject Name</th>
                    <th className="py-2.5 px-3.5">Lectures</th>
                    <th className="py-2.5 px-3.5">Attended</th>
                    <th className="py-2.5 px-3.5">Percentage</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance?.subjects?.map((sub, idx) => {
                    const isLow = sub.percentage < 75;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-slate-600 font-medium">{sub.code}</td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900">{sub.name}</td>
                        <td className="py-2.5 px-3.5 text-slate-600">{sub.total}</td>
                        <td className="py-2.5 px-3.5 text-slate-600 font-mono">{sub.attended}</td>
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-800">
                          {sub.percentage}%
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700 bg-white border border-slate-200 shadow-2xs">
                            <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            {isLow ? 'Warning (<75%)' : 'Good (≥75%)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="saas-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Lecture Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time schedule with faculty cancellation updates.</p>
            </div>

            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    selectedDay === day
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTimetable.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No classes scheduled for {selectedDay}.
              </div>
            ) : (
              filteredTimetable.map((item, idx) => (
                <div key={idx} className="saas-card-interactive p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {item.time}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700 bg-white border border-slate-200 shadow-2xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.is_cancelled ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      {item.is_cancelled ? 'Cancelled' : 'Scheduled'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{item.subject}</h4>
                  <div className="text-xs text-slate-500">
                    Faculty: <strong className="text-slate-700 font-medium">{item.faculty}</strong>
                  </div>
                  <div className="text-xs text-slate-400">
                    Room: <strong className="text-slate-600 font-medium">{item.room}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FEES & DUES */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="saas-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Outstanding Dues</span>
              <div className="text-2xl font-bold text-emerald-600 tracking-tight">₹0.00</div>
              <p className="text-[11px] text-slate-500">Cleared for Current Semester</p>
            </div>
            <div className="saas-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Paid (Year 2026)</span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">₹1,15,000</div>
              <p className="text-[11px] text-slate-500">Tuition + Hostel + Mess</p>
            </div>
            <div className="saas-card-interactive p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">No-Dues Clearance</span>
              <div className="text-lg font-bold text-emerald-600 tracking-tight mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Verified Clear</span>
              </div>
              <p className="text-[11px] text-slate-500">Eligible for Gatepass & Exams</p>
            </div>
          </div>

          <div className="saas-card p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Semester Fee Ledger</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {fees?.map((fee, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{fee.description || fee.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono">Receipt: {fee.receipt_no || `REC-2026-0${idx + 1}`}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">₹{fee.amount}</div>
                    <span className="text-[11px] font-medium text-emerald-600">✓ Paid</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: HOSTEL & MESS */}
      {activeTab === 'mess' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Weekly Mess Menu */}
            <div className="lg:col-span-2 saas-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hostel Weekly Dining Menu</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Mess Block A</span>
              </div>

              <div className="space-y-2">
                {messMenu?.map((m, idx) => (
                  <div key={idx} className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{m.day}</span>
                      <span className="text-[#FF5733] font-bold">{m.meal}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{m.items}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Interactive Mess Feedback Form */}
            <div className="saas-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>Submit Meal Review</span>
              </h3>

              <form onSubmit={handleSubmitMessFeedback} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Day</label>
                    <select
                      value={fbDay}
                      onChange={(e) => setFbDay(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none"
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
                    <label className="block font-semibold text-slate-700 mb-1">Meal</label>
                    <select
                      value={fbMeal}
                      onChange={(e) => setFbMeal(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Dinner">Dinner</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFbRating(star)}
                        className={`flex-1 py-1.5 rounded-lg border text-center font-bold text-xs transition ${
                          fbRating >= star ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Taste, hygiene, portion size..."
                    value={fbComment}
                    onChange={(e) => setFbComment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#FF5733] hover:bg-[#E0482B] text-white rounded-lg font-semibold text-xs shadow-2xs transition"
                >
                  Submit Meal Review
                </button>
              </form>

              {messFeedbacks.length > 0 && (
                <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                  <div className="font-semibold text-slate-800 text-[11px]">Your Recent Reviews:</div>
                  {messFeedbacks.slice(0, 2).map((fb, idx) => (
                    <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{fb.meal}</span>
                        <span className="text-amber-600">★ {fb.rating}/5</span>
                      </div>
                      <p className="text-slate-500">{fb.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: GATE HISTORY */}
      {activeTab === 'gate' && (
        <div className="space-y-4">
          <div className="saas-card p-4">
            <h3 className="text-sm font-bold text-slate-900">Personal Turnstile Gate Logs</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated RF-ID and QR scanning history across campus gates.</p>
          </div>

          <div className="saas-card overflow-hidden">
            <div className="divide-y divide-slate-100 text-xs">
              {gateHistory.length === 0 ? (
                <div className="py-10 text-center text-slate-400">No gate turnstile logs recorded.</div>
              ) : (
                gateHistory.map((gh, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-white border border-slate-200 shadow-2xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${gh.type === 'Entry' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        {gh.type}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900">{gh.gate || 'Campus Main Gate 1'}</div>
                        <div className="text-[11px] text-slate-500">{gh.remarks || 'Routine movement'}</div>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(gh.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: TARGETED NOTICES */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="saas-card p-4">
            <h3 className="text-sm font-bold text-slate-900">Targeted Campus Notices</h3>
            <p className="text-xs text-slate-500 mt-0.5">Personalized broadcast feed based on your Hostel, Branch, and Batch.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {notices.map((n) => (
              <div 
                key={n.id} 
                className="saas-card p-4 space-y-2.5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Posted by: {n.posted_by} • {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {!n.is_read ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-900 bg-white border border-slate-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5733]" />
                      New
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                      Read
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkNoticeRead(n.id)}
                      className="text-[#FF5733] hover:underline font-semibold"
                    >
                      Acknowledge & Mark Read
                    </button>
                  )}

                  {n.actionable === 1 && (
                    <button
                      onClick={() => handleMarkNoticeAction(n.id)}
                      className={`px-3 py-1 rounded-lg font-semibold transition text-xs ${
                        n.action_completed
                          ? 'bg-slate-100 text-emerald-700 border border-slate-200'
                          : 'bg-[#FF5733] text-white hover:bg-[#E0482B] shadow-2xs'
                      }`}
                    >
                      {n.action_completed ? '✓ Completed' : 'Action Required'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Detail Master-Detail Side Panel Drawer */}
      {selectedSidePanelTicket && (
        <TicketDetailPanel
          ticket={selectedSidePanelTicket}
          currentUser={currentUser}
          onClose={() => setSelectedSidePanelTicket(null)}
          onStatusUpdated={async () => {
            await reloadRequests();
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

      {/* QR Modal */}
      {selectedQrRequest && (
        <QrModal
          request={selectedQrRequest}
          onClose={() => setSelectedQrRequest(null)}
        />
      )}

    </div>
  );
}
