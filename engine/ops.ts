import { consumeFavour, offsetFavours, bindFavours } from './favour-ledger';
import { closeRequest, openRequest } from './requests';
import { setMinisterTarget } from './commitments';
import { release } from './talent';
import { transferSavedFund, type FundDestination } from './fund-transfers';
import { reformName } from './reforms';
// Operations an outcome can run when a number is not enough: paying a named
// debt, granting what someone wants, moving a fund, rescuing a bet.

import { weaken } from './attacks';
import { backSuccessor, candidate } from './successor';
import { MILESTONE_BY_ID } from '../content/agenda';
import { FINANCE_CANDIDATES } from '../content/names';
import { currentWant } from './wants';
import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { DEBT_BY_ID, FUND_BY_ID } from '../content/treasury';
import { TYCOON_BY_ID } from '../content/tycoons';
import { VENTURE_BY_ID } from '../content/ventures';
import { delay, rescue, rescueCost } from './bets';
import { charge } from './cases';
import { tycoonDeal, who } from './favours';
import { addOwed } from './ledger';
import { addMark, deal, replaceMinister } from './people';
import { naira } from './text';
import { pay } from './treasury';
import { pledge, pledgeOp, pledgeOptions } from './promises';
import type { DebtId, FundId, GameState, Op2, ZoneId } from './types';
import { clamp, favoursOwed, favoursOwing } from './vars';

const group = (s: GameState, g: 'governor' | 'senator', d: number) => {
  for (const p of PEOPLE) {
    const st = s.people[p.id];
    if (p.group === g && st && !st.gone) st.rel = clamp(st.rel + d, 0, 100);
  }
};

/** Runs one operation. Returns extra text for the result, if any. */
export function runOp(s: GameState, op: Op2): string {
  const [name, a, b, c] = op;
  switch (name) {
    case 'target': setMinisterTarget(s, String(a), Number(b), c === undefined ? 10 : Number(c)); return 'A dated ministerial target is recorded for review.';
    case 'paydebt': {
      const id = a as DebtId;
      return pay(s, id, s.debts[id] * Number(b ?? 1));
    }
    case 'notes': {
      const id = a as DebtId;
      const amount = s.debts[id];
      addOwed(s, id, -amount);
      addOwed(s, 'bonds', amount);
      return '';
    }
    case 'grant': {
      const id = String(a);
      if (TYCOON_BY_ID[id]) return s.tycoons[id]?.granted ? '' : tycoonDeal(s, id, 'grant').text;
      if (PERSON_BY_ID[id] && currentWant(s, id)) {
        const out = deal(s, id, 'grant').text;
        // What was given settles what was owed.
        const debt = favoursOwing(s, id)[0];
        const credit = s.favours.find((f) => f.who === id && f.dir === 'owed' && f.turn === s.turn);
        if (debt && credit) offsetFavours(s, debt.id, credit.id);
        return out;
      }
      return '';
    }
    case 'pledgewant': {
      const id = String(a);
      const o = pledgeOptions(s, id, 99).find((x) => x.kind === 'want');
      return o?.ok ? pledge(s, id, 'want', undefined, o.text, o.months) : '';
    }
    case 'honour': case 'breakp': case 'settlep':
      return pledgeOp(s, name, String(a));
    case 'settle': {
      const debt = favoursOwing(s, String(a))[0];
      if (debt) consumeFavour(s, debt.id, debt.size, 'settled', 'Repayment agreed in a decision');
      return '';
    }
    case 'grow': {
      const debt = favoursOwing(s, String(a))[0];
      if (debt) { const before = debt.size; debt.size = Math.min(3, debt.size + 1); debt.turn = s.turn; if (debt.size !== before) delete debt.disputedAt; }
      return '';
    }
    case 'void': {
      const credit = favoursOwed(s, String(a))[0];
      if (credit) consumeFavour(s, credit.id, credit.size, 'used', 'Called in on a written decision');
      return '';
    }
    case 'repudiate': {
      const debt = favoursOwing(s, String(a))[0];
      if (!debt) return '';
      bindFavours(s); debt.disputedAt = s.turn;
      const object = 'repay-favour:' + debt.id;
      const terms = { description: 'Strength ' + debt.size };
      const previous = Object.values(s.governance!.requests).filter((r) => r.object === object && r.requester === debt.counterpart).at(-1);
      const id = 'debt-demand.' + s.governance!.administrationId + '.' + debt.id + '.' + s.turn + '.' + debt.size;
      if (!previous || previous.terms?.description !== terms.description) {
        openRequest(s, { id, requester: { person: debt.counterpart! }, object, text: 'Repay the outstanding favour: ' + debt.why, terms, previous: previous?.id, changedBy: previous ? 'threat' : undefined });
        closeRequest(s, id, 'refused', 'The President declined repayment. The underlying debt remains owed.');
      }
      return 'The demand is refused. The underlying debt is still owed.';
    }
    case 'backer': {
      // The campaign's financier: warm or cool them, and optionally close the account.
      const id = String(s.flags.financier);
      if (s.tycoons[id]) s.tycoons[id].rel = clamp(s.tycoons[id].rel + Number(a), 0, 100);
      if (b === 'settle') { const debt = favoursOwing(s, id)[0]; if (debt) consumeFavour(s, debt.id, debt.size, 'settled', 'Repayment agreed in a decision'); }
      return '';
    }
    case 'deliver': {
      const id = String(a);
      if (!s.agenda.done.includes(id)) { s.agenda.active = s.agenda.active.filter((x) => x.id !== id); s.agenda.done.push(id); s.counters[`done.${id}`] = s.turn; }
      return '';
    }
    case 'spendall':
      // Everything owed to the President is called in at once.
      for (const f of favoursOwed(s)) consumeFavour(s, f.id, f.size, 'used', 'Called all debts in on a decision');
      return '';
    case 'governors': group(s, 'governor', Number(a)); return '';
    case 'senators': group(s, 'senator', Number(a)); return '';
    case 'fundmove': {
      const moved = transferSavedFund(s, a as FundId, b as FundDestination, Number(c ?? 1));
      if (moved.to === 'currency') return `The auction sold $${moved.dollars!.toFixed(3)}bn from the sovereign fund at ₦${Math.round(moved.rate!)} per dollar, buying ${naira(moved.naira)}. This was an intervention, not money available for the federal budget.`;
      return '';
    }
    case 'betrescue': s.counters[`trouble.${a}`] = s.turn; return rescue(s, String(a));
    case 'betdelay': s.counters[`trouble.${a}`] = s.turn; return delay(s, String(a));
    case 'betseen': s.counters[`trouble.${a}`] = s.turn; return '';
    case 'vpbrief': if (s.vp) { s.vp.portfolio = s.turn; s.vp.sidelined = false; } return '';
    case 'charge': charge(s, String(a), String(b), Number(c ?? 0)); return '';
    case 'sack': return replaceMinister(s, String(a), b === 'party' ? 'party' : 'technocrat').text;
    case 'finleave': {
      // The Finance Minister goes. The next is whichever of the other candidates is still available.
      const old = s.chars.fin;
      const next = FINANCE_CANDIDATES.find((c) => c.name !== old?.name);
      if (!next) return '';
      if (old) release(s, old.name);
      s.chars.fin = { ...next, rel: 40, notes: [] };
      s.chars.fin.patron = next.patron ?? 'president';
      s.chars.fin.rep = next.rep ?? { competence: next.competence, loyalty: next.loyalty };
      s.flags['fin.replaced'] = true;
      return '';
    }
    case 'forgive': s.wronged = (s.wronged ?? []).filter((w) => w.who !== String(a)); return '';
    case 'weaken': return weaken(s, String(a), Number(b ?? 0.5));
    case 'backsucc': return backSuccessor(s, String(a));
    case 'succadj': s.flags['succession.strength'] = Number(s.flags['succession.strength'] ?? 0) + Number(a); return '';
    case 'mark': addMark(s, String(a), Number(b), String(c ?? '')); return '';
    case 'seen': s.flags[`dirty.${a}.${s.people[String(a)]?.name ?? ''}`] = true; return '';
    case 'lean': {
      const st = s.people[String(a)];
      if (st) { st.compliantUntil = s.turn + 8; st.rel = clamp(st.rel - 18, 0, 100); }
      return '';
    }
    case 'story':
      if (!s.stories.some((x) => x.id === a)) s.stories.push({ id: String(a), about: b ? String(b) : undefined, stage: 0, next: s.turn + 1 });
      return '';
    case 'storyend':
      s.stories = a ? s.stories.filter((x) => x.id !== a) : s.stories.slice(1);
      return '';
    case 'focus': s.focus = (a as ZoneId) ?? null; s.counters.focusTurn = s.turn; return '';
    case 'defect': {
      const st = s.people[String(a)];
      if (st) { st.gone = true; s.favours = s.favours.filter((f) => f.who !== a); }
      return '';
    }
  }
  return '';
}

/** What an operation will do, in words, for the list of options. */
export function opText(s: GameState, op: Op2): string | null {
  const [name, a, b, c] = op;
  switch (name) {
    case 'paydebt': {
      const id = a as DebtId;
      const amount = s.debts[id] * Number(b ?? 1);
      return `Pays ${naira(amount)} to ${DEBT_BY_ID[id].creditor.toLowerCase()}${Number(b ?? 1) >= 1 ? ', clearing it' : ''}`;
    }
    case 'notes': return `Turns ${naira(s.debts[a as DebtId])} of ${a === 'ways' ? 'the overdraft' : 'arrears'} into bonds: debt service rises`;
    case 'grant': {
      const id = String(a);
      const w = who(s, id);
      const want = TYCOON_BY_ID[id]?.want ?? currentWant(s, id) ?? PERSON_BY_ID[id]?.want;
      if (!want) return null;
      const cost = [want.pc ? `${want.pc} capital` : '', want.naira ? naira(want.naira) : ''].filter(Boolean).join(', ');
      return `${w.short} gets what was asked${cost ? ` (${cost})` : ''}: ${want.text.replace(/\.$/, '').toLowerCase()}`;
    }
    case 'settle': return `Settles what you owe ${who(s, String(a)).short}`;
    case 'grow': return `What you owe ${who(s, String(a)).short} grows`;
    case 'void': return `Spends one favour owed by ${who(s, String(a)).short}; what you owe stays owed`;
    case 'repudiate': return 'Refuses repayment; the underlying debt remains outstanding';
    case 'backer': {
      const w = who(s, String(s.flags.financier));
      return b === 'settle' ? `Settles what you owe ${w.short}` : `${w.short} ${Number(a) > 0 ? 'is pleased' : 'will not forget it'}`;
    }
    case 'deliver': return MILESTONE_BY_ID[String(a)] ? `Counts as delivering the reform: ${reformName(s, String(a))}` : null;
    case 'spendall': return 'Every favour you are owed is spent';
    case 'governors': return `All your governors ${Number(a) > 0 ? 'warm to you' : 'cool towards you'}`;
    case 'senators': return `All your senators ${Number(a) > 0 ? 'warm to you' : 'cool towards you'}`;
    case 'fundmove': {
      const from = a as FundId;
      const amount = s.funds[from] * Number(c ?? 1);
      const to = b === 'treasury' ? 'the treasury' : b === 'states' ? 'the states' : b === 'currency' ? 'a central-bank foreign-exchange auction' : FUND_BY_ID[b as FundId]?.name ?? '';
      return `${naira(amount)} leaves ${FUND_BY_ID[from].name} for ${to}`;
    }
    case 'betrescue': {
      const v = VENTURE_BY_ID[String(a)];
      return v ? `Costs ${naira(rescueCost(v))} and 3 capital. Odds of "${v.name}" improve by 12 points` : null;
    }
    case 'betdelay': return 'The opening is put back, giving you time to fix what is wrong';
    case 'vpbrief': return 'The Vice President is given the economic council for two years';
    case 'charge': return `${String(a) === 'pred' ? 'Your predecessor' : who(s, String(a)).name} is charged: the case goes to trial, and you can follow it`;
    case 'sack': return `${who(s, String(a)).name} is replaced by a ${b === 'party' ? 'party nominee' : 'technocrat'}`;
    case 'finleave': return 'The Finance Minister leaves the government';
    case 'forgive': return `${who(s, String(a)).short} lets the grievance go`;
    case 'weaken': { const m = MILESTONE_BY_ID[String(a)]?.m; return m ? (Number(b) <= 0 ? `The reform stands: ${reformName(s, m.id)}` : Number(b) >= 1 ? `Repeals the reform: ${reformName(s, m.id)}. Part of what it delivered is lost and it can be passed again` : `Weakens the reform: ${reformName(s, m.id)}. ${Math.round(Number(b) * 100)}% of what it delivered is lost`) : null; }
    case 'backsucc': { const c = candidate(s, String(a)); return `${c.name} becomes your candidate: ${c.strength >= 0 ? '+' : ''}${c.strength} to the party's share; loyalty to you ${c.loyalty}`; }
    case 'succadj': return `Your candidate's standing ${Number(a) >= 0 ? 'rises' : 'falls'} by ${Math.abs(Number(a))}`;
    case 'lean': return `${who(s, String(a)).short} obeys for eight months and resents it for longer`;
    case 'storyend': return 'The newspaper series against you ends';
    case 'defect': return `${who(s, String(a)).short} leaves your party`;
  }
  return null;
}
