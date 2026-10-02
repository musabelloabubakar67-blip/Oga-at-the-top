// Operations an outcome can run when a number is not enough: paying a named
// debt, granting what someone wants, moving a fund, rescuing a bet.

import { MILESTONE_BY_ID } from '../content/agenda';
import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { DEBT_BY_ID, FUND_BY_ID } from '../content/treasury';
import { TYCOON_BY_ID } from '../content/tycoons';
import { VENTURE_BY_ID } from '../content/ventures';
import { delay, rescue, rescueCost } from './bets';
import { tycoonDeal, who } from './favours';
import { addOwed } from './ledger';
import { addMark, deal, replaceMinister } from './people';
import { naira } from './text';
import { pay } from './treasury';
import type { DebtId, FundId, GameState, Op2, ZoneId } from './types';
import { clamp, favoursOwing } from './vars';

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
      if (PERSON_BY_ID[id] && !s.people[id]?.granted && PERSON_BY_ID[id].want) {
        const out = deal(s, id, 'grant').text;
        // What was given settles what was owed.
        const debt = favoursOwing(s, id)[0];
        if (debt) s.favours = s.favours.filter((f) => f.id !== debt.id && !(f.who === id && f.dir === 'owed' && f.turn === s.turn));
        return out;
      }
      return '';
    }
    case 'settle': {
      const debt = favoursOwing(s, String(a))[0];
      if (debt) s.favours = s.favours.filter((f) => f.id !== debt.id);
      return '';
    }
    case 'grow': {
      const debt = favoursOwing(s, String(a))[0];
      if (debt) { debt.size = Math.min(3, debt.size + 1); debt.turn = s.turn; }
      return '';
    }
    case 'void':
      s.favours = s.favours.filter((f) => f.who !== String(a));
      return '';
    case 'backer': {
      // The campaign's financier: warm or cool them, and optionally close the account.
      const id = String(s.flags.financier);
      if (s.tycoons[id]) s.tycoons[id].rel = clamp(s.tycoons[id].rel + Number(a), 0, 100);
      if (b === 'settle') { const debt = favoursOwing(s, id)[0]; if (debt) s.favours = s.favours.filter((f) => f.id !== debt.id); }
      return '';
    }
    case 'deliver': {
      const id = String(a);
      if (!s.agenda.done.includes(id)) { s.agenda.active = s.agenda.active.filter((x) => x.id !== id); s.agenda.done.push(id); }
      return '';
    }
    case 'spendall':
      // Everything owed to the President is called in at once.
      s.favours = s.favours.filter((f) => f.dir !== 'owed');
      return '';
    case 'governors': group(s, 'governor', Number(a)); return '';
    case 'senators': group(s, 'senator', Number(a)); return '';
    case 'fundmove': {
      const from = a as FundId;
      const amount = s.funds[from] * Number(c ?? 1);
      s.funds[from] = Math.max(0, s.funds[from] - amount);
      if (b === 'treasury') s.nation.fiscalSpace += amount;
      else if (b !== 'states' && s.funds[b as FundId] !== undefined) s.funds[b as FundId] += amount;
      return '';
    }
    case 'betrescue': s.counters[`trouble.${a}`] = s.turn; return rescue(s, String(a));
    case 'betdelay': s.counters[`trouble.${a}`] = s.turn; return delay(s, String(a));
    case 'betseen': s.counters[`trouble.${a}`] = s.turn; return '';
    case 'sack': return replaceMinister(s, String(a), b === 'party' ? 'party' : 'technocrat').text;
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
      const want = TYCOON_BY_ID[id]?.want ?? PERSON_BY_ID[id]?.want;
      if (!want) return null;
      const cost = [want.pc ? `${want.pc} capital` : '', want.naira ? naira(want.naira) : ''].filter(Boolean).join(', ');
      return `${w.short} gets what was asked${cost ? ` (${cost})` : ''}: ${want.text.replace(/\.$/, '').toLowerCase()}`;
    }
    case 'settle': return `Settles what you owe ${who(s, String(a)).short}`;
    case 'grow': return `What you owe ${who(s, String(a)).short} grows`;
    case 'void': return `${who(s, String(a)).short} no longer owes you, or is owed, anything`;
    case 'backer': {
      const w = who(s, String(s.flags.financier));
      return b === 'settle' ? `Settles what you owe ${w.short}` : `${w.short} ${Number(a) > 0 ? 'is pleased' : 'will not forget it'}`;
    }
    case 'deliver': return MILESTONE_BY_ID[String(a)] ? `Counts as delivering the reform: ${MILESTONE_BY_ID[String(a)].m.name}` : null;
    case 'spendall': return 'Every favour you are owed is spent';
    case 'governors': return `All your governors ${Number(a) > 0 ? 'warm to you' : 'cool towards you'}`;
    case 'senators': return `All your senators ${Number(a) > 0 ? 'warm to you' : 'cool towards you'}`;
    case 'fundmove': {
      const from = a as FundId;
      const amount = s.funds[from] * Number(c ?? 1);
      const to = b === 'treasury' ? 'the treasury' : b === 'states' ? 'the states' : FUND_BY_ID[b as FundId]?.name ?? '';
      return `${naira(amount)} leaves ${FUND_BY_ID[from].name} for ${to}`;
    }
    case 'betrescue': {
      const v = VENTURE_BY_ID[String(a)];
      return v ? `Costs ${naira(rescueCost(v))} and 3 capital. Odds of "${v.name}" improve by 12 points` : null;
    }
    case 'betdelay': return 'The opening is put back, giving you time to fix what is wrong';
    case 'sack': return `${who(s, String(a)).name} is replaced by a ${b === 'party' ? 'party nominee' : 'technocrat'}`;
    case 'lean': return `${who(s, String(a)).short} obeys for eight months and resents it for longer`;
    case 'storyend': return 'The newspaper series against you ends';
    case 'defect': return `${who(s, String(a)).short} leaves your party`;
  }
  return null;
}
