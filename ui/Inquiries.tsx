'use client';

// QUESTIONS (plan 08)
// Open questions with their reports (source, date, confidence, what the source
// wants, what it can see), the inquiries that can be commissioned, and the
// decision. Closed questions show what was known, what was decided, and what
// turned out to be true.

import { METHODS, MYSTERY_BY_ID } from '../content/mysteries';
import { dateLabel } from '../engine/config';
import { canProbe, inquiries, methodsFor, REVEAL_AFTER } from '../engine/inquiry';
import { describe } from '../engine/effects';
import { movesLeft } from '../engine/reduce';
import type { Action, GameState } from '../engine/types';

const btn = (ok: boolean) => `border px-2.5 py-1 text-sm ${ok ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-45'}`;

export function Inquiries({ s, dispatch }: { s: GameState; dispatch: (a: Action) => void }) {
  const list = s.inquiries ?? [];
  const left = movesLeft(s);
  if (!list.length) return null;
  return (
    <section className="paper p-6 xl:p-8">
      <p className="label text-state">Questions</p>
      <h2 className="mt-1 font-serif text-3xl">What is really going on</h2>
      <p className="mt-1 max-w-prose text-sm text-ink-soft">Each source sees part of it and has its own reason to see it one way. You can decide now, or wait for more, while the problem goes on. The truth comes out about {REVEAL_AFTER} months after you decide.</p>
      <ul className="mt-4 space-y-3">
        {[...list].reverse().map((q) => {
          const def = MYSTERY_BY_ID[q.id];
          const name = (h: string) => def.hypotheses.find((x) => x.id === h)?.text ?? h;
          return (
            <li key={q.id + q.opened} className="border border-ink/20 p-3 text-[13px] leading-snug">
              <p className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-serif text-lg">{def.title}</span><span className="label text-ink-soft">opened {dateLabel(q.opened, s.startYear)}{q.decided ? ` · decided ${dateLabel(q.decided.turn, s.startYear)}` : ' · undecided'}</span></p>
              <p>{def.question}</p>
              {def.announced && <p className="text-ink-soft">{def.announced.text}</p>}
              <p className="label mt-2 text-ink-soft">What you have</p>
              <ul className="space-y-1">
                {q.reports.map((r, i) => (
                  <li key={i} className="border-l-2 border-ink/15 pl-2">
                    <p>{r.text}</p>
                    <p className="text-ink-soft">{dateLabel(r.turn, s.startYear)} · {r.confidence} confidence · {METHODS[r.method].incentive}{q.revealed ? <span className={r.says === q.truth || r.says === null ? 'text-state' : 'text-alarm'}> · {r.says === q.truth ? 'it was right' : r.says === null ? 'it was right to find nothing' : 'it was wrong'}</span> : ''}</p>
                  </li>
                ))}
                {q.probing.map((p) => <li key={p.method} className="text-ink-soft">{METHODS[p.method].name}: reports {dateLabel(p.due, s.startYear)}.</li>)}
              </ul>
              {!q.decided && (
                <>
                  <p className="label mt-2 text-ink-soft">Ask someone else</p>
                  <div className="flex flex-wrap gap-2">
                    {methodsFor(q.id).map(({ method, can }) => {
                      const c = canProbe(s, q.id, method, left);
                      const d = METHODS[method];
                      return <button key={method} disabled={!c.ok} title={`${d.incentive} Can see: ${can.map(name).join(' / ')}`} onClick={() => dispatch({ type: 'INQUIRY_PROBE', id: q.id, method: method as 'audit' | 'field' | 'intel' })} className={btn(c.ok)}>{d.name} · {d.months ? `${d.months} month${d.months === 1 ? '' : 's'}` : 'now'}{d.pc ? `, ${d.pc} capital` : ''}</button>;
                    })}
                  </div>
                  <p className="label mt-2 text-ink-soft">Decide</p>
                  <ul className="space-y-1">
                    {def.hypotheses.map((h) => (
                      <li key={h.id}>
                        <button disabled={left <= 0} onClick={() => dispatch({ type: 'INQUIRY_DECIDE', id: q.id, hypothesis: h.id })} className={`${btn(left > 0)} w-full text-left`}>
                          <span className="font-semibold">{h.text}</span> <span className="text-ink-soft">→ {h.response.label}. If right: {describe(h.response.right).map((c) => `${c.label} ${c.arrows}`).join(', ') || 'the problem eases'}. If wrong: {describe(h.response.wrong).map((c) => `${c.label} ${c.arrows}`).join(', ') || 'little changes'}.</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {q.decided && (
                <p className="mt-2">{q.decided.hypothesis ? <>You concluded: <span className="font-semibold">{name(q.decided.hypothesis).replace(/\.$/, '')}</span>,</> : 'You did not decide; events overtook it'} on {q.decided.known} report{q.decided.known === 1 ? '' : 's'} ({q.decided.support} for, {q.decided.against} against). {q.revealed ? <span className={q.right ? 'text-state' : 'text-alarm'}>It was {q.right ? 'right' : 'wrong'}: {def.hypotheses.find((h) => h.id === q.truth)?.response.resolves}</span> : <span className="text-ink-soft">Whether it was right will be known by {dateLabel(q.decided.turn + REVEAL_AFTER, s.startYear)}.</span>}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
