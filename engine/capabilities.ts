import { CONTRACT_VERSION } from './contracts';
import { clockOf } from './governance';
import { syncDebt } from './ledger';
import { hasCapability } from './recruitment';
import type { Choice, DebtId, GameEvent, GameState } from './types';

const need = (id: string) => ({ v: [id, '==', 1] as [string, '==', number] });
/** A signed creditor agreement changes coupons, not the face value of principal. */
export function negotiateDebt(s: GameState, mode: string): string {
  if (!hasCapability(s, 'cap.debt_restructuring')) throw new Error('Debt negotiation capability is not active');
  const now = clockOf(s), terms = s.debtTerms ??= {};
  if (mode === 'roll') {
    if (s.debts.eurobond < 1.5) throw new Error('No matching maturing bond');
    const share = 1.5 / s.debts.eurobond;
    terms.eurobond = { rateFactor: (terms.eurobond?.rateFactor ?? 1) * (1 - 0.08 * share), at: now.worldMonth, administrationId: now.administrationId };
  } else if (mode === 'portfolio') {
    for (const id of ['eurobond', 'bonds'] as DebtId[]) if (s.debts[id] > 0) terms[id] = { rateFactor: Math.max(0.55, (terms[id]?.rateFactor ?? 1) * 0.82), at: now.worldMonth, administrationId: now.administrationId };
    s.flags['crisis.last'] = 'negotiated';
  } else throw new Error('Unknown creditor negotiation');
  syncDebt(s);
  return 'Creditors signed the revised coupons. Principal remains owed in full; this is not recorded as a default. The signed terms survive the negotiator leaving office.';
}
export function gridDiagnosis(s: GameState): 'gas' | 'transmission' | 'tariff' {
  return s.debts.gas > 0.6 ? 'gas' : !s.agenda.done.includes('p2') ? 'transmission' : 'tariff';
}
/** Read-only additions: the source event and the dice are never changed. */
export function withCapabilities(s: GameState, source: GameEvent): GameEvent {
  let out = source;
  const add = (choice: Choice, line?: string) => { out = { ...out, choices: [...out.choices, choice], ...(line ? { body: [...out.body, line] } : {}) }; };
  if (source.id === 'debt.crisis' && hasCapability(s, 'cap.debt_restructuring')) add({
    id: 'expert.restructure', label: 'Use the debt team to negotiate revised coupons without a default', pc: 8, naira: 0.12, requires: need('cap.debt_restructuring'),
    outcomes: [{ result: 'The debt team secures creditor consent before announcing the exchange. Domestic and foreign bond coupons fall by 18%, with a floor of 55% of their original level. The principal is still owed; the treasury paid ₦120bn in negotiation and transaction costs.', fx: [['bloc.establishment', 4]], ops: [['negotiatedebt', 'portfolio']],
      news: ['CREDITORS ACCEPT CONSENSUAL DEBT EXCHANGE; NO DEFAULT', 'DEBT STILL DEY. THE INTEREST DON COME DOWN'], archive: 'Negotiated lower bond coupons with creditor consent, without reducing principal or defaulting.', sig: 3 }],
  }, 'The appointed debt team has a creditor-consented exchange ready. It costs ₦120bn to execute, and leaves the face value of the debt unchanged.');
  if (['debt.maturity', 'debt.eurobond'].includes(source.id) && hasCapability(s, 'cap.debt_restructuring')) add({
    id: 'expert.refinance', label: 'Let the debt team refinance the ₦1.5tn maturity on negotiated terms', naira: 0.06,
    requires: { all: [need('cap.debt_restructuring'), { v: ['nation.debt', '<', 90] }, { v: ['debt.eurobond', '>=', 1.5] }] }, locked: 'The debt team still needs a lender and a matching maturity.',
    outcomes: [{ result: 'A ₦1.5tn replacement bond redeems the ₦1.5tn maturity. Principal is unchanged, its coupon is 8% lower, and the treasury pays a ₦60bn transaction fee. The portfolio coupon records only the share that was refinanced.', fx: [['bloc.establishment', 2]], ops: [['negotiatedebt', 'roll']], flags: { 'maturity.rolled': true },
      news: ['DEBT TEAM REFINANCES EUROBOND AT LOWER COUPON', 'WE BORROW TO PAY OLD DEBT. THIS ONE COSTS LESS'], archive: 'Refinanced a maturing bond at a lower coupon with the debt team.', sig: 2 }],
  });
  if (['grid.collapse', 'shock.blackout'].includes(source.id) && hasCapability(s, 'cap.grid_diagnostics')) {
    const cause = gridDiagnosis(s), gas = cause === 'gas', cost = gas ? s.debts.gas : cause === 'transmission' ? 0.18 : 0.06;
    add({ id: 'expert.remedy', label: gas ? `Follow the engineers: clear ₦${Math.round(cost * 1000)}bn of gas arrears` : cause === 'transmission' ? 'Follow the engineers: repair the identified transmission fault' : 'Follow the engineers: repair the collection and dispatch shortfall',
      naira: cost, requires: need('cap.grid_diagnostics'), outcomes: [{
        result: gas ? 'The identified constraint was gas deliveries withheld over unpaid invoices. The treasury clears those invoices in full, the plants resume gas supply, and the engineers stabilise the grid.' : cause === 'transmission' ? 'The engineers isolate the failing transmission corridor, replace the protection equipment and restore dispatch. The work is targeted; it does not replace the national corridor programme.' : 'The engineers find a collection and dispatch shortfall, secure the payments needed to keep plants supplying, and restore the operating reserve.',
        fx: [['nation.power', 6], ...(gas ? [['debt.gas', -cost] as [string, number]] : [])],
        flags: { 'grid.diagnosis': cause, ...(source.id === 'shock.blackout' ? { 'shock.blackout': 'engineers' } : {}) },
        news: ['ENGINEERS IDENTIFY GRID FAILURE AND IMPLEMENT MATCHED REMEDY', 'ENGINEERS FIND THE FAULT. LIGHT DEY RETURN'], archive: `Funded the grid team's remedy for the diagnosed ${cause} constraint.`, sig: 2,
      }] }, `The appointed grid team diagnoses ${cause === 'gas' ? 'unpaid gas deliveries' : cause === 'transmission' ? 'a transmission failure' : 'a collection and dispatch shortfall'} on the day and identifies the matching remedy. Paying for a different remedy will not remove this constraint.`);
  }
  if (['uni.ultimatum', 'uni.strike', 'uni.tranche'].includes(source.id) && hasCapability(s, 'cap.university_settlement') && !s.flags['uni.negotiated']) {
    const id = `uni.negotiated.${clockOf(s).administrationId}`;
    add({ id: 'expert.settlement', label: 'Accept the mediator’s protected-budget settlement: ₦75bn now, ₦150bn in twelve months', naira: 0.075,
      requires: { all: [need('cap.university_settlement'), { not: { flag: 'uni.negotiated' } }] },
      outcomes: [{ result: 'The union signs a ₦225bn settlement with audited delivery and a protected health-and-schools allocation. ₦75bn is paid now; the remaining ₦150bn is due in twelve months. Teaching resumes without another strike notice. The balance is a dated public commitment the union can inspect.',
        fx: [['bloc.street', 4], ['pressure.wageGrievance', -6]], flags: { 'uni.agreement': 'phased', 'uni.negotiated': true },
        domain: { version: CONTRACT_VERSION, effects: [{ type: 'commitment.open', id, responsible: { office: 'min_service' }, object: 'negotiated-university-balance', text: 'Pay the ₦150bn balance under the protected-budget university settlement.', afterMonths: 12, visibility: 'public', resources: { naira: 0.15 } }] },
        follow: [{ event: 'uni.negotiated.balance', after: 12 }], news: ['UNION SIGNS MEDIATED UNIVERSITY SETTLEMENT', 'LECTURERS SIGN A TIMETABLE WITH MONEY AND A PROTECTED BUDGET'], archive: 'Paid the first tranche of a negotiated ₦225bn university settlement and committed to its balance.', sig: 3,
      }] });
  }
  return out;
}
