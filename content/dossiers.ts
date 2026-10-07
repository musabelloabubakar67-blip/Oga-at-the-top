// INHERITANCE DOSSIERS (plan section 02)
// What the new President is handed on the first morning, for each starting
// scenario: what the outgoing government says, what the records show, what is
// owed and to whom, one thing that works and is worth keeping, and who holds
// leverage over the new government. Every figure here matches the scenario's
// starting state in `content/scenarios.ts` (and the default treasury where the
// scenario does not override it).
//
// Status: the starting asset each dossier names is declared on its scenario
// (content/scenarios.ts, contract S6) and exists from the first month. The
// transition screens that show the rest of the dossier wait on contract R6.

export type ClaimStatus = 'confirmed' | 'partly true' | 'false' | 'disputed';

export interface DossierClaim {
  /** What the outgoing government says, in its own words. */
  claim: string;
  /** Who is saying it. */
  source: string;
  /** What the records show. */
  finding: string;
  status: ClaimStatus;
  /** Who checked, so the finding is attributed, not asserted. */
  checkedBy: string;
}

export interface DossierObligation {
  what: string;
  owedTo: string;
  amount?: string;
  due: string;
  kind: 'debt' | 'agreement' | 'promise' | 'case' | 'contract' | 'programme';
  /** The game state this corresponds to, for the screen to show live. */
  state?: string;
}

export interface DossierLeverage {
  /** A person or businessman id from `content/people.ts`, `content/tycoons.ts`, or a cast name key from `content/names.ts`. */
  who: string;
  holds: string;
  wants: string;
}

export interface Dossier {
  scenario: string;
  /** One line on who is leaving and how. */
  predecessor: string;
  claims: DossierClaim[];
  obligations: DossierObligation[];
  /** One functioning thing worth keeping. `asset` is an id from `content/assets.ts`; `site` a state id. */
  asset: { asset: string; site: string; condition: string; why: string };
  leverage: DossierLeverage[];
  /** What the Chief of Staff says when the door is closed. */
  briefing: string[];
  /** The first decision the dossier sets up, and the file or power it points to. */
  firstAct: { text: string; points: string };
}

export const DOSSIERS: Dossier[] = [
  {
    scenario: 'standard',
    predecessor: 'A two-term government that broke nothing visibly and fixed nothing at all, and left on time.',
    claims: [
      { claim: 'The economy is on a sound footing.', source: 'The outgoing government\'s handover notes', finding: 'Debt service takes about two thirds of revenue. The central bank has lent the government ₦4.8tn it created for the purpose.', status: 'false', checkedBy: 'The Debt Management Office' },
      { claim: 'All contractual obligations are being met.', source: 'The outgoing Minister of Finance', finding: '₦2.5tn is unpaid: ₦0.7tn to the gas suppliers, ₦1.2tn to contractors, ₦0.6tn to pensioners. None of it is in the published debt figures.', status: 'false', checkedBy: 'The Accountant-General\'s ledgers' },
      { claim: 'The refinery is 95% complete.', source: 'The Minister of State, Petroleum, six months ago', finding: 'Nobody has independently inspected it in six years.', status: 'disputed', checkedBy: 'Not yet checked' },
      { claim: 'The university agreement has been honoured.', source: 'The outgoing Minister of Education', finding: 'It was signed eleven years ago. No budget line was ever created for it.', status: 'false', checkedBy: 'The Budget Office' },
    ],
    obligations: [
      { what: 'Arrears to the gas suppliers', owedTo: 'The gas suppliers to the power plants', amount: '₦0.7tn', due: 'Overdue; deliveries are falling', kind: 'debt', state: 'debt.gas' },
      { what: 'Certificates for finished federal work', owedTo: 'An association of four hundred contractors', amount: '₦1.2tn', due: 'Overdue', kind: 'debt', state: 'debt.contractors' },
      { what: 'Pension arrears', owedTo: 'Retired federal workers', amount: '₦0.6tn', due: 'Overdue', kind: 'debt', state: 'debt.pensions' },
      { what: 'The university funding agreement', owedTo: 'The Senior Academics\' Union', amount: '₦420bn over three years', due: 'An ultimatum is expected within months', kind: 'agreement', state: 'flag:uni.agreement' },
      { what: 'The capped pump price', owedTo: 'Fuel importers, through the oil company', amount: 'About ₦4.2tn a year', due: 'Every month it stays', kind: 'programme', state: 'flag:policy.subsidy' },
    ],
    asset: { asset: 'wheat', site: 'KN', condition: 'Working, on a third of its hectares. The pumps were last serviced four years ago.', why: 'It is the one federal farm programme that grows what it says it grows. Keep it serviced and it feeds the North through a bad year.' },
    leverage: [
      { who: 'ty_fuel', holds: 'A third of the country\'s petrol and most of the depots.', wants: 'His subsidy claims paid, and the cap kept.' },
      { who: 'gov_ss', holds: 'The Governors\' Forum, and the votes of the states it speaks for.', wants: 'Every surplus shared, and no questions about the states\' payrolls.' },
      { who: 'sen_pres', holds: 'Which bills the Senate hears, and when.', wants: 'To be "carried along" on board appointments.' },
    ],
    briefing: [
      'Nothing has broken yet, {SIR}. That is the danger. Everything here breaks on a schedule, and the schedule is not ours.',
      'The first thing anyone will test is whether you know what is owed. Most of your predecessor\'s cabinet did not.',
    ],
    firstAct: { text: 'The Finance Ministry\'s memorandum on the petrol subsidy is on the desk within the month.', points: 'subsidy.memo' },
  },
  {
    scenario: 'boom',
    predecessor: 'A government that rode a high oil price for two years, spent it on itself and the states, and handed over at the top.',
    claims: [
      { claim: 'We are leaving the treasury full.', source: 'The outgoing government\'s farewell statement', finding: 'True: ₦3.4tn in the treasury and ₦2.4tn in the stabilisation account. The cost of running the government rose by 40% while it was filling.', status: 'partly true', checkedBy: 'The Accountant-General' },
      { claim: 'Oil revenue is now on a permanently higher path.', source: 'The outgoing Minister of Petroleum', finding: 'The forward price for crude falls from $98 to about $50 by the fourth year. Nothing on the books depends on it staying high, except the budget.', status: 'false', checkedBy: 'The central bank\'s research department' },
      { claim: 'The excess crude account was shared in accordance with the law.', source: 'The outgoing Governors\' Forum', finding: 'It was shared twice, by agreement with the governors. The Attorney General\'s office says the law required the surplus to be saved; the Forum says the states were owed it.', status: 'disputed', checkedBy: 'The Attorney General' },
    ],
    obligations: [
      { what: 'Contractor arrears', owedTo: 'Contractors', amount: '₦0.8tn', due: 'Overdue', kind: 'debt', state: 'debt.contractors' },
      { what: 'Pension arrears', owedTo: 'Retired federal workers', amount: '₦0.2tn', due: 'Overdue', kind: 'debt', state: 'debt.pensions' },
      { what: 'The university funding agreement', owedTo: 'The Senior Academics\' Union', amount: '₦420bn over three years', due: 'Signed a year ago; unfunded', kind: 'agreement', state: 'flag:uni.agreement' },
    ],
    asset: { asset: 'coastal', site: 'LA', condition: 'The first stretch is open and busy. The rest is surveyed.', why: 'It was built with windfall money and it works. It is also the first thing the next oil slump will make unaffordable to finish.' },
    leverage: [
      { who: 'gov_ss', holds: 'Thirty governors who have now been paid out of the savings twice.', wants: 'A third sharing.' },
      { who: 'ty_bank', holds: 'A tenth of the government\'s domestic debt.', wants: 'Rates kept high while the money is plentiful.' },
    ],
    briefing: [
      'It is easy to be popular this year, {SIR}. It will be very hard in your third.',
      'Whatever you save now is the only thing that will be there when the price falls. Everyone in this building will ask you to spend it first.',
    ],
    firstAct: { text: 'The governors\' letter about the stabilisation account will not wait long.', points: 'fund.share' },
  },
  {
    scenario: 'morning',
    predecessor: 'A government that spent the reserves defending the naira, let it go in its final month, and left.',
    claims: [
      { claim: 'History will vindicate the defence of the naira.', source: 'The outgoing President', finding: 'The defence cost the reserves and added ₦1.7tn to the foreign bonds. The naira fell anyway, in the last month, all at once.', status: 'false', checkedBy: 'The central bank' },
      { claim: 'The central bank overdraft is a temporary bridge.', source: 'The outgoing Minister of Finance', finding: 'It stands at ₦5.6tn. Inflation is above 30%, and the overdraft is most of the reason.', status: 'false', checkedBy: 'The Debt Management Office' },
      { claim: 'The lender\'s programme was negotiated in good faith and is ready to sign.', source: 'The outgoing economic team', finding: 'The programme exists and is on the table. Its first condition is the petrol price; the outgoing team had not told the party.', status: 'partly true', checkedBy: 'The Ministry of Finance' },
    ],
    obligations: [
      { what: 'Arrears to gas suppliers, contractors and pensioners', owedTo: 'Gas suppliers, contractors and retired workers', amount: '₦3.5tn in all', due: 'Overdue', kind: 'debt', state: 'debt.arrears' },
      { what: 'The central bank overdraft', owedTo: 'The central bank', amount: '₦5.6tn', due: 'No date, which is the problem', kind: 'debt', state: 'debt.ways' },
      { what: 'Foreign bonds', owedTo: 'Bondholders abroad', amount: '₦6.6tn at today\'s rate', due: 'A maturity falls within two years', kind: 'debt', state: 'debt.eurobond' },
      { what: 'The lender\'s programme', owedTo: 'A multilateral lender', due: 'Open for three months', kind: 'programme' },
    ],
    asset: { asset: 'export_power', site: 'NI', condition: 'Working, selling electricity to the neighbours for dollars.', why: 'It earns dollars every month. In a country short of them, it is the one line on the books that gets better as the naira gets worse.' },
    leverage: [
      { who: 'ty_bank', holds: 'The banks that hold the bonds the market will not buy.', wants: 'An end to the overdraft, and higher rates.' },
      { who: 'LABOUR', holds: 'A union whose members\' wages are worth a third less than a year ago.', wants: 'A new minimum wage before anything else.' },
      { who: 'CBN', holds: 'The memorandum warning the last government, signed and dated.', wants: 'Your public commitment that the overdraft ends.' },
    ],
    briefing: [
      'There is nothing in the account, {SIR}, and nobody will wait.',
      'Whatever you sign in the first quarter will be blamed on you. Whatever you do not sign will be blamed on you too, a little later.',
    ],
    firstAct: { text: 'The lender\'s programme comes back to the desk within the first year, with ending the overdraft as its third condition.', points: 'lender.offer' },
  },
  {
    scenario: 'scandal',
    predecessor: 'A President removed by the National Assembly, 81 votes to 22. The Vice President finished the term and signed nothing.',
    claims: [
      { claim: 'The removal was a political lynching.', source: 'The removed President\'s spokesman', finding: 'The Assembly\'s panel documented ₦900bn of contracts to eleven companies registered in the same week, and three ignored Supreme Court rulings. Whether removal was the right remedy is argued; the record is not.', status: 'false', checkedBy: 'The Assembly\'s panel and the Auditor-General' },
      { claim: 'The government\'s files have been preserved.', source: 'The Secretary to the Government', finding: 'Most have. Several from the final year are missing from the registry, and copies exist with civil servants who kept them.', status: 'partly true', checkedBy: 'The Attorney General' },
      { claim: 'The institutions are intact.', source: 'The caretaker government', finding: 'Integrity is at its lowest on record. The anti-corruption agency has files it was told not to open.', status: 'false', checkedBy: 'The anti-corruption agency' },
    ],
    obligations: [
      { what: 'The files on the removed President\'s officials', owedTo: 'The public, and the courts', due: 'The street expects charges this year', kind: 'case', state: 'flag:inherit.exposures' },
      { what: 'Arrears to gas suppliers, contractors and pensioners', owedTo: 'Gas suppliers, contractors and retired workers', amount: '₦2.5tn', due: 'Overdue', kind: 'debt', state: 'debt.arrears' },
      { what: 'The eleven contracts', owedTo: 'Eleven companies with lawyers', amount: '₦900bn', due: 'They will sue if cancelled', kind: 'contract' },
    ],
    asset: { asset: 'hospital', site: 'FC', condition: 'Open, staffed and good. It was built by contractors the removed President favoured.', why: 'It is the best hospital in the country, and it was built by the people you may now prosecute. Keeping it running and prosecuting them are both possible; doing either badly ruins the other.' },
    leverage: [
      { who: 'CHAIR', holds: 'A party split between those who voted for the removal and those who did not.', wants: 'No prosecutions of party members.' },
      { who: 'EDITOR', holds: 'Documents from the final year, and a source inside the building.', wants: 'To publish them.' },
      { who: 'sen_pres', holds: 'The Senate that removed your predecessor and knows it can.', wants: 'To be consulted, visibly.' },
    ],
    briefing: [
      'Everyone is watching to see whether you are the cure or the next case, {SIR}.',
      'The party wants you to move on. The street wants you to look back. The files want to be read.',
    ],
    firstAct: { text: 'The Attorney General\'s file on the previous administration reaches the desk early.', points: 'inherit.matters' },
  },
  {
    scenario: 'reformer',
    predecessor: 'A reformer who ended the subsidy, cleared the gas debt, unified the tax system, and lost the election for it. Conceded on the night.',
    claims: [
      { claim: 'I did what was necessary.', source: 'The defeated President', finding: 'Revenue is rising, the gas debt is cleared and the overdraft is half what it was. Prices are brutal and real wages have fallen by a third.', status: 'partly true', checkedBy: 'The Ministry of Finance and the statistics office' },
      { claim: 'The central bank overdraft has been halved.', source: 'The outgoing Minister of Finance', finding: 'It has: from ₦4.8tn to ₦2.6tn, paid down in the last year in office.', status: 'confirmed', checkedBy: 'The Debt Management Office' },
      { claim: 'The reforms cannot be reversed.', source: 'The outgoing economic team', finding: 'They can. Each has a constituency that would cheer its reversal and a reason it would cost more to undo than to keep.', status: 'false', checkedBy: 'Your own advisers' },
    ],
    obligations: [
      { what: 'Contractor arrears', owedTo: 'Contractors', amount: '₦0.6tn', due: 'Overdue', kind: 'debt', state: 'debt.contractors' },
      { what: 'Your own campaign\'s promise', owedTo: 'The voters who elected you against the reforms', due: 'From the first day', kind: 'promise' },
      { what: 'The unified tax system and the cleared gas debt', owedTo: 'The successor of a reformer: keeping them is the cost of their benefits', due: 'They pay only if kept', kind: 'programme', state: 'agenda.t1' },
    ],
    asset: { asset: 'hub', site: 'LA', condition: 'Working, with twelve firms trading and a waiting list.', why: 'It works because the tax system was unified and the books are believed. It pays only while they stay that way.' },
    leverage: [
      { who: 'LABOUR', holds: 'The union that campaigned against the subsidy removal and, in effect, for you.', wants: 'The subsidy back, or a wage that makes up for it.' },
      { who: 'ty_fuel', holds: 'The fuel import business that the subsidy used to feed.', wants: 'The subsidy back.' },
      { who: 'ty_bank', holds: 'The investors who finally trust the books.', wants: 'Nothing changed.' },
    ],
    briefing: [
      'You won by promising relief, {SIR}. The relief that is available is undoing the things that are about to start paying.',
      'Your predecessor took the pain. If you keep the reforms, you will have the benefits and the blame for both.',
    ],
    firstAct: { text: 'Labour\'s leader writes within months, under pressure from members who want the subsidy back. What restoring it would cost is already on the desk.', points: 'minor.labour' },
  },
  {
    scenario: 'emergency',
    predecessor: 'A government that withdrew the forward bases to save money, left the troops unpaid, and declared the war over at a rally.',
    claims: [
      { claim: 'Insecurity is a global phenomenon.', source: 'The outgoing administration', finding: 'Three theatres, the North West, the North East and the farm belt, are at the worst level the security services have recorded. The forward bases that held the farm belt were withdrawn two years ago.', status: 'false', checkedBy: 'The National Security Adviser' },
      { claim: 'The troops\' allowances have been paid.', source: 'The outgoing Minister of Defence', finding: 'They were left unpaid for eleven months. Some have been paid since; the units in the field say most have not.', status: 'disputed', checkedBy: 'Unit returns and the Ministry\'s ledgers disagree' },
      { claim: 'The war is over.', source: 'The outgoing President, at a rally', finding: 'It is not.', status: 'false', checkedBy: 'Every theatre commander' },
    ],
    obligations: [
      { what: 'Troops\' allowance arrears', owedTo: 'Serving soldiers', due: 'Overdue', kind: 'debt' },
      { what: 'The governors\' demand for state police', owedTo: 'The Governors\' Forum', due: 'Raised at the first meeting', kind: 'promise' },
      { what: 'Arrears to gas suppliers, contractors and pensioners', owedTo: 'Gas suppliers, contractors and retired workers', amount: '₦2.5tn', due: 'Overdue', kind: 'debt', state: 'debt.arrears' },
    ],
    asset: { asset: 'rice', site: 'KB', condition: 'Working, exporting rice, inside a theatre that is getting worse.', why: 'It is proof that the North West can produce and export. It is also the first place the armed groups will tax if the theatre is not held.' },
    leverage: [
      { who: 'min_defence', holds: 'The service chiefs\' confidence and the procurement files.', wants: 'More money and no audit.' },
      { who: 'gov_nw', holds: 'The state most hit, and the governors who follow him on state police.', wants: 'His own police force.' },
      { who: 'ty_trade', holds: 'The import licences for the food the farms are no longer growing.', wants: 'The borders kept open to imports.' },
    ],
    briefing: [
      'Nothing else you want to do is possible until people can travel and farm, {SIR}.',
      'The armed forces will ask for money first and accountability never. You will need both.',
    ],
    firstAct: { text: 'The farm belt is the first theatre to test you.', points: 'attack.farms' },
  },
  // ---------------------------------------------------------------- short scenarios (plan 17)
  {
    scenario: 'payroll',
    predecessor: 'The outgoing President leaves after one term, with the salaries paid and nothing in the account to pay the next ones.',
    claims: [
      { claim: 'The treasury is in safe hands.', source: 'The outgoing Minister of Finance', finding: 'The account holds less than the salaries of one month, and the stabilisation account was emptied three months ago.', status: 'false', checkedBy: 'The Accountant-General' },
      { claim: 'The central bank advance has been repaid.', source: 'The office of the outgoing President', finding: 'It was rolled into the overdraft, which is larger than it was.', status: 'false', checkedBy: 'The central bank' },
    ],
    obligations: [
      { what: 'Pensions owed and unpaid', owedTo: 'Retired federal workers', amount: '₦0.9tn', due: 'Now', kind: 'debt', state: 'debt.pensions' },
      { what: 'Salaries due every month', owedTo: 'Federal workers', due: 'Every month', kind: 'programme' },
    ],
    asset: { asset: 'hub', site: 'LA', condition: 'Running at three fifths: the port clears in four days, not two.', why: 'It earns fees in naira and dollars, and could be leased if the money runs out.' },
    leverage: [{ who: 'ty_bank', holds: 'The banks that buy government bonds', wants: 'A higher rate, and the deposits of the government' }],
    briefing: ['{SIR}, the first payroll is in three weeks. Everything else can wait for it.', 'There are four ways to find money quickly, and each has a price. The Treasury shows them.'],
    firstAct: { text: 'The Accountant-General will need an instruction on the first payroll within weeks. Raising money is in the Treasury.', points: 'treasury.payroll' },
  },
  {
    scenario: 'queues',
    predecessor: 'The outgoing President leaves in the middle of a fuel scarcity, having blamed vandals, importers and the weather in turn.',
    claims: [
      { claim: 'There is sufficient product in stock.', source: 'The national oil company', finding: 'There is stock in the depots and none at the stations; nobody has checked why.', status: 'disputed', checkedBy: 'Nobody yet' },
      { claim: 'The refinery will produce by the end of the quarter.', source: 'The Minister of State, Petroleum', finding: 'It runs at a third of its capacity on a good day.', status: 'partly true', checkedBy: 'The engineers on site' },
    ],
    obligations: [{ what: 'The petrol subsidy, paid monthly', owedTo: 'The importers', due: 'Every month', kind: 'programme' }],
    asset: { asset: 'refinery', site: 'RI', condition: 'Working at a third of its capacity.', why: 'A third of a refinery is still petrol the country does not have to import.' },
    leverage: [{ who: 'ty_fuel', holds: 'A third of the depot space in the country', wants: 'An import licence and no questions about the depots' }],
    briefing: ['{SIR}, the queues are the first thing anyone will judge you on.', 'Find out who is keeping the fuel before you decide who to blame.'],
    firstAct: { text: 'The scarcity reaches the desk early, and the question of who is keeping the fuel opens in the register.', points: 'petrol.scarcity' },
  },
  {
    scenario: 'corridor',
    predecessor: 'The outgoing President leaves having announced a joint task force for the expressway, and appointed nobody to it.',
    claims: [
      { claim: 'The roads are safer than ever.', source: 'The outgoing Minister of Interior', finding: 'Kidnappings on the corridor doubled in the last year.', status: 'false', checkedBy: 'The count kept by the transport unions' },
      { claim: 'A joint task force has been established.', source: 'The office of the outgoing President', finding: 'It exists on paper; it has no commander and no budget.', status: 'partly true', checkedBy: 'Defence Headquarters' },
    ],
    obligations: [{ what: 'Compensation promised to the families of kidnapped drivers', owedTo: 'The transport unions', due: 'Overdue', kind: 'promise' }],
    asset: { asset: 'rail', site: 'LA', condition: 'Running at three fifths: the trains run, the night service does not.', why: 'Freight by rail is freight that does not travel the corridor at night.' },
    leverage: [{ who: 'gov_sw', holds: 'The regional security outfit the corridor patrols depend on', wants: 'A say in who commands the operation' }],
    briefing: ['{SIR}, the corridor is a mission, not a speech. Choose the commander, the resources and the limits.', 'If the army becomes the problem on that road, the road is lost twice.'],
    firstAct: { text: 'Order a mission on the corridor from The country, The armed forces; the service chiefs will disagree about how to fight it as soon as it starts.', points: 'mil.dispute' },
  },
];

export const DOSSIER_BY_SCENARIO = Object.fromEntries(DOSSIERS.map((d) => [d.scenario, d]));
