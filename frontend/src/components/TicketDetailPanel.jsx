import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  QrCode, 
  Send, 
  ThumbsUp, 
  ShieldCheck, 
  ExternalLink, 
  Flame, 
  Camera, 
  AlertOctagon, 
  Check 
} from 'lucide-react';
import { api } from '../api';
import QrModal from './QrModal';

export default function TicketDetailPanel({ 
  ticket, 
  currentUser, 
  onClose, 
  onStatusUpdated 
}) {
  const [localTicket, setLocalTicket] = useState(ticket);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'audit'

  // Staff Resolution Proof form
  const [showProofForm, setShowProofForm] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [resolutionProof, setResolutionProof] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [vendorSlip, setVendorSlip] = useState('');
  const [updating, setUpdating] = useState(false);

  // Student Two-Way Verification state
  const [verificationNote, setVerificationNote] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Upvote state
  const [upvoting, setUpvoting] = useState(false);

  const loadLogs = useCallback(async (id) => {
    const targetId = id || ticket?.id;
    if (!targetId) return;
    try {
      setLoadingLogs(true);
      const data = await api.getRequestLogs(targetId);
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to load logs in detail panel", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [ticket?.id]);

  useEffect(() => {
    if (ticket?.id) {
      setLocalTicket(ticket);
      loadLogs(ticket.id);
      setStatusNote('');
      setResolutionProof('');
      setProofImageUrl(ticket.proof_image_url || '');
      setVendorSlip(ticket.vendor_invoice_or_slip || '');
      setVerificationNote('');
      setShowProofForm(false);
    }
  }, [ticket, loadLogs]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      if (newStatus === 'Pending Verification') {
        const proof = resolutionProof.trim();
        const img = proofImageUrl.trim();
        if (!img || (!img.startsWith('http://') && !img.startsWith('https://'))) {
          alert('Mandatory Verified Proof Required: Please provide a valid HTTP/HTTPS proof image URL.');
          return;
        }
        if (!proof || proof.length < 25) {
          alert(`Mandatory Resolution Steps Required: Notes must be at least 25 characters detailing resolution steps (currently ${proof.length} chars).`);
          return;
        }
      }

      setUpdating(true);
      const note = statusNote.trim() || `Status updated to ${newStatus} via command side-panel`;
      const updated = await api.updateRequestStatus(
        localTicket.id, 
        newStatus, 
        note, 
        currentUser?.name || 'Staff',
        resolutionProof.trim(),
        proofImageUrl.trim(),
        vendorSlip.trim()
      );
      setLocalTicket(updated);
      setShowProofForm(false);
      setStatusNote('');
      setResolutionProof('');
      if (onStatusUpdated) onStatusUpdated();
      await loadLogs();
    } catch (err) {
      alert(`Error updating ticket: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpvote = async () => {
    try {
      setUpvoting(true);
      const res = await api.upvoteRequest(localTicket.id);
      if (res.request) {
        setLocalTicket(res.request);
      } else {
        setLocalTicket(prev => ({
          ...prev,
          upvotes_count: res.upvotes_count,
          sla_limit_hours: res.effective_sla_hours,
          has_upvoted: true,
          escalated: res.escalated_now ? 1 : prev.escalated,
          status: res.escalated_now ? 'Escalated' : prev.status,
          escalation_target: res.escalated_now ? 'Chief Warden / Campus Supervisor' : prev.escalation_target,
        }));
      }
      if (onStatusUpdated) onStatusUpdated();
      await loadLogs();
    } catch (err) {
      alert(`Upvote failed: ${err.message}`);
    } finally {
      setUpvoting(false);
    }
  };

  const handleVerify = async (confirmed, customReason = '') => {
    try {
      setVerifying(true);
      if (!confirmed) {
        const reason = customReason || rejectReason || 'Proof rejected: Problem persists or proof is fraudulent';
        const updated = await api.verifyRequest(localTicket.id, false, reason);
        setLocalTicket(updated);
        setShowRejectModal(false);
      } else {
        const note = verificationNote.trim() || 'Student inspected and confirmed resolution.';
        const updated = await api.verifyRequest(localTicket.id, true, note);
        setLocalTicket(updated);
      }
      if (onStatusUpdated) onStatusUpdated();
      setVerificationNote('');
      await loadLogs();
    } catch (err) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  if (!localTicket) return null;

  const isStaff = currentUser?.role === 'warden' || currentUser?.role === 'admin';
  const isOwnerStudent = currentUser?.role === 'student' && 
    (currentUser?.student_id === localTicket.student_id || currentUser?.id === localTicket.student_id);

  const escalationTiers = [
    { level: 0, title: 'Warden', desc: 'Hostel Operations' },
    { level: 1, title: 'Chief Warden', desc: 'Campus Supervisor' },
    { level: 2, title: 'Dean Affairs', desc: 'Apex Admin' },
    { level: 3, title: 'Director / Apex', desc: 'Executive / Anti-Fraud' }
  ];

  const currentTier = localTicket.escalation_level ?? (localTicket.escalated ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* SpaceBasic Pure White Master-Detail Drawer */}
      <aside className="w-full max-w-xl bg-white border-l border-slate-200 shadow-xl flex flex-col h-full animate-slide-left z-20">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              {localTicket.type?.toUpperCase()}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600 bg-slate-100/80 border border-slate-200">
              {localTicket.category}
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">#{localTicket.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-2.5 py-1 rounded-md transition ${activeTab === 'details' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-2.5 py-1 rounded-md transition ${activeTab === 'audit' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Audit Trail ({logs.length})
              </button>
            </div>

            {/* Soft Gray Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          
          {/* High-Visibility Anti-Fraud Alert Banner (Crisp border-l-4) */}
          {localTicket.fraud_flag === 1 && (
            <div className="bg-white border border-slate-200 border-l-4 border-l-red-500 rounded-xl p-4 text-slate-800 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-red-600">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>Fraudulent Resolution Flagged (Tier 3 Apex Escalation)</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Staff resolution was rejected as falsified or inadequate by the filing student. The ticket immediately bypassed Level 1/2 and auto-escalated directly to <strong className="text-slate-800">Dean / Director of Campus Operations</strong> under Zero-Tolerance Anti-Fraud policy.
              </p>
              {localTicket.fraud_reason && (
                <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-slate-700">
                  <span className="font-semibold text-slate-800">Student Rejection Note:</span> "{localTicket.fraud_reason}"
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' ? (
            <>
              {/* Title & Status Summary Card */}
              <div className="sb-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-bold text-slate-900 leading-snug">{localTicket.title}</h2>
                  
                  {/* SpaceBasic Status Indicator */}
                  {localTicket.escalated || localTicket.status === 'Escalated' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-red-700 bg-red-50 border border-red-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      <span>ESCALATED TO {(localTicket.escalation_target || 'CHIEF WARDEN').toUpperCase()}</span>
                    </span>
                  ) : localTicket.status === 'Closed' || localTicket.status === 'Resolved' || localTicket.status === 'Approved' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>{localTicket.status}</span>
                    </span>
                  ) : localTicket.status === 'In Progress' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>In Progress</span>
                    </span>
                  ) : localTicket.status === 'Pending Verification' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                      <span>Needs Student Verification</span>
                    </span>
                  ) : localTicket.status === 'Rejected' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Rejected</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>Open</span>
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {localTicket.description}
                </p>

                {/* Metadata Row */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span>Student: <strong className="text-slate-700 font-medium">{localTicket.student_name}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Hostel: <strong className="text-slate-700 font-medium">{localTicket.hostel}</strong> (Rm {localTicket.room})</span>
                  <span className="text-slate-300">•</span>
                  <span>Assigned: <strong className="text-slate-700 font-medium">{localTicket.assigned_staff_name || 'Unassigned'}</strong></span>
                </div>
              </div>

              {/* Dynamic SLA Acceleration & Upvote Engine */}
              {localTicket.type === 'complaint' && (
                <div className="sb-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Flame className="w-3.5 h-3.5 text-[#FF5733]" />
                      <span>Dynamic SLA Acceleration Engine</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Formula-Governed
                    </span>
                  </div>

                  {/* Acceleration Gauge (Crisp Neutral) */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Base SLA</div>
                      <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
                        {localTicket.base_sla_hours || 48}h
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Target SLA Deadline</div>
                      <div className="text-base font-bold text-[#FF5733] font-mono mt-0.5">
                        {localTicket.sla_limit_hours || localTicket.effective_sla_hours || 48}h
                      </div>
                    </div>
                  </div>

                  {/* Upvote velocity alert if >= 5 */}
                  {localTicket.upvotes_count >= 5 && (
                    <div className="bg-white border border-slate-200 border-l-4 border-l-red-500 p-3 rounded-xl text-slate-800 flex items-center gap-2 font-medium text-xs shadow-2xs">
                      <Flame className="w-4 h-4 text-red-500 shrink-0" />
                      <span><strong>Critical Velocity (≥5 Upvotes):</strong> SLA compressed to 6-hour floor & Critical Priority</span>
                    </div>
                  )}

                  {/* Student Upvote CTA */}
                  {currentUser?.role === 'student' && localTicket.status !== 'Closed' && localTicket.status !== 'Resolved' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        {localTicket.has_upvoted ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Endorsed (+1 SLA Acceleration)
                          </span>
                        ) : (
                          <span>Experiencing this defect too? Endorse to shorten deadline.</span>
                        )}
                      </div>

                      {!localTicket.has_upvoted && (
                        <button
                          onClick={handleUpvote}
                          disabled={upvoting}
                          className="px-3.5 py-1.5 bg-[#FF5733] hover:bg-[#E0482B] text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{upvoting ? 'Accelerating...' : 'Endorse (+1 Upvote)'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4-Tier Escalation Hierarchy Bar */}
              <div className="sb-card p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Deterministic Escalation Hierarchy</span>
                  <span className="text-[11px] text-slate-500">
                    Current: <strong className="text-slate-900 font-semibold">Tier {currentTier} ({escalationTiers[currentTier]?.title})</strong>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {escalationTiers.map((tier) => {
                    const isActive = currentTier === tier.level;
                    const isPassed = currentTier > tier.level;
                    return (
                      <div
                        key={tier.level}
                        className={`p-2 rounded-lg border text-center transition ${
                          isActive
                            ? 'bg-white border-red-300 ring-2 ring-red-100 shadow-2xs'
                            : isPassed
                            ? 'bg-slate-50 border-slate-200 text-slate-500'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase">
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          <span className={isActive ? 'text-red-700' : 'text-slate-500'}>Tier {tier.level}</span>
                        </div>
                        <div className={`text-xs font-semibold truncate mt-0.5 ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                          {tier.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{tier.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STUDENT TWO-WAY CLOSURE VERIFICATION CARD (Linear-style border-l-4) */}
              {localTicket.status === 'Pending Verification' && (
                <div className="bg-white border border-slate-200 border-l-4 border-l-purple-500 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-purple-900">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Mandatory Student Verification Required</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Staff has submitted resolution proof. Under the Zero-Breach architecture, <strong className="text-slate-800">tickets cannot close without student inspection</strong>.
                  </p>

                  {/* Submitted Proof Card */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                    <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-600" />
                      <span>Staff Resolution Proof</span>
                    </div>

                    {localTicket.proof_image_url && (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white max-h-48 flex items-center justify-center">
                        <img 
                          src={localTicket.proof_image_url} 
                          alt="Resolution Proof" 
                          className="w-full h-auto object-cover max-h-48"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <a 
                          href={localTicket.proof_image_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute bottom-2 right-2 bg-slate-900/80 text-white px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 hover:bg-black transition"
                        >
                          <ExternalLink className="w-3 h-3" /> View Full Image
                        </a>
                      </div>
                    )}

                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong className="text-slate-900">Action Steps Taken:</strong> {localTicket.resolution_proof || 'Repairs executed per protocol.'}
                    </div>

                    {localTicket.vendor_invoice_or_slip && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Vendor Slip / Invoice: <strong className="text-slate-800">{localTicket.vendor_invoice_or_slip}</strong>
                      </div>
                    )}
                  </div>

                  {/* Student Action Buttons */}
                  {isOwnerStudent ? (
                    <div className="space-y-2 pt-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Student Verification Note (Optional):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Inspected tap in Room 204, water flow verified normal."
                        value={verificationNote}
                        onChange={(e) => setVerificationNote(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          onClick={() => handleVerify(true)}
                          disabled={verifying}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{verifying ? 'Closing...' : 'Verify Resolution'}</span>
                        </button>

                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={verifying}
                          className="w-full py-2.5 bg-white text-red-600 border border-slate-200 hover:bg-red-50 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                        >
                          <AlertOctagon className="w-4 h-4 text-red-500" />
                          <span>Dispute Resolution Proof</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg text-center font-medium border border-slate-200">
                      Awaiting verification by filing student ({localTicket.student_name}).
                    </div>
                  )}
                </div>
              )}

              {/* STAFF RESOLUTION PROOF SUBMISSION FORM */}
              {isStaff && localTicket.status !== 'Closed' && localTicket.status !== 'Resolved' && (
                <div className="sb-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Staff Operational Controls</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Zero-Trust Guard Active
                    </span>
                  </div>

                  {localTicket.type === 'leave' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus('Approved')}
                        disabled={updating}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Digital Gatepass</span>
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) {
                            setStatusNote(reason);
                            handleUpdateStatus('Rejected');
                          }
                        }}
                        disabled={updating}
                        className="py-2.5 px-3 bg-white text-red-600 border border-slate-200 hover:bg-red-50 rounded-lg font-medium text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {localTicket.status === 'Open' && (
                        <button
                          onClick={() => handleUpdateStatus('In Progress')}
                          disabled={updating}
                          className="w-full py-2 bg-white text-blue-600 border border-slate-200 hover:bg-blue-50/50 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Acknowledge & Mark In Progress</span>
                        </button>
                      )}

                      {!showProofForm ? (
                        <button
                          onClick={() => setShowProofForm(true)}
                          className="w-full py-2.5 bg-[#FF5733] hover:bg-[#E0482B] text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Mark Maintenance Complete</span>
                        </button>
                      ) : (
                        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-xs">Submit Resolution Proof For Inspection</span>
                            <button
                              onClick={() => setShowProofForm(false)}
                              className="text-slate-400 hover:text-slate-600 text-xs"
                            >
                              Cancel
                            </button>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Verified Proof Image URL (HTTP/HTTPS) *
                            </label>
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/... or uploaded proof link"
                              value={proofImageUrl}
                              onChange={(e) => setProofImageUrl(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5733]/20"
                            />
                            {proofImageUrl && (
                              <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 max-h-32 bg-white flex items-center justify-center">
                                <img 
                                  src={proofImageUrl} 
                                  alt="Live Preview" 
                                  className="h-32 w-auto object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[11px] font-semibold text-slate-700">
                                Action Taken Notes (Min 25 chars) *
                              </label>
                              <span className={`text-[10px] font-mono ${resolutionProof.length >= 25 ? 'text-emerald-600 font-bold' : 'text-red-500'}`}>
                                {resolutionProof.length}/25 min
                              </span>
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Detail the mechanical/electrical repair steps executed..."
                              value={resolutionProof}
                              onChange={(e) => setResolutionProof(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5733]/20"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Vendor Slip / Invoice Number (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., INV-PLUMB-9821"
                              value={vendorSlip}
                              onChange={(e) => setVendorSlip(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5733]/20"
                            />
                          </div>

                          <button
                            onClick={() => handleUpdateStatus('Pending Verification')}
                            disabled={updating || resolutionProof.length < 25 || !proofImageUrl}
                            className="w-full py-2.5 bg-[#FF5733] hover:bg-[#E0482B] disabled:bg-slate-300 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{updating ? 'Submitting Proof...' : 'Submit Proof for Student Inspection'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Digital QR Gatepass Action (if leave ticket approved) */}
              {localTicket.type === 'leave' && localTicket.status === 'Approved' && (
                <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-xl p-4 flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>Verified Digital QR Pass Ready</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Present at turnstile gates for contact-free campus clearance.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition"
                  >
                    <span>View QR Pass</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* AUDIT TRAIL TAB (Immutable Lifecycle Logs) */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-xs">Cryptographic Audit Sequence</span>
                <span className="text-[10px] text-slate-500 font-mono">Immutable Hash Chain</span>
              </div>

              {loadingLogs ? (
                <div className="text-center py-10 text-slate-400 text-xs">Loading audit ledger...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">No audit logs recorded.</div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {logs.map((log) => {
                    const isEscalation = log.action.includes('ESCALATED') || log.action.includes('FRAUD');
                    const isResolved = log.action.includes('RESOLVED') || log.action.includes('APPROVED') || log.action.includes('CLOSED');

                    return (
                      <div key={log.id} className="relative">
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                          isEscalation 
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : isResolved 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-blue-50 border-blue-200 text-blue-600'
                        }`}>
                          •
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>Actor: <strong className="text-slate-700 font-medium">{log.actor_name}</strong> ({log.actor_role})</span>
                            {log.client_ip && (
                              <span className="text-slate-400 font-mono">• IP: {log.client_ip}</span>
                            )}
                          </div>

                          {log.note && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200">
                              {log.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">CampOS Zero-Breach Engine</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium transition shadow-2xs"
          >
            Dismiss
          </button>
        </div>

      </aside>

      {/* QR Modal if triggered */}
      {showQrModal && (
        <QrModal
          request={localTicket}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* Dispute / Anti-Fraud Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertOctagon className="w-4 h-4 text-red-500" />
              <span>Anti-Fraud Escalation to Dean / Director</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Rejecting this resolution proof flags the work as fraudulent or incomplete. The ticket will <strong className="text-slate-800">instantly bypass Tier 1/2 and escalate directly to Level 3 (Dean / Director)</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Disputing Proof *
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Staff marked repaired but water tap still leaks continuously, photo is from a different room."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify(false)}
                disabled={!rejectReason.trim()}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-semibold transition shadow-2xs"
              >
                Confirm Fraud Escalation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
