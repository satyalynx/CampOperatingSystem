import React, { useEffect, useState, useCallback } from 'react';
import { Lightbulb, Info } from 'lucide-react';
import { api } from '../api';

export default function SimilarTicketsBox({ type, category }) {
  const [similarTickets, setSimilarTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSimilar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSimilarTickets(type, category);
      setSimilarTickets(data || []);
    } catch (err) {
      console.error("Failed to fetch similar tickets", err);
    } finally {
      setLoading(false);
    }
  }, [type, category]);

  useEffect(() => {
    if (type && category) {
      fetchSimilar();
    } else {
      setSimilarTickets([]);
    }
  }, [type, category, fetchSimilar]);

  if (!category || (similarTickets.length === 0 && !loading)) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-xl p-4 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Institutional Knowledge — Similar Resolved Tickets</span>
        </div>
        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold border border-slate-200">
          Precedent
        </span>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed">
        Before filing a duplicate, see how previous <strong className="text-slate-800">{category}</strong> tickets were resolved across campus:
      </p>

      {loading ? (
        <div className="text-xs text-slate-400 py-2">Searching campus precedent ledger...</div>
      ) : (
        <div className="space-y-2">
          {similarTickets.map((t) => (
            <div 
              key={t.id} 
              className="bg-slate-50/60 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{t.title}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-700 bg-white border border-slate-200 shadow-2xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    t.status === 'Resolved' || t.status === 'Approved' || t.status === 'Closed' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  {t.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                Location: {t.hostel} (Room {t.room})
              </div>

              {t.resolution_note && (
                <div className="bg-white border border-slate-200 rounded-md p-2 text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-900">Proven Solution:</span> {t.resolution_note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span>Rule-based deterministic matching (type & category exact lookup).</span>
      </div>
    </div>
  );
}
