'use client';

import { useContext, useState } from 'react';
import { Inline, Overlay, Preview, usePreview, CloseButton } from './shell';
import { EVENTS } from '../content';
import { ORDER_BY_ID, TRACKS, type Order } from '../content/agenda';
import { THEATRES } from '../content/theatres';
import { ASSETS } from '../content/assets';
import { STATE_BY_ID } from '../content/states';
import { TYCOON_BY_ID } from '../content/tycoons';
import { VENTURES } from '../content/ventures';
import { eventOf } from '../engine/cast';
import { who } from '../engine/favours';
import { policyNow } from '../engine/policies';
import { activeShocks } from '../engine/shocks';
import { REHEAD_PC, available as availableInstitutions, built, canAbolish, canEstablish, canReplaceHead, headsFor, monthlyFx, performance } from '../engine/institutions';
import { INSTITUTION_BY_ID } from '../content/institutions';
import { adviser, adviserFor, forecast, recommend, secondFor, trackRecord } from '../engine/advice';
import { canFocus, offensiveStrength, theatreDrift, threatWord, worstTheatre } from '../engine/security';
import { forecastChallenge } from '../engine/courts';
import { assetFiscal, assetFx, assetPerformance, assets, canSetManager, local } from '../engine/places';
import { runElection } from '../engine/election';
import { upcoming } from '../engine/upcoming';
import { bench } from '../engine/courts';
import { StateMap } from './StateMap';
import { grievances, recentUses, targetName, targetsFor, wearFactor, type TargetKind } from '../engine/targets';
import { oilGap } from '../engine/treasury';
import { CFG, dateLabel, monthOf, termTurnOf, yearOf } from '../engine/config';
import { capitalIncome, movesTotal } from '../engine/capital';
import { describe } from '../engine/effects';
import { verdict } from '../engine/legacy';
import {
  applyAction,
  ACTION_COST, DRAWER_COST, agendaSlots, aidedFx, aidedPc, availability, blocked, canAct, canDelay, canDrawer, canLaunch, canOrder, canRescue, canVenture,
  favoursFor, financeAlternatives, launchCost, launchMoney, milestoneStatus, movesLeft, orderEcon, orderLevel, orderOutcome, partnerIn, rescueCost, risksOf, shieldFor,
  standingOrders, ventureNaira, ventureOdds, ventureStatus, ventureVisible,
} from '../engine/reduce';
import { blocks, fill, naira } from '../engine/text';
import type { Action, ActionId, Aid, Change, Choice, DeskItem, DrawerOp, Fx, GameEvent, GameState, Track, ZoneId } from '../engine/types';
import { ZONES, ZONE_NAME, approval } from '../engine/vars';
import { blocView, gauges, outlook, previewChoice, recordOf, resolveRead, traceFor } from '../engine/view';
import { Papers } from './Paper';
import { PeopleModal, senateLine } from './People';
import { BudgetModal, TreasuryModal } from './Treasury';
import { PEOPLE, RIVAL_BY_ID } from '../content/people';
import { strongestRival } from '../engine/people';
import { standing } from '../engine/vars';

type Dispatch = (a: Action) => void;
type Pred = ReturnType<typeof describe>;

function nextFixture(s: GameState): string {
  const tt = termTurnOf(s.turn);
  const m = monthOf(s.turn);
  const marks: [number, string][] = s.term === 1
    ? [[24, 'Governorship elections in three states'], [CFG.primaryTermTurn, 'Party primary'], [CFG.electionTermTurn, 'General election'], [48, s.flags['election.won'] ? 'Second inauguration' : 'Handover']]
    : [[24, 'Governorship elections in three states'], [36, 'The succession'], [CFG.electionTermTurn, 'General election'], [48, 'Handover']];
  const next = marks.find(([t]) => t >= tt);
  if (next && next[0] - tt <= 12) return next[0] === tt ? `${next[1]}: this month` : `${next[1]} in ${next[0] - tt} ${next[0] - tt === 1 ? 'month' : 'months'}`;
  const toBudget = (12 - m + 12) % 12;
  return toBudget === 0 ? 'The budget must be signed this month' : `Budget in ${toBudget} ${toBudget === 1 ? 'month' : 'months'}`;
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <Overlay onClose={onClose} width={wide ? 'max-w-3xl' : 'max-w-xl'}>{children}</Overlay>;
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: 'alarm' }) {
  return (
    <span className={`label whitespace-nowrap border px-1.5 py-0.5 ${tone === 'alarm' ? 'border-alarm/50 text-alarm' : 'border-ink/25 text-ink-soft'}`}>
      {children}
    </span>
  );
}

const good = (dark?: boolean) => (dark ? 'text-[#7fc4a0]' : 'text-state');
const bad = (dark?: boolean) => (dark ? 'text-[#e08a7c]' : 'text-alarm');

/** What actually changed, in numbers. */
function Changes({ changes, dark }: { changes: Change[]; dark?: boolean }) {
  if (!changes.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {changes.map((c, i) => (
        <li key={i} className={`text-sm ${c.good ? good(dark) : bad(dark)}`}>
          <span className={dark ? 'text-ivory/70' : 'text-ink-soft'}>{c.label}</span> <span className="font-semibold">{c.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** What is expected to change, as arrows. */
function Expected({ items, later, dark, label }: { items: Pred; later?: boolean; dark?: boolean; label?: string }) {
  if (!items.length) return null;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px]">
      <span className={`label pt-0.5 ${dark ? 'text-mute' : 'text-ink-soft'}`}>{label ?? (later ? 'Later' : 'Now')}</span>
      {items.map((c, i) => (
        <span key={i} className={c.good ? good(dark) : bad(dark)}>
          <span className={dark ? 'text-ivory/75' : 'text-ink-soft'}>{c.label}</span> {c.arrows}
        </span>
      ))}
    </span>
  );
}

/** A standing policy's cost, a year of it, at the economy as it is today. */
function PolicyPreview({ s, id }: { s: GameState; id: string }) {
  const p = policyNow(s, id);
  if (!p) return null;
  const year: Fx[] = [...p.fx.map(([t, v]) => [t, v * 12] as Fx), ['bonus.fiscal', p.fiscal], ['bonus.inflation', p.inflation]];
  return (
    <>
      <Expected items={describe(year)} dark label="Every year, at today's economy" />
      {p.approval > 0 && <p className="text-[12.5px] leading-snug text-state-lit">While it stands, approval is {p.approval} {p.approval === 1 ? 'point' : 'points'} higher than it would otherwise be.</p>}
      <p className="text-[12.5px] leading-snug text-ivory/60">{p.why}</p>
    </>
  );
}

// ---------------------------------------------------------------- the file

function FileModal({ s, e, item, dispatch, onClose }: { s: GameState; e: GameEvent; item: DeskItem; dispatch: Dispatch; onClose: () => void }) {
  const [tab, setTab] = useState<'advice' | 'trace'>('advice');
  const [aid, setAid] = useState<Aid>({});
  const favours = favoursFor(s, e);
  const shield = shieldFor(s, e);
  const reads = (e.reads ?? []).map((r) => resolveRead(s, e, r)).filter((r) => r !== null);
  const trace = traceFor(s, e);
  // Forecasts come from a named adviser, and can be wrong. What happened is shown after.
  const adv = adviserFor(s, e);
  const aidFx = (fx: Fx[] | undefined) => aidedFx(s, fx, aid);
  const usable = (c: Choice) => availability(s, { ...c, pc: aidedPc(s, c.pc, aid) }).ok;
  const advised = adv ? recommend(s, e, adv.role, aidFx, usable) : null;
  const other = item.second ? adviser(s, item.second) : null;
  const canSecond = !item.second && !!adv && !!secondFor(s, adv.role) && movesLeft(s) > 0;
  const record = adv ? trackRecord(s, adv.role) : null;
  const ref = `PRES/${e.category.slice(0, 3).toUpperCase()}/${yearOf(s.turn, s.startYear)}/${100 + s.turn * 3}`;

  return (
    <Modal onClose={onClose} wide>
      <article className="paper p-5 sm:p-9">
        <header className="flex items-start justify-between gap-4 border-b rule pb-4">
          <div>
            <p className="label text-state">{fill(s, e.office)}</p>
            <p className="label mt-1 text-ink-soft">{ref} · {dateLabel(s.turn, s.startYear)}</p>
          </div>
          {e.stamp && <span className={`stamp text-xs ${e.stamp === 'ROUTINE' ? 'text-ink-soft' : 'text-alarm'}`}>{e.stamp}</span>}
        </header>

        <h2 className="mt-5 font-serif text-2xl leading-tight sm:text-3xl">{fill(s, e.title)}</h2>
        <div className="mt-4 space-y-3 font-serif text-[17px] leading-relaxed">
          {blocks(s, e.body).map((p, i) => <p key={i}>{p}</p>)}
        </div>

        {e.statement && (
          <blockquote className="mt-5 border-l-2 border-honour bg-paper-dim px-4 py-3">
            <p className="label text-ink-soft">Official statement</p>
            <p className="mt-1 font-serif italic leading-relaxed">“{fill(s, e.statement)}”</p>
          </blockquote>
        )}

        {!item.resolved && (reads.length > 0 || trace.length > 0) && (
          <section className="mt-6">
            <div className="flex gap-4 border-b rule">
              <button onClick={() => setTab('advice')} className={`label pb-2 ${tab === 'advice' ? 'border-b-2 border-state text-ink' : 'text-ink-soft'}`}>Advice</button>
              {trace.length > 0 && (
                <button onClick={() => setTab('trace')} className={`label pb-2 ${tab === 'trace' ? 'border-b-2 border-state text-ink' : 'text-ink-soft'}`}>How did we get here?</button>
              )}
            </div>
            {tab === 'advice' ? (
              <ul className="mt-3 space-y-3">
                {reads.map((r, i) => (
                  <li key={i} className="border-l border-ink/20 pl-3">
                    <p className="label text-ink-soft">{r.name} · {r.role}</p>
                    <p className="mt-1 font-serif leading-snug">“{r.line}”</p>
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="mt-3 space-y-2">
                {trace.map((a) => (
                  <li key={a.id} className="flex gap-3 font-serif leading-snug">
                    <span className="label w-32 shrink-0 pt-1 text-ink-soft">{a.turn <= 0 ? 'Previous administration' : dateLabel(a.turn, s.startYear)}</span>
                    <span>{a.headline}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {!item.resolved ? (
          <section className="mt-7">
            {(favours.length > 0 || shield) && (
              <div className="mb-4 border border-honour/50 bg-paper-dim px-4 py-3">
                <p className="label text-ink-soft">Before you decide: who will carry this for you?</p>
                {favours.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {favours.map((f) => {
                      const on = aid.favour === f.id;
                      return (
                        <button key={f.id} onClick={() => setAid({ ...aid, favour: on ? undefined : f.id })}
                          className={`border px-3 py-1.5 text-left font-serif ${on ? 'border-state bg-state/15' : 'border-ink/25 hover:border-state'}`}>
                          {on ? '✓ ' : ''}Call in {who(s, f.who).short} <span className="text-state">{'●'.repeat(f.size)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {favours.length > 0 && <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">A favour makes the calls for you: it saves up to 5 political capital for each ● and softens the damage with the party, the establishment and the Villa. It is spent when you decide.</p>}
                {shield && (
                  <div className="mt-2">
                    <button disabled={!shield.ok} onClick={() => setAid({ ...aid, minister: !aid.minister })}
                      className={`border px-3 py-1.5 text-left font-serif ${!shield.ok ? 'border-ink/10 opacity-45' : aid.minister ? 'border-state bg-state/15' : 'border-ink/25 hover:border-state'}`}>
                      {aid.minister ? '✓ ' : ''}Put {who(s, shield.id).name} in front of it
                    </button>
                    <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">{shield.ok ? 'The minister announces it and takes the blame: the damage to your approval, the street and the press is halved. It goes on the minister\'s scorecard, and the minister will not thank you.' : shield.reason}</p>
                  </div>
                )}
              </div>
            )}
            <p className="label text-ink-soft">{adv ? `Your options, and what ${adv.name} expects of each` : 'Your options, and what the advisers expect of each'}</p>
            {adv && (
              <p className="mt-1 text-[13px] leading-snug text-ink-soft">
                {adv.title}. Reputation: {adv.rep.competence >= 4 ? 'able' : adv.rep.competence <= 2 ? 'out of their depth' : 'adequate'}, {adv.rep.loyalty >= 4 ? 'loyal' : adv.rep.loyalty <= 2 ? 'their own person' : 'reliable enough'}.
                {' '}{record && record.checked ? `Their forecasts so far: ${record.close} of ${record.checked} close to what happened.` : 'No record yet to check them against.'}
                {' '}A forecast is a forecast: what happens is shown after you decide.
                {canSecond && <button onClick={() => dispatch({ type: 'SECOND_OPINION', eventId: e.id })} className="ml-1 underline hover:text-state">Ask {secondFor(s, adv.role)!.name} for a second opinion · 1 move</button>}
              </p>
            )}
            <ul className="mt-2 space-y-2">
              {e.choices.map((c) => {
                const pc = aidedPc(s, c.pc, aid);
                const a = availability(s, { ...c, pc });
                if (!a.visible) return null;
                const p = previewChoice(s, c, aid);
                const f = adv ? forecast(s, e, c, adv.role, aidFx) : null;
                const f2 = other ? forecast(s, e, c, other.role, aidFx) : null;
                return (
                  <li key={c.id}>
                    <button
                      disabled={!a.ok}
                      onClick={() => dispatch({ type: 'CHOOSE', eventId: e.id, choiceId: c.id, aid })}
                      className={`w-full border px-4 py-3 text-left transition-colors ${a.ok ? 'border-ink/25 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-55'}`}
                    >
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-serif text-[17px] leading-snug">{fill(s, c.label)}</span>
                        <span className="flex flex-wrap gap-1.5">
                          {c.pc ? <Chip>{pc === c.pc ? `${c.pc} capital` : pc ? `${pc} capital, not ${c.pc}` : 'No capital: the favour covers it'}</Chip> : null}
                          {c.naira ? <Chip>{naira(c.naira)}</Chip> : null}
                          {c.purse ? <Chip tone="alarm">₦{c.purse}bn from the drawer</Chip> : null}
                          {p.risky ? <Chip tone="alarm">Risky</Chip> : null}
                          {advised === c.id && adv ? <Chip>Recommended by {adv.short}</Chip> : null}
                        </span>
                      </span>
                      <span className="mt-2 block space-y-1">
                        {p.notes.map((n) => <span key={n} className="block text-[13.5px] leading-snug text-ink">→ {n}</span>)}
                        <Expected items={f ? describe(f.now) : p.now} />
                        <Expected items={f ? describe(f.later) : p.later} later />
                        {f2 && other && (
                          <span className="block border-l-2 border-honour/60 pl-2">
                            <span className="label block text-ink-soft">{other.short} expects</span>
                            <Expected items={describe(f2.now)} />
                            <Expected items={describe(f2.later)} later />
                          </span>
                        )}
                        {p.leadsOn && <span className="label block text-ink-soft">This will come back to the desk</span>}
                        {a.overdraft ? <span className="block text-[13px] text-alarm">You are {Math.ceil(a.overdraft)} capital short. You can still do it; the party and the Villa will resent being overruled.</span> : null}
                        {!a.ok && a.reason ? <span className="block text-[13px] text-alarm">{a.reason}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <section className="fade-in mt-7 border-t rule pt-5">
            <p className="label text-ink-soft">Directive</p>
            <p className="mt-1 font-serif text-lg leading-snug">{item.resolved.label}</p>
            {item.resolved.signed && (
              <p className="mt-3 flex items-center gap-3">
                <span className="font-serif text-3xl italic text-state" style={{ transform: 'rotate(-3deg)' }}>{s.president.name}</span>
                <span className="label rounded-full border-2 border-honour px-2 py-2 text-honour">Seal</span>
              </p>
            )}
            <p className="mt-4 font-serif text-[17px] leading-relaxed">{item.resolved.result}</p>
            {item.resolved.changes && item.resolved.changes.length > 0 && (
              <div className="mt-4 bg-paper-dim px-4 py-3">
                <p className="label mb-1.5 text-ink-soft">What changed</p>
                <Changes changes={item.resolved.changes} />
              </div>
            )}
            <div className="mt-6 text-right">
              <button onClick={onClose} autoFocus className="bg-ink px-5 py-2.5 font-serif text-paper hover:bg-state">Close the file</button>
            </div>
          </section>
        )}
      </article>
    </Modal>
  );
}

// ---------------------------------------------------------------- the phone

function PhoneModal({ s, e, item, dispatch, onClose }: { s: GameState; e: GameEvent; item: DeskItem; dispatch: Dispatch; onClose: () => void }) {
  const reads = (e.reads ?? []).map((r) => resolveRead(s, e, r)).filter((r) => r !== null);
  return (
    <Modal onClose={onClose}>
      <div className="rounded-3xl border border-ivory/15 bg-pit p-4 shadow-2xl sm:p-5">
        <p className="label text-mute">{fill(s, e.from ?? 'Message')}</p>
        <p className="font-serif text-lg text-ivory">{fill(s, e.title)}</p>
        <div className="mt-4 space-y-2">
          {blocks(s, e.body).map((p, i) => (
            <p key={i} className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#23272b] px-4 py-2.5 leading-snug text-ivory">{p}</p>
          ))}
          {!item.resolved && reads.map((r, i) => (
            <p key={i} className="max-w-[88%] rounded-2xl rounded-tl-sm border border-honour/40 px-4 py-2.5 leading-snug text-ivory/90">
              <span className="label block text-honour">{r.name}</span>
              {r.line}
            </p>
          ))}
        </div>
        {!item.resolved ? (
          <div className="mt-5 flex flex-col items-end gap-2">
            {e.choices.map((c) => {
              const a = availability(s, c);
              if (!a.visible) return null;
              const p = previewChoice(s, c);
              const costs = [c.pc && `${c.pc} capital`, c.naira && naira(c.naira), c.purse && `₦${c.purse}bn from the drawer`, !a.ok && a.reason].filter(Boolean).join(' · ');
              return (
                <button
                  key={c.id} disabled={!a.ok}
                  onClick={() => dispatch({ type: 'CHOOSE', eventId: e.id, choiceId: c.id })}
                  className={`max-w-[92%] rounded-2xl rounded-br-sm border px-4 py-2.5 text-left leading-snug ${a.ok ? 'border-state-lit/60 bg-state/40 text-ivory hover:bg-state' : 'border-ivory/10 text-ivory/50'}`}
                >
                  {fill(s, c.label)}
                  {costs && <span className="label mt-1 block text-ivory/70">{costs}</span>}
                  {p.notes.map((n) => <span key={n} className="mt-1 block text-[13px] text-ivory/80">→ {n}</span>)}
                  <span className="mt-1 block"><Expected items={[...p.now, ...p.later]} dark /></span>
                </button>
              );
            })}
            <button onClick={onClose} className="label mt-2 text-mute hover:text-ivory">Leave on read</button>
          </div>
        ) : (
          <div className="fade-in mt-5">
            <p className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-state px-4 py-2.5 leading-snug text-ivory">{item.resolved.label}</p>
            <p className="mt-4 font-serif leading-relaxed text-ivory/85">{item.resolved.result}</p>
            {item.resolved.changes && <div className="mt-3"><Changes changes={item.resolved.changes} dark /></div>}
            <div className="mt-4 text-right"><button onClick={onClose} autoFocus className="label text-honour">Close</button></div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- executive powers

const APPEARANCES: { id: ActionId; name: string; text: string; zone?: boolean; fx: Fx[] }[] = [
  { id: 'address', name: 'Address the nation', text: 'Lifts approval and the street when the facts support the speech. Backfires when hardship is high.', fx: [['approval', 4], ['bloc.street', 4], ['bloc.press', 3]] },
  { id: 'tour', name: 'Tour a zone', text: 'A large lift in the zone you visit. Less each time you return.', zone: true, fx: [['approval', 0.5], ['bloc.street', 2]] },
  { id: 'audit', name: 'Order a forensic audit', text: 'Raises integrity, cools scandal and recovers money. The party will not thank you.', fx: [['nation.integrity', 6], ['pressure.scandalHeat', -15], ['nation.fiscalSpace', 0.25], ['bloc.party', -7], ['bloc.press', 4]] },
  { id: 'convene', name: 'Convene the party and stakeholders', text: 'Rebuilds political capital and soothes the party.', fx: [['pc', 6], ['bloc.party', 3], ['bloc.establishment', 2]] },
  { id: 'rally', name: 'Hold a campaign rally', text: 'Campaign season only. Wins votes in the zone on election day.', zone: true, fx: [] },
];

const GROUPS: [Order['group'], string][] = [
  ['capital', 'Raising political capital'], ['economy', 'The economy'], ['relief', 'Relief'], ['security', 'Security'], ['politics', 'Cabinet and party'],
];

function OrderCard({ s, o, onUse, tag }: { s: GameState; o: Order; onUse: (target?: string, level?: number) => void; tag?: React.ReactNode }) {
  const [where, setWhere] = useState<string | undefined>(() => (o.target === 'theatre' ? worstTheatre(s) : o.target ? targetsFor(s, o.target)[0]?.id : undefined));
  const [level, setLevel] = useState<number | undefined>(undefined);
  const lv = orderLevel(o, level);
  const can = canOrder(s, o, level);
  const target = o.target ? where : undefined;
  const out = orderOutcome(o, s, target, level);
  const strength = o.target === 'theatre' && target ? offensiveStrength(s, target as ZoneId) : null;
  const econ = orderEcon(o, s);
  const now: Fx[] = [...(out.fx ?? [])];
  if (lv.naira) now.push(['nation.fiscalSpace', -lv.naira]);
  const uses = o.hostile ? recentUses(s, o.id) : 0;
  const remembers = o.hostile && target && o.target !== 'paper' && o.target !== 'zone' && o.target !== 'theatre' && o.target !== 'state';
  const hover = usePreview({ type: 'ORDER', id: o.id, target, level: o.levels ? lv.index : undefined }, can.ok);
  const card = (
    <button
      disabled={!can.ok} onClick={() => onUse(target, o.levels ? lv.index : undefined)} {...hover}
      className={`w-full border px-4 py-3 text-left ${can.ok ? 'border-ink/25 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-50'}`}
    >
      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-serif text-lg">{o.name}</span>
        <span className="flex flex-wrap gap-1.5">
          {tag}
          {lv.pc ? <Chip>{lv.pc} capital</Chip> : null}
          {lv.naira ? <Chip>{naira(lv.naira)}</Chip> : null}
        </span>
      </span>
      <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{o.blurb}</span>
      <span className="mt-1.5 block space-y-0.5">
        <Expected items={describe(now)} />
        {(out.later ?? []).map((l, i) => <Expected key={i} items={describe(l.fx)} later />)}
        {econ && <span className="block text-[13px] text-ink-soft">{econ.note}</span>}
        {strength && (
          <span className="block text-[13px] text-ink-soft">
            Strength ×{Number(strength.strike.toFixed(2))}{strength.why.length ? `: ${strength.why.join('; ')}` : ': no groundwork yet'}.
            {' '}{strength.held ? 'The ground will be held afterwards.' : 'Nothing will hold the ground afterwards, so part of the gain comes back within a year.'}
          </span>
        )}
        {uses > 0 && <span className="block text-[13px] text-ink-soft">Used {uses === 1 ? 'once' : `${uses} times`} in the last two years. Everyone has seen it coming: it works at {Math.round(wearFactor(s, o.id) * 100)}%.</span>}
        {(o.hostile ?? 0) >= 3 && (() => { const f = forecastChallenge(s); return <span className="block text-[13px] text-ink-soft">They will go to court. The Supreme Court as it sits: {f.against} against you, {f.for} for you{f.unsure ? `, ${f.unsure} for sale` : ''}. Lose and half of it is undone, and it costs you 3 capital.</span>; })()}
        {remembers && <span className="block text-[13px] text-ink-soft">{targetName(s, o.target as TargetKind, target!).name} will remember this for two years, and will not warm to you past a point until then.</span>}
        {!can.ok && can.reason && <span className="block text-[13px] text-alarm">{can.reason}</span>}
      </span>
    </button>
  );
  const levels = o.levels && (
    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
      <span className="label mr-1 text-ink-soft">How far</span>
      {o.levels.map((l, i) => (
        <button key={l.label} onClick={() => setLevel(i)}
          className={`border px-2 py-0.5 text-[13px] ${lv.index === i ? 'border-state bg-state/10' : 'border-ink/20 hover:border-state'}`}>
          {l.label}
        </button>
      ))}
    </div>
  );
  const picks = o.target === 'theatre'
    ? THEATRES.map((th) => ({ id: th.zone, label: `${ZONE_NAME[th.zone]} · ${Math.round(s.theatres[th.zone])}`, detail: undefined as string | undefined }))
    : o.target ? targetsFor(s, o.target).map((t) => ({ id: t.id, label: t.label, detail: t.detail })) : [];
  const grudges = (id: string) => grievances(s, id).length;
  return (
    <div>
      {levels}
      {picks.length > 0 && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className="label mr-1 text-ink-soft">{o.target === 'theatre' || o.target === 'zone' || o.target === 'state' ? 'Where' : 'Whom'}</span>
          {picks.map((t) => (
            <button key={t.id} onClick={() => setWhere(t.id)} title={t.detail}
              className={`border px-2 py-0.5 text-[13px] ${where === t.id ? 'border-state bg-state/10' : 'border-ink/20 hover:border-state'}`}>
              {t.label}{t.detail && o.target !== 'paper' ? <span className="text-ink-soft"> · {t.detail.replace(/^.*, /, '')}</span> : null}{grudges(t.id) ? <span className="text-alarm"> · wronged</span> : null}
            </button>
          ))}
        </div>
      )}
      {card}
    </div>
  );
}

const repWords = (r: { competence: number; loyalty: number }) =>
  `${r.competence >= 4 ? 'able' : r.competence <= 2 ? 'out of their depth' : 'adequate'}, ${r.loyalty >= 4 ? 'loyal' : r.loyalty <= 2 ? 'their own person' : 'reliable enough'}`;

/** What orders have built, and what could be built: each with a head, an upkeep and an output. */
function Institutions({ s, dispatch, left }: { s: GameState; dispatch: Dispatch; left: number }) {
  const [heads, setHeads] = useState<Record<string, string>>({});
  const [rehead, setRehead] = useState<string | null>(null);
  const candidates = headsFor(s);
  const mine = built(s);
  const year = (fx: Fx[]) => describe(fx.map(([t, v]) => [t, v * 12] as Fx));
  return (
    <section className="mt-6">
      <h3 className="label border-b border-honour pb-1 text-state">Build something that lasts</h3>
      <p className="mt-1 text-sm text-ink-soft">An institution keeps working every month under the head you choose, and costs something every month. A capable head makes it work. A head who serves someone else captures it, and it will show. What you build is handed on.</p>
      {mine.length > 0 && (
        <ul className="mt-2 space-y-2">
          {mine.map((i) => {
            const d = INSTITUTION_BY_ID[i.id];
            const perf = performance(s, i.id);
            const ab = canAbolish(s, i.id);
            return (
              <li key={i.id} className={`border px-4 py-3 ${i.seen ? 'border-alarm/50' : 'border-state/40'}`}>
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-lg">{d.name}</span>
                  <span className="label text-ink-soft">since {dateLabel(i.since, s.startYear)}</span>
                </p>
                <p className="text-sm">Headed by {i.head.name.replace(/^A /, 'a ')}. {i.seen ? <span className="text-alarm">Captured: it has been serving someone else.</span> : <>Working at {Math.round(perf.k * 100)}%.</>} {perf.why.join('. ')}</p>
                <span className="mt-1 block"><Expected items={year(monthlyFx(s, i.id))} label="A year of it" /></span>
                <span className="mt-1 flex flex-wrap gap-2">
                  <button onClick={() => setRehead(rehead === i.id ? null : i.id)} className="border border-ink/30 px-3 py-1 text-sm hover:border-state">{rehead === i.id ? 'Keep the head' : `Replace the head · ${REHEAD_PC} capital · 1 move`}</button>
                  <button disabled={!ab.ok} title={ab.reason} onClick={() => dispatch({ type: 'ABOLISH', id: i.id })} className={`border px-3 py-1 text-sm ${ab.ok ? 'border-ink/30 hover:border-alarm' : 'border-ink/10 opacity-45'}`}>Wind it up · {d.abolishPc} capital</button>
                </span>
                {rehead === i.id && (
                  <ul className="mt-2 space-y-1">
                    {candidates.filter((h) => h.name !== i.head.name).map((h) => {
                      const ok = canReplaceHead(s, i.id, h.name, left);
                      return (
                        <li key={h.name}>
                          <button disabled={!ok.ok} title={ok.reason} onClick={() => { dispatch({ type: 'REPLACE_HEAD', id: i.id, head: h.name }); setRehead(null); }} className={`w-full border px-3 py-1.5 text-left text-sm ${ok.ok ? 'border-ink/20 hover:border-state' : 'border-ink/10 opacity-45'}`}>
                            <span className="font-serif">{h.name}</span> <span className="text-ink-soft">· by reputation {repWords(h.rep)}. {h.blurb}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ul className="mt-2 space-y-2">
        {availableInstitutions(s).map((d) => {
          const head = heads[d.id] ?? candidates[0]?.name;
          const can = canEstablish(s, d.id, head, left);
          const preview: Fx[] = d.fx.map(([t, v]) => [t, v * 0.95] as Fx);
          return (
            <li key={d.id} className="border border-ink/25 px-4 py-3">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-serif text-lg">{d.name}</span>
                <span className="flex flex-wrap gap-1.5">{d.pc ? <Chip>{d.pc} capital</Chip> : null}{d.naira ? <Chip>{naira(d.naira)}</Chip> : null}<Chip>{d.fiscal < 0 ? `${naira(-d.fiscal * 12)} a year to run` : `raises up to ${naira(d.fiscal * 12)} a year`}</Chip></span>
              </p>
              <p className="mt-0.5 text-sm leading-snug text-ink-soft">{d.blurb}</p>
              <span className="mt-1 block"><Expected items={year(preview)} label="A year of it, under an ordinary head" /></span>
              {d.needs && <span className="block text-[13px] text-ink-soft">Needs {d.needs.label.toLowerCase()} to work at full strength.</span>}
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <span className="label text-ink-soft">Head</span>
                <select value={head} onChange={(e) => setHeads({ ...heads, [d.id]: e.target.value })} className="border border-ink/25 bg-paper px-2 py-1 text-sm">
                  {candidates.map((h) => <option key={h.name} value={h.name}>{h.name} · {repWords(h.rep)}</option>)}
                </select>
                <button disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'ESTABLISH', id: d.id, head })} className={`border px-3 py-1 font-serif ${can.ok ? 'border-ink/30 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-45'}`}>Set it up · 1 move</button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PowersModal({ s, dispatch, onClose }: { s: GameState; dispatch: Dispatch; onClose: () => void }) {
  const [pick, setPick] = useState<ActionId | null>(null);
  const left = movesLeft(s);
  const done = (a: Action) => { dispatch(a); onClose(); };
  const inline = useContext(Inline);
  const [only, setOnly] = useState<'all' | 'aimed' | 'now'>('all');
  const keep = (o: Order) => only === 'all' || (only === 'aimed' ? !!o.target : canOrder(s, o).ok);
  const list = inline ? 'mt-2 grid items-start gap-2 xl:grid-cols-2' : 'mt-2 space-y-2';

  return (
    <Modal onClose={onClose} wide>
      <div className="paper p-5 sm:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="label text-state">Executive powers</p>
            <h2 className="mt-1 font-serif text-3xl">What do you want done?</h2>
          </div>
          <p className="label text-ink-soft">{left} of {movesTotal(s)} moves left this month</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="label text-ink-soft">Show</span>
          {([['all', 'Everything'], ['aimed', 'Aimed at someone'], ['now', 'What I can do now']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setOnly(k)} className={`border px-2 py-0.5 ${only === k ? 'border-state bg-state/10' : 'border-ink/20 hover:border-state'}`}>{label}</button>
          ))}
          <span className="text-ink-soft">Orders aimed at a person are also on their card under Power.</span>
        </div>


        <section className="mt-6">
          <h3 className="label border-b border-honour pb-1 text-state">Open to you now · these pass</h3>
          <p className="mt-1 text-sm text-ink-soft">Options that exist because of the moment: the season, the state of the country, the calendar, your rivals. Each lapses when its moment does.</p>
          {s.offers.length === 0 && <p className="mt-2 font-serif italic text-ink-soft">Nothing unusual is open this month.</p>}
          <ul className={list}>
            {s.offers.map((x) => {
              const o = ORDER_BY_ID[x.id];
              if (!o || !keep(o)) return null;
              const months = x.until - s.turn;
              return (
                <li key={x.id}>
                  <OrderCard s={s} o={o} onUse={(t, l) => done({ type: 'ORDER', id: o.id, target: t, level: l })}
                    tag={<>{x.since === s.turn && <Chip tone="alarm">New</Chip>}<Chip>{months <= 1 ? 'Last month' : `${months} months left`}</Chip></>} />
                </li>
              );
            })}
          </ul>
        </section>

        <p className="label mt-8 text-ink-soft">Standing powers</p>
        {GROUPS.map(([group, title]) => (
          <section key={group} className="mt-3">
            <h3 className="label border-b rule pb-1 text-ink-soft">{title}</h3>
            <ul className={list}>
              {standingOrders(s).filter((o) => o.group === group && keep(o)).map((o) => (
                <li key={o.id}><OrderCard s={s} o={o} onUse={(t, l) => done({ type: 'ORDER', id: o.id, target: t, level: l })} /></li>
              ))}
              {group === 'politics' && only === 'all' && financeAlternatives(s).map((c) => {
                const ok = left > 0 && s.pc >= 10;
                return (
                  <li key={c.name}>
                    <button
                      disabled={!ok} onClick={() => done({ type: 'REPLACE_FIN', name: c.name })}
                      className={`w-full border px-4 py-3 text-left ${ok ? 'border-ink/25 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-50'}`}
                    >
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-serif text-lg">Replace {s.chars.fin?.short} with {c.name}</span>
                        <Chip>10 capital</Chip>
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{c.blurb}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section className="mt-6">
          <h3 className="label border-b rule pb-1 text-ink-soft">In person</h3>
          <ul className="mt-2 space-y-2">
            {APPEARANCES.map((a) => {
              const can = canAct(s, a.id);
              if (a.id === 'rally' && !can.ok && can.reason?.startsWith('The campaign')) return null;
              return (
                <li key={a.id} className={`border px-4 py-3 ${can.ok ? 'border-ink/25' : 'border-ink/10 opacity-50'}`}>
                  <button disabled={!can.ok} onClick={() => (a.zone ? setPick(a.id) : done({ type: 'ACT', action: a.id }))} className="w-full text-left">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-serif text-lg">{a.name}</span>
                      {ACTION_COST[a.id] > 0 && <Chip>{ACTION_COST[a.id]} capital</Chip>}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-soft">{can.ok ? a.text : can.reason}</span>
                    <span className="mt-1 block"><Expected items={describe(a.fx)} /></span>
                  </button>
                  {pick === a.id && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {ZONES.map((z) => (
                        <button key={z} onClick={() => done({ type: 'ACT', action: a.id, zone: z })} className="border border-ink/25 px-2 py-2 text-left hover:border-state hover:bg-state/5">
                          <span className="block font-serif">{ZONE_NAME[z]}</span>
                          <span className="label text-ink-soft">{Math.round(s.zones[z].approval)}% approve</span>
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
        {only === 'all' && <Institutions s={s} dispatch={dispatch} left={left} />}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- the agenda

function TrackCard({ s, track, dispatch, priority }: { s: GameState; track: Track; dispatch: Dispatch; priority: boolean }) {
  const done = track.milestones.filter((m) => s.agenda.done.includes(m.id)).length;
  return (
    <div className="border border-ivory/12 bg-[#1a1d20] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl text-ivory">{track.name}</h3>
        <span className="label text-mute">{done}/{track.milestones.length}</span>
      </div>
      <p className="text-sm text-mute">{track.goal}{track.loose && ' · in any order; read each one before you sign it'}{!priority && ' · not a declared priority: costs more capital'}</p>
      <ol className="mt-3 space-y-2">
        {track.milestones.map((m, i) => {
          const st = milestoneStatus(s, m.id);
          const active = s.agenda.active.find((a) => a.id === m.id);
          const can = canLaunch(s, m.id);
          const cost = launchCost(s, m);
          const money = launchMoney(s, m);
          return (
            <li key={m.id} className={`border-l-2 pl-3 ${st === 'done' ? 'border-state-lit' : st === 'active' ? 'border-honour' : 'border-ivory/15'} ${st === 'later' ? 'opacity-45' : ''}`}>
              <p className="flex items-baseline justify-between gap-2">
                <span className={`font-serif leading-snug ${st === 'done' ? 'text-ivory/60 line-through decoration-state-lit' : 'text-ivory'}`}>{track.loose ? '' : `${i + 1}. `}{m.name}</span>
                {st === 'done' && <span className="label text-state-lit">Delivered</span>}
              </p>
              {st === 'active' && active && (
                <div className="mt-1.5">
                  <div className="h-1.5 bg-ivory/10"><div className="h-1.5 bg-honour transition-all duration-700" style={{ width: `${Math.min(100, active.progress)}%` }} /></div>
                  <p className="label mt-1 text-honour">Under way · {Math.round(Math.min(99, active.progress))}%</p>
                  {m.duringText && <p className="mt-0.5 text-[12.5px] leading-snug text-alarm/90">Hurting while it lasts: {m.duringText}</p>}
                </div>
              )}
              {st === 'next' && (
                <div className="mt-1">
                  <p className="text-sm leading-snug text-ivory/65">{m.blurb}</p>
                  <div className="mt-1.5 space-y-0.5">
                    {m.start && <Expected items={describe(m.start)} dark />}
                    {m.during && (
                      <>
                        <Expected items={describe(m.during.map(([t, v]) => [t, v * m.months] as Fx))} dark label={`While it is under way, ${m.months} months`} />
                        <p className="text-[12.5px] leading-snug text-alarm/90">{m.duringText} Launch it early enough to be through it before an election.</p>
                      </>
                    )}
                    <Expected items={describe(m.done)} later dark />
                    <PolicyPreview s={s} id={m.id} />
                    {m.lasting && <p className="text-[12.5px] leading-snug text-ivory/70"><span className="label mr-1 text-mute">For as long as it stands</span>{m.lasting}</p>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <button
                      disabled={!can.ok} onClick={() => dispatch({ type: 'LAUNCH', id: m.id })}
                      className={`px-3 py-1.5 font-serif ${can.ok ? 'bg-state text-ivory hover:bg-state-lit' : 'bg-ivory/8 text-ivory/40'}`}
                    >
                      Launch
                    </button>
                    <span className="label text-mute">
                      {[cost ? `${cost} capital` : null, m.naira ? (money.fund ? `${naira(money.fund)} from the Infrastructure Fund${money.treasury > 0.001 ? ` + ${naira(money.treasury)}` : ''}` : naira(m.naira)) : null, `${m.months} months`].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  {!can.ok && can.reason && <p className="mt-1 text-[13px] text-[#e08a7c]">{can.reason}</p>}
                  {m.needs && can.ok && <p className="mt-1 text-[13px] text-mute">Goes to a vote in the Assembly when it is ready. If the party has turned by then, it falls.</p>}
                  {!can.ok && can.grease && (
                    <button onClick={() => dispatch({ type: 'LAUNCH', id: m.id, grease: true })} className="mt-1.5 border border-honour/50 px-3 py-1.5 font-serif text-honour hover:bg-honour/10">
                      Launch with logistics · ₦10bn from the drawer
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Agenda({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const [all, setAll] = useState(false);
  const mine = TRACKS.filter((t) => s.agenda.tracks.includes(t.id));
  const others = TRACKS.filter((t) => !s.agenda.tracks.includes(t.id));
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="label text-mute">Your agenda · {s.agenda.active.length} of {agendaSlots(s)} reforms under way{s.agenda.active.length > CFG.agenda.easyLoad ? ` · beyond ${CFG.agenda.easyLoad}, each one costs ${CFG.agenda.loadPc} capital and ${CFG.agenda.loadParty} with the party a month` : ''}</p>
        <button onClick={() => setAll(!all)} className="label text-honour/90 hover:text-honour">{all ? 'Hide the other tracks' : `Show all ${TRACKS.length} reform tracks · ${s.agenda.done.length} of ${TRACKS.reduce((a, t) => a + t.milestones.length, 0)} delivered`}</button>
      </div>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        {mine.map((t) => <TrackCard key={t.id} s={s} track={t} dispatch={dispatch} priority />)}
        {all && others.map((t) => <TrackCard key={t.id} s={s} track={t} dispatch={dispatch} priority={false} />)}
      </div>
      <Ventures s={s} dispatch={dispatch} />
    </section>
  );
}

// ---------------------------------------------------------------- big bets

function Risks({ s, v, live }: { s: GameState; v: (typeof VENTURES)[number]; live?: boolean }) {
  const list = risksOf(s, v);
  return (
    <ul className="mt-2 space-y-1">
      {list.map(({ risk, ok }) => (
        <li key={risk.id} className="text-[13px] leading-snug">
          <span className={ok ? 'text-[#7fc4a0]' : 'text-[#e08a7c]'}>{ok ? '✓' : '✕'} {risk.label}</span>
          {!ok && <span className="block pl-4 text-ivory/60">{live ? risk.warn + ' ' : ''}Costs {Math.round(risk.cost * 100)} points of the odds. {risk.fix}</span>}
        </li>
      ))}
    </ul>
  );
}

function Ventures({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const [open, setOpen] = useState(false);
  const [sites, setSites] = useState<Record<string, string>>({});
  const running = VENTURES.filter((v) => ventureStatus(s, v.id) === 'active');
  const available = VENTURES.filter((v) => ventureStatus(s, v.id) === 'open' && ventureVisible(s, v));
  const locked = VENTURES.filter((v) => v.opened && ventureStatus(s, v.id) === 'open' && !ventureVisible(s, v));
  const fresh = available.filter((v) => v.opened);
  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="label text-mute">Big bets · {running.length} of {CFG.agenda.ventureSlots} running</p>
        <button onClick={() => setOpen(!open)} className="label text-honour/90 hover:text-honour">{open ? 'Hide' : `Show ${available.length} available${fresh.length ? `, ${fresh.length} opened by your reforms` : ''}`}</button>
      </div>
      <p className="mt-1 text-sm text-mute">Bold initiatives that can fail. Each lists what must be true for it to work. Those are judged on the day it opens; until then you can put them right. Reforms open new bets.</p>
      {running.length > 0 && (
        <ul className="mt-2 space-y-2">
          {running.map((v) => {
            const a = s.ventures.active.find((x) => x.id === v.id)!;
            const odds = ventureOdds(s, v);
            const res = canRescue(s, v.id);
            const del = canDelay(s, v.id);
            const st = s.bets[v.id];
            return (
              <li key={v.id} className="border border-honour/30 bg-[#1a1d20] p-3">
                <p className="flex items-baseline justify-between gap-2 font-serif text-ivory">{v.name}<span className={`label ${odds < 0.5 ? 'text-[#e08a7c]' : 'text-honour'}`}>{Math.round(odds * 100)}% odds</span></p>
                <div className="mt-1.5 h-1.5 bg-ivory/10"><div className="h-1.5 bg-honour transition-all duration-700" style={{ width: `${Math.min(100, a.progress)}%` }} /></div>
                <p className="label mt-1 text-mute">{Math.round(Math.min(99, a.progress))}% built{st?.partner && v.partner ? ` · ${TYCOON_BY_ID[v.partner].short} is co-financing` : ''}{st?.rescued ? ' · reinforced' : ''}{st?.delayed ? ' · postponed once' : ''}</p>
                <Risks s={s} v={v} live />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button disabled={!res.ok} title={res.reason} onClick={() => dispatch({ type: 'VENTURE_RESCUE', id: v.id })}
                    className={`border px-2.5 py-1 text-sm ${res.ok ? 'border-honour/50 text-honour hover:bg-honour/10' : 'border-ivory/10 text-ivory/35'}`}>
                    Send a task team · {naira(rescueCost(v))}, 3 capital · +12 points
                  </button>
                  <button disabled={!del.ok} title={del.reason} onClick={() => dispatch({ type: 'VENTURE_DELAY', id: v.id })}
                    className={`border px-2.5 py-1 text-sm ${del.ok ? 'border-ivory/25 text-ivory/80 hover:border-ivory/50' : 'border-ivory/10 text-ivory/35'}`}>
                    Postpone the opening · buys time, costs a little approval
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {open && (
        <>
          <ul className="mt-2 grid gap-3 md:grid-cols-2">
            {available.map((v) => {
              const can = canVenture(s, v);
              const odds = ventureOdds(s, v);
              const cost = ventureNaira(s, v);
              const partner = partnerIn(s, v);
              return (
                <li key={v.id} className={`border bg-[#1a1d20] p-4 ${v.opened ? 'border-state-lit/60' : 'border-ivory/12'}`}>
                  {v.opened && <p className="label text-[#7fc4a0]">Opened by: {v.opened}</p>}
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="font-serif text-lg leading-snug text-ivory">{v.name}</span>
                    <span className={`label shrink-0 ${odds < 0.5 ? 'text-[#e08a7c]' : 'text-honour'}`}>{Math.round(odds * 100)}% odds</span>
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ivory/65">{v.blurb}</p>
                  <p className="label mt-2 text-mute">What it depends on · {Math.round(v.top * 100)}% if all are in place</p>
                  <Risks s={s} v={v} />
                  <div className="mt-2 space-y-1">
                    {v.start && <Expected items={describe(v.start)} dark />}
                    <p className="label text-[#7fc4a0]">If it works</p>
                    <Expected items={describe(v.win)} later dark />
                    <p className="label text-[#e08a7c]">If it fails</p>
                    <Expected items={describe(v.lose)} later dark />
                  </div>
                  {ASSETS[v.id] && (
                    <div className="mt-2">
                      <p className="label text-mute">Where to build it · if it works, it runs there under a manager you choose and lifts that state's vote; if it fails, the site stays</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {ASSETS[v.id].sites.map((st) => (
                          <button key={st} onClick={() => setSites({ ...sites, [v.id]: st })}
                            className={`border px-2 py-0.5 text-[13px] ${(sites[v.id] ?? ASSETS[v.id].sites[0]) === st ? 'border-honour bg-honour/15 text-ivory' : 'border-ivory/20 text-ivory/70 hover:border-honour'}`}>
                            {STATE_BY_ID[st].name} · {Math.round(s.zones[STATE_BY_ID[st].zone].approval)}%{s.theatres[STATE_BY_ID[st].zone] >= 65 ? ' · unsafe' : ''}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-[13px] text-mute">Once running: {[ASSETS[v.id].fiscal ? `${ASSETS[v.id].fiscal > 0 ? 'earns' : 'costs'} ${naira(Math.abs(ASSETS[v.id].fiscal) * 12)} a year` : null, ...describe(ASSETS[v.id].fx.map(([t, x]) => [t, x * 12] as Fx)).map((c) => `${c.label} ${c.text ?? ''}`.trim())].filter(Boolean).join(' · ')}{ASSETS[v.id].fx.length ? ' a year' : ''}. A site in an unsafe theatre runs at 60%.</p>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <button disabled={!can.ok} onClick={() => dispatch({ type: 'VENTURE', id: v.id, site: sites[v.id] ?? ASSETS[v.id]?.sites[0] })} className={`px-3 py-1.5 font-serif ${can.ok ? 'bg-honour/90 text-pit hover:bg-honour' : 'bg-ivory/8 text-ivory/40'}`}>
                      Take the bet
                    </button>
                    <span className="label text-mute">{[v.pc ? `${v.pc} capital` : null, cost ? naira(cost) : null, `${v.months} months`].filter(Boolean).join(' · ')}</span>
                  </div>
                  {v.partner && <p className="mt-1 text-[13px] text-mute">{partner ? `${TYCOON_BY_ID[v.partner].short} is with you and will put in 40% of the money.` : `${TYCOON_BY_ID[v.partner].short} would pay 40% of this as a friend (60 or better on the politics screen).`}</p>}
                  {v.infra && s.funds.infra > 0.01 && <p className="mt-1 text-[13px] text-[#7fc4a0]">The Infrastructure Fund pays for this at a 25% discount.</p>}
                  {!can.ok && can.reason && <p className="mt-1 text-[13px] text-[#e08a7c]">{can.reason}</p>}
                </li>
              );
            })}
          </ul>
          {locked.length > 0 && (
            <p className="mt-3 text-[13px] leading-snug text-mute">
              <span className="label mr-1">Not yet possible</span>
              {locked.map((v) => `${v.name} (needs: ${v.opened})`).join(' · ')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- the record

function RecordPanel({ s }: { s: GameState }) {
  const r = recordOf(s);
  return (
    <div>
      <p className="label text-mute">Your record</p>
      <p className="mt-2 label text-[#7fc4a0]">Achievements · {r.wins.length}</p>
      {r.wins.length ? (
        <ul className="mt-1 space-y-1 text-sm leading-snug text-ivory/85">{r.wins.map((w) => <li key={w}>◆ {w}</li>)}</ul>
      ) : <p className="mt-1 text-sm italic text-mute">Nothing yet. Reforms and big bets are how this list grows.</p>}
      <p className="mt-3 label text-[#e08a7c]">Failures · {r.losses.length}</p>
      {r.losses.length ? (
        <ul className="mt-1 space-y-1 text-sm leading-snug text-ivory/85">{r.losses.map((w) => <li key={w}>✕ {w}</li>)}</ul>
      ) : <p className="mt-1 text-sm italic text-mute">None so far.</p>}
      {r.inForce.length > 0 && (
        <>
          <p className="mt-3 label text-mute">In force</p>
          <ul className="mt-1 space-y-1 text-sm leading-snug text-ivory/75">{r.inForce.map((w) => <li key={w}>{w}</li>)}</ul>
        </>
      )}
      {r.lasting.length > 0 && (
        <>
          <p className="mt-3 label text-mute">Permanent effects of what you built</p>
          <div className="mt-1"><Changes changes={r.lasting} dark /></div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- state of the nation

function NationModal({ s, dispatch, onClose }: { s: GameState; dispatch: Dispatch; onClose: () => void }) {
  const v = verdict(s);
  const left = movesLeft(s);
  const tone = (g: string) => (g === 'Transformed' || g === 'Stronger' ? 'text-state' : g === 'Held' ? 'text-ink-soft' : 'text-alarm');
  return (
    <Modal onClose={onClose} wide>
      <div className="paper p-5 sm:p-9">
        <p className="label text-state">State of the nation · {dateLabel(s.turn, s.startYear)}</p>
        <h2 className="mt-1 font-serif text-3xl">Against what you inherited</h2>
        <p className="mt-2 text-sm text-ink-soft">This is how history would grade you if you left office today. It is judged on change, not on where you started.</p>
        <ul className="mt-4 divide-y divide-ink/10">
          {v.dims.map((d) => (
            <li key={d.name} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5">
              <span className="font-serif text-lg">{d.name}</span>
              <span className="text-right">
                <span className={`font-serif text-lg ${tone(d.grade)}`}>{d.grade}</span>
                <span className="label block text-ink-soft">{d.from} → {d.to}</span>
              </span>
            </li>
          ))}
        </ul>

        <StatesTable s={s} dispatch={dispatch} left={left} />

        <h3 className="label mt-7 border-b rule pb-1 text-ink-soft">Security, theatre by theatre</h3>
        <p className="mt-2 text-sm leading-snug text-ink-soft">
          The security figure is these six problems added up. Each has its own cause and its own cost. You can concentrate the security effort on one: it improves steadily, and the other five get a little worse. Moving the forces costs a move and takes three months to change again.
        </p>
        <ul className="mt-3 space-y-3">
          {THEATRES.map((th) => {
            const threat = s.theatres[th.zone];
            const drift = theatreDrift(s, th.zone);
            const here = s.focus === th.zone;
            const can = canFocus(s, th.zone, left);
            return (
              <li key={th.zone} className={`border p-3 ${here ? 'border-state' : threat >= 70 ? 'border-alarm/50' : 'border-ink/20'}`}>
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-lg">{ZONE_NAME[th.zone]}: {th.name.toLowerCase()}</span>
                  <span className={`font-serif ${threat >= 60 ? 'text-alarm' : threat < 45 ? 'text-state' : ''}`}>{threatWord(threat)} · {Math.round(threat)}</span>
                </p>
                <div className="mt-1.5 h-1.5 bg-ink/10"><div className={`h-1.5 transition-all duration-700 ${threat >= 60 ? 'bg-alarm' : 'bg-honour'}`} style={{ width: `${threat}%` }} /></div>
                <p className="mt-1.5 text-sm leading-snug"><span className="label mr-1 text-ink-soft">Costs you</span>{th.costs}</p>
                <p className="mt-0.5 text-sm leading-snug text-ink-soft"><span className="label mr-1">What moves it</span>{th.driver}</p>
                <p className={`mt-1 text-[13px] ${drift.d > 0.05 ? 'text-alarm' : drift.d < -0.05 ? 'text-state' : 'text-ink-soft'}`}>
                  This month it is {drift.d > 0.05 ? 'getting worse' : drift.d < -0.05 ? 'improving' : 'holding'}{drift.why.length ? `: ${drift.why.join('; ').toLowerCase()}` : ''}.
                  {' '}Approval in the zone: {Math.round(s.zones[th.zone].approval)}%.
                </p>
                <button disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'FOCUS', zone: th.zone })}
                  className={`mt-2 border px-3 py-1.5 font-serif ${here ? 'border-state bg-state/10' : can.ok ? 'border-ink/30 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-45'}`}>
                  {here ? '✓ The security effort is concentrated here' : 'Concentrate the security effort here'}
                </button>
              </li>
            );
          })}
        </ul>
        {s.focus && (() => {
          const can = canFocus(s, null, left);
          return <button disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'FOCUS', zone: null })} className={`mt-3 border px-3 py-1.5 font-serif ${can.ok ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-45'}`}>Return forces to their usual stations</button>;
        })()}
        <CloseButton onClose={onClose} className="mt-8" />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- the drawer

const DRAWER: { op: DrawerOp; name: string; text: string }[] = [
  { op: 'security_vote', name: 'Draw this month\'s security vote', text: '₦4bn. Unaudited, unreceipted, undiscussed.' },
  { op: 'assembly', name: 'Logistics for the Assembly', text: 'The party warms. Every legislator who collects is a witness.' },
  { op: 'campaign', name: 'Move it to the campaign', text: 'A war chest with no new debts to financiers.' },
  { op: 'villa', name: 'Appreciate the Villa staff', text: 'Loyalty, while the money lasts.' },
];

function DrawerModal({ s, dispatch, onClose }: { s: GameState; dispatch: Dispatch; onClose: () => void }) {
  const witnesses = new Set(s.exposures.flatMap((x) => x.witnesses)).size;
  const sealed = s.archive.filter((a) => a.sealed).slice(-6).reverse();
  return (
    <Modal onClose={onClose}>
      <div className="border border-honour/30 bg-wood p-5 shadow-2xl sm:p-7">
        <p className="label text-honour">The left-hand drawer</p>
        <p className="mt-2 font-serif text-4xl text-ivory">₦{Math.round(s.purse)}bn</p>
        <p className="mt-1 text-sm text-mute">
          {s.exposures.length === 0
            ? 'Empty. Nobody knows anything, because there is nothing to know.'
            : `${witnesses} ${witnesses === 1 ? 'person knows' : 'people know'} something. Campaign chest: ₦${s.campaign.chest}bn.`}
        </p>
        <ul className="mt-5 space-y-2">
          {DRAWER.map((d) => {
            const can = canDrawer(s, d.op);
            return (
              <li key={d.op}>
                <button
                  disabled={!can.ok}
                  onClick={() => dispatch({ type: 'DRAWER', op: d.op })}
                  className={`w-full border px-4 py-3 text-left ${can.ok ? 'border-ivory/20 hover:border-honour' : 'border-ivory/10 opacity-45'}`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-lg text-ivory">{d.name}</span>
                    {DRAWER_COST[d.op] > 0 && <span className="label text-honour">₦{DRAWER_COST[d.op]}bn</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-mute">{can.ok ? d.text : can.reason}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {sealed.length > 0 && (
          <>
            <p className="label mt-6 text-mute">Not in the archive</p>
            <ul className="mt-2 space-y-1.5 text-sm text-ivory/75">
              {sealed.map((a) => <li key={a.id}><span className="label mr-2 text-mute">{dateLabel(a.turn, s.startYear)}</span>{a.headline}</li>)}
            </ul>
          </>
        )}
        <div className="mt-6 text-right"><button onClick={onClose} className="label text-honour">Close the drawer</button></div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- the archive

function ArchiveModal({ s, onClose }: { s: GameState; onClose: () => void }) {
  const entries = s.archive.filter((a) => !a.sealed);
  const years = [...new Set(entries.filter((a) => a.turn > 0).map((a) => yearOf(a.turn, s.startYear)))].sort((a, b) => b - a);
  const inherited = entries.filter((a) => a.turn <= 0);
  return (
    <Modal onClose={onClose} wide>
      <div className="paper p-5 sm:p-9">
        <p className="label text-state">The Presidential Archive</p>
        <h2 className="mt-1 font-serif text-3xl">What you did</h2>
        {years.map((y) => (
          <section key={y} className="mt-6">
            <h3 className="border-b rule pb-1 font-serif text-xl">{y}</h3>
            <ul className="mt-2 space-y-1.5">
              {entries.filter((a) => a.turn > 0 && yearOf(a.turn, s.startYear) === y).reverse().map((a) => (
                <li key={a.id} className="flex gap-3 leading-snug">
                  <span className="label w-20 shrink-0 pt-1 text-ink-soft">{dateLabel(a.turn, s.startYear).split(' ')[0].slice(0, 3)}</span>
                  <span className={`font-serif ${a.sig === 3 ? 'font-bold' : a.sig === 1 ? 'text-ink-soft' : ''}`}>
                    {a.sig === 3 && <span className="mr-1.5 text-honour">◆</span>}{a.headline}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="mt-6">
          <h3 className="border-b rule pb-1 font-serif text-xl text-ink-soft">What you inherited</h3>
          <ul className="mt-2 space-y-1.5 font-serif text-ink-soft">
            {inherited.map((a) => <li key={a.id}>{a.headline}</li>)}
          </ul>
        </section>
        <CloseButton onClose={onClose} className="mt-8" />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- the desk

function CapitalIncome({ s }: { s: GameState }) {
  const [open, setOpen] = useState(false);
  const inc = capitalIncome(s);
  const sign = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;
  return (
    <div className="mt-1.5">
      <button onClick={() => setOpen(!open)} className="text-left text-sm text-ivory/80 hover:text-ivory">
        <span className={inc.total >= 0 ? good(true) : bad(true)}>{sign(inc.total)}</span> a month <span className="label ml-1 text-honour/90">{open ? 'hide' : 'where from?'}</span>
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1 border-l border-ivory/15 pl-3">
          {inc.lines.map((l) => (
            <li key={l.label} className="text-[13px] leading-snug">
              <span className="flex justify-between gap-3"><span className="text-ivory/80">{l.label}</span><span className={l.value >= 0 ? good(true) : bad(true)}>{sign(l.value)}</span></span>
              <span className="block text-mute">{l.hint}</span>
            </li>
          ))}
          {inc.capped && <li className="text-[13px] text-mute">Above {CFG.pc.softCap} capital, income is halved: unused authority fades.</li>}
          <li className="text-[13px] text-mute">You can also raise it directly: see “Raising political capital” under the powers of the office.</li>
        </ul>
      )}
    </div>
  );
}

function Delta({ d, upIsGood, unit }: { d: number; upIsGood: boolean; unit: string }) {
  const tiny = unit === 'tn' ? 0.02 : 0.25;
  if (Math.abs(d) < tiny) return <span className="text-mute">—</span>;
  const isGood = d > 0 === upIsGood;
  const n = unit === 'tn' ? Math.abs(d).toFixed(2) : Math.abs(d) >= 10 ? Math.round(Math.abs(d)) : Math.abs(d).toFixed(1);
  return <span className={isGood ? good(true) : bad(true)}>{d > 0 ? '▲' : '▼'} {n}</span>;
}

type View = 'desk' | 'orders' | 'reforms' | 'power' | 'country' | 'treasury';

const NAV: [View, string, string][] = [
  ['desk', 'The desk', 'What happened, what needs deciding'],
  ['orders', 'Orders', 'The powers of the office'],
  ['reforms', 'Reforms and bets', 'The agenda and big bets'],
  ['power', 'Power', 'People, money, courts, rivals'],
  ['country', 'The country', 'Map, states, security, scorecard'],
  ['treasury', 'The Treasury', 'What is owed and saved'],
];

export function Desk({ s, dispatch, onQuit }: { s: GameState; dispatch: Dispatch; onQuit: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<View>('desk');
  const [powerTab, setPowerTab] = useState<string | undefined>(undefined);
  const [panel, setPanel] = useState<'drawer' | 'archive' | 'paper' | 'budget' | null>(null);
  const [preview, setPreview] = useState<Action | null>(null);

  const lead = s.desk.lead;
  const leadEvent = eventOf(s, lead) ?? null;
  const stop = blocked(s);
  const canEnd = !stop;
  const unanswered = s.desk.minors.filter((m) => !m.resolved).length + (lead && !lead.resolved ? 1 : 0);
  const drawerVisible = !!s.flags['drawer.open'] && !s.flags['drawer.sealed'];
  const left = movesLeft(s);
  const openItem = [lead, ...s.desk.minors].find((i) => i && i.eventId === open) ?? null;
  const openEvent = eventOf(s, openItem) ?? null;
  // Where the action being pointed at would leave things. Orders and people moves are deterministic enough to show.
  let next: GameState | null = null;
  try { next = preview ? applyAction(s, preview) : null; } catch { next = null; }
  if (next && next.lastAction === s.lastAction) next = null;
  const coming = upcoming(s);
  const go = (v: View, tab?: string) => { setView(v); if (v === 'power') setPowerTab(tab); setPreview(null); window.scrollTo({ top: 0 }); };
  const badge: Partial<Record<View, number>> = {
    desk: unanswered,
    orders: s.offers.filter((x) => x.since === s.turn).length,
    power: bench(s).seats.filter((j) => !j).length,
    treasury: s.budget.due ? 1 : 0,
  };

  return (
    <Preview.Provider value={{ action: preview, set: setPreview }}>
      <div className="flex min-h-screen">
        <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ivory/10 bg-pit/60 px-4 py-5 lg:flex">
          <p className="label text-honour">The Presidency</p>
          <p className="mt-1 font-serif text-xl leading-tight text-ivory">President {s.president.name}</p>
          <p className="label mt-1 text-mute">{s.president.partyShort} · {s.term === 1 ? 'First' : 'Second'} term</p>
          <ul className="mt-6 space-y-1">
            {NAV.map(([id, name, hint]) => (
              <li key={id}>
                <button onClick={() => go(id)} className={`w-full border-l-2 px-3 py-2 text-left ${view === id ? 'border-honour bg-ivory/5' : 'border-transparent hover:bg-ivory/5'}`}>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`font-serif text-lg ${view === id ? 'text-ivory' : 'text-ivory/75'}`}>{name}</span>
                    {badge[id] ? <span className="label rounded-full bg-alarm px-1.5 text-ivory">{badge[id]}</span> : null}
                  </span>
                  <span className="label block text-mute">{hint}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto space-y-1.5">
            <button onClick={() => setPanel('paper')} className="label block text-ivory/75 hover:text-ivory">This month&apos;s papers</button>
            <button onClick={() => setPanel('archive')} className="label block text-ivory/75 hover:text-ivory">The archive</button>
            {drawerVisible && <button onClick={() => setPanel('drawer')} className="label block text-honour/80 hover:text-honour">The drawer</button>}
            <button onClick={onQuit} className="label block text-mute hover:text-ivory">Leave the desk</button>
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          <StatusBar s={s} next={next} stop={stop} canEnd={canEnd} left={left} unanswered={unanswered}
            onEnd={() => { setOpen(null); setPreview(null); dispatch({ type: 'END_MONTH' }); }} />
          {/* Narrow screens keep a simple section switcher. */}
          <div className="flex gap-3 overflow-x-auto border-b border-ivory/10 px-4 py-2 lg:hidden">
            {NAV.map(([id, name]) => <button key={id} onClick={() => go(id)} className={`label shrink-0 ${view === id ? 'text-honour' : 'text-mute'}`}>{name}</button>)}
            <button onClick={() => setPanel('paper')} className="label shrink-0 text-mute">Papers</button>
            <button onClick={() => setPanel('archive')} className="label shrink-0 text-mute">Archive</button>
            {drawerVisible && <button onClick={() => setPanel('drawer')} className="label shrink-0 text-honour/80">Drawer</button>}
          </div>
          {coming.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-ivory/10 px-6 py-2.5">
              <span className="label self-center text-mute">Coming up</span>
              {coming.map((c, i) => (
                <button key={i} onClick={() => go(c.go, c.tab)}
                  className={`border px-2.5 py-1 text-left text-[13px] ${c.tone === 'bad' ? 'border-alarm/50 text-[#e8a597]' : c.tone === 'good' ? 'border-state-lit/50 text-[#9fd3b6]' : 'border-ivory/20 text-ivory/80'} hover:bg-ivory/5`}>
                  <span className="label mr-1.5 text-mute">{c.months <= 0 ? 'now' : `${c.months} mo`}</span>{c.text}
                </button>
              ))}
            </div>
          )}

          <main className="mx-auto max-w-[1500px] px-6 pb-16 pt-6">
            {view === 'desk' && (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_300px] lg:grid-cols-2">
                <section className="min-w-0 space-y-5">
                  <h2 className="label text-mute">The brief</h2>
                  <div className="border-l-2 border-honour/60 pl-4">
                    <p className="font-serif text-lg italic leading-snug text-ivory/90">“{s.desk.note}”</p>
                    <p className="label mt-1.5 text-mute">{s.chars.cos?.name}, Chief of Staff</p>
                  </div>
                  {s.lastAction && (
                    <div className="fade-in border border-ivory/10 p-4">
                      <p className="label text-mute">Just done</p>
                      <p className="mt-1 font-serif leading-relaxed text-ivory/85">{s.lastAction.text}</p>
                      <div className="mt-2"><Changes changes={s.lastAction.changes} dark /></div>
                    </div>
                  )}
                  {s.report.length > 0 ? (
                    <div>
                      <p className="label text-mute">Since last month</p>
                      <ul className="mt-2 space-y-2">
                        {s.report.map((r, i) => (
                          <li key={i} className={`border-l-2 bg-[#1a1d20] px-4 py-3 ${r.kind === 'reform' ? 'border-state-lit' : r.kind === 'failure' ? 'border-alarm' : 'border-honour'}`}>
                            <p className="font-serif text-lg leading-snug text-ivory">{r.title}</p>
                            {r.cause && <p className="text-sm text-mute">{r.kind === 'consequence' ? `Because of: ${r.cause}` : r.cause}</p>}
                            {r.text && <p className="mt-1 font-serif leading-snug text-ivory/80">{r.text}</p>}
                            <div className="mt-1.5"><Changes changes={r.changes} dark /></div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : <p className="font-serif italic text-ivory/60">Nothing you did last month has come back yet.</p>}
                </section>

                <section className="min-w-0 space-y-4">
                  <h2 className="label text-mute">To decide</h2>
                  {lead && leadEvent ? (
                    <button onClick={() => setOpen(lead.eventId)} className="paper slide-in block w-full p-5 text-left transition-transform hover:-translate-y-0.5 sm:p-6">
                      <span className="flex items-start justify-between gap-4">
                        <span className="label text-state">{fill(s, leadEvent.office)}</span>
                        {leadEvent.stamp && <span className={`stamp text-[10px] ${leadEvent.stamp === 'ROUTINE' ? 'text-ink-soft' : 'text-alarm'}`}>{leadEvent.stamp}</span>}
                      </span>
                      <span className="mt-3 block font-serif text-2xl leading-tight">{fill(s, leadEvent.title)}</span>
                      <span className="label mt-3 block text-ink-soft">{lead.resolved ? `Decided · ${lead.resolved.label}` : 'Open the file →'}</span>
                    </button>
                  ) : (
                    <p className="border border-dashed border-ivory/15 p-5 font-serif text-lg italic text-ivory/70">No crisis this month. The time is yours: use it.</p>
                  )}
                  {s.budget.due && (
                    <button onClick={() => setPanel('budget')} className="paper slide-in block w-full p-5 text-left transition-transform hover:-translate-y-0.5">
                      <span className="flex items-start justify-between gap-4">
                        <span className="label text-state">Budget Office of the Federation</span>
                        <span className="stamp text-[10px] text-alarm">FOR ASSENT</span>
                      </span>
                      <span className="mt-3 block font-serif text-2xl leading-tight">The Appropriation Bill, {yearOf(s.turn, s.startYear) + 1}</span>
                      <span className="mt-1 block text-sm text-ink-soft">What will oil sell for next year, and where does the money go? Nothing is released until you sign.</span>
                    </button>
                  )}
                  {s.desk.minors.length > 0 && (
                    <div>
                      <p className="label text-mute">The phone</p>
                      <ul className="mt-2 space-y-2">
                        {s.desk.minors.map((m) => {
                          const e = eventOf(s, m);
                          if (!e) return null;
                          return (
                            <li key={m.eventId}>
                              <button onClick={() => setOpen(m.eventId)} className="flex w-full items-center gap-3 rounded-2xl border border-ivory/10 bg-[#1c1f22] px-4 py-3 text-left hover:border-ivory/30">
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${m.resolved ? 'bg-ivory/20' : 'bg-state-lit'}`} />
                                <span className="min-w-0">
                                  <span className="label block text-mute">{fill(s, e.from ?? 'Message')}</span>
                                  <span className="block truncate font-serif text-ivory">{fill(s, e.title)}</span>
                                </span>
                                <span className="label ml-auto shrink-0 text-mute">{m.resolved ? 'Replied' : 'Unread'}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {activeShocks(s).map((x) => (
                    <div key={x.def.id} className={`border p-4 ${x.def.good ? 'border-state-lit/40 bg-state/5' : 'border-alarm/40 bg-alarm/5'}`}>
                      <p className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-serif text-xl text-ivory">{x.def.name}</span>
                        <span className="label text-mute">{x.left <= 1 ? 'Last month' : `${x.left} months left`}</span>
                      </p>
                      <p className={`mt-1 text-sm ${x.def.good ? 'text-state-lit' : 'text-alarm'}`}>{x.def.good ? `${Math.round(x.factor * 100)}% of it is being caught.` : `${Math.round(x.factor * 100)}% of it is being felt.`}</p>
                      <span className="mt-1 block"><Expected items={describe(x.fx)} dark label="Each month" /></span>
                      <ul className="mt-1.5 space-y-0.5 text-[13px]">
                        {x.met.map((g) => <li key={g.label} className="text-state-lit">✓ {g.label}</li>)}
                        {x.missing.map((g) => <li key={g.label} className="text-ivory/50">✗ {g.label}</li>)}
                      </ul>
                    </div>
                  ))}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button onClick={() => go('orders')} className="border border-honour/40 bg-honour/5 p-4 text-left hover:bg-honour/10">
                      <span className="block font-serif text-lg text-ivory">Give an order</span>
                      <span className="block text-sm text-mute">{s.offers.length} open this moment{badge.orders ? `, ${badge.orders} new` : ''}</span>
                    </button>
                    <button onClick={() => go('power')} className="border border-ivory/15 p-4 text-left hover:border-honour/60">
                      <span className="block font-serif text-lg text-ivory">Work on someone</span>
                      <span className="block text-sm text-mute">{PEOPLE.filter((p) => p.group === 'governor' && standing(s, p.id) >= 58).length} of 6 governors with you · Senate {senateLine(s).toLowerCase()}</span>
                    </button>
                  </div>
                </section>

                <aside className="min-w-0 space-y-5 lg:col-span-2 xl:col-span-1 xl:border-l xl:border-ivory/10 xl:pl-6">
                  <CountryColumn s={s} next={next} onCountry={() => go('country')} />
                </aside>
              </div>
            )}

            {view === 'orders' && <Inline.Provider value={true}><PowersModal s={s} dispatch={dispatch} onClose={() => {}} /></Inline.Provider>}
            {view === 'reforms' && <Agenda s={s} dispatch={dispatch} />}
            {view === 'power' && <Inline.Provider value={true}><PeopleModal key={powerTab ?? 'default'} s={s} dispatch={dispatch} onClose={() => {}} start={powerTab as never} /></Inline.Provider>}
            {view === 'country' && (
              <div className="space-y-6">
                <div className="paper p-6 xl:p-8">
                  <p className="label text-state">The country · {dateLabel(s.turn, s.startYear)}</p>
                  <h2 className="mt-1 mb-4 font-serif text-3xl">Where the votes are, and where the danger is</h2>
                  <StateMap s={s} />
                </div>
                <Inline.Provider value={true}><NationModal s={s} dispatch={dispatch} onClose={() => {}} /></Inline.Provider>
              </div>
            )}
            {view === 'treasury' && <Inline.Provider value={true}><TreasuryModal s={s} dispatch={dispatch} start="books" onClose={() => {}} onBudget={() => setPanel('budget')} /></Inline.Provider>}
          </main>
        </div>
      </div>

      {openItem && openEvent && (openEvent.slot === 'lead'
        ? <FileModal key={openItem.eventId} s={s} e={openEvent} item={openItem} dispatch={dispatch} onClose={() => setOpen(null)} />
        : <PhoneModal s={s} e={openEvent} item={openItem} dispatch={dispatch} onClose={() => setOpen(null)} />)}
      {panel === 'budget' && s.budget.due && <BudgetModal s={s} dispatch={dispatch} onClose={() => setPanel(null)} />}
      {panel === 'drawer' && <DrawerModal s={s} dispatch={dispatch} onClose={() => setPanel(null)} />}
      {panel === 'archive' && <ArchiveModal s={s} onClose={() => setPanel(null)} />}
      {panel === 'paper' && s.papers.length > 0 && s.phase === 'desk' && <Papers pages={s.papers} onDismiss={() => setPanel(null)} />}
    </Preview.Provider>
  );
}

/** Across the top of every section: the date, the four numbers that decide each month, and the month's end. Shows where a hovered action would leave them. */
function StatusBar({ s, next, stop, canEnd, left, unanswered, onEnd }: { s: GameState; next: GameState | null; stop: string | null; canEnd: boolean; left: number; unanswered: number; onEnd: () => void }) {
  const tt = termTurnOf(s.turn);
  const app = approval(s);
  const out = outlook(s);
  const showOutlook = s.term === 1 && !s.flags['ticket.lost'] && !s.election;
  const cell = (label: string, now: string, then: string | null, good: boolean | null, title?: string) => (
    <div title={title}>
      <p className="label text-mute">{label}</p>
      <p className="font-serif text-2xl leading-tight text-ivory">
        {now}
        {then !== null && then !== now && <span className={`ml-2 text-base ${good ? 'text-[#9fd3b6]' : 'text-[#e8a597]'}`}>→ {then}</span>}
      </p>
    </div>
  );
  const fs = (x: GameState) => (x.nation.fiscalSpace <= 0.01 ? 'Empty' : `₦${x.nation.fiscalSpace.toFixed(1)}tn`);
  return (
    <header className="sticky top-0 z-20 border-b border-ivory/10 bg-pit/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-6 py-3">
        <div className="mr-2">
          <p className="font-serif text-2xl leading-tight text-ivory">{dateLabel(s.turn, s.startYear)}</p>
          <p className="label text-mute">Month {tt} of 48 · {nextFixture(s)}</p>
        </div>
        {cell('Approval', `${Math.round(app)}%`, next ? `${Math.round(approval(next))}%` : null, next ? approval(next) >= app : null, 'Approval of the President')}
        {cell('Capital', `${Math.round(s.pc)}`, next ? `${Math.round(next.pc)}` : null, next ? next.pc >= s.pc : null, 'Political capital')}
        {cell('Treasury', fs(s), next ? fs(next) : null, next ? next.nation.fiscalSpace >= s.nation.fiscalSpace : null)}
        {cell('Moves', `${left} of ${movesTotal(s)}`, null, null)}
        {showOutlook && cell('Re-election', out.word, null, null, 'An estimate of the margin today. The mood on polling day can move it.')}
        <div className="ml-auto flex items-center gap-4">
          {canEnd && (unanswered > 0 || left > 0) && (
            <span className="label hidden text-mute xl:inline">{[left > 0 ? `${left} ${left === 1 ? 'move' : 'moves'} unused` : null, unanswered > 0 ? `${unanswered} unanswered` : null].filter(Boolean).join(' · ')}</span>
          )}
          <button disabled={!canEnd} onClick={onEnd} className={`px-5 py-2.5 font-serif text-lg ${canEnd ? 'bg-state text-ivory hover:bg-state-lit' : 'bg-ivory/10 text-ivory/40'}`}>
            {stop ?? 'End the month'}
          </button>
        </div>
      </div>
    </header>
  );
}

/** The country at a glance, on the desk: the gauges and the blocs, with where a hovered action would move them. */
function CountryColumn({ s, next, onCountry }: { s: GameState; next: GameState | null; onCountry: () => void }) {
  const g = gauges(s);
  const gn = next ? gauges(next) : null;
  const bn = next ? next.blocs : null;
  return (
    <>
      <div>
        <p className="label text-mute">Political capital</p>
        <div className="mt-1 h-1 bg-ivory/10"><div className="h-1 bg-honour transition-all duration-500" style={{ width: `${s.pc}%` }} /></div>
        <CapitalIncome s={s} />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <p className="label text-mute">The country</p>
          <button onClick={onCountry} className="label text-honour/90 hover:text-honour">Map and states →</button>
        </div>
        <ul className="mt-2 space-y-2">
          {g.map((x, i) => {
            const n = gn?.[i];
            const moved = n && n.value !== x.value;
            return (
              <li key={x.label}>
                <p className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-ivory/75">{x.label}</span>
                  <span className="font-serif text-ivory">{x.value}{moved && <span className="ml-1.5 text-honour">→ {n!.value}</span>} <span className="ml-1 text-xs"><Delta d={x.delta} upIsGood={x.upIsGood} unit={x.unit} /></span></span>
                </p>
                {x.bar !== undefined && (
                  <div className="relative mt-0.5 h-1 bg-ivory/10">
                    <div className={`h-1 transition-all duration-700 ${x.upIsGood ? 'bg-state-lit' : 'bg-alarm'}`} style={{ width: `${Math.max(2, Math.min(100, x.bar))}%` }} />
                    {moved && n!.bar !== undefined && <div className="absolute top-[-2px] h-2 w-0.5 bg-honour" style={{ left: `${Math.max(0, Math.min(100, n!.bar))}%` }} />}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="label text-mute">Who is with you</p>
        <ul className="mt-2 space-y-2">
          {blocView(s).map((b) => {
            const after = bn?.[b.id];
            const moved = after !== undefined && Math.round(after) !== Math.round(s.blocs[b.id]);
            return (
              <li key={b.id}>
                <p className="flex items-baseline justify-between">
                  <span className="text-sm text-ivory/75">{b.name}</span>
                  <span className={`font-serif ${b.mood === 'Breaking' ? 'text-[#e08a7c]' : 'text-ivory'}`}>{b.mood} <span className="text-mute">{b.trend}</span>{moved && <span className={`ml-1.5 text-sm ${after! > s.blocs[b.id] ? 'text-[#9fd3b6]' : 'text-[#e8a597]'}`}>{after! > s.blocs[b.id] ? '+' : ''}{Math.round(after! - s.blocs[b.id])}</span>}</span>
                </p>
                <div className="relative mt-0.5 h-1 bg-ivory/10">
                  <div className={`h-1 transition-all duration-700 ${s.blocs[b.id] < 20 ? 'bg-alarm' : 'bg-honour'}`} style={{ width: `${Math.max(2, s.blocs[b.id])}%` }} />
                  {moved && <div className="absolute top-[-2px] h-2 w-0.5 bg-ivory" style={{ left: `${Math.max(0, Math.min(100, after!))}%` }} />}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <RecordPanel s={s} />
    </>
  );
}

/** Every state: its voters, its zone's mood, what has been put there, and how it would vote today. Then the assets that run in them. */
function StatesTable({ s, dispatch, left }: { s: GameState; dispatch: Dispatch; left: number }) {
  const [sort, setSort] = useState<'margin' | 'voters' | 'zone'>('margin');
  const [mgr, setMgr] = useState<string | null>(null);
  const proj = runElection(structuredClone(s), s.term === 2 ? 'succession' : 'reelection', true);
  const rows = proj.states.map((r) => ({ ...r, margin: r.share - r.opp, local: local(s, r.id) }));
  rows.sort((a, b) => (sort === 'voters' ? b.voters - a.voters : sort === 'zone' ? a.zone.localeCompare(b.zone) || a.margin - b.margin : a.margin - b.margin));
  const won = rows.filter((r) => r.won).length;
  const mine = assets(s);
  return (
    <>
      <h3 className="label mt-7 border-b rule pb-1 text-ink-soft">The states</h3>
      <p className="mt-2 text-sm leading-snug text-ink-soft">
        How each state would vote if the {s.term === 2 ? 'succession election, with your backing as it stands,' : 'election'} were held today, without the mood on the day: {won} of 37 for {s.term === 2 ? 'your party' : 'you'}.
        {' '}Each is its zone's approval, its own lean, its governor, your rallies and what you have put there: a working asset lifts a state by 3 points of approval, one being built by 1, an abandoned site costs 2.
      </p>
      <div className="mt-2 flex gap-2 text-[13px]">
        <span className="label text-ink-soft">Sort</span>
        {(['margin', 'voters', 'zone'] as const).map((k) => (
          <button key={k} onClick={() => setSort(k)} className={`border px-2 py-0.5 ${sort === k ? 'border-state bg-state/10' : 'border-ink/20 hover:border-state'}`}>{k === 'margin' ? 'Closest first' : k === 'voters' ? 'Largest first' : 'By zone'}</button>
        ))}
      </div>
      <div className="mt-2 max-h-[28rem] overflow-y-auto border border-ink/15">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-paper-dim">
            <tr className="label text-ink-soft">
              <th className="px-2 py-1.5">State</th><th className="px-2">Zone</th><th className="px-2 text-right">Voters</th><th className="px-2 text-right">Zone approval</th><th className="px-2 text-right">Threat</th><th className="px-2">What is there</th><th className="px-2 text-right">Today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.map((r) => (
              <tr key={r.id} className={s.president.home === r.id ? 'bg-honour/10' : ''}>
                <td className="px-2 py-1.5 font-serif">{r.name}{s.president.home === r.id ? ' (home)' : ''}</td>
                <td className="px-2 text-ink-soft">{ZONE_NAME[r.zone]}</td>
                <td className="px-2 text-right tabular-nums">{r.voters.toFixed(1)}m</td>
                <td className="px-2 text-right tabular-nums">{Math.round(s.zones[r.zone].approval)}%</td>
                <td className={`px-2 text-right tabular-nums ${s.theatres[r.zone] >= 65 ? 'text-alarm' : ''}`}>{Math.round(s.theatres[r.zone])}</td>
                <td className="px-2 text-[13px] text-ink-soft">{r.local.items.map((x) => `${x.label} (${x.v > 0 ? '+' : ''}${x.v})`).join('; ')}</td>
                <td className={`px-2 text-right font-serif tabular-nums ${r.won ? 'text-state' : 'text-alarm'}`}>{r.margin > 0 ? '+' : ''}{r.margin.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mine.length > 0 && (
        <>
          <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">Assets: what your big bets built</h3>
          <ul className="mt-2 space-y-2">
            {mine.map((a) => {
              const perf = assetPerformance(s, a.id);
              const fiscal = assetFiscal(s, a.id);
              return (
                <li key={a.id} className="border border-ink/20 p-3">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-serif text-lg">{ASSETS[a.id].name}, {STATE_BY_ID[a.state].name}</span>
                    <span className={`label ${perf.captured ? 'text-alarm' : 'text-ink-soft'}`}>running at {Math.round(perf.k * 100)}%{perf.captured ? ' · captured' : ''}</span>
                  </p>
                  <p className="text-sm text-ink-soft">Managed by {a.head.name} since {dateLabel(a.since, s.startYear)}. {fiscal >= 0 ? 'Earns' : 'Costs'} {naira(Math.abs(fiscal) * 12)} a year.{perf.why.length ? ` ${perf.why.join('. ')}.` : ''}</p>
                  <Expected items={describe(assetFx(s, a.id).map(([t, x]) => [t, x * 12] as Fx))} label="A year" />
                  <button onClick={() => setMgr(mgr === a.id ? null : a.id)} className="label mt-1 text-state hover:underline">{mgr === a.id ? 'Close' : `Replace the manager · ${REHEAD_PC} capital`}</button>
                  {mgr === a.id && (
                    <ul className="mt-1 space-y-1">
                      {headsFor(s).filter((h) => h.name !== a.head.name).map((h) => {
                        const can = canSetManager(s, a.id, h.name, left);
                        return (
                          <li key={h.name}>
                            <button disabled={!can.ok} onClick={() => { dispatch({ type: 'SET_MANAGER', id: a.id, name: h.name }); setMgr(null); }}
                              className={`w-full border px-2 py-1 text-left text-sm ${can.ok ? 'border-ink/20 hover:border-state' : 'border-ink/10 opacity-50'}`}>
                              <span className="font-serif">{h.name}</span> <span className="text-ink-soft">· said to be {repWords(h.rep)}{h.blurb ? `. ${h.blurb}` : ''}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
