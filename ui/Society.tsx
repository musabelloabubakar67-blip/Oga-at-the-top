'use client';

// THE COUNTRY BY GROUP, BY SERVICE, AND BY WHAT IT IS BECOMING (plan 14)
// Every group's fortune with its reasons, so a good national year can be a bad
// one for someone, visibly; services measured on several dimensions; the
// constituencies that success created; and the kinds of country it could become.

import { useState } from 'react';
import { CONSTITUENCIES, DIM_NAME, GROUPS, type ServiceDim } from '../content/society';
import { dateLabel } from '../engine/config';
import { ensureSociety, fortune, inequality, leftBehind, output, profiles, serviceRisks, services } from '../engine/society';
import { reformName } from '../engine/reforms';
import type { GameState } from '../engine/types';
import { test } from '../engine/vars';

const trend = (h: number[]) => (h.length >= 2 ? h[h.length - 1] - h[0] : 0);

export function Society({ s }: { s: GameState }) {
  const view = structuredClone(s);
  const soc = ensureSociety(view);
  const [open, setOpen] = useState<string | null>(null);
  const svc = services(view);
  const behind = leftBehind(view);
  const prof = profiles(view);
  return (
    <div className="paper p-6 xl:p-8">
      <p className="label text-state">Who is doing well, and who is not</p>
      <h2 className="mt-1 font-serif text-3xl">The country, group by group</h2>
      <p className="mt-1 max-w-prose text-[14px] text-ink-soft">National output is {output(view)}; the gap between the best-off and worst-off groups is {inequality(view)} points. A national gain can leave a group behind, and the reason is shown.</p>
      {behind.length > 0 && (
        <ul className="mt-3 space-y-1 border-l-2 border-alarm pl-3 text-[13px] leading-snug">
          {behind.map((b) => <li key={b.group}><span className="font-semibold">{b.name}</span> lost {b.fell} points over the year while the country gained. Mostly: {b.why.toLowerCase()}.</li>)}
        </ul>
      )}
      <ul className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((g) => {
          const f = fortune(view, g.id);
          const t = trend(soc.hist[g.id] ?? []);
          return (
            <li key={g.id} className="border border-ink/15 p-2 text-[13px]">
              <button onClick={() => setOpen(open === g.id ? null : g.id)} className="flex w-full items-baseline justify-between text-left">
                <span className="font-serif text-base">{g.name}</span>
                <span className="tabular-nums">{f.v}{t ? <span className={t > 0 ? 'text-state' : 'text-alarm'}> {t > 0 ? '▲' : '▼'}{Math.abs(t)}</span> : ''}</span>
              </button>
              <div className="h-1 bg-ink/10"><div className="h-1 bg-state" style={{ width: `${f.v}%` }} /></div>
              {open === g.id && <ul className="mt-1 space-y-0.5">{f.lines.map((l) => <li key={l.label} className="flex justify-between gap-2"><span>{l.label}</span><span className="tabular-nums text-ink-soft">{l.value > 0 ? `+${l.value}` : l.value}</span></li>)}</ul>}
              {(soc.organised[g.id] ?? 0) > 0 && <p className="label mt-1 text-honour">Organised</p>}
            </li>
          );
        })}
      </ul>

      <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">What the services deliver, measured more than one way</h3>
      <ul className="mt-2 grid gap-x-6 gap-y-1 text-[13px] md:grid-cols-2">
        {(Object.keys(svc) as ServiceDim[]).map((d) => (
          <li key={d}>
            <button onClick={() => setOpen(open === d ? null : d)} className="flex w-full justify-between text-left"><span>{DIM_NAME[d]}</span><span className="tabular-nums">{svc[d].v}</span></button>
            {open === d && <ul className="mb-1 space-y-0.5 pl-2 text-ink-soft">{svc[d].lines.map((l) => <li key={l.label} className="flex justify-between gap-2"><span>{l.label}</span><span>{l.value > 0 ? `+${l.value}` : l.value}</span></li>)}</ul>}
          </li>
        ))}
      </ul>
      {serviceRisks(view).length > 0 && (
        <ul className="mt-2 space-y-1 text-[13px] leading-snug">
          {serviceRisks(view).map((r) => <li key={r.id} className={r.failing ? 'text-alarm' : 'text-ink-soft'}><span className="font-semibold">{reformName(view, r.id)}:</span> {r.failing ? 'failing now. ' : ''}{r.text}</li>)}
        </ul>
      )}

      <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">Constituencies that progress created</h3>
      {Object.keys(soc.constituencies).length === 0 ? <p className="mt-1 text-[13px] text-ink-soft">None yet. A broader tax base, growing firms, new plants, more graduates and a capable civil service each create people who want something new.</p> : (
        <ul className="mt-1 space-y-1 text-[13px] leading-snug">
          {CONSTITUENCIES.filter((k) => soc.constituencies[k.id] !== undefined).map((k) => (
            <li key={k.id}><span className="font-semibold">{k.name}</span> <span className="text-ink-soft">since {dateLabel(soc.constituencies[k.id], s.startYear)}.</span> {k.because} They want: {k.wants} <span className={test(view, k.satisfied) ? 'text-state' : 'text-alarm'}>{test(view, k.satisfied) ? 'Satisfied for now.' : 'Not satisfied: they press every month.'}</span></li>
          ))}
        </ul>
      )}

      <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">What kind of country it is becoming</h3>
      <ul className="mt-1 space-y-1 text-[13px] leading-snug">
        {prof.map((p, i) => <li key={p.id} className={i === 0 ? '' : 'text-ink-soft'}><span className="font-semibold">{p.name}</span>{i === 0 ? ' · the strongest direction now' : ''}: {p.text}</li>)}
      </ul>
      <p className="mt-1 text-[12.5px] text-ink-soft">None of these is the right answer. Each is a country some Nigerians want.</p>
    </div>
  );
}
