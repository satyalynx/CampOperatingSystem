import React from 'react';
import { X, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { api } from '../api';

export default function QrModal({ request, onClose }) {
  if (!request) return null;

  const qrUrl = api.getQrUrl(request.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Verified Digital Gate Pass</h3>
          <p className="text-xs text-slate-400 mt-0.5">Campus Security Kiosk Scan</p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl inline-block border-4 border-slate-700/80 shadow-inner">
          <img
            src={qrUrl}
            alt="Gatepass QR"
            className="w-48 h-48 mx-auto object-contain"
          />
        </div>

        {/* Details Card */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3 text-xs text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Student:</span>
            <span className="font-semibold text-slate-200">{request.student_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Hostel / Room:</span>
            <span className="font-medium text-slate-300">{request.hostel} (Rm {request.room})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Leave Type:</span>
            <span className="font-medium text-slate-300">{request.category}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-700/60">
            <span className="text-slate-400">Pass Status:</span>
            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Approved & Active
            </span>
          </div>
        </div>

        <p className="text-[11px] text-emerald-400/90 font-medium bg-emerald-950/40 border border-emerald-800/40 py-2 px-3 rounded-xl">
          ✓ Present this QR at Main Gate terminal for contact-free automated logging.
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
