import type { GameState, Milestone } from '../engine/types';

// WHO PAYS, AND HOW THE MONEY IS SPENT (plan 10)
// The old "Fix the Treasury" track mixed two different jobs. Taxation is who
// pays and how it is collected: its reforms widen or narrow the base, put the
// burden on someone, cost something to administer and are resented by the
// people who pay. The Treasury is how collected money is budgeted, released,
// borrowed and accounted for: its reforms make releases predictable, budgets
// credible, arrears fewer, procurement visible and borrowing cheaper.
//
// A country can be good at one and bad at the other. Money collected by a
// state that cannot spend it is lost on the way to the project; a disciplined
// treasury with a narrow tax base runs on very little. Both are visible in the
// Treasury's books (engine/fiscal-system.ts).
//
// Rival answers close each other: VAT or excise; property or income; audit
// the rich or offer them an amnesty; abolish the holidays or put them under
// rules; levy the traders or register them; cut the rates or chase collection;
// one revenue service or states that collect and keep.

type M = Milestone;
const g1 = (m: Omit<M, 'gen'>): M => ({ ...m, gen: 1 });
const g2 = (m: Omit<M, 'gen'>): M => ({ ...m, gen: 2 });
const g3 = (m: Omit<M, 'gen'>): M => ({ ...m, gen: 3 });
const SENATE = { needs: { v: ['senate', '>=', 50] as [string, '>=', number] }, needsText: 'You do not have the Senate. Win over your senators first.' };
const done = (s: GameState, id: string) => s.agenda.done.includes(id);

/** Who carries a tax. Every burden has a constituency that feels it each month. */
export type Burden = 'poor' | 'workers' | 'traders' | 'business' | 'wealthy' | 'importers';

/** What a reform does to the tax system (base, burden, cost to run) or to spending discipline. */
export interface FiscalProfile {
  /** Points of tax base: how much of what is owed is actually assessed and collected. */
  base?: number;
  /** Who pays it. */
  burden?: Burden;
  /** ₦tn a month it costs to administer. */
  admin?: number;
  /** Points of spending discipline: releases on time, budgets believed, arrears and procurement controlled. */
  discipline?: number;
}

export const FISCAL_PROFILE: Record<string, FiscalProfile> = {
  // Taxation
  t1: { base: 12, admin: 0.002, burden: 'traders' },
  t3: { base: 8, burden: 'importers' },
  t5: { base: 6 },
  x1: { base: 10, burden: 'poor' },
  x2: { base: 4, burden: 'wealthy' },
  x3: { base: 8, burden: 'wealthy', admin: 0.002 },
  x4: { base: 8, burden: 'workers' },
  x5: { base: 6, burden: 'wealthy', admin: 0.001 },
  x6: { base: 5, burden: 'business' },
  x7: { base: 3 },
  x8: { base: 10, burden: 'traders', admin: 0.001 },
  x9: { base: 4 },
  x10: { base: 8 },
  x11: { base: 6, burden: 'business', admin: 0.002 },
  x12: { base: 10, admin: 0.003 },
  x13: { base: 3 },
  // The Treasury
  y1: { discipline: 12 },
  t2: { discipline: 8 },
  t4: { discipline: 10 },
  t6: { discipline: 6 },
  t7: { discipline: 10 },
  t8: { discipline: 5 },
  t9: { discipline: 6 },
  t10: { discipline: 4 },
  t11: { discipline: 4 },
  y2: { discipline: 10 },
  y3: { discipline: 10 },
  y4: { discipline: 6 },
};

/** What each burden does every month while the tax stands, and who feels it. */
export const BURDEN: Record<Burden, { label: string; who: string; fx: [string, number][] }> = {
  poor: { label: 'Paid by the poor', who: 'Households, in the price of what they buy', fx: [['bloc.street', -0.05], ['pressure.wageGrievance', 0.04]] },
  workers: { label: 'Paid by salaried workers', who: 'Employees, out of every payslip', fx: [['pressure.wageGrievance', 0.05]] },
  traders: { label: 'Paid by small traders', who: 'Market women, artisans and shopkeepers', fx: [['bloc.street', -0.04], ['nation.jobs', -0.008]] },
  business: { label: 'Paid by companies', who: 'Firms, out of what they would invest', fx: [['bloc.establishment', -0.03], ['nation.jobs', -0.01]] },
  wealthy: { label: 'Paid by the wealthy', who: 'The richest households and their companies', fx: [['bloc.establishment', -0.04], ['bloc.street', 0.02]] },
  importers: { label: 'Paid by importers', who: 'Importers, and in the end their customers', fx: [['nation.inflation', 0.01]] },
};

/** The taxation track. Its foundations come from the old Treasury track; the rest are rival answers. */
export const TAX_TRACK_HEAD = { id: 'tax', name: 'Who Pays', goal: 'A tax base that is broad, collected and fair', metric: 'fiscal.base' };

export const TAX_REFORMS: M[] = [
  g2({ id: 'x1', name: 'Raise VAT, with food and medicine exempt', pc: 12, naira: 0, months: 4, excludes: ['x2'],
    lasting: 'A large, cheap tax to collect. The poor pay a larger share of what they spend than the rich do: hardship and the street feel it every month.',
    blurb: 'The cheapest tax to collect and the hardest to hide from. Everyone pays it, in proportion to what they spend, which is most of what the poor have.',
    start: [['bloc.street', -5], ['approval', -2]], during: [['nation.inflation', 0.3]], duringText: 'Prices rise the week the new rate takes effect.',
    done: [['bonus.fiscal', 0.035], ['nation.inflation', 1.5]],
    news: ['VAT RISES; FOOD AND MEDICINE EXEMPT', 'VAT DON GO UP. BREAD NO CHANGE, OTHER THINGS DON COST'], archive: 'Raised VAT, exempting food and medicine.' }),
  g2({ id: 'x2', name: 'Excise on luxuries, alcohol, tobacco and sugar; VAT held', pc: 8, naira: 0, months: 4, excludes: ['x1'],
    lasting: 'Raises less than VAT would. What it raises comes from those who buy the things it taxes, most of them comfortable.',
    blurb: 'Tax the second car, the champagne, the cigarettes and the soft drinks. Less money than a VAT rise, and less anger.',
    start: [['tycoon.ty_trade', -4]],
    done: [['bonus.fiscal', 0.015], ['approval', 1]],
    news: ['NEW EXCISE ON LUXURIES, DRINKS AND TOBACCO', 'BIG MAN CHAMPAGNE DON COST'], archive: 'Introduced excise on luxuries, alcohol, tobacco and sugar, and held VAT.' }),
  g2({ id: 'x3', name: 'A property tax, collected with the states from a land register', pc: 10, naira: 0.3, months: 12, excludes: ['x4'],
    needs: { v: ['nation.capacity', '>=', 40] }, needsText: 'It needs a land register, and a state capable of keeping one (capacity 40).',
    lasting: 'Property cannot leave the country to avoid it. The owners of empty mansions pay; the register costs money to keep.',
    blurb: 'Value every building in the cities, and send the bill to the owner. The houses that stand empty in the capital are owned by people who pay no other tax.',
    start: [['bloc.establishment', -4], ['bloc.party', -2]],
    done: [['bonus.fiscal', 0.02], ['nation.capacity', 2], ['bloc.street', 2]],
    news: ['PROPERTY TAX BILLS SENT TO 400,000 CITY OWNERS', 'MANSION OWNERS DON SEE BILL'], archive: 'Introduced a property tax collected with the states.' }),
  g2({ id: 'x4', name: 'Enforce income tax on high earners through their employers and banks', pc: 10, naira: 0, months: 6, excludes: ['x3'],
    lasting: 'More is collected through payslips. Salaried workers, who already paid, pay more reliably; those paid in cash still do not.',
    blurb: 'Employers deduct, banks report, and the revenue service matches the two. The salaried pay; the self-employed rich still mostly do not.',
    start: [['bloc.establishment', -3], ['pressure.wageGrievance', 4]],
    done: [['bonus.fiscal', 0.025], ['nation.capacity', 1]],
    news: ['BANKS TO REPORT HIGH EARNERS TO TAX SERVICE', 'BANK GO TELL TAX PEOPLE WETIN YOU GET'], archive: 'Enforced income tax on high earners through employers and banks.' }),
  g2({ id: 'x5', name: 'A high-net-worth unit: audit the two thousand richest', pc: 14, naira: 0.05, months: 6, excludes: ['x13'],
    lasting: 'The richest are assessed on what they own, not what they declare. The businessmen resent it, and remember who did it.',
    blurb: 'Two thousand people own most of what is untaxed. Forty auditors, the asset registers and the bank records, and no exemptions for friends.',
    start: [['tycoon.ty_trade', -6], ['tycoon.ty_bank', -6], ['tycoon.ty_fuel', -6], ['bloc.establishment', -4]],
    done: [['bonus.fiscal', 0.02], ['nation.integrity', 3], ['bloc.street', 4]],
    news: ['TAX SERVICE AUDITS THE COUNTRY\'S 2,000 RICHEST', 'BIG MEN DEY RUN FROM TAX AUDIT'], archive: 'Set up a high-net-worth unit to audit the richest.' }),
  g2({ id: 'x13', name: 'A voluntary disclosure amnesty for undeclared wealth', pc: 6, naira: 0, months: 4, excludes: ['x5'],
    lasting: 'Some money comes in quickly, once. Everyone who paid on time learns that waiting was cheaper.',
    blurb: 'Declare what you hid, pay a reduced rate, and nobody asks where it came from. Cash now; a lesson about compliance for ever.',
    done: [['nation.fiscalSpace', 0.4], ['bonus.fiscal', 0.008], ['nation.integrity', -2], ['tycoon.ty_trade', 4], ['tycoon.ty_bank', 4]],
    news: ['TAX AMNESTY RAISES ₦400BN; CRITICS CALL IT A REWARD', 'DECLARE YOUR MONEY, NO WAHALA. NA AMNESTY'], archive: 'Offered an amnesty for undeclared wealth.' }),
  g2({ id: 'x6', name: 'Abolish the tax holidays', pc: 10, naira: 0, months: 3, excludes: ['x7'],
    lasting: 'Every company pays. Some investments that came for the holiday leave with it.',
    blurb: 'Three hundred companies pay no company tax under "pioneer status", some for twenty years. End it, for all of them.',
    start: [['tycoon.ty_maker', -8], ['bloc.establishment', -3]],
    done: [['bonus.fiscal', 0.02], ['nation.jobs', -2]],
    news: ['FG ENDS ALL COMPANY TAX HOLIDAYS', 'TAX HOLIDAY DON END FOR EVERYBODY'], archive: 'Abolished company tax holidays.' }),
  g2({ id: 'x7', name: 'Incentives by rule: published, time-limited, tied to jobs', pc: 6, naira: 0, months: 5, excludes: ['x6'],
    lasting: 'Investors keep their incentives if they hire. Less revenue than abolition, and no favours.',
    blurb: 'An incentive for anyone who meets the published test, for five years, withdrawn if the jobs are not created. Nobody negotiates one in the Villa.',
    done: [['bonus.fiscal', 0.008], ['nation.jobs', 2], ['nation.integrity', 2]],
    news: ['TAX INCENTIVES NOW BY PUBLISHED RULE ONLY', 'NO MORE SPECIAL TAX HOLIDAY FOR FRIENDS'], archive: 'Put tax incentives under published rules tied to jobs.' }),
  g2({ id: 'x8', name: 'A flat levy on small traders, collected through the market associations', pc: 6, naira: 0, months: 4, excludes: ['x9'],
    lasting: 'A broad base, quickly. The market associations collect it, and some of them collect more than the law says.',
    blurb: 'Every stall pays a fixed sum each month to its market association, which passes it on. Simple, broad, and resented in every market in the country.',
    start: [['bloc.street', -4]], during: [['bloc.street', -0.3]], duringText: 'The collectors arrive before the receipts do.',
    done: [['bonus.fiscal', 0.015], ['bloc.street', -3]],
    news: ['SMALL TRADERS TO PAY FLAT MONTHLY LEVY', 'MARKET WOMEN GO DEY PAY TAX NOW'], archive: 'Imposed a flat levy on small traders through the market associations.' }),
  g2({ id: 'x9', name: 'Exempt small traders, and register them for credit and pensions', pc: 6, naira: 0.2, months: 8, excludes: ['x8'],
    lasting: 'No tax below a threshold. Registered traders get credit and a pension; as they grow, they become taxpayers.',
    blurb: 'Nobody below the threshold pays. Everyone who registers gets a bank account, a credit history and a pension. The base grows slowly, from the bottom.',
    done: [['nation.jobs', 3], ['bloc.street', 4], ['nation.capacity', 1]],
    news: ['SMALL TRADERS EXEMPT; 3 MILLION REGISTER FOR CREDIT', 'SMALL TRADERS NO GO PAY TAX. DEM GO GET LOAN'], archive: 'Exempted small traders and registered them for credit and pensions.' }),
  g2({ id: 'x10', name: 'Lower the rates and tax everything', pc: 10, naira: 0, months: 6, excludes: ['x11'],
    lasting: 'Lower rates, fewer exemptions, less reason to hide. Revenue rises slowly as compliance does; firms invest more.',
    blurb: 'Cut company and income tax rates, and abolish the exemptions that made the high rates fiction. The bet is that people pay a fair rate they cannot avoid.',
    start: [['bonus.fiscal', -0.005]],
    done: [['bonus.fiscal', 0.017], ['nation.jobs', 3], ['bloc.establishment', 4]],
    news: ['TAX RATES CUT AS EXEMPTIONS ARE ABOLISHED', 'TAX DON REDUCE, BUT EVERYBODY GO PAY'], archive: 'Lowered tax rates and abolished exemptions.' }),
  g2({ id: 'x11', name: 'Keep the rates, and chase collection', pc: 8, naira: 0.2, months: 6, excludes: ['x10'],
    lasting: 'More inspectors, more audits, the same rates. Revenue comes in sooner; firms spend more on accountants and less on growing.',
    blurb: 'The rates are fine; the collection is not. Double the inspectors and audit every large company every year.',
    start: [['bloc.establishment', -3]],
    done: [['bonus.fiscal', 0.02], ['nation.capacity', 1]],
    news: ['TAX SERVICE DOUBLES ITS INSPECTORS', 'TAX PEOPLE DON BOOK EVERY COMPANY'], archive: 'Kept the tax rates and doubled collection.' }),
  g2({ id: 'x12', name: 'One revenue service for every tier of government', pc: 14, naira: 0.1, months: 12, excludes: ['t5'], ...SENATE,
    lasting: 'Federal, state and local taxes collected by one service and shared by formula. Cheaper and broader; the governors lose their own collectors.',
    blurb: 'Thirty-seven revenue agencies, and the local councils, replaced by one service that collects everything and shares it out.',
    start: [['bloc.party', -6]],
    done: [['bonus.fiscal', 0.03], ['nation.capacity', 3], ['bloc.party', -3]],
    news: ['ONE REVENUE SERVICE TO COLLECT FOR ALL TIERS', 'ONE TAX OFFICE FOR EVERYBODY NOW'], archive: 'Created one revenue service for every tier of government.' }),
  g3({ id: 'x14', name: 'Refund what the levy collectors overcharged', pc: 4, naira: 0.2, months: 4,
    emerge: (s) => done(s, 'x8') && s.blocs.street < 40, emergeText: 'The market associations have been collecting twice the levy and keeping the difference.',
    blurb: 'An audit of every association, refunds to the traders, and receipts printed by the revenue service, not the collectors.',
    done: [['bloc.street', 6], ['nation.integrity', 2], ['bonus.fiscal', -0.003]],
    news: ['TRADERS REFUNDED AS LEVY COLLECTORS ARE AUDITED', 'DEM DON RETURN MARKET WOMEN MONEY'], archive: 'Refunded traders overcharged by the levy collectors.' }),
];

/** New Treasury reforms: the account, the calendar, the price list and the borrowing plan. */
export const TREASURY_REFORMS: { first: M; deeper: M[] } = {
  first: g1({ id: 'y1', name: 'One treasury account for every ministry and agency', pc: 8, naira: 0, months: 4,
    lasting: 'No agency hides a balance. Releases are paid from one account, on the date set.',
    blurb: 'Nine hundred agencies keep their own bank accounts, and nobody knows what is in them. Close them all into one account at the central bank.',
    start: [['bloc.villa', -2], ['bloc.establishment', -3], ['tycoon.ty_bank', -5]],
    done: [['nation.fiscalSpace', 0.4], ['nation.integrity', 2]],
    news: ['900 AGENCY ACCOUNTS CLOSED INTO ONE TREASURY ACCOUNT', 'ALL GOVERNMENT MONEY DON ENTER ONE ACCOUNT'], archive: 'Moved every ministry and agency onto one treasury account.' }),
  deeper: [
    g2({ id: 'y2', name: 'A published cash-release calendar', pc: 4, naira: 0, months: 3,
      lasting: 'Ministries know what arrives and when: releases are steadier, and contractors plan.',
      blurb: 'When the budget is signed, publish the month each release will be paid. Then pay it.',
      done: [['bloc.establishment', 3], ['bloc.party', -2]],
      news: ['TREASURY PUBLISHES RELEASE DATES FOR THE YEAR', 'NOW WE KNOW WHEN MONEY GO COME'], archive: 'Published a cash-release calendar.' }),
    g2({ id: 'y3', name: 'A procurement price list: no award above the published price', pc: 8, naira: 0, months: 5,
      lasting: 'Nothing is bought above the published price. Less is stolen in the buying.',
      blurb: 'What a classroom, a kilometre of road and a borehole cost, published. An award above it needs a reason, in public.',
      start: [['bloc.party', -4]],
      done: [['nation.integrity', 3], ['bonus.fiscal', 0.01]],
      news: ['FG PUBLISHES WHAT A ROAD SHOULD COST', 'NOW WE KNOW HOW MUCH BOREHOLE COST'], archive: 'Published a procurement price list and capped awards at it.' }),
    g2({ id: 'y4', name: 'A borrowing plan: long, in naira, on a published calendar', pc: 6, naira: 0, months: 6,
      lasting: 'Lenders know what is coming and when. Market borrowing costs less.',
      blurb: 'Issue on a calendar, at longer terms, mostly at home. No surprise auctions, no rushing to the eurobond market when the account runs dry.',
      done: [['debt.rates', -3], ['bloc.establishment', 4], ['tycoon.ty_bank', 3]],
      news: ['DEBT OFFICE PUBLISHES BORROWING CALENDAR', 'GOVERNMENT GO BORROW BY CALENDAR NOW'], archive: 'Published a long-term borrowing plan.' }),
  ],
};
