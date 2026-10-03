'use client';

import { Overlay } from './shell';
import { oilForecast } from '../engine/oilforecast';
import { useState } from 'react';
import { BENCHMARKS, DEBTS, FUNDS, SECTORS } from '../content/treasury';
import { dateLabel, yearOf } from '../engine/config';
import { rateOf, servicePoints } from '../engine/ledger';
import { naira } from '../engine/text';
import { inflationTarget } from '../engine/tick';
import { activePolicies, affordableWage, canRepeal, economyStrength, policyName, policyNow, repealCost } from '../engine/policies';
import { describe } from '../engine/effects';
import {
  budgetPoints, canBudget, canFund, canPay, canSecuritise, canSupplementary, effectiveIncrease, erosion, evenSites, fiscalFlow, fundCosts, oilGap, paddingDemand, potency, releaseRate, vetoHolds,
} from '../engine/treasury';
import type { Action, DebtId, FundId, GameState, SectorId, ZoneId } from '../engine/types';
import { ZONES, ZONE_NAME, senate } from '../engine/vars';

type Dispatch = (a: Action) => void;
type Tab = 'books' | 'year' | 'owed' | 'saved' | 'policies';

const signed = (v: number) => `${v >= 0 ? '+' : '−'}₦${Math.round(Math.abs(v) * 1000)}bn`;

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <Overlay onClose={onClose} paper>{children}</Overlay>;
}

// ---------------------------------------------------------------- the budget

export function BudgetModal({ s, dispatch, onClose }: { s: GameState; dispatch: Dispatch; onClose: () => void }) {
  const [benchmark, setBenchmark] = useState(s.budget.benchmark);
  const [alloc, setAlloc] = useState<Record<SectorId, number>>({ ...s.budget.alloc });
  const [sites, setSites] = useState<Partial<Record<ZoneId, number>>>(() => ({ ...(s.budget.sites ?? evenSites(s.budget.alloc.power ?? 0)) }));
  const points = budgetPoints(benchmark, s);
  const eroded = erosion(s);
  const used = SECTORS.reduce((a, x) => a + (alloc[x.id] ?? 0), 0);
  const left = points - used;
  const demand = paddingDemand(s);
  const sen = senate(s);
  const sited = ZONES.reduce((a, z) => a + (sites[z] ?? 0), 0);
  const works = alloc.power ?? 0;
  const can = canBudget(s, benchmark, alloc);
  const siteOk = sited === works;
  const year = s.budget.reopened ? s.budget.year : yearOf(s.turn, s.startYear) + 1;
  const last = s.budget.alloc;
  const set = (id: SectorId, d: number) => {
    setAlloc((a) => ({ ...a, [id]: Math.max(0, (a[id] ?? 0) + d) }));
    // Works points follow: a new point goes to the zone with the least, a removed one leaves the zone with the most.
    if (id === 'power') setSites((st) => {
      const out = { ...st };
      const order = [...ZONES].sort((p, q) => (out[p] ?? 0) - (out[q] ?? 0));
      if (d > 0) out[order[0]] = (out[order[0]] ?? 0) + 1;
      else { const z = order[order.length - 1]; out[z] = Math.max(0, (out[z] ?? 0) - 1); }
      return out;
    });
  };
  const moveSite = (z: ZoneId, d: number) => setSites((st) => ({ ...st, [z]: Math.max(0, (st[z] ?? 0) + d) }));

  if (s.budget.pending) return <AssemblyVersion s={s} dispatch={dispatch} onClose={onClose} />;

  return (
    <Shell onClose={onClose}>
      <p className="label text-state">Budget Office of the Federation · {dateLabel(s.turn, s.startYear)}</p>
      <h2 className="mt-1 font-serif text-3xl">{s.budget.reopened ? `A supplementary budget for ${year}` : `The Appropriation Bill, ${year}`}</h2>
      <p className="mt-2 text-sm leading-snug text-ink-soft">
        What the government assumes oil will sell for, how that money is divided, and where the works money is spent. The Assembly then sends back its own version. What passes is not all spent: each ministry spends as much of its increase as its minister can manage and the treasury can pay for.
      </p>

      <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">1 · What will oil sell for?</h3>
      <p className="mt-2 text-sm text-ink-soft">
        Oil is at <span className="font-semibold text-ink">${Math.round(s.oil.price)}</span> and the country produces {s.oil.output.toFixed(2)}m barrels a day. Above your figure, the difference is saved; below it, it comes out of the treasury every month.
        {eroded > 0 && <span className="text-alarm"> With inflation at {Math.round(s.nation.inflation)}%, every budget buys {eroded} {eroded === 1 ? 'point' : 'points'} less than its headline.</span>}
      </p>
      {(() => {
        const f = oilForecast(s);
        return (
          <div className="mt-2 border-l-2 border-state bg-state/5 px-3 py-2">
            <p className="label text-ink-soft">The forecast · {f.by}{f.title ? `, ${f.title}` : ''}</p>
            <p className="font-serif text-lg leading-snug">Oil should average about ${f.mid} next year: most likely between ${f.low} and ${f.high}.</p>
            <p className="text-[13px] text-ink-soft">{f.note} {f.record ? `The record: ${f.record}.` : 'No forecast of theirs has been tested yet.'} A forecaster who serves someone else tends to see oil higher than it is: more on paper means more to spend.</p>
          </div>
        );
      })()}
      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        {BENCHMARKS.map((b) => (
          <button key={b.price} onClick={() => setBenchmark(b.price)}
            className={`border p-3 text-left ${benchmark === b.price ? 'border-state bg-state/10' : 'border-ink/20 hover:border-ink/50'}`}>
            <span className="block font-serif text-xl">${b.price} <span className="text-sm text-ink-soft">{b.name}</span></span>
            <span className="label block text-state">{b.points - eroded} points to spend{eroded ? ` (${b.points} − ${eroded})` : ''}</span>
            <span className="mt-1 block text-[13px] leading-snug text-ink-soft">{b.blurb}</span>
          </button>
        ))}
      </div>

      <h3 className="label mt-6 flex items-baseline justify-between border-b rule pb-1 text-ink-soft">
        <span>2 · Where does it go?</span>
        <span className={left < 0 ? 'text-alarm' : 'text-ink'}>{left < 0 ? `${-left} over` : `${left} unallocated`}</span>
      </h3>
      <p className="mt-2 text-sm text-ink-soft">Effects are measured against the usual level; each point above it does less than the one before, and money goes further where the problem is worse. Cutting below last year&apos;s level angers whoever depended on it.</p>
      <ul className="mt-2 divide-y divide-ink/10">
        {SECTORS.map((x) => {
          const v = alloc[x.id] ?? 0;
          const d = v - x.usual;
          const pot = potency(s, x.id);
          const rel = releaseRate(s, x.id);
          const was = last[x.id] ?? x.usual;
          const nextStep = d >= 0 ? effectiveIncrease(d + 1) - effectiveIncrease(d) : 1;
          return (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg">{x.name}</span>
                <span className={`block text-[13px] leading-snug ${d > 0 ? 'text-state' : d < 0 ? 'text-alarm' : 'text-ink-soft'}`}>
                  {d > 0 ? x.more : d < 0 ? x.less : `At the usual level (${x.usual}). No change.`}
                </span>
                <span className="block text-[13px] leading-snug text-ink-soft">
                  {[pot.why ? `Worth ×${pot.k} this year (${pot.why.charAt(0).toLowerCase()}${pot.why.slice(1)})` : null,
                    x.id !== 'debt' && x.id !== 'padding' ? `${Math.round(rel.rate * 100)}% of an increase gets spent: ${rel.why.join('; ')}` : null,
                    d >= 0 && x.id !== 'padding' && x.id !== 'debt' ? `next point: ${nextStep >= 0.999 ? 'full effect' : `${Math.round(nextStep * 100)}% effect`}` : null].filter(Boolean).join(' · ')}
                </span>
                {v < was && <span className="block text-[13px] text-alarm">Last year: {was}. Cutting it will be felt.</span>}
              </span>
              <span className="flex items-center gap-2">
                <button onClick={() => set(x.id, -1)} disabled={v <= 0} className="h-8 w-8 border border-ink/30 font-serif text-lg disabled:opacity-30">−</button>
                <span className="w-16 text-center font-serif text-2xl">{v}<span className="ml-1 text-xs text-ink-soft">{d === 0 ? '' : d > 0 ? `+${d}` : d}</span></span>
                <button onClick={() => set(x.id, 1)} disabled={v >= x.max || left <= 0} className="h-8 w-8 border border-ink/30 font-serif text-lg disabled:opacity-30">+</button>
              </span>
            </li>
          );
        })}
      </ul>

      <h3 className="label mt-6 flex items-baseline justify-between border-b rule pb-1 text-ink-soft">
        <span>3 · Where is the works money spent?</span>
        <span className={siteOk ? 'text-ink' : 'text-alarm'}>{sited} of {works} sited</span>
      </h3>
      <p className="mt-2 text-sm text-ink-soft">Roads, bridges and power lines go somewhere. A zone given more than an even share warms to you every month, and so does its governor; a zone given less cools. It shows in how its states vote.</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {ZONES.map((z) => (
          <div key={z} className="flex items-center justify-between border border-ink/15 px-3 py-2">
            <span><span className="font-serif">{ZONE_NAME[z]}</span><span className="label block text-ink-soft">approval {Math.round(s.zones[z].approval)}%</span></span>
            <span className="flex items-center gap-1.5">
              <button onClick={() => moveSite(z, -1)} disabled={(sites[z] ?? 0) <= 0} className="h-7 w-7 border border-ink/30 disabled:opacity-30">−</button>
              <span className="w-6 text-center font-serif text-xl">{sites[z] ?? 0}</span>
              <button onClick={() => moveSite(z, 1)} disabled={sited >= works} className="h-7 w-7 border border-ink/30 disabled:opacity-30">+</button>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-l-2 border-honour bg-honour/5 px-3 py-2">
        <p className="label text-ink-soft">In the Assembly</p>
        <p className="mt-1 font-serif leading-snug">
          {(alloc.padding ?? 0) >= demand
            ? `Senator Zango wants ${demand} points for members' projects and has them. The bill will pass as sent.`
            : `Senator Zango wants ${demand} points for members' projects and you are offering ${alloc.padding ?? 0}. The Assembly will send back its own version with ${demand - (alloc.padding ?? 0)} more, taken from your largest lines. You can sign it, split the difference, or veto it: ${vetoHolds(s) ? `your senators (${Math.round(sen)}) would sustain a veto` : `with the Senate at ${Math.round(sen)} (it needs 54), a veto would stall the budget until March`}.`}
        </p>
      </div>

      {!can.ok && can.reason && <p className="mt-3 text-sm text-alarm">{can.reason}</p>}
      {can.ok && !siteOk && <p className="mt-3 text-sm text-alarm">Site every works point: {works - sited} left to place.</p>}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={onClose} className="label text-ink-soft hover:text-ink">Not yet</button>
        <button disabled={!can.ok || !siteOk} onClick={() => dispatch({ type: 'BUDGET', benchmark, alloc, sites })}
          className={`px-5 py-2.5 font-serif text-lg ${can.ok && siteOk ? 'bg-state text-paper hover:bg-state-lit' : 'bg-ink/15 text-ink-soft'}`}>
          Send it to the Assembly
        </button>
      </div>
    </Shell>
  );
}

/** The Assembly's version of the bill, against yours, and the three answers. */
function AssemblyVersion({ s, dispatch, onClose }: { s: GameState; dispatch: Dispatch; onClose: () => void }) {
  const p = s.budget.pending!;
  const holds = vetoHolds(s);
  const choose = (choice: 'accept' | 'veto' | 'split') => { dispatch({ type: 'BUDGET_RESOLVE', choice }); onClose(); };
  return (
    <Shell onClose={onClose}>
      <p className="label text-state">The National Assembly · Committee on Appropriations</p>
      <h2 className="mt-1 font-serif text-3xl">The Assembly&apos;s version</h2>
      <p className="mt-2 text-sm leading-snug text-ink-soft">Senator Zango&apos;s committee has returned the bill with {p.insert} more {p.insert === 1 ? 'point' : 'points'} for members&apos; projects, found in your largest lines.</p>
      <table className="mt-4 w-full text-left text-sm">
        <thead><tr className="label text-ink-soft"><th className="py-1">Line</th><th className="text-right">Yours</th><th className="text-right">Theirs</th></tr></thead>
        <tbody className="divide-y divide-ink/10">
          {SECTORS.map((x) => {
            const a = p.alloc[x.id] ?? 0;
            const b = p.amended[x.id] ?? 0;
            return (
              <tr key={x.id} className={a !== b ? 'font-semibold' : ''}>
                <td className="py-1.5 font-serif">{x.name}</td>
                <td className="text-right">{a}</td>
                <td className={`text-right ${b > a ? 'text-alarm' : b < a ? 'text-alarm' : ''}`}>{b}{b !== a ? ` (${b > a ? '+' : ''}${b - a})` : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <button onClick={() => choose('accept')} className="border border-ink/25 p-3 text-left hover:border-state hover:bg-state/5">
          <span className="block font-serif text-lg">Sign their version</span>
          <span className="block text-[13px] text-ink-soft">On time. The chairman is pleased. Integrity −1, and the money goes to members&apos; projects.</span>
        </button>
        <button onClick={() => choose('split')} disabled={s.pc < 4} className="border border-ink/25 p-3 text-left hover:border-state hover:bg-state/5 disabled:opacity-50">
          <span className="block font-serif text-lg">Meet them halfway</span>
          <span className="block text-[13px] text-ink-soft">{Math.ceil(p.insert / 2)} of the {p.insert} insertions. 4 capital; the chairman cools a little.</span>
        </button>
        <button onClick={() => choose('veto')} className={`border p-3 text-left ${holds ? 'border-ink/25 hover:border-state hover:bg-state/5' : 'border-alarm/50 hover:bg-alarm/5'}`}>
          <span className="block font-serif text-lg">Veto it</span>
          <span className={`block text-[13px] ${holds ? 'text-ink-soft' : 'text-alarm'}`}>{holds ? 'Your senators sustain it and pass your bill. Integrity +1.5, press +3; the chairman will not forget.' : 'The Senate is not firmly yours (needs 54). The budget stalls until March: nothing above last year is released for three months.'}</span>
        </button>
      </div>
    </Shell>
  );
}

/** This year's budget as it is being spent: what each line is doing, how much of it is going out, and your instruction. */
function ThisYear({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const sup = canSupplementary(s);
  return (
    <div className="mt-4">
      <p className="text-sm text-ink-soft">The {s.budget.year} budget, on oil at ${s.budget.benchmark}. Increases are spent as fast as each minister can manage. You can rush a line out (all of it, at a premium, with procurement skipped) or hold half of it back to keep the cash.</p>
      <ul className="mt-3 divide-y divide-ink/10">
        {SECTORS.map((x) => {
          const v = s.budget.alloc[x.id] ?? 0;
          const up = v - x.usual;
          const rel = releaseRate(s, x.id);
          const mode = s.budget.release?.[x.id] ?? 'normal';
          return (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg">{x.name} · {v}{up ? <span className={`ml-1 text-sm ${up > 0 ? 'text-state' : 'text-alarm'}`}>({up > 0 ? '+' : ''}{up} on usual)</span> : null}</span>
                {up > 0 && x.id !== 'debt' && x.id !== 'padding' && <span className="block text-[13px] text-ink-soft">{Math.round(rel.rate * 100)}% of the increase is going out. {rel.why.join('. ')}.</span>}
              </span>
              {up > 0 && x.id !== 'debt' && x.id !== 'padding' && (
                <span className="flex gap-1.5">
                  {(['hold', 'normal', 'full'] as const).map((m) => (
                    <button key={m} onClick={() => dispatch({ type: 'BUDGET_RELEASE', sector: x.id, mode: m })}
                      className={`border px-2 py-0.5 text-[13px] ${mode === m ? 'border-state bg-state/10' : 'border-ink/20 hover:border-state'}`}>
                      {m === 'hold' ? 'Hold half back' : m === 'normal' ? 'As it comes' : 'Rush it out'}
                    </button>
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {s.budget.sites && (
        <p className="mt-3 text-sm text-ink-soft">Works money by zone: {ZONES.map((z) => `${ZONE_NAME[z]} ${s.budget.sites?.[z] ?? 0}`).join(' · ')}.</p>
      )}
      <div className="mt-4 border-t rule pt-3">
        <button disabled={!sup.ok} onClick={() => dispatch({ type: 'SUPPLEMENTARY' })}
          className={`border px-3 py-1.5 font-serif ${sup.ok ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-50'}`}>
          Send a supplementary budget · 4 capital
        </button>
        <span className="ml-3 text-[13px] text-ink-soft">{sup.ok ? `Oil is $${Math.round(s.oil.price)} against the $${s.budget.benchmark} assumed: reopen the year's budget.` : sup.reason}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the treasury

function Flow({ s }: { s: GameState }) {
  const flow = fiscalFlow(s);
  const infl = inflationTarget(s);
  const gap = oilGap(s);
  return (
    <div className="mt-4 grid gap-6 sm:grid-cols-2">
      <section>
        <h3 className="label border-b rule pb-1 text-ink-soft">Into and out of the treasury, each month</h3>
        <ul className="mt-2 space-y-1.5">
          {flow.lines.map((l) => (
            <li key={l.label} className="text-sm leading-snug">
              <span className="flex justify-between gap-3"><span>{l.label}</span><span className={`font-semibold ${l.value >= 0 ? 'text-state' : 'text-alarm'}`}>{signed(l.value)}</span></span>
              <span className="block text-[12.5px] text-ink-soft">{l.hint}</span>
            </li>
          ))}
          <li className="flex justify-between border-t rule pt-1.5 font-serif text-lg">
            <span>Each month</span><span className={flow.total >= 0 ? 'text-state' : 'text-alarm'}>{signed(flow.total)}</span>
          </li>
        </ul>
        <p className="mt-2 text-[13px] leading-snug text-ink-soft">
          {flow.total >= 0
            ? 'The treasury is growing. What to do with it is the decision: pay what is owed, save it, or build.'
            : 'The treasury is shrinking. When it is empty the stabilisation account is drawn first; after that, half of every shortfall is borrowed and half is simply not paid to contractors and pensioners.'}
        </p>
      </section>
      <section>
        <h3 className="label border-b rule pb-1 text-ink-soft">Oil</h3>
        <p className="mt-2 font-serif text-3xl">${Math.round(s.oil.price)} <span className="text-base text-ink-soft">a barrel · budget assumed ${s.budget.benchmark}</span></p>
        <p className="mt-1 text-sm leading-snug text-ink-soft">
          Output {s.oil.output.toFixed(2)}m barrels a day. It falls as oil theft in the South South rises.{' '}
          {gap >= 0
            ? <span className="text-state">Oil is paying {signed(gap)} a month above the budget. That is saved in the stabilisation account automatically.</span>
            : <span className="text-alarm">Oil is paying {signed(gap)} a month against the budget. That comes out of the treasury.</span>}
        </p>
        <h3 className="label mt-5 border-b rule pb-1 text-ink-soft">Where inflation is heading: {infl.total.toFixed(1)}%</h3>
        <ul className="mt-2 space-y-0.5">
          {infl.lines.map((l) => (
            <li key={l.label} className="flex justify-between gap-3 text-sm"><span>{l.label}</span><span className={l.value <= 0 ? 'text-state' : 'text-ink'}>{l.value > 0 ? '+' : '−'}{Math.abs(l.value).toFixed(1)}</span></li>
          ))}
        </ul>
        <p className="mt-1 text-[13px] text-ink-soft">Now {s.nation.inflation.toFixed(1)}%. It moves towards this figure by about a seventh of the gap each month.</p>
      </section>
    </div>
  );
}

function Policies({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const eco = economyStrength(s);
  const ids = activePolicies(s);
  return (
    <div className="mt-4 grid gap-6 sm:grid-cols-[1fr_2fr]">
      <section>
        <h3 className="label border-b rule pb-1 text-ink-soft">What the economy can carry: {Math.round(eco.v)} of 100</h3>
        <ul className="mt-2 space-y-0.5">
          {eco.lines.map((l) => (
            <li key={l.label} className="flex justify-between gap-3 text-sm"><span>{l.label}</span><span className={l.value >= 0 ? 'text-state' : 'text-alarm'}>{l.value > 0 ? '+' : '−'}{Math.abs(l.value).toFixed(1)}</span></li>
          ))}
        </ul>
        <p className="mt-2 text-[13px] leading-snug text-ink-soft">
          Policies that promise money are judged against this every month. Today the economy could carry a minimum wage of about ₦{affordableWage(s)}k.
        </p>
      </section>
      <section>
        <h3 className="label border-b rule pb-1 text-ink-soft">Standing policies, at today's economy</h3>
        {ids.length === 0 && <p className="mt-2 font-serif italic text-ink-soft">None in force. A fixed pump price, a decreed wage, closed borders and the like would be costed here, every month, against the economy as it is.</p>}
        <ul className="mt-2 space-y-3">
          {ids.map((id) => {
            const p = policyNow(s, id)!;
            const cost = repealCost(id);
            const can = canRepeal(s, id);
            const year = describe(p.fx.map(([t, v]) => [t, v * 12]));
            return (
              <li key={id} className="border border-ink/20 p-3">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-lg">{policyName(id)}</span>
                  <span className="text-sm">
                    {Math.abs(p.fiscal) >= 0.0005 && <span className={p.fiscal >= 0 ? 'text-state' : 'text-alarm'}>{signed(p.fiscal)} a month</span>}
                    {Math.abs(p.inflation) >= 0.05 && <span className={`ml-3 ${p.inflation <= 0 ? 'text-state' : 'text-alarm'}`}>inflation {p.inflation > 0 ? '+' : '−'}{Math.abs(p.inflation).toFixed(1)}</span>}
                  </span>
                </p>
                {year.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-x-3 text-[13px]">
                    <span className="label pt-0.5 text-ink-soft">A year of it</span>
                    {year.map((c) => <span key={c.label} className={c.good ? 'text-state' : 'text-alarm'}>{c.label} {c.text}</span>)}
                  </p>
                )}
                {p.approval > 0 && <p className="mt-1 text-[13px] text-state">Keeps approval {p.approval} {p.approval === 1 ? 'point' : 'points'} higher while it stands.</p>}
                <p className="mt-1 text-[13px] leading-snug text-ink-soft">{p.why}</p>
                <button disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'REPEAL', id })}
                  className={`mt-2 border px-3 py-1.5 font-serif text-sm ${can.ok ? 'border-ink/30 hover:border-alarm hover:bg-alarm/5' : 'border-ink/10 opacity-45'}`}>
                  Repeal it · {cost.pc} capital{cost.fx.length ? ` · ${describe(cost.fx).map((c) => `${c.label} ${c.text}`).join(', ')}` : ''}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Owed({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const sec = canSecuritise(s);
  return (
    <div className="mt-4">
      <p className="text-sm leading-snug text-ink-soft">
        Debt service takes <span className="font-semibold text-ink">{Math.round(s.nation.debt)}%</span> of revenue. It is the sum of the three debts that bear interest. Above 90% with an empty treasury, capital spending stops. Above 100%, nobody will lend. Paying a debt costs no move, and can only be done with cash the treasury holds: <span className="font-semibold text-ink">{naira(s.nation.fiscalSpace)}</span>.
      </p>
      <ul className="mt-3 space-y-3">
        {DEBTS.map((d) => {
          const owed = s.debts[d.id];
          const pts = d.kind === 'bond' ? servicePoints(s, d.id) : 0;
          const clear = owed <= 0.001;
          const bad = d.kind === 'arrears' && owed > (d.id === 'contractors' ? 0.5 : 0.2);
          const chunks = d.kind === 'arrears' ? [owed / 2, owed] : d.chunks;
          return (
            <li key={d.id} className={`border p-4 ${bad ? 'border-alarm/50' : 'border-ink/20'}`}>
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-serif text-xl">{d.name}</span>
                <span className={`font-serif text-xl ${clear ? 'text-state' : ''}`}>{clear ? 'Paid' : naira(owed)}
                  {pts > 0 && <span className="ml-2 text-sm text-ink-soft">{pts.toFixed(0)} pts of debt service</span>}
                </span>
              </p>
              <p className="label text-ink-soft">Owed to: {d.creditor}</p>
              <p className="mt-1.5 text-sm leading-snug">{d.blurb}</p>
              <p className={`mt-1 text-sm leading-snug ${bad ? 'text-alarm' : 'text-ink-soft'}`}><span className="label mr-1">While it stands</span>{d.harm}</p>
              <p className="mt-1 text-sm leading-snug text-state"><span className="label mr-1">If you pay</span>{d.cleared}</p>
              {d.id === 'eurobond' && rateOf(s, 'eurobond') > 4.05 && <p className="mt-1 text-[13px] text-alarm">The naira has weakened: each ₦1tn of this now costs {rateOf(s, 'eurobond').toFixed(1)} points, not 4.</p>}
              {!clear && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chunks.map((amount, i) => {
                    const a = Math.min(amount, owed);
                    const can = canPay(s, d.id, a);
                    const all = a >= owed - 0.001;
                    return (
                      <button key={i} disabled={!can.ok} title={can.reason}
                        onClick={() => dispatch({ type: 'PAY_DEBT', id: d.id as DebtId, amount: a })}
                        className={`border px-3 py-1.5 font-serif ${can.ok ? 'border-state bg-state/10 hover:bg-state/20' : 'border-ink/10 opacity-45'}`}>
                        {all ? 'Pay it all' : 'Pay'} · {naira(a)}
                      </button>
                    );
                  })}
                  {d.id === 'ways' && (
                    <button disabled={!sec.ok} title={sec.reason} onClick={() => dispatch({ type: 'SECURITISE' })}
                      className={`border px-3 py-1.5 font-serif ${sec.ok ? 'border-ink/30 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-45'}`}>
                      Convert it all to long bonds · 8 capital
                    </button>
                  )}
                </div>
              )}
              {d.id === 'ways' && !clear && <p className="mt-1.5 text-[13px] text-ink-soft">Converting stops it feeding inflation and makes it ordinary debt, at interest. It needs the Senate (50). {sec.ok ? '' : sec.reason}</p>}
              {!clear && s.nation.fiscalSpace < 0.05 && <p className="mt-1.5 text-[13px] text-alarm">The treasury is empty. Nothing can be paid.</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Saved({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const costs = fundCosts(s);
  const total = s.funds.abroad + s.funds.buffer + s.funds.infra + s.funds.growth;
  return (
    <div className="mt-4">
      <p className="text-sm leading-snug text-ink-soft">
        The treasury holds <span className="font-semibold text-ink">{naira(s.nation.fiscalSpace)}</span> and the funds hold <span className="font-semibold text-ink">{naira(total)}</span>. Money left in the treasury can be spent by anyone with a claim on it. Money in a fund is put to a purpose. Moving it costs no move.
      </p>
      {costs.length > 0 && (
        <ul className="mt-3 space-y-1 border-l-2 border-alarm bg-alarm/5 px-3 py-2 text-sm text-alarm">
          {costs.map((c) => <li key={c}>{c}</li>)}
        </ul>
      )}
      <ul className="mt-3 space-y-3">
        {FUNDS.map((f) => {
          const held = s.funds[f.id];
          const steps = [0.5, 1];
          return (
            <li key={f.id} className="border border-ink/20 p-4">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-serif text-xl">{f.name}</span>
                <span className="font-serif text-xl">{held <= 0.001 ? 'Empty' : naira(held)}</span>
              </p>
              <p className="label text-ink-soft">{f.where}</p>
              <p className="mt-1.5 text-sm leading-snug">{f.blurb}</p>
              <p className="mt-1 text-sm leading-snug text-state"><span className="label mr-1">Gives</span>{f.gives}</p>
              <p className="mt-1 text-sm leading-snug text-alarm"><span className="label mr-1">Costs</span>{f.costs}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {steps.map((a) => {
                  const can = canFund(s, f.id, a);
                  return (
                    <button key={`in${a}`} disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'FUND', id: f.id as FundId, amount: a })}
                      className={`border px-3 py-1.5 font-serif ${can.ok ? 'border-state bg-state/10 hover:bg-state/20' : 'border-ink/10 opacity-45'}`}>
                      Put in {naira(a)}
                    </button>
                  );
                })}
                {held > 0.001 && [Math.min(0.5, held), held].filter((a, i, arr) => arr.indexOf(a) === i).map((a) => {
                  const can = canFund(s, f.id, -a);
                  return (
                    <button key={`out${a}`} disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'FUND', id: f.id as FundId, amount: -a })}
                      className={`border px-3 py-1.5 font-serif ${can.ok ? 'border-ink/30 hover:border-alarm hover:bg-alarm/5' : 'border-ink/10 opacity-45'}`}>
                      Take out {a >= held - 0.001 ? 'all' : ''} {naira(a)}{f.id === 'infra' ? ' · 6 capital' : ''}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TreasuryModal({ s, dispatch, onClose, onBudget, start }: { s: GameState; dispatch: Dispatch; onClose: () => void; onBudget: () => void; start?: Tab }) {
  const [tab, setTab] = useState<Tab>(start ?? 'books');
  const [before] = useState(s.lastAction?.text);
  const said = s.lastAction && s.lastAction.text !== before ? s.lastAction.text : null;
  const arrears = s.debts.gas + s.debts.contractors + s.debts.pensions;
  const standing = activePolicies(s).length;
  const tabs: [Tab, string][] = [['books', 'The books'], ['year', `The ${s.budget.year} budget`], ['owed', `What is owed · ${Math.round(s.nation.debt)}% and ${naira(arrears)} unpaid`], ['saved', 'What is saved'], ['policies', `Standing policies${standing ? ` · ${standing}` : ''}`]];
  const used = SECTORS.reduce((a, x) => a + (s.budget.alloc[x.id] ?? 0), 0);
  return (
    <Shell onClose={onClose}>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="label text-state">The Treasury · {dateLabel(s.turn, s.startYear)}</p>
          <h2 className="mt-1 font-serif text-3xl">{s.nation.fiscalSpace <= 0.01 ? 'The account is empty' : `${naira(s.nation.fiscalSpace)} in the account`}</h2>
        </div>
        <button onClick={s.budget.due ? onBudget : undefined} className={`label text-right ${s.budget.due ? 'text-alarm underline' : 'text-ink-soft'}`}>
          {s.budget.due ? 'The budget is waiting to be signed →' : `Budget ${s.budget.year}: oil at $${s.budget.benchmark}, ${used} points${s.budget.late ? ', passed late' : ''}`}
        </button>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 border-b rule">
        {tabs.map(([id, name]) => (
          <button key={id} onClick={() => setTab(id)} className={`label pb-2 ${tab === id ? 'border-b-2 border-state text-ink' : 'text-ink-soft'}`}>{name}</button>
        ))}
      </div>
      {tab === 'books' && <Flow s={s} />}
      {tab === 'owed' && <Owed s={s} dispatch={dispatch} />}
      {tab === 'saved' && <Saved s={s} dispatch={dispatch} />}
      {tab === 'policies' && <Policies s={s} dispatch={dispatch} />}
      {tab === 'year' && <ThisYear s={s} dispatch={dispatch} />}
      {said && tab !== 'books' && (
        <p className="fade-in mt-4 border-l-2 border-honour bg-paper-dim px-3 py-2 font-serif leading-snug">{said}</p>
      )}
      <div className="mt-6 text-right"><button onClick={onClose} className="bg-ink px-5 py-2.5 font-serif text-paper hover:bg-state">Close</button></div>
    </Shell>
  );
}
