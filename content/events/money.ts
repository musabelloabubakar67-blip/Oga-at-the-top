import type { GameEvent } from '../../engine/types';

// WHEN THE MONEY RUNS OUT (plan 11)
// The salary crisis: the account cannot meet a payroll, and every way out has a
// timing and a cost. Bridging finance is owed; a sale is not cash until it
// settles; deferring salaries is a debt to the people who work for the state.
// The Treasury's "Raising money" view shows every measure with its proceeds,
// timing, conditions and what it leaves behind.

export const MONEY_FILES: GameEvent[] = [
  {
    id: 'treasury.payroll', kind: 'recurring', slot: 'lead', category: 'economy', tone: 'grave', intensity: 4, topic: 'money',
    when: { all: [{ v: ['nation.fiscalSpace', '<', 0.05] }, { v: ['fund.buffer', '<', 0.1] }, { turn: [3] }] }, cooldown: 10, max: 3, weight: 40,
    office: 'Office of the Accountant-General of the Federation', stamp: 'URGENT',
    title: 'Salaries are due on Friday, and the account cannot pay them',
    body: [
      'The federal payroll is ₦300bn this month. The treasury holds less than ₦50bn, and the stabilisation account is empty.',
      'The Accountant-General needs an instruction by Wednesday. Every option on the page arrives at a different time.',
      { when: { v: ['nation.debt', '>=', 100] }, text: 'At this level of debt service, nobody in the market will lend. The central bank can, and the Governor has said in writing what it will cost.' },
      { when: { v: ['count.treasury.payroll', '>=', 2] }, text: 'This is not the first payroll the account has failed to meet. The unions have the dates of the last one.' },
    ],
    reads: [
      { role: 'fin', good: 'Pay this month from a short loan and put something on the market to repay it, {SIR}. Deferring salaries is borrowing from the poorest creditors we have.', weak: 'Ask the central bank, {SIR}. It is only this month.' },
      { role: 'cos', good: 'Whatever you choose, tell the workers before the papers do.' },
    ],
    choices: [
      {
        id: 'bridge', label: 'Pay on time from a bridging loan, and put the idle property on the market to repay it', pc: 4,
        requires: { all: [{ v: ['nation.debt', '<', 100] }, { v: ['holding.federal_properties', '>', 0.5] }] }, locked: 'Nobody will lend at this debt service, or there is no idle property left to sell.',
        outcomes: [{
          result: 'Salaries are paid on Friday. The bridging loan is signed at a premium, and an expedited sale of the idle federal property begins; it will repay the loan when it settles next month, if the bidders hold.',
          fx: [['nation.fiscalSpace', 0.3], ['debt.bonds', 0.33], ['bloc.establishment', -1]],
          ops: [['sell', 'federal_properties', 'expedited', 1]],
          news: ['SALARIES PAID AS FG ARRANGES BRIDGING LOAN, SELLS PROPERTY', 'SALARY DON ENTER. DEM BORROW, DEM SELL HOUSE'],
          archive: 'Met a payroll with a bridging loan and an expedited property sale.', sig: 2,
        }],
      },
      {
        id: 'overdraft', label: 'Have the central bank advance the money',
        outcomes: [{
          result: 'The Governor complies in writing. Salaries are paid on Friday with money created on Thursday. The papers do the arithmetic within the week.',
          fx: [['nation.fiscalSpace', 0.3], ['debt.ways', 0.3], ['bloc.establishment', -4]],
          news: ['CENTRAL BANK FUNDS FEDERAL PAYROLL', 'DEM PRINT MONEY TO PAY SALARY'],
          archive: 'Paid salaries with a central bank advance.', sig: 2,
        }],
      },
      {
        id: 'cut', label: 'Pay salaries by stopping capital releases for the quarter',
        outcomes: [{
          result: 'Salaries are paid. Every capital project stops for three months. The contractors go home and the sites fill with grass.',
          fx: [['nation.fiscalSpace', 0.3], ['nation.power', -2], ['nation.jobs', -2], ['debt.contractors', 0.15], ['bloc.party', -2]],
          news: ['FG HALTS CAPITAL SPENDING TO PAY SALARIES', 'PROJECT DON STOP. SALARY DON PAY'],
          archive: 'Stopped capital spending for a quarter to meet the payroll.', sig: 2,
        }],
      },
      {
        id: 'defer', label: 'Pay half now and the rest "within the month"',
        outcomes: [{
          result: 'Half the payroll goes out. The other half becomes a debt to federal workers, with a date nobody believes. The unions call an emergency meeting.',
          fx: [['debt.pensions', 0.15], ['pressure.wageGrievance', 12], ['bloc.street', -4], ['approval', -2]],
          news: ['FEDERAL WORKERS PAID HALF SALARIES', 'HALF SALARY. THE REST "SOON"'],
          archive: 'Paid half the federal payroll and owed the rest.', sig: 2,
        }],
      },
    ],
  },
];
