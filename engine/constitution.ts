// AUTHORITY AND THE CONSTITUTION (plan 04.A5, 04.A6)
// What kind of act each presidential decision is: an executive order the
// President can simply make, a law the Assembly must pass, a constitutional
// amendment that needs two thirds and the states, a federal bargain with the
// governors, or a decision that belongs to an independent body. And the rules
// that delivered reforms and settled clauses put in force: they bind this
// President and every successor until they are changed by the same process.

import { MILESTONE_BY_ID } from '../content/agenda';
import type { GameState } from './types';

export type Authority = 'executive' | 'legislative' | 'constitutional' | 'federal' | 'independent';
export const AUTHORITY_NAME: Record<Authority, string> = {
  executive: 'An executive decision: the President can make it',
  legislative: 'A law: the Assembly must pass it',
  constitutional: 'A constitutional amendment: two thirds of the Senate and the state assemblies',
  federal: 'A federal bargain: the governors must agree to it',
  independent: 'A decision for an independent body',
};

/** What kind of act a reform is, read from what it needs and whom it binds. */
export function reformAuthority(id: string): Authority {
  const m = MILESTONE_BY_ID[id]?.m;
  if (!m) return 'executive';
  const need = m.needs && 'v' in m.needs ? m.needs.v : null;
  if (need && need[0] === 'senate' && Number(need[2]) >= 56) return 'constitutional';
  if (need && need[0] === 'senate') return 'legislative';
  if ([...(m.start ?? []), ...m.done].some(([t]) => t === 'bloc.party' || t.startsWith('person.gov')) && /state|governor/i.test(`${m.name} ${m.blurb}`)) return 'federal';
  return 'executive';
}

export interface Rule {
  id: string;
  name: string;
  /** What it does, as a rule the next President inherits. */
  text: string;
  /** Changing it needs an amendment, not just a decision. */
  entrenched: boolean;
  /** Where it came from. */
  source: string;
}

/** The rules in force now, from delivered reforms and settled clauses. */
export function rules(s: GameState): Rule[] {
  const done = (id: string) => s.agenda.done.includes(id);
  const out: Rule[] = [];
  if (done('t4')) out.push({ id: 'debtceiling', name: 'The debt ceiling', text: 'No emergency borrowing once debt service reaches 90% of revenue.', entrenched: false, source: 'The fiscal responsibility law' });
  if (done('c9')) out.push({ id: 'watchdogs', name: 'Watchdog heads chosen by a panel', text: 'The heads of the anti-corruption agency, the statistics bureau and the projects regulator can be replaced only with the Senate\'s consent.', entrenched: false, source: 'Independent appointments for the watchdogs' });
  if (done('c4')) out.push({ id: 'prosecutor', name: 'An independent prosecutor', text: 'The President cannot ask for a case to be dropped; the prosecutor decides.', entrenched: false, source: 'The independent prosecutor\'s office' });
  if (s.flags['constitution.clause'] === 'courts') out.push({ id: 'judicial', name: 'Judges chosen by a commission', text: 'The President may nominate only from the commission\'s list: no friends of the President.', entrenched: true, source: 'The new constitution' });
  if (s.flags['constitution.clause'] === 'devolve') out.push({ id: 'devolve', name: 'Fiscal autonomy for the states', text: 'The states keep a larger share of every surplus.', entrenched: true, source: 'The new constitution' });
  if (s.flags['constitution.clause'] === 'recall') out.push({ id: 'recall', name: 'Recall of legislators', text: 'Senators who ignore their districts can be recalled; the Senate listens to its voters more than to the Villa.', entrenched: true, source: 'The new constitution' });
  if (done('s4')) out.push({ id: 'statepolice', name: 'State police', text: 'The states have their own police. Abolishing them needs another amendment.', entrenched: true, source: 'The state police amendment' });
  if (done('t5')) out.push({ id: 'revenue', name: 'States that collect, keep', text: 'The revenue formula rewards collection. Changing it needs two thirds of the Senate.', entrenched: true, source: 'The new revenue formula' });
  if (s.flags['diaspora.vote']) out.push({ id: 'diaspora', name: 'The diaspora vote', text: 'Nigerians abroad vote in every federal election.', entrenched: false, source: 'The diaspora bet' });
  return out;
}

export const ruleInForce = (s: GameState, id: string) => rules(s).some((r) => r.id === id);

/** Why a reform cannot be undone by decision: it is entrenched in the constitution. */
export function entrenchedReform(s: GameState, id: string): string | null {
  if (id === 's4' && ruleInForce(s, 'statepolice')) return 'State police are in the Constitution: undoing them needs another amendment.';
  if (id === 't5' && ruleInForce(s, 'revenue')) return 'The revenue formula is entrenched: changing it needs two thirds of the Senate.';
  return null;
}
