import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Building, 
  History, 
  QrCode, 
  Send, 
  AlertTriangle, 
  Layers, 
  ChevronRight,
  ThumbsUp,
  ShieldCheck,
  FileCheck,
  RotateCcw
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

  // Status Update state for staff
  const [statusNote, setStatusNote] = useState('');
  const [resolutionProof, setResolutionProof] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [vendorSlip, setVendorSlip] = useState('');
  const [updating, setUpdating] = useState(false);

  // Student Two-Way Verification state
  const [verificationNote, setVerificationNote] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Upvote state
  const [upvoting, setUpvoting] = useState(false);

  useEffect(() => {
    if (ticket?.id) {
      setLocalTicket(ticket);
      loadLogs(ticket.id);
      setStatusNote('');
      setResolutionProof('');
      setProofImageUrl(ticket.proof_image_url || '');
      setVendorSlip(ticket.vendor_invoice_or_slip || '');
      setVerificationNote('');
    }
  }, [ticket]);

  const loadLogs = async (id = localTicket?.id) => {
    if (!id) return;
    try {
      setLoadingLogs(true);
      const data = await api.getRequestLogs(id);
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to load logs in side-panel", err);
    } finally {
      setLoadingLogs(false);
    }
  };

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
          alert(`Mandatory Resolution Steps Required: Notes must be at least 25 characters (currently ${proof.length} chars).`);
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
      if (onStatusUpdated) onStatusUpdated();
      setStatusNote('');
      setResolutionProof('');
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

  const handleVerify = async (confirmed) => {
    try {
      if (!confirmed) {
        const promptNote = verificationNote.trim() || window.prompt('Please specify reason for rejecting proof (triggers Level 3 Escalation to Dean / Director):');
        if (promptNote === null) return;
        if (!promptNote.trim()) {
          alert('Rejection reason required to document fraud/inadequate resolution.');
          return;
        }
        setVerifying(true);
        const updated = await api.verifyRequest(localTicket.id, false, promptNote.trim());
        setLocalTicket(updated);
      } else {
        setVerifying(true);
        const updated = await api.verifyRequest(localTicket.id, true, verificationNote.trim() || 'Student inspected and confirmed resolution.');
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      {/* Background click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Side-Panel Container */}
      <aside className="w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {localTicket.type}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {localTicket.category}
            </span>
            <span className="text-xs font-mono text-slate-500">#{localTicket.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* High-Visibility Fraud Alert Banner (If Flagged) */}
          {localTicket.fraud_flag === 1 && (
            <div className="bg-rose-950/80 border-2 border-rose-600 rounded-2xl p-4 text-rose-200 space-y-2 shadow-xl shadow-rose-950/50 ring-2 ring-rose-500/30 animate-pulse">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-300">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <span>🚨 FRAUDULENT RESOLUTION ATTEMPT FLAGGED (LEVEL 3 APEX ESCALATION)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-200">
                Staff resolution was rejected as falsified or inadequate by the filing student. The ticket immediately bypassed Level 1/2 and auto-escalated directly to <strong>Dean / Director of Campus Operations</strong> under Zero-Tolerance Anti-Fraud policy.
              </p>
              {localTicket.fraud_reason && (
                <div className="text-[11px] bg-slate-950/80 p-2.5 rounded-xl border border-rose-800/80 font-mono text-rose-300">
                  <strong>Student Rejection Note:</strong> "{localTicket.fraud_reason}"
                </div>
              )}
            </div>
          )}

          {/* Title & Status */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-white leading-snug">{localTicket.title}</h2>
              <span className={`px-2.5 py-1 rounded-full font-bold shrink-0 border ${
                localTicket.status === 'Closed' || localTicket.status === 'Resolved' || localTicket.status === 'Approved'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : localTicket.status === 'Pending Verification'
                  ? 'bg-purple-950 text-purple-300 border-purple-700'
                  : localTicket.status === 'Escalated'
                  ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                  : localTicket.status === 'Rejected'
                  ? 'bg-rose-950/60 text-rose-400 border-rose-800'
                  : 'bg-amber-950 text-amber-300 border-amber-700'
              }`}>
                {localTicket.status}
              </span>
            </div>
            <p className="text-slate-300 mt-2 text-xs leading-relaxed bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
              {localTicket.description}
            </p>
          </div>

          {/* Community Upvoting & Dynamic SLA Compression Banner */}
          {localTicket.type === 'complaint' && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-bold text-indigo-300 text-xs bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-800">
                    <ThumbsUp className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{localTicket.upvotes_count || 0} Student Upvotes</span>
                  </span>
                  {localTicket.amenity_type === 'shared_amenity' && (
                    <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      🏢 Shared Amenity
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">Dynamic SLA Compression</span>
                </div>

                {currentUser?.role === 'student' && localTicket.status !== 'Closed' && localTicket.status !== 'Resolved' && localTicket.status !== 'Rejected' && (
                  <button
                    onClick={handleUpvote}
                    disabled={upvoting || localTicket.has_upvoted}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      localTicket.has_upvoted
                        ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{localTicket.has_upvoted ? 'Upvoted' : 'Upvote (+1)'}</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Effective SLA: <strong className="text-amber-400 font-mono">{localTicket.sla_limit_hours || 48}h</strong> (Base 48h - {(localTicket.upvotes_count || 0) * 4}h)</span>
                <span className="text-slate-500 text-[10px]">Min: 6h Floor</span>
              </div>
            </div>
          )}

          {/* Multi-Tier Administrative Escalation Chain */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Administrative Accountability Chain
              </span>
              <span className="text-[10px] font-mono text-indigo-400 font-semibold">
                Tier {localTicket.escalation_level ?? 0} Active
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 text-center">
              {escalationTiers.map((tier) => {
                const isActive = (localTicket.escalation_level || 0) === tier.level;
                const isPast = (localTicket.escalation_level || 0) > tier.level;
                return (
                  <div 
                    key={tier.level}
                    className={`p-1.5 rounded-xl border text-[9px] transition ${
                      isActive && localTicket.escalated
                        ? 'bg-rose-950/70 border-rose-600 text-rose-200 font-bold ring-1 ring-rose-500'
                        : isActive
                        ? 'bg-indigo-950/80 border-indigo-600 text-indigo-200 font-bold'
                        : isPast
                        ? 'bg-slate-900/60 border-slate-800 text-slate-500 line-through'
                        : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="truncate font-semibold">{tier.title}</div>
                    <div className="text-[8px] text-slate-400 opacity-80 truncate">{tier.desc}</div>
                  </div>
                );
              })}
            </div>

            {localTicket.escalated ? (
              <div className="bg-rose-950/40 border border-rose-800/80 p-2.5 rounded-xl text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>SLA Breached — Escalated to {localTicket.escalation_target || 'Dean'}</span>
                </div>
                <p className="text-[10px] text-rose-300/90 leading-tight">
                  This issue passed the handling threshold. Operational authority escalated to senior administration.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                <span>Elapsed: <strong className="text-white">{localTicket.elapsed_hours || 0}h</strong></span>
                <span className="text-amber-400 font-semibold">
                  Auto-escalates in {localTicket.sla_remaining_hours !== undefined ? localTicket.sla_remaining_hours : '...'}h
                </span>
              </div>
            )}
          </div>

          {/* Verified Resolution Proof Card (If Set or Pending Verification) */}
          {(localTicket.resolution_proof || localTicket.proof_image_url) && (
            <div className="bg-emerald-950/30 border border-emerald-800/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px] uppercase tracking-wide">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Work Order / Resolution Proof</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700">
                  Zero-Trust Verified
                </span>
              </div>

              {localTicket.proof_image_url && (
                <div className="space-y-1">
                  <img 
                    src={localTicket.proof_image_url} 
                    alt="Work Resolution Proof" 
                    className="w-full max-h-48 object-cover rounded-xl border border-emerald-800/80 shadow-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    Photo URL: <a href={localTicket.proof_image_url} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{localTicket.proof_image_url}</a>
                  </div>
                </div>
              )}

              {localTicket.resolution_proof && (
                <p className="text-xs text-emerald-200 font-medium bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/50">
                  {localTicket.resolution_proof}
                </p>
              )}

              {localTicket.vendor_invoice_or_slip && (
                <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span>Vendor Invoice Slip:</span>
                  <a 
                    href={localTicket.vendor_invoice_or_slip} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-indigo-400 underline font-mono text-[10px]"
                  >
                    View Document / Slip ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Student Two-Way Verification Loop Card */}
          {(localTicket.status === 'Pending Verification' || localTicket.status === 'Closed' || localTicket.status === 'Resolved') && (
            <div className="border rounded-2xl p-3.5 space-y-3 bg-slate-800/50 border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  Two-Way Student Closure Loop
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  localTicket.status === 'Closed' || localTicket.student_verified === 1
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : localTicket.student_verified === -1
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : 'bg-purple-950 text-purple-300 border-purple-700'
                }`}>
                  {localTicket.status === 'Closed' || localTicket.student_verified === 1
                    ? '✓ Verified & Closed by Student'
                    : localTicket.student_verified === -1
                    ? '🚨 Disputed as Fraudulent'
                    : '⏳ Awaiting Student Inspection'}
                </span>
              </div>

              {localTicket.status === 'Closed' || localTicket.student_verified === 1 ? (
                <div className="text-emerald-300 text-[11px] bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60">
                  <strong>Student Confirmation:</strong> "{localTicket.student_verification_note || 'Issue inspected and confirmed resolved.'}"
                </div>
              ) : localTicket.student_verified === -1 ? (
                <div className="text-rose-300 text-[11px] bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                  <strong>Student Dispute Note:</strong> "{localTicket.student_verification_note || 'Work unsatisfactory.'}" (Escalated to Level 3 Dean / Director)
                </div>
              ) : (isOwnerStudent || currentUser?.role === 'student') ? (
                <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Staff submitted the proof photo above. Please inspect the location and confirm whether the issue is resolved or fake:
                  </p>
                  <input
                    type="text"
                    placeholder="Inspection note (e.g. Inspected tap; leak stopped, brass fitting in place)"
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleVerify(true)}
                      disabled={verifying}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-xl font-bold text-xs transition shadow"
                    >
                      ✓ Accept & Close Ticket
                    </button>
                    <button
                      onClick={() => handleVerify(false)}
                      disabled={verifying}
                      className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 py-2 px-3 rounded-xl font-bold text-xs transition"
                      title="Auto-escalates directly to Level 3 Dean / Director with fraud flag"
                    >
                      🚨 Reject as Fraudulent / Inadequate
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded-xl border border-slate-800">
                  Zero-Trust Guard: Ticket is locked awaiting student inspection ({localTicket.student_name}). Staff cannot self-resolve or bypass student closure.
                </p>
              )}
            </div>
          )}

          {/* Requester & Location Meta */}
          <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Student:</span>
              <span className="font-semibold text-slate-200">{localTicket.student_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Location:</span>
              <span className="font-medium text-slate-300">{localTicket.hostel} (Room {localTicket.room})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Assigned Officer:</span>
              <span className="font-medium text-indigo-300">{localTicket.assigned_staff_name || 'Chief Admin'}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-500">Created:</span>
              <span className="text-slate-400 font-mono">{new Date(localTicket.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Digital QR Gate Pass Button (for Approved Leaves) */}
          {localTicket.type === 'leave' && localTicket.status === 'Approved' && (
            <button
              onClick={() => setShowQrModal(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>Open Verified Digital Gate Pass QR</span>
            </button>
          )}

          {/* Staff Triage Action Form (Zero-Trust FSM Enforced) */}
          {isStaff && localTicket.status !== 'Closed' && localTicket.status !== 'Resolved' && localTicket.status !== 'Rejected' && (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">
                  Operational Status Actions (Zero-Trust Guard)
                </h4>
                <span className="text-[10px] text-amber-400 font-medium">
                  {localTicket.type === 'leave' ? 'Leave Approval Workflow' : 'Staff Proof Required'}
                </span>
              </div>

              {localTicket.type !== 'leave' ? (
                <>
                  {/* Mandatory Resolution Proof Image URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Mandatory Proof Photo URL <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setProofImageUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800')}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                      >
                        [📷 Use Demo Photo]
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="https://.../photo.jpg"
                      value={proofImageUrl}
                      onChange={(e) => setProofImageUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Mandatory Resolution Steps (min 25 chars) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Resolution Steps Notes (Min 25 chars) <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setResolutionProof('Replaced faulty brass compression gasket and tested water pressure for 15 minutes. Zero leaks observed.')}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                      >
                        [📝 Sample Work Notes]
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Minimum 25 characters detailing resolution steps..."
                      value={resolutionProof}
                      onChange={(e) => setResolutionProof(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex justify-between items-center text-[10px] mt-0.5">
                      <span className={resolutionProof.length >= 25 ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                        {resolutionProof.length} / 25 characters
                      </span>
                      <span className="text-slate-500">Staff cannot mark closed; sets Pending Verification</span>
                    </div>
                  </div>

                  {/* Optional Vendor Invoice / Slip */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-400">Optional Vendor Invoice / Slip URL</label>
                      <button
                        type="button"
                        onClick={() => setVendorSlip('https://campos.edu/records/INV-2026-8812.pdf')}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                      >
                        [📄 Sample Invoice]
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="https://.../invoice.pdf"
                      value={vendorSlip}
                      onChange={(e) => setVendorSlip(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  {/* Optional Audit Note */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Internal Log Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Caretaker inspected repair on-site"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  {/* Staff Action Buttons for Complaints */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateStatus('Pending Verification')}
                      disabled={updating}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Submit Proof & Request Verif.</span>
                    </button>

                    {localTicket.status === 'Open' && (
                      <button
                        onClick={() => handleUpdateStatus('In Progress')}
                        disabled={updating}
                        className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-xl font-semibold text-xs transition"
                      >
                        In Progress
                      </button>
                    )}

                    <button
                      onClick={() => handleUpdateStatus('Rejected')}
                      disabled={updating}
                      className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 py-2 px-3 rounded-xl font-semibold text-xs transition"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </>
              ) : (
                /* Staff Action Buttons for Leave Passes */
                <>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Pass Audit Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Verified with student's local guardian via phone call"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateStatus('Approved')}
                      disabled={updating}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-xl font-bold transition shadow"
                    >
                      ✓ Approve Pass
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('Rejected')}
                      disabled={updating}
                      className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 py-2 px-3 rounded-xl font-semibold transition"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Audit Trail Timeline inside Side-Panel */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>Append-Only Immutable Audit Trail</span>
              </h4>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                🔒 DB Trigger Protected
              </span>
            </div>

            {loadingLogs ? (
              <div className="text-slate-500 text-xs py-3">Loading history...</div>
            ) : logs.length === 0 ? (
              <div className="text-slate-500 text-xs py-2">No history logs recorded.</div>
            ) : (
              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-900" />
                    <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <strong className="text-slate-200">{log.action.replace(/_/g, ' ')}</strong>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-indigo-400 font-medium">
                          By {log.actor_name} <span className="text-slate-500 uppercase font-mono">[{log.actor_role || 'user'}]</span>
                        </span>
                        {log.client_ip && (
                          <span className="text-slate-500 font-mono text-[9px]">
                            IP: {log.client_ip}
                          </span>
                        )}
                      </div>
                      {log.note && (
                        <p className="text-[11px] text-slate-300 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 leading-snug">
                          {log.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* QR Modal if triggered */}
      {showQrModal && (
        <QrModal
          request={localTicket}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
}
