import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export default function QrModal({ request, onClose }) {
  if (!request) return null;

  const qrUrl = api.getQrUrl(request.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="sb-card max-w-sm w-full p-6 text-center space-y-4 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Verified Digital Gate Pass</h3>
          <p className="text-xs text-slate-500 mt-0.5">Turnstile & Security Kiosk Scanner</p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-3 rounded-lg inline-block border border-slate-200 shadow-2xs">
          <img
            src={qrUrl}
            alt="Gatepass QR"
            className="w-44 h-44 mx-auto object-contain"
          />
        </div>

        {/* Details Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-left space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Student:</span>
            <span className="font-semibold text-slate-900">{request.student_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Hostel / Room:</span>
            <span className="font-medium text-slate-700">{request.hostel} (Rm {request.room})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Leave Reason:</span>
            <span className="font-medium text-slate-700">{request.category}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
            <span className="text-slate-500">Authorization:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium text-[10px] text-slate-700 bg-white border border-slate-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Warden Approved
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg">
          Present this QR at Main Campus Gate for automated turnstile clearance.
        </p>

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-2xs active:scale-95"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
