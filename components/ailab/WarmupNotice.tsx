import React from 'react';
import { Hourglass } from 'lucide-react';

/**
 * Shown whenever a reading leans on a warm-up seeded from the previous session.
 *
 * The alternative to this banner is a panel that looks identical at 09:20 and
 * 11:20 while being far less reliable at the first. The band is widened to keep
 * its stated coverage true, and this says so.
 */
const WarmupNotice: React.FC<{ liveBars: number; multiplier?: number }> = ({ liveBars, multiplier }) => (
  <div className="rounded-xl p-3 border bg-amber-500/10 border-amber-500/30">
    <div className="flex items-start gap-2.5">
      <Hourglass size={15} className="text-amber-400 mt-0.5 shrink-0" />
      <p className="text-xs text-slate-300 leading-relaxed">
        <span className="font-bold text-amber-300">Warming up — {liveBars} minute{liveBars === 1 ? '' : 's'} of live data.</span>{' '}
        The 30-minute feature windows are seeded from the previous session, price-aligned so the overnight gap is not
        read as a move.
        {multiplier && multiplier > 1 ? (
          <>
            {' '}The band is widened <span className="font-mono font-bold text-amber-300">{multiplier.toFixed(1)}×</span> to
            keep its 80% coverage honest at this stage; it tightens automatically as real data accumulates.
          </>
        ) : (
          ' Readings tighten as real data accumulates.'
        )}
      </p>
    </div>
  </div>
);

export default WarmupNotice;
