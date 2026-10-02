import type { Cond, OutletId } from '../engine/types';

/** Evergreen headlines for slow news months: [broadsheet, youth outlet]. */
export const FILLERS: [string, string][] = [
  ['FG REITERATES COMMITMENT TO DELIVERING DIVIDENDS OF DEMOCRACY', 'GOVERNMENT SAY DIVIDEND DEY COME. WE STILL DEY WAIT'],
  ['REFINERY NOW {REFINERY}% COMPLETE — MINISTER', 'REFINERY DON REACH {REFINERY}%. SINCE WHEN?'],
  ['COMMITTEE REQUESTS MORE TIME TO SUBMIT REPORT', 'COMMITTEE WAN MORE TIME. SHOCKER'],
  ['STAKEHOLDERS\' SUMMIT ENDS WITH 14-POINT COMMUNIQUÉ', 'ANOTHER SUMMIT, ANOTHER COMMUNIQUÉ, ANOTHER BUFFET'],
  ['SENATE ADJOURNS PLENARY FOR TWO WEEKS', 'SENATORS DON GO HOLIDAY AGAIN'],
  ['MINISTER ASSURES NIGERIANS OF STEADY POWER "SOON"', '"SOON" — MINISTER. WHICH YEAR BE SOON?'],
  ['FG TO PARTNER PRIVATE SECTOR ON INFRASTRUCTURE', 'GOVERNMENT SAY E GO PARTNER. PARTNER WHO?'],
  ['GOVERNORS\' FORUM MEETS, CALLS FOR MORE ALLOCATION', 'GOVERNORS MEET, ASK FOR MORE MONEY. AS USUAL'],
  ['ELECTORAL COMMISSION SAYS PORTAL UPGRADE IS "ON COURSE"', 'ELECTION PORTAL DEY UPGRADE. WE DON HEAR'],
  ['FG INAUGURATES TASK FORCE ON EASE OF DOING BUSINESS', 'NEW TASK FORCE TO MAKE BUSINESS EASY. FORM NA 14 PAGES'],
  ['MINISTER COMMISSIONS BOREHOLE, HAILS "MILESTONE"', 'MINISTER FLY COME COMMISSION ONE BOREHOLE'],
  ['PRESIDENCY: "THERE IS NO CAUSE FOR ALARM"', 'DEM SAY NO CAUSE FOR ALARM. WE DON ALARM'],
  ['HOUSE PANEL SUMMONS AGENCY HEAD OVER UNSPENT FUNDS', 'AGENCY OGA NO SHOW FOR HOUSE AGAIN'],
  ['FG RECEIVES REPORT OF PANEL ON PREVIOUS PANEL\'S REPORT', 'REPORT ON THE REPORT DON LAND'],
  ['INDEPENDENCE ANNIVERSARY TO BE "LOW-KEY" — FG', 'LOW-KEY CELEBRATION WEY COST ₦2BN'],
  ['CENSUS POSTPONED AGAIN, NEW DATE "TO BE COMMUNICATED"', 'CENSUS DON SHIFT AGAIN. WE NO SABI HOW MANY WE BE'],
  ['FG, STATES TRADE BLAME OVER UNPAID COUNTERPART FUNDS', 'FEDERAL AND STATE DEY POINT FINGER'],
  ['MINISTRY RETURNS ₦4BN UNSPENT; CANNOT SAY WHAT IT WAS FOR', 'MINISTRY NO FIT SPEND MONEY, NO FIT EXPLAIN AM'],
  ['AIRPORT RUNWAY LIGHTS FAIL; FLIGHTS DIVERTED TO NEIGHBOURING COUNTRY', 'PLANE WEY DEY COME ABUJA LAND FOR ANOTHER COUNTRY'],
  ['SENATE CONSTITUTES AD-HOC COMMITTEE ON AD-HOC COMMITTEES', 'COMMITTEE TO COUNT THE COMMITTEES'],
  ['GOVERNOR COMMISSIONS PEDESTRIAN BRIDGE, DECLARES PUBLIC HOLIDAY', 'PUBLIC HOLIDAY BECAUSE OF ONE BRIDGE'],
  ['POLICE PARADE SUSPECTS; ONE IS JOURNALIST WHO CAME TO COVER PARADE', 'DEM ARREST THE JOURNALIST WEY COME SNAP THEM'],
  ['EX-GOVERNORS DEMAND UPWARD REVIEW OF THEIR PENSIONS', 'EX-GOVERNORS WAN MORE PENSION. PENSIONERS DEY QUEUE'],
  ['AGENCY SPENDS ₦900M ON "SENSITISATION" AGAINST WASTE', '₦900M TO TELL US NO WASTE MONEY'],
  ['LAWMAKERS REJECT BILL TO PUBLISH THEIR ALLOWANCES', 'SENATORS NO WAN MAKE WE KNOW THEIR SALARY'],
  ['FG LAUNCHES 25-YEAR DEVELOPMENT PLAN; PREVIOUS ONE HAS 11 YEARS LEFT', 'NEW 25-YEAR PLAN. THE OLD ONE NEVER EXPIRE'],
  ['STATE DECLARES WORK-FREE DAY TO WELCOME FEDERAL DELEGATION', 'NO WORK TODAY: ABUJA PEOPLE DEY COME'],
  ['PORT AUTHORITY SAYS CONGESTION IS "A SIGN OF ECONOMIC ACTIVITY"', 'TRAFFIC NA SIGN SAY ECONOMY DEY WORK — PORT OGA'],
  ['MINISTER ATTENDS CONFERENCE ON REDUCING FOREIGN TRAVEL, ABROAD', 'DEM TRAVEL GO ABROAD GO LEARN HOW TO STOP TRAVEL'],
  ['NATIONAL ASSEMBLY COMPLEX RENOVATION NOW IN FIFTH YEAR', 'DEM STILL DEY RENOVATE ASSEMBLY SINCE'],
  ['TRADITIONAL RULERS SEEK CONSTITUTIONAL ROLE, AGAIN', 'KABIYESI DEM WAN ENTER CONSTITUTION'],
  ['ELECTRICITY FIRM BILLS CUSTOMER FOR MONTH HE WAS DISCONNECTED', 'NO LIGHT, BUT BILL COME'],
  ['FG TO HOLD RETREAT ON OUTCOMES OF LAST RETREAT', 'RETREAT TO DISCUSS THE RETREAT'],
];

export const SIDEBARS: { kicker: string; text: string; when?: Cond }[] = [
  { kicker: 'VOX POP', text: '"I am not angry. I am just calculating." — a tailor in Mushin, on the price of everything.', when: { v: ['hardship', '>', 55] } },
  { kicker: 'VOX POP', text: '"Small small, it is getting better. I will not say it loud so they do not relax." — a spare-parts trader, Nnewi.', when: { v: ['hardship', '<', 42] } },
  { kicker: 'QUOTE OF THE WEEK', text: '"The situation is under control." — the Minister of Information, shortly before the situation.' },
  { kicker: 'CORRECTION', text: 'Yesterday we reported that the committee had submitted its report. The committee has asked us to clarify that it has submitted a request for an extension.' },
  { kicker: 'OVERHEARD', text: '"Is the meeting to discuss the problem, or to discuss the meeting?" — a permanent secretary, in a lift.' },
  { kicker: 'BY THE NUMBERS', text: 'Presidential committees constituted since inauguration: we have stopped counting. Reports published: we are still at zero.', when: { v: ['counter.committees', '>=', 3] } },
  { kicker: 'VOX POP', text: '"Before, I was buying fuel and complaining. Now I am trekking and complaining. The complaining is constant." — a civil servant, Abuja.', when: { flag: 'policy.subsidy', is: 'removed' } },
  { kicker: 'EDITORIAL', text: 'A government that is not stealing should be the minimum, not the manifesto. But we note it, and we will check again next month.', when: { v: ['nation.integrity', '>', 40] } },
  { kicker: 'EDITORIAL', text: 'When every query is "politically motivated", the phrase stops meaning anything except that there is a query.', when: { v: ['nation.integrity', '<', 24] } },
  { kicker: 'OPPOSITION', text: '{OPP}: "This government has run out of ideas." Asked for his own, he promised to unveil them "at the appropriate time".' },
  { kicker: 'VOX POP', text: '"We have light for six hours yesterday. I ironed everything in the house in case." — a schoolteacher, Kaduna.', when: { v: ['nation.power', '>', 38] } },
  { kicker: 'VOX POP', text: '"NEPA brought light at 2am. Who are they bringing it for, the mosquitoes?" — a barber, Aba.', when: { v: ['nation.power', '<', 32] } },
  { kicker: 'LETTER', text: 'Sir: I have applied for my pension since 2019. I am told my file is "receiving attention". I am 74. Kindly ask the attention to hurry.' },
  { kicker: 'OVERHEARD', text: '"Stakeholders have been engaged." "Which ones?" "The ones who came." — outside a ministry conference room.', when: { v: ['counter.stakeholders', '>=', 2] } },
  { kicker: 'STREET POLL', text: 'We asked 50 people at Berger to name one minister. 31 named the Minister of Information. None of them was complimentary.' },
  { kicker: 'VOX POP', text: '"They say the economy is growing. Let it grow reach my side." — a bus conductor, Ojota.' },
  { kicker: 'VOX POP', text: '"My son got a job at the new factory. First person in our family with a payslip." — a widow, Aba.', when: { v: ['nation.jobs', '>', 46] } },
  { kicker: 'VOX POP', text: '"Three graduates in this house. All of them riding okada." — a retired teacher, Ilorin.', when: { v: ['nation.jobs', '<', 34] } },
  { kicker: 'VOX POP', text: '"We slept in the farm last night. First time in four years nobody came." — a yam farmer, Benue.', when: { v: ['nation.security', '>', 50] } },
  { kicker: 'VOX POP', text: '"We pay the bandits a levy to harvest. They give receipt." — a farmer, Zamfara.', when: { v: ['nation.security', '<', 34] } },
  { kicker: 'OVERHEARD', text: '"He has been to see the President three times this year. The President has been to see him once. That is the whole story." — a governor\'s aide.', when: { v: ['bloc.party', '<', 45] } },
  { kicker: 'CORRECTION', text: 'We reported that the Minister had "resigned". He has asked us to say he was "reassigned to pursue other national interests". We are happy to say it.' },
  { kicker: 'BY THE NUMBERS', text: 'Reforms the government has delivered: {DONE}. Reforms it promised: 20. We are keeping the receipt.', when: { v: ['turn', '>', 12] } },
  { kicker: 'LETTER', text: 'Sir: The road in front of my house was commissioned in 2019. I would be grateful if somebody could now build it.' },
  { kicker: 'STREET POLL', text: 'We asked 100 people whether things are better than last year. 41 said yes, 38 said no, and 21 asked whether we had come to share something.' },
  { kicker: 'EDITORIAL', text: 'It is possible to govern well here. We know because, this month, somebody did. We reserve the right to change our mind.', when: { v: ['approval', '>', 55] } },
  { kicker: 'OVERHEARD', text: '"If I had known the job was this much reading I would have stayed governor." — attributed.' },
];

/** One line of comment from each outlet, chosen by what the country looks like. */
export const EDITORIALS: { when?: Cond; chronicle: string; street: string }[] = [
  { when: { v: ['hardship', '>', 62] }, chronicle: 'The government asks for patience. Patience is a currency, and it is being spent faster than the naira.', street: 'Dem say make we manage. We don manage reach where manage sef don finish.' },
  { when: { v: ['hardship', '<', 38] }, chronicle: 'The numbers are, for once, moving in the right direction. The test of a government is what it does when they stop.', street: 'E don better small. We no go lie. But make dem no relax.' },
  { when: { v: ['nation.debt', '>', 85] }, chronicle: 'A country that spends most of its revenue on interest is not governing. It is renting time.', street: 'All the money wey Nigeria dey make, na debt e dey pay. Na our pikin go suffer am.' },
  { when: { v: ['nation.integrity', '<', 22] }, chronicle: 'Nobody in government appears to be embarrassed any more. That is new, and it is not an improvement.', street: 'Dem no dey even hide am again.' },
  { when: { v: ['nation.integrity', '>', 45] }, chronicle: 'Publishing the accounts is not the same as governing well. It is merely the first time it has been possible to tell.', street: 'At least this one dey show us the receipt.' },
  { when: { v: ['bloc.party', '<', 35] }, chronicle: 'The President has an agenda. Whether the President has a party is a separate and more urgent question.', street: 'Even the party people no dey pick President call again.' },
  { when: { v: ['nation.power', '>', 48] }, chronicle: 'Electricity has improved. The fact that this is remarkable says more than the improvement.', street: 'Light dey. We dey fear to talk am loud.' },
  { when: { v: ['nation.jobs', '>', 48] }, chronicle: 'Factories are hiring. It has been so long that several had to be reminded how.', street: 'Work dey small small. Tell your cousin.' },
  { when: { v: ['pc', '<', 15] }, chronicle: 'A President without political capital still has the office. The office, by itself, has never passed a bill.', street: 'President don weak. Everybody dey do anyhow.' },
  { chronicle: 'The administration will be judged on what is still standing when it leaves, not on what it announced.', street: 'Talk is cheap. Na the result we dey find.' },
  { chronicle: 'Every government promises to hit the ground running. The ground, in our experience, is patient.', street: 'Dem all promise. Na who deliver we dey count.' },
];


export const STANDFIRSTS: Record<OutletId, string[]> = {
  chronicle: [
    'The Presidency says consultations are ongoing and that further details will be made available in due course.',
    'Officials described the development as being "in line with extant provisions".',
    'A statement from the Villa said government remains committed to the welfare of all Nigerians.',
    'Analysts say the full implications will become clear in the coming months.',
    'The opposition called the move "too little, too late". The ruling party called it "decisive".',
  ],
  street: [
    'Nigerians are reacting. Some of the reactions cannot be printed.',
    'We went to the motor park to ask what people think. They told us. At length.',
    'The Villa has released a statement. We read it so you do not have to.',
    'Your timeline already knows. Here is what actually happened.',
    'As usual, everybody get opinion. Here na the facts.',
  ],
};

/** What an adviser of low competence says when the event gives no specific weak line. */
export const WEAK_LINES: Record<string, string[]> = {
  default: [
    'It is a delicate matter, {SIR}.',
    'I am sure whatever you decide will be the right decision, {SIR}.',
    'We are on top of the situation, {SIR}.',
  ],
  fin: [
    'It is manageable, {SIR}.',
    'The fundamentals remain strong, {SIR}.',
    'We can always explore financing options, {SIR}.',
  ],
  info: ['We should issue a strong statement, {SIR}.'],
  edu: ['Discussions remain fruitful, {SIR}.'],
  power: ['We are investigating the remote and immediate causes, {SIR}.'],
};
