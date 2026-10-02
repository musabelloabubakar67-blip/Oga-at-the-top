import type { DebtId, FundId, SectorId } from '../engine/types';

// THE BOOKS
// What the country owes, where it keeps what it saves, and how the year's
// money is divided. Each debt names who is owed, what it costs while it stands,
// and what paying it does.

export interface DebtDef {
  id: DebtId;
  name: string;
  creditor: string;
  /** Interest-bearing debts add to debt service; arrears do their damage directly. */
  kind: 'bond' | 'arrears';
  /** Starting balance, ₦tn. */
  start: number;
  /** Points of debt service per ₦tn owed. Zero for arrears. */
  rate: number;
  blurb: string;
  /** What it costs while it stands. */
  harm: string;
  /** What paying it does. */
  cleared: string;
  /** Sizes of payment offered, ₦tn. Arrears can always be paid in full. */
  chunks: number[];
}

export const DEBTS: DebtDef[] = [
  {
    id: 'eurobond', name: 'Foreign bonds', creditor: 'Fund managers in London and New York', kind: 'bond', start: 5.7, rate: 4, chunks: [0.5, 1],
    blurb: 'Borrowed in dollars and repaid in dollars. The most expensive money the country owes.',
    harm: 'Costs more whenever inflation runs above 20%, because the naira buys fewer dollars. Falls due in lumps.',
    cleared: 'Each ₦1tn retired takes about 4 points off debt service: roughly ₦140bn a year back in the treasury, lower inflation and a calmer establishment.',
  },
  {
    id: 'bonds', name: 'Domestic bonds', creditor: 'The banks and the pension funds', kind: 'bond', start: 10, rate: 3, chunks: [0.5, 1],
    blurb: 'Where every deficit goes. Each month the treasury runs short, this grows by itself.',
    harm: 'Above ₦12tn the banks lend to government instead of to business, and jobs suffer for it.',
    cleared: 'Each ₦1tn retired takes 3 points off debt service: roughly ₦110bn a year back in the treasury.',
  },
  {
    id: 'ways', name: 'The central bank overdraft', creditor: 'The Central Bank', kind: 'bond', start: 4.8, rate: 2.5, chunks: [0.5, 1],
    blurb: 'Money the central bank created and lent to the government. Cheap to service. Paid for at the market.',
    harm: 'Every ₦1tn outstanding adds about 0.6 points to inflation for as long as it stands.',
    cleared: 'Paying it down lowers inflation directly. It can also be converted to long bonds: inflation falls, interest rises.',
  },
  {
    id: 'gas', name: 'Gas suppliers', creditor: 'The companies that supply gas to the power plants', kind: 'arrears', start: 0.7, rate: 0, chunks: [],
    blurb: 'The power plants exist. They stand idle because the gas has not been paid for.',
    harm: 'Power falls every month and the grid is likelier to collapse. It builds again, every month, until the electricity tariff covers the cost of supply.',
    cleared: 'Idle plants come back: power rises at once. This is the first reform on the power track.',
  },
  {
    id: 'contractors', name: 'Contractors', creditor: 'Firms that built roads and were never paid', kind: 'arrears', start: 1.2, rate: 0, chunks: [],
    blurb: 'Certificates issued for work done, some of them six years old. The sites they left are still there.',
    harm: 'Above ₦500bn, every building reform and big bet runs 15% slower and jobs fall each month, faster the more is owed. It grows whenever the treasury is empty.',
    cleared: 'Contractors return to site: jobs, state capacity and the establishment all improve, and building runs at full speed.',
  },
  {
    id: 'pensions', name: 'Pensions and salaries', creditor: 'Pensioners and federal workers', kind: 'arrears', start: 0.6, rate: 0, chunks: [],
    blurb: 'Pensions outstanding since the last administration. Some of the people owed have died waiting.',
    harm: 'Labour anger rises every month and the street cools, faster the more is owed. It grows whenever the treasury is empty.',
    cleared: 'Paid in full: the street warms, approval rises and labour anger falls sharply.',
  },
];

export const DEBT_BY_ID = Object.fromEntries(DEBTS.map((d) => [d.id, d])) as Record<DebtId, DebtDef>;

export interface FundDef {
  id: FundId;
  name: string;
  where: string;
  blurb: string;
  gives: string;
  costs: string;
}

export const FUNDS: FundDef[] = [
  {
    id: 'buffer', name: 'The stabilisation account', where: 'Central Bank, Abuja',
    blurb: 'Savings against a fall in the oil price. Oil earnings above the budget benchmark are paid in here automatically.',
    gives: 'Covers any shortfall before the government has to borrow. Earns nothing.',
    costs: 'Every governor can see it. Above ₦1.5tn they will demand that it be shared.',
  },
  {
    id: 'abroad', name: 'The Future Generations Fund', where: 'Held abroad, in dollars',
    blurb: 'A sovereign wealth fund invested in foreign bonds and shares, by managers the party cannot telephone.',
    gives: 'Grows about 7% a year, and by more when the naira is falling. Nobody at home can raid it.',
    costs: 'Money abroad while people are hungry: above ₦1tn it costs approval whenever cost-of-living pressure is high. Withdrawals unsettle the establishment.',
  },
  {
    id: 'infra', name: 'The Infrastructure Fund', where: 'Held at home, ring-fenced',
    blurb: 'Money set aside for building. Reforms and big bets that build things draw on it first.',
    gives: 'Pays for power, roads, industry and farming reforms at a 25% discount, because contractors are paid on time.',
    costs: 'Earns nothing. If integrity is below 30, about 1% of it disappears every month.',
  },
  {
    id: 'growth', name: 'The Growth Portfolio', where: 'Start-ups, a foreign refinery stake, and things the Finance Minister cannot explain',
    blurb: 'The risky one. Stakes in companies at home and abroad, chosen by people who are paid on results.',
    gives: 'Judged once a year. Most years it returns 5% to 22%.',
    costs: 'About one year in seven it loses 30%, and the loss is announced in the newspapers.',
  },
];

export const FUND_BY_ID = Object.fromEntries(FUNDS.map((f) => [f.id, f])) as Record<FundId, FundDef>;

export interface SectorDef {
  id: SectorId;
  name: string;
  /** Points in last year's budget, which is what happens if nothing changes. */
  usual: number;
  max: number;
  more: string;
  less: string;
}

/** How the year's discretionary money is divided. Each point above or below the usual shifts the sector for twelve months. */
export const SECTORS: SectorDef[] = [
  { id: 'security', name: 'Defence and policing', usual: 2, max: 5, more: 'Every theatre improves a little each month.', less: 'Every theatre worsens a little each month.' },
  { id: 'power', name: 'Power, roads and works', usual: 2, max: 5, more: 'Power and jobs rise each month.', less: 'Power and jobs decay faster.' },
  { id: 'people', name: 'Health and schools', usual: 2, max: 5, more: 'The street warms and labour anger eases.', less: 'The street cools and labour anger builds.' },
  { id: 'agric', name: 'Farming and food', usual: 1, max: 4, more: 'Food prices pull inflation down.', less: 'Food prices push inflation up.' },
  { id: 'debt', name: 'Paying down debt', usual: 0, max: 4, more: 'Retires ₦240bn of domestic bonds over the year for each point.', less: '' },
  { id: 'padding', name: 'Legislators\' constituency projects', usual: 3, max: 6, more: 'Your senators warm to you every month. Integrity suffers.', less: 'The Appropriations chairman will resent every point he does not get, and may hold the budget up.' },
];

export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map((x) => [x.id, x])) as Record<SectorId, SectorDef>;

/** The oil price the budget can assume. A bolder assumption gives more to spend and more to lose. */
export const BENCHMARKS: { price: number; name: string; points: number; blurb: string }[] = [
  { price: 60, name: 'Cautious', points: 8, blurb: 'Less to spend. Almost any price leaves a surplus, which is saved.' },
  { price: 70, name: 'Central', points: 10, blurb: 'What the forecasters expect. The budget you inherited assumed this.' },
  { price: 80, name: 'Hopeful', points: 12, blurb: 'More to spend. If oil sells below it, the gap comes out of the treasury every month.' },
  { price: 90, name: 'Reckless', points: 14, blurb: 'A great deal more to spend, on an assumption that has been right about one year in five.' },
];
