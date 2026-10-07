import { FINANCE_CANDIDATES } from '../content/names';
import { applyAction, newGame } from '../engine/reduce';
import { fiscalFlow } from '../engine/treasury';
import { revenueAnnual, interestAnnual } from '../engine/accounts';
import type { GameState } from '../engine/types';
let s: GameState = newGame({ seed: 5, scenario: 'standard', name: 'P', party: 'P', partyShort: 'P', home: 'KN', background: 'governor', address: 'sir', finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] } as any);
s.phase = 'desk';
for (let i = 0; i <= 48; i++) {
  if (i % 6 === 0) {
    const f = fiscalFlow(s);
    console.log(`m${s.turn} svc ${s.nation.debt.toFixed(0)} cash ${s.nation.fiscalSpace.toFixed(2)} flow ${f.total.toFixed(3)} rev ${revenueAnnual(s).toFixed(1)} int ${interestAnnual(s).toFixed(2)} bonds ${s.debts.bonds.toFixed(1)} ways ${s.debts.ways.toFixed(1)} euro ${s.debts.eurobond.toFixed(1)} arrears ${(s.debts.contractors + s.debts.pensions + s.debts.gas).toFixed(1)} oil ${s.oil.price.toFixed(0)} infl ${s.nation.inflation.toFixed(0)}`);
    if (i === 0) for (const l of f.lines) console.log('   ', l.label, (l as any).value?.toFixed?.(3));
  }
  s.phase = 'desk'; s.desk.lead = null; s.desk.minors = []; s.budget.due = false; (s as any).night = undefined; s.budget.pending = undefined as any; s.desk.actionsUsed = 0;
  s = applyAction(s, { type: 'END_MONTH' });
  if (s.phase === 'verdict') break;
}
