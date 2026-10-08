import React, { useEffect, useState } from 'react';
import { Lightbulb, CheckCircle2, Clock, Info } from 'lucide-react';
import { api } from '../api';

export default function SimilarTicketsBox({ type, category }) {
  const [similarTickets, setSimilarTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (type && category) {
      fetchSimilar();
    } else {
      setSimilarTickets([]);
    }
  }, [type, category]);

  const fetchSimilar = async () => {
    try {
      setLoading(true);
      const data = await api.getSimilarTickets(type, category);
      setSimilarTickets(data || []);
    } catch (err) {
      console.error("Failed to fetch similar tickets", err);
    } finally {
      setLoading(false);
    }
  };

  if (!category || (similarTickets.length === 0 && !loading)) {
    return null;
  }

  return (
    <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Institutional Knowledge — Similar Resolved Tickets</span>
        </div>
        <span className="text-[10px] text-indigo-400/80 bg-indigo-900/50 px-2 py-0.5 rounded-full border border-indigo-700/50">
          Deterministic Precedent Match
        </span>
      </div>

      <p className="text-[11px] text-slate-300 leading-relaxed">
        Before filing, review how previous <strong className="text-white">{category}</strong> tickets were resolved across campus:
      </p>

      {loading ? (
        <div className="text-xs text-indigo-300/70 py-2">Searching institutional precedent...</div>
      ) : (
        <div className="space-y-2">
          {similarTickets.map((t) => (
            <div 
              key={t.id} 
              className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{t.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  t.status === 'Resolved' || t.status === 'Approved'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}>
                  {t.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                Location: {t.hostel} (Room {t.room})
              </div>

              {t.resolution_note && (
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2 text-[11px] text-emerald-300">
                  <span className="font-semibold">Resolution Note:</span> {t.resolution_note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-indigo-900/40">
        <Info className="w-3 h-3 text-slate-500" />
        <span>Rule-based deterministic matching (type & category exact lookup, not ML).</span>
      </div>
    </div>
  );
}
