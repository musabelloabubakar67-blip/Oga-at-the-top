import { NAMES } from '../content/names';
import { PERSON_BY_ID, RIVAL_BY_ID } from '../content/people';
import { STATE_BY_ID } from '../content/states';
import { yearOf } from './config';
import type { Block, GameState } from './types';
import { delegates, test } from './vars';

function rival(s: GameState) {
  const id = Object.entries(s.opposition ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'alt';
  return RIVAL_BY_ID[id] ?? RIVAL_BY_ID.alt;
}

export function fill(s: GameState, text: string): string {
  return text.replace(/\{([A-Z_]+)\}/g, (m, key: string) => {
    switch (key) {
      case 'PRES': return `President ${s.president.name}`;
      case 'NAME': return s.president.name;
      case 'SIR': return s.president.address === 'ma' ? 'Ma' : 'Sir';
      case 'MRP': return s.president.address === 'ma' ? 'Madam President' : 'Mr President';
      case 'PARTY': return s.president.party;
      case 'PSHORT': return s.president.partyShort;
      case 'HOME': return STATE_BY_ID[s.president.home]?.name ?? 'home';
      case 'YEAR': return String(yearOf(s.turn));
      case 'OPP': return rival(s).name;
      case 'OPPARTY': return rival(s).party;
      case 'FIN': return s.chars.fin?.name ?? 'the Minister of Finance';
      case 'FINSHORT': return s.chars.fin?.short ?? 'the Minister';
      case 'COS': return s.chars.cos?.name ?? 'the Chief of Staff';
      case 'SAP': return s.chars.sap?.name ?? 'the Special Adviser';
      // Ministers are whoever holds the job now.
      case 'POWERMIN': return s.people.min_power?.name ?? PERSON_BY_ID.min_power.name;
      case 'WORKS': return s.people.min_works?.name ?? PERSON_BY_ID.min_works.name;
      case 'NSA': return s.people.min_defence?.name ?? PERSON_BY_ID.min_defence.name;
      case 'DELEGATES': return String(Math.round(delegates(s)));
      case 'OIL': return String(Math.round(s.oil.price));
      case 'BENCH': return String(s.budget.benchmark);
      case 'OUTPUT': return s.oil.output.toFixed(2);
      case 'BUDGETYEAR': return String(yearOf(s.turn) + 1);
      default: return NAMES[key] ?? m;
    }
  });
}

export function blocks(s: GameState, body: Block[]): string[] {
  const out: string[] = [];
  for (const b of body) {
    if (typeof b === 'string') out.push(fill(s, b));
    else if (test(s, b.when)) out.push(fill(s, b.text));
  }
  return out;
}

export function naira(tn: number): string {
  if (Math.abs(tn) >= 1) return `₦${tn.toFixed(1)}tn`;
  return `₦${Math.round(tn * 1000)}bn`;
}
