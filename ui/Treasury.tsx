'use client';

import { useState } from 'react';
import { BENCHMARKS, DEBTS, FUNDS, SECTORS } from '../content/treasury';
import { dateLabel, yearOf } from '../engine/config';
import { rateOf, servicePoints } from '../engine/ledger';
import { naira } from '../engine/text';
import { inflationTarget } from '../engine/tick';
import {
  budgetPoints, canBudget, canFund, canPay, canSecuritise, fiscalFlow, fundCosts, oilGap, paddingDemand,
} from '../engine/treasury';
import type { Action, DebtId, FundId, GameState, SectorId } from '../engine/types';
import { senate } from '../engine/vars';

type Dispatch = (a: Action) => void;
type Tab = 'books' | 'owed' | 'saved';

const signed = (v: number) => `${v >= 0 ? '+' : '−'}₦${Math.round(Math.abs(v) * 1000)}bn`;

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fade-in fixed inset-0 z-30 overflow-y-auto bg-pit/80 px-3 py-6 sm:py-10" onClick={onClose} role="dialog">
      <div className="slide-in paper mx-auto max-w-3xl p-5 sm:p-8" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------- the budget

export function BudgetModal({ s, dispatch, onClose }: { s: GameState; dispatch: Dispatch; onClose: () => void }) {
  const [benchmark, setBenchmark] = useState(s.budget.benchmark);
  const [alloc, setAlloc] = useState<Record<SectorId, number>>({ ...s.budget.alloc });
  const points = budgetPoints(benchmark);
  const used = SECTORS.reduce((a, x) => a + (alloc[x.id] ?? 0), 0);
  const left = points - used;
  const demand = paddingDemand(s);
  const short = Math.max(0, demand - (alloc.padding ?? 0));
  const sen = senate(s);
  const can = canBudget(s, benchmark, alloc);
  const year = yearOf(s.turn, s.startYear) + 1;
  const set = (id: SectorId, d: number) => setAlloc((a) => ({ ...a, [id]: Math.max(0, (a[id] ?? 0) + d) }));

  return (
    <Shell onClose={onClose}>
      <p className="label text-state">Budget Office of the Federation · {dateLabel(s.turn, s.startYear)}</p>
      <h2 className="mt-1 font-serif text-3xl">The Appropriation Bill, {year}</h2>
      <p className="mt-2 text-sm leading-snug text-ink-soft">
        Once a year you decide what the government assumes oil will sell for, and how the money that assumption gives you is divided. It holds for twelve months. Nothing is released until you sign.
      </p>

      <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">1 · What will oil sell for?</h3>
      <p className="mt-2 text-sm text-ink-soft">
        Oil is at <span className="font-semibold text-ink">${Math.round(s.oil.price)}</span> today and the country is producing {s.oil.output.toFixed(2)}m barrels a day. If it sells above your figure, the difference is saved in the stabilisation account. If it sells below, the difference comes out of the treasury every month.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        {BENCHMARKS.map((b) => (
          <button key={b.price} onClick={() => setBenchmark(b.price)}
            className={`border p-3 text-left ${benchmark === b.price ? 'border-state bg-state/10' : 'border-ink/20 hover:border-ink/50'}`}>
            <span className="block font-serif text-xl">${b.price} <span className="text-sm text-ink-soft">{b.name}</span></span>
            <span className="label block text-state">{b.points} points to spend</span>
            <span className="mt-1 block text-[13px] leading-snug text-ink-soft">{b.blurb}</span>
          </button>
        ))}
      </div>

      <h3 className="label mt-6 flex items-baseline justify-between border-b rule pb-1 text-ink-soft">
        <span>2 · Where does it go?</span>
        <span className={left < 0 ? 'text-alarm' : 'text-ink'}>{left < 0 ? `${-left} over` : `${left} unallocated`}</span>
      </h3>
      <p className="mt-2 text-sm text-ink-soft">Each point above or below last year&apos;s level shifts that area a little, every month, for the year. Unallocated points are saved.</p>
      <ul className="mt-2 divide-y divide-ink/10">
        {SECTORS.map((x) => {
          const v = alloc[x.id] ?? 0;
          const d = v - x.usual;
          return (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg">{x.name}</span>
                <span className={`block text-[13px] leading-snug ${d > 0 ? 'text-state' : d < 0 ? 'text-alarm' : 'text-ink-soft'}`}>
                  {d > 0 ? x.more : d < 0 ? x.less : `Last year's level: ${x.usual}. No change.`}
                </span>
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

      <div className={`mt-4 border-l-2 px-3 py-2 ${short ? 'border-alarm bg-alarm/5' : 'border-state bg-state/5'}`}>
        <p className="label text-ink-soft">In the Assembly</p>
        <p className="mt-1 font-serif leading-snug">
          {short === 0
            ? `Senator Zango wanted ${demand} points for members' projects and has them. The bill will pass on time.`
            : sen >= 54
              ? `Senator Zango wants ${demand} points for members' projects and you are offering ${alloc.padding ?? 0}. Your senators are firm enough (${Math.round(sen)}) to pass it over him. He will not forget it.`
              : `Senator Zango wants ${demand} points for members' projects and you are offering ${alloc.padding ?? 0}. The Senate is not firmly yours (${Math.round(sen)}; it needs 54). The bill will sit in committee until March, and nothing above last year's level will be released for three months.`}
        </p>
      </div>

      {!can.ok && can.reason && <p className="mt-3 text-sm text-alarm">{can.reason}</p>}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={onClose} className="label text-ink-soft hover:text-ink">Not yet</button>
        <button disabled={!can.ok} onClick={() => { dispatch({ type: 'BUDGET', benchmark, alloc }); onClose(); }}
          className={`px-5 py-2.5 font-serif text-lg ${can.ok ? 'bg-state text-paper hover:bg-state-lit' : 'bg-ink/15 text-ink-soft'}`}>
          Sign the budget
        </button>
      </div>
    </Shell>
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
  const tabs: [Tab, string][] = [['books', 'The books'], ['owed', `What is owed · ${Math.round(s.nation.debt)}% and ${naira(arrears)} unpaid`], ['saved', 'What is saved']];
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
      {said && tab !== 'books' && (
        <p className="fade-in mt-4 border-l-2 border-honour bg-paper-dim px-3 py-2 font-serif leading-snug">{said}</p>
      )}
      <div className="mt-6 text-right"><button onClick={onClose} className="bg-ink px-5 py-2.5 font-serif text-paper hover:bg-state">Close</button></div>
    </Shell>
  );
}
