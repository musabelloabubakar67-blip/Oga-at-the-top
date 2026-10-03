// Life after office. Immunity ends at noon on the last day. What happens next
// depends on what can be found, who wants to find it, and who is in a position
// to stop them: the successor you backed and how they feel about you, the
// rivals you wronged, the bench you appointed, the bill you passed, the money
// you moved. It can end well. It can end very badly.

import { RIVALS } from '../content/people';
import { benchVars } from './courts';
import { strongestRival } from './people';
import { grievances } from './targets';
import type { GameState } from './types';
import { approval } from './vars';

export type AfterKind = 'statesman' | 'quiet' | 'harassed' | 'protected' | 'investigated' | 'trial' | 'prison' | 'exile';

export interface After { kind: AfterKind; title: string; text: string; risk: string[]; shield: string[]; bad: boolean }

export function afterOffice(s: GameState): After {
  const ending = s.ending ?? 'term_limit';
  const kept = s.purseTaken.personal;
  const political = s.purseTaken.political;
  const trail = s.exposures.reduce((a, x) => a + x.trail, 0);
  const witnesses = new Set(s.exposures.flatMap((x) => x.witnesses)).size;
  const ally = ending === 'term_limit' && !!s.flags['succession.won'];
  const loyalty = Number(s.flags['successor.loyalty'] ?? 35);
  const sIntegrity = Number(s.flags['successor.integrity'] ?? 3);
  const sName = String(s.flags['successor.name'] ?? 'your successor');
  // What matters is whether whoever now holds power is someone you used the state against.
  const winner = RIVALS.find((r) => r.id === strongestRival(s).id);
  const wronged = winner ? grievances(s, winner.id).length : 0;
  const bench = benchVars(s);
  const app = approval(s);

  const risk: string[] = [];
  const shield: string[] = [];
  let r = 0;
  if (kept >= 5) { r += 2 * Math.sqrt(kept / 10); risk.push(`₦${Math.round(kept)}bn you kept for yourself`); }
  if (political >= 20) { r += Math.min(2, political / 60); risk.push(`₦${Math.round(political)}bn in political money that passed through your hands`); }
  if (trail >= 3) { r += Math.min(3, trail / 10); risk.push(`A paper trail (${trail})`); }
  if (witnesses >= 2) { r += Math.min(2, witnesses * 0.15); risk.push(`${witnesses} people who know and could testify`); }
  if (ending === 'removed') { r += 2; risk.push('You were removed, and the record of the removal is evidence'); }
  if (wronged && !ally && winner) { r += Math.min(2, wronged); risk.push(`${winner.name}, whom you used the state against ${wronged === 1 ? 'once' : `${wronged} times`}, is now in a position to return the favour`); }

  let p = 0;
  if (ally) {
    let k = loyalty / 25;
    if (sIntegrity >= 4 && kept >= 40 && loyalty < 75) { k /= 2; shield.push(`${sName} owes you the Villa but is honest, and what you took is too much to overlook (loyalty ${loyalty})`); }
    else shield.push(`${sName} holds the Villa and owes it to you (loyalty ${loyalty})`);
    p += k;
  } else if (ending === 'term_limit' || ending === 'defeated') risk.push('The other side holds the Villa');
  if (bench.loyal >= 2) { p += bench.loyal * 0.4; shield.push(`${bench.loyal} justices you appointed`); }
  if (s.flags['exit.immunity']) { const k = ally ? 2.5 : 1; p += k; shield.push(ally ? 'The immunity law you passed' : 'The immunity law you passed, which the new government is already trying to repeal'); }
  if (app >= 55) { p += 1; shield.push(`You leave popular (${Math.round(app)}%): prosecuting you would cost them`); }
  const owed = s.favours.filter((f) => f.dir === 'owed').length;
  if (owed >= 2) { p += Math.min(2, owed * 0.2); shield.push(`${owed} people who still owe you`); }

  const net = r - p;
  const clean = kept < 5 && trail < 3;
  const out = (kind: AfterKind, title: string, text: string, bad = false): After => ({ kind, title, text, risk, shield, bad });

  if (clean) {
    if (wronged >= 2 && !ally) return out('harassed', 'Harassed', 'There is nothing to find, so the new government looks for it anyway. An inquiry into your use of the security services sits for two years. Your passport is held for eleven months. Nothing comes of it, slowly.');
    if (app >= 50 || ending === 'term_limit') return out('statesman', 'Elder statesman', 'You chair election observer missions abroad and are consulted, occasionally, at home. Your memoir sells well in airports. Nobody can find anything, because there is nothing to find.');
    return out('quiet', 'A quiet retirement', 'You go home. The telephone rings less each month. It is, everyone agrees, a dignified way to be forgotten.');
  }
  if (net <= 0) return out('protected', 'Protected', 'The files exist. Everyone who matters knows where they are. Nobody opens them, and as long as the people protecting you stay where they are, nobody will.');
  if (net <= 2.5) return out('investigated', 'Investigated', 'The anti-corruption agency invites you for "a chat" that lasts nine hours. Your accounts are frozen for a year. The case is adjourned, and adjourned, and adjourned. You are never convicted. You are never quite cleared.', true);
  if (s.flags['exit.abroad']) return out('exile', 'Exile', 'You leave for a medical check-up abroad a week after the handover and do not come back. The money you moved is enough. The extradition request is renewed every year. You watch the news from home on a satellite dish.', true);
  if (net <= 6) return out('trial', 'On trial', 'You are charged on forty counts. The trial runs for three years, through two judges and a pandemic of adjournments. You spend it under house arrest in the home you built, which the prosecution lists as Exhibit 12.', true);
  return out('prison', 'Prison', 'You are arrested at your home at dawn, a month after the handover, by officers you once reviewed on parade. The trial is short. The sentence is not. Your successor says the law must take its course.', true);
}
