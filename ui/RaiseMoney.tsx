'use client';

// RAISING MONEY (plan 11)
// Every way to find cash in a hurry, each with what it brings, when the money
// actually arrives, what it needs and what it leaves owed or given up. Below
// it, the register of what the state owns, and what has already been sold.

import { useState } from 'react';
import { HOLDINGS, METHOD, type SaleMethod } from '../content/holdings';
import { TYCOON_BY_ID } from '../content/tycoons';
import { dateLabel } from '../engine/config';
import { canBorrowNow, canCollect, canSell, collectQuote, ensureHoldings, saleQuote } from '../engine/holdings';
import { movesLeft } from '../engine/reduce';
import type { Action, GameState } from '../engine/types';

const bn = (tn: number) => (Math.abs(tn) >= 1 ? `₦${tn.toFixed(2)}tn` : `₦${Math.round(tn * 1000)}bn`);
const btn = (ok: boolean) => `border px-3 py-1 text-sm ${ok ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-45'}`;

function Measure({ title, proceeds, timing, needs, leaves, children }: { title: string; proceeds: string; timing: string; needs: string; leaves: string; children?: React.ReactNode }) {
  return (
    <li className="border border-ink/20 p-3">
      <p className="font-serif text-lg">{title}</p>
      <dl className="mt-1 grid gap-x-4 gap-y-0.5 text-[13px] leading-snug sm:grid-cols-[8rem_1fr]">
        <dt className="label text-ink-soft">Brings in</dt><dd>{proceeds}</dd>
        <dt className="label text-ink-soft">When</dt><dd>{timing}</dd>
        <dt className="label text-ink-soft">Needs</dt><dd>{needs}</dd>
        <dt className="label text-ink-soft">Leaves behind</dt><dd>{leaves}</dd>
      </dl>
      {children && <div className="mt-2 flex flex-wrap gap-2">{children}</div>}
    </li>
  );
}

function HoldingRow({ s, id, dispatch }: { s: GameState; id: string; dispatch: (a: Action) => void }) {
  const [open, setOpen] = useState(false);
  const h = HOLDINGS.find((x) => x.id === id)!;
  const st = s.holdings?.[id];
  const left = movesLeft(s);
  const share = st?.share ?? 1;
  const pending = s.sales?.find((x) => x.holding === id);
  const conceded = st?.conceded && st.conceded.until > s.turn ? st.conceded : null;
  const status = share <= 0.001 ? 'Sold' : pending ? `On the market: settles ${dateLabel(pending.due, s.startYear)}` : conceded ? `Leased to ${TYCOON_BY_ID[conceded.to]?.name ?? conceded.to} until ${dateLabel(conceded.until, s.startYear)}` : st?.pledged ? `Pledged: ${st.pledged}` : share < 1 ? `${Math.round(share * 100)}% still owned` : 'Owned';
  return (
    <li className={`border p-3 ${share <= 0.001 ? 'border-ink/10 opacity-60' : 'border-ink/20'}`}>
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-serif">{h.name}</span>
        <span className="label text-ink-soft">{status}</span>
      </p>
      <p className="text-[13px] leading-snug text-ink-soft">
        Worth about {bn(h.value * share)} · {h.income > 0 ? `earns ${bn(h.income * share * 12)} a year` : h.income < 0 ? `costs ${bn(-h.income * share * 12)} a year to keep` : 'earns nothing directly'}{h.oilShare ? ` · carries ${Math.round(h.oilShare * share * 100)}% of the state's oil income` : ''}
      </p>
      <p className="text-[13px] leading-snug">{h.note}</p>
      {h.essential && <p className="text-[13px] leading-snug text-alarm">{h.essential}</p>}
      {share > 0.001 && !pending && (
        <>
          <button onClick={() => setOpen(!open)} className="label mt-1 text-state underline">{open ? 'Close' : 'Ways to raise money from it'}</button>
          {open && (
            <ul className="mt-2 space-y-2">
              {h.methods.map((m: SaleMethod) => {
                const part = m === 'minority' ? Math.min(0.2, share - (id === 'noc' ? 0.51 : 0)) : share;
                if (part <= 0.001) return null;
                const q = saleQuote(s, id, m, part);
                const can = canSell(s, id, m, part, left);
                return (
                  <li key={m} className="border-l-2 border-ink/20 pl-2 text-[13px] leading-snug">
                    <p><span className="font-semibold">{METHOD[m].name}{m === 'minority' ? ` (${Math.round(part * 100)}%)` : ''}</span>: about {bn(q.price)}, paid in {q.months} month{q.months === 1 ? '' : 's'}.{q.buyer ? ` Buyer: ${TYCOON_BY_ID[q.buyer]?.name}.` : ''}</p>
                    <p className="text-ink-soft">{METHOD[m].text}</p>
                    {q.costs.map((c) => <p key={c} className="text-alarm">{c}</p>)}
                    {q.obligations.map((c) => <p key={c} className="text-ink-soft">{c}</p>)}
                    <button disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'SELL_HOLDING', id, method: m, share: part })} className={`mt-1 ${btn(can.ok)}`}>Start it</button>
                    {!can.ok && can.reason && <span className="ml-2 text-ink-soft">{can.reason}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      {(st?.history.length ?? 0) > 0 && (
        <ul className="mt-1 text-[12.5px] text-ink-soft">{st!.history.map((x, i) => <li key={i}>{dateLabel(x.at, s.startYear)}: {Math.round(x.share * 100)}% {x.method === 'concession' ? 'leased' : 'sold'}{x.price ? ` for ${bn(x.price)}` : ''}{x.buyer ? ` to ${TYCOON_BY_ID[x.buyer]?.name ?? x.buyer}` : ''}.</li>)}</ul>
      )}
    </li>
  );
}

export function RaiseMoney({ s, dispatch }: { s: GameState; dispatch: (a: Action) => void }) {
  ensureHoldings(structuredClone(s));
  const left = movesLeft(s);
  const collect = collectQuote(structuredClone(s));
  const canC = canCollect(structuredClone(s), left);
  const tax = s.receivables?.tax ?? 0;
  const sold = HOLDINGS.filter((h) => (s.holdings?.[h.id]?.share ?? 1) < 1).length;
  return (
    <div className="mt-4">
      <p className="text-sm leading-snug text-ink-soft">
        Every way to raise money in a hurry, with what it brings and when. A sale is not money until it settles. Borrowing is owed. What is sold is gone for the next government too{sold ? `: ${sold} holding${sold === 1 ? ' has' : 's have'} already been sold or part-sold` : ''}.
      </p>
      <ul className="mt-3 space-y-3">
        <Measure title="Sell or lease something the state owns" proceeds="Its value, less a discount for haste or a chosen buyer." timing="One to four months, depending on the method. Auctions can fail at diligence." needs="Two political capital and a move to start." leaves="The holding and its income are gone; a lease gives up the income for ten years.">
          <span className="text-[13px] text-ink-soft">See the register below.</span>
        </Measure>
        <Measure title="Collect assessed tax debts" proceeds={tax > 0.01 ? `About ${bn(collect.total)} of the ${bn(tax)} assessed and unpaid; a more capable state collects more of it.` : 'Almost nothing is left to collect.'} timing={`In four monthly instalments, ${bn(collect.perMonth)} a month.`} needs="Three political capital and a move." leaves="Every businessman with an assessment is less friendly; the establishment notices.">
          <button disabled={!canC.ok} title={canC.reason} onClick={() => dispatch({ type: 'COLLECT_TAX' })} className={btn(canC.ok)}>Start the collection drive</button>
          {s.receivables?.collecting && <span className="text-[13px] text-state">Under way until {dateLabel(s.receivables.collecting.until, s.startYear)}.</span>}
        </Measure>
        <Measure title="An emergency bond issue" proceeds="Up to ₦1tn." timing="This week." needs="A move, and lenders willing to lend (debt service below 100%)." leaves="An 8% premium on top of the amount, owed in domestic bonds at their interest rate.">
          {[0.25, 0.5, 1].map((a) => { const c = canBorrowNow(s, a, left); return <button key={a} disabled={!c.ok} title={c.reason} onClick={() => dispatch({ type: 'BORROW_NOW', amount: a })} className={btn(c.ok)}>Borrow {bn(a)}</button>; })}
        </Measure>
        <Measure title="Draw on the savings" proceeds={`The stabilisation account holds ${bn(s.funds.buffer)}; the fund abroad ${bn(s.funds.abroad)}.`} timing="At once." needs="Nothing but the decision (What is saved)." leaves="Less to fall back on next time; taking money home from abroad unsettles the establishment." />
        <Measure title="Defer payments" proceeds="Whatever is not paid this month." timing="At once." needs="Holding budget releases (the budget) or paying staff late (a file on the desk)." leaves="Arrears to contractors or workers, which do their own damage until paid." />
      </ul>
      {(s.sales?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">Sales under way</h3>
          <ul className="mt-1 space-y-0.5 text-[13px]">{s.sales!.map((x) => <li key={x.id}>{HOLDINGS.find((h) => h.id === x.holding)?.name}: {METHOD[x.method].name.toLowerCase()}, about {bn(x.price)}, settles {dateLabel(x.due, s.startYear)}.</li>)}</ul>
        </section>
      )}
      <section className="mt-6">
        <h3 className="label text-ink-soft">What the state owns</h3>
        <ul className="mt-2 grid items-start gap-3 xl:grid-cols-2">{HOLDINGS.map((h) => <HoldingRow key={h.id} s={s} id={h.id} dispatch={dispatch} />)}</ul>
      </section>
    </div>
  );
}
