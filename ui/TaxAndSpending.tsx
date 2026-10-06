'use client';

// TAX AND SPENDING (plan 10)
// The two halves of the public finances, side by side: how broad the tax base
// is and who pays it, and how well the Treasury spends what it collects. Each
// score is shown with every cause, and the condition the two make together.

import { burdens, discipline, fiscalCondition, lostShare, releaseFactor, taxBase, taxRaised } from '../engine/fiscal-system';
import type { GameState } from '../engine/types';

const bn = (tn: number) => `₦${Math.round(tn * 12 * 1000)}bn a year`;
const sign = (v: number) => (v > 0 ? `+${v}` : `${v}`);

function Score({ title, v, lines, low, high }: { title: string; v: number; lines: { label: string; value: number }[]; low: string; high: string }) {
  return (
    <section className="border border-ink/20 p-3">
      <p className="flex items-baseline justify-between gap-2"><span className="font-serif text-lg">{title}</span><span className="font-serif text-2xl">{Math.round(v)}</span></p>
      <div className="mt-1 h-1.5 w-full bg-ink/10"><div className="h-1.5 bg-state" style={{ width: `${Math.round(v)}%` }} /></div>
      <p className="mt-1 text-[12.5px] text-ink-soft">{v < 50 ? low : high}</p>
      <ul className="mt-2 space-y-0.5 text-[13px]">
        {lines.map((l) => <li key={l.label} className="flex justify-between gap-3"><span>{l.label}</span><span className="tabular-nums text-ink-soft">{sign(l.value)}</span></li>)}
      </ul>
    </section>
  );
}

export function TaxAndSpending({ s }: { s: GameState }) {
  const base = taxBase(s), disc = discipline(s), cond = fiscalCondition(s);
  const raised = taxRaised(s), lost = raised * lostShare(s), rel = releaseFactor(s);
  const pay = burdens(s);
  return (
    <div className="mt-4 space-y-4">
      <p className="border-l-2 border-state pl-3 text-sm leading-snug">{cond.text}</p>
      <div className="grid items-start gap-3 md:grid-cols-2">
        <Score title="The tax base" v={base.v} lines={base.lines}
          low="Most of what is owed is never assessed. Oil decides what can be afforded."
          high="Most of what is owed is assessed and collected." />
        <Score title="Spending discipline" v={disc.v} lines={disc.lines}
          low={disc.v < 30 ? 'Releases are erratic, arrears build, and part of what is spent is lost.' : 'Part of whatever new taxes raise is lost before it is spent.'}
          high="Releases arrive when promised, and budgets are believed." />
      </div>
      <section>
        <h3 className="label text-ink-soft">What the two do together</h3>
        <ul className="mt-1 space-y-0.5 text-[13px] leading-snug">
          <li>The taxation reforms in force raise about {bn(raised)}{raised > 0 ? `; about ${bn(lost)} of it is lost before it is spent.` : '.'}</li>
          <li>{rel > 1.01 ? `Budgeted increases arrive about ${Math.round((rel - 1) * 100)}% fuller and on time` : rel < 0.99 ? `About ${Math.round((1 - rel) * 100)}% of every budgeted increase goes astray` : 'Budgeted increases arrive as they always have'}, before each minister's own competence counts.</li>
          <li>{disc.v > 30 ? 'Lenders charge less for a treasury they believe.' : 'Lenders charge what they charged the last government.'}</li>
        </ul>
      </section>
      <section>
        <h3 className="label text-ink-soft">Who pays</h3>
        {pay.length === 0 ? <p className="mt-1 text-[13px] text-ink-soft">No taxation reform is in force yet. The old taxes fall mostly on those who cannot avoid them.</p> : (
          <ul className="mt-1 space-y-1 text-[13px] leading-snug">
            {pay.map((p) => <li key={p.burden}><span className="font-semibold">{p.label}</span>: {p.who}. <span className="text-ink-soft">{p.taxes.join('; ')}.</span></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
