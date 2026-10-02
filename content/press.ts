import type { Cond, Fx, OutletId, Stance, Topic } from '../engine/types';

// THE PAPERS
// Four newspapers with different loyalties. Each month two of them cover the
// same lead story, and disagree about it. Every line here is tied to what the
// story is about and whether it is good or bad for the government, and each is
// printed once: a joke does not survive a second appearance.

export interface Outlet {
  id: OutletId;
  name: string;
  tagline: string;
  /** Who it answers to, shown on the masthead when it explains the coverage. */
  note: string;
}

export const OUTLETS: Record<OutletId, Outlet> = {
  chronicle: { id: 'chronicle', name: 'The Federal Chronicle', tagline: 'Abuja edition', note: 'The paper of record. Reports what happened and lets it stand.' },
  street: { id: 'street', name: 'Street Gist', tagline: 'No long thing', note: 'Speaks for people who buy fuel by the litre. Follows the cost of living, not the Villa.' },
  stakeholder: { id: 'stakeholder', name: 'The Daily Stakeholder', tagline: 'Partners in progress', note: 'Owned by Otunba Gbenga Oyewole. It thinks what he thinks of you.' },
  rejoinder: { id: 'rejoinder', name: 'The Daily Rejoinder', tagline: 'The other side of the story', note: 'The opposition\'s paper. Whoever is leading against you is its front page.' },
};

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });

// ---------------------------------------------------------------- headlines the partisan papers write
// {R} is the leading rival's surname, in capitals. The facts follow underneath.

type Pool = Partial<Record<Topic, string[]>>;

export const HOSTILE_BAD: Pool = {
  prices: ['{R}: "ASK THE WOMAN SELLING PEPPER WHAT SHE THINKS OF THIS GOVERNMENT"', 'PRICES ARE THE ONE THING THIS GOVERNMENT HAS RAISED — {R}', '{R}: "THEY HAVE NOT BOUGHT THEIR OWN RICE SINCE THE INAUGURATION"'],
  money: ['{R}: "THEY ARE SPENDING OUR CHILDREN\'S MONEY ON THEIR OWN SURVIVAL"', 'THE TREASURY IS BEING RUN LIKE A PARTY ACCOUNT — {R}', '{R}: "THE BOOKS DO NOT BALANCE AND NEITHER DOES THE PRESIDENT"'],
  power: ['{R}: "THEY PROMISED LIGHT AND DELIVERED A PRESS STATEMENT"', 'DARKNESS IS NOW GOVERNMENT POLICY — {R}', '{R}: "THE ONLY THING GENERATING IN THIS COUNTRY IS EXCUSES"'],
  security: ['{R} DEMANDS ANSWERS FROM PRESIDENT ON INSECURITY', '{R}: "THE FIRST DUTY OF A GOVERNMENT IS NOT BEING DONE"'],
  politics: ['{R}: "EVEN HIS OWN PARTY HAS STOPPED TAKING HIS CALLS"', 'A PRESIDENCY AT WAR WITH ITSELF — {R}', '{R}: "HE CANNOT LEAD A CAUCUS, NEVER MIND A COUNTRY"'],
  scandal: ['{R} DEMANDS PRESIDENT PUBLISH THE FILES', '{R}: "THE ONLY THING THEY HAVE BUILT IS A WALL AROUND THE ACCOUNTS"', 'WHAT DID THE PRESIDENT KNOW? — {R}'],
  labour: ['{R} BACKS WORKERS, BLAMES PRESIDENT', '{R}: "THE WORKERS ARE OWED WAGES. THE MINISTERS ARE OWED NOTHING"'],
  reform: ['{R}: "HE CANNOT PASS A BILL THROUGH HIS OWN SENATE"', 'ANOTHER REFORM DIES. {R}: "WE SAID SO"'],
  bet: ['{R}: "THEY GAMBLED YOUR MONEY AND LOST IT"', 'WHITE ELEPHANT: {R} DEMANDS AN INQUIRY', '{R}: "ANNOUNCED WITH DRUMS, BURIED IN SILENCE"'],
  oil: ['{R}: "THEY WROTE THE BUDGET ON A PRAYER"', 'OIL FALLS AND THE PRESIDENT HAS NO PLAN — {R}'],
  people: ['{R}: "HIS OWN PEOPLE ARE LEAVING HIM"', 'THE EXODUS FROM THE PRESIDENT\'S CAMP — {R}'],
  general: ['{R}: "THIS GOVERNMENT CONFUSES ANNOUNCEMENTS WITH ACHIEVEMENTS"', '{R}: "THE PRESIDENT IS A SPECTATOR AT HIS OWN ADMINISTRATION"', 'NOTHING WORKS AND NOBODY RESIGNS — {R}'],
};

export const HOSTILE_GOOD: Pool = {
  prices: ['PRICES EASE. {R}: "LOOK AT WHERE THEY STARTED"', '{R}: "ONE GOOD MONTH DOES NOT FEED A FAMILY"'],
  money: ['BOOKS BALANCE; PEOPLE DO NOT — {R}', '{R}: "THEY ARE SAVING MONEY THAT HUNGRY PEOPLE NEED"'],
  power: ['{R}: "LIGHT IN THE CITIES. WHAT OF THE SEVEN HUNDRED TOWNS?"', '{R}: "WE STARTED THAT PROJECT"'],
  security: ['{R}: "A QUIET MONTH IS NOT PEACE"', '{R} URGES CAUTION OVER SECURITY CLAIMS'],
  politics: ['{R}: "BOUGHT, NOT WON"', '{R}: "THE PRESIDENT HAS RENTED A MAJORITY"'],
  scandal: ['{R}: "HE PROSECUTES HIS ENEMIES AND PROMOTES HIS FRIENDS"', '{R}: "ONE ARREST DOES NOT MAKE A CLEAN GOVERNMENT"'],
  labour: ['{R}: "PAID WITH BORROWED MONEY"', '{R}: "IT TOOK A STRIKE TO MAKE HIM DO IT"'],
  reform: ['{R}: "A LAW ON PAPER IS NOT A CHANGE IN THE MARKET"', '{R}: "OUR IDEA, THEIR RIBBON"', '{R}: "LET US SEE IT IN A YEAR"'],
  bet: ['IT WORKED. {R} ASKS WHAT IT COST', '{R}: "EVEN A STOPPED CLOCK"'],
  oil: ['{R}: "THE OIL PRICE IS NOT A POLICY"', '{R}: "LUCK IS NOT GOVERNANCE"'],
  people: ['{R}: "LOYALTY HAS A PRICE AND HE HAS PAID IT"'],
  general: ['{R}: "TOO LITTLE, AND YEARS LATE"', '{R}: "THE BAR IS ON THE FLOOR AND HE HAS STEPPED OVER IT"'],
};

export const LOYAL_GOOD: Pool = {
  prices: ['RELIEF AT LAST: PRESIDENT\'S POLICIES BEAR FRUIT', 'MARKETS SMILE AS PRICES FALL'],
  money: ['PRUDENCE PAYS: TREASURY IN SAFE HANDS', 'INVESTORS APPLAUD PRESIDENT\'S FISCAL DISCIPLINE'],
  power: ['LET THERE BE LIGHT: A PROMISE KEPT', 'THE PRESIDENT WHO FIXED THE GRID'],
  security: ['SAFER STREETS: PRESIDENT\'S STRATEGY VINDICATED', 'TROOPS HAIL COMMANDER-IN-CHIEF'],
  politics: ['MASTERSTROKE: PRESIDENT OUTFLANKS THE OPPOSITION', 'PARTY UNITES BEHIND THE PRESIDENT'],
  scandal: ['NO SACRED COWS: PRESIDENT CLEANS HOUSE', 'ZERO TOLERANCE: THE PRESIDENT MEANS IT'],
  labour: ['A LISTENING PRESIDENT: WORKERS REJOICE', 'INDUSTRIAL PEACE RETURNS'],
  reform: ['HISTORY MADE: PRESIDENT DELIVERS', 'THEY SAID IT COULD NOT BE DONE', 'ANOTHER PROMISE KEPT'],
  bet: ['VISION REWARDED: THE DOUBTERS WERE WRONG', 'A GIANT LEAP FOR NIGERIA'],
  oil: ['WINDFALL: PRESIDENT\'S PRUDENCE REWARDED', 'OIL BOOM MEETS A STEADY HAND'],
  people: ['STAKEHOLDERS RALLY TO THE PRESIDENT', 'ELDERS, GOVERNORS PLEDGE LOYALTY'],
  general: ['THE NATION IS ON COURSE', 'STEADY PROGRESS UNDER A STEADY HAND'],
};

export const LOYAL_BAD: Pool = {
  prices: ['PRESIDENT "FEELS THE PAIN", ASSURES NIGERIANS', 'GLOBAL FORCES, NOT GOVERNMENT, BEHIND PRICES — VILLA'],
  money: ['PRESIDENCY: FUNDAMENTALS "REMAIN STRONG"', 'TEMPORARY CHALLENGE, LASTING VISION'],
  power: ['SABOTEURS SUSPECTED AS PRESIDENT ORDERS PROBE', 'PRESIDENT "PERSONALLY MONITORING" POWER SITUATION'],
  security: ['PRESIDENT CONDEMNS ATTACK, VOWS ACTION', 'SERVICE CHIEFS SUMMONED AS PRESIDENT TAKES CHARGE'],
  politics: ['DISGRUNTLED ELEMENTS WILL NOT DISTRACT PRESIDENT — VILLA', 'PRESIDENT REMAINS FOCUSED ON GOVERNANCE'],
  scandal: ['OPPOSITION PEDDLES FALSEHOOD — PRESIDENCY', 'POLITICALLY MOTIVATED: VILLA DISMISSES REPORT'],
  labour: ['PRESIDENT APPEALS FOR PATIENCE, PATRIOTISM', 'UNIONS URGED TO SHUN "FIFTH COLUMNISTS"'],
  reform: ['REFORM "NOT DEAD, ONLY RESTING" — VILLA', 'PRESIDENT UNDETERRED BY SENATE SETBACK'],
  bet: ['SETBACK WILL NOT DERAIL TRANSFORMATION AGENDA', 'LESSONS LEARNED, VISION INTACT — MINISTER'],
  oil: ['GLOBAL OIL SHOCK TESTS EVERY NATION — PRESIDENCY', 'PRESIDENT CALLS FOR CALM OVER OIL PRICE'],
  people: ['GOOD RIDDANCE: PARTY STRONGER WITHOUT DEFECTORS', 'PRESIDENT WISHES FORMER ALLY WELL'],
  general: ['THERE IS NO CAUSE FOR ALARM — PRESIDENCY', 'PRESIDENT SEEKS UNDERSTANDING OF NIGERIANS'],
};

/** The line above the headline. */
export const STRAPS: Record<Stance, { good: string[]; bad: string[]; flat: string[] }> = {
  record: { good: ['The record'], bad: ['The record'], flat: ['The record'] },
  street: { good: ['E don happen'], bad: ['Wahala'], flat: ['Gist'] },
  loyal: { good: ['A nation applauds', 'Promise kept', 'Leadership'], bad: ['The Presidency responds', 'Setting the record straight', 'Calm, please'], flat: ['From the Villa'] },
  hostile: { good: ['The opposition replies', 'A second opinion', 'Not so fast'], bad: ['The opposition replies', 'We warned them', 'Another one'], flat: ['The other side'] },
};

/** What a paper adds after the facts. Keyed by stance, then by whether the news is good or bad for you. */
export const COMMENT: Record<Stance, { good: string[]; bad: string[]; grave: string[] }> = {
  record: {
    good: [
      'Officials caution that it is early. It is, but it is also the first time in some years the caution has been needed.',
      'Analysts describe the result as real and reversible, in that order.',
      'The opposition called it overdue. The figures do not contradict either side.',
      'It is the kind of thing governments usually announce and seldom do.',
      'The test, as ever, is whether it survives the next budget.',
      'Diplomats who had stopped asking about it have started asking again.',
      'The Presidency has not, so far, overclaimed. Observers find this unsettling.',
      'It will not show in the price of bread this month. It may show in the price of bread next year.',
      'Those who said it was impossible have moved on to saying it was obvious.',
      'A senior civil servant described it as "the first file in some time that came back finished".',
    ],
    bad: [
      'The Presidency says it is studying the situation. It has been studying it for some time.',
      'Officials described the development as "regrettable". Nobody has been asked to resign.',
      'A statement is expected. Statements have been expected before.',
      'The opposition called for an inquiry. The government said one would be premature.',
      'Analysts say the consequences will be felt well after the news cycle has moved on.',
      'Nobody has yet been able to say who was in charge. Several people have been able to say who was not.',
      'The relevant ministry referred questions to the Villa. The Villa referred them back.',
      'This newspaper asked what would be done differently next time. It was told that there would not be a next time.',
      'The figures were released on a Friday evening, which is when figures of this kind are released.',
      'An official who asked not to be named said the problem had been "foreseen, minuted and filed".',
    ],
    grave: [
      'The names of the dead have not been released.',
      'The Presidency has been asked what was known beforehand. It has not yet replied.',
      'Relief agencies say the figures will rise.',
    ],
  },
  street: {
    good: [
      'We no go lie: this one, dem try. Make e no be audio.',
      'People for the park say dem go believe am when e reach their pocket.',
      'Small small. But e better pass yesterday, and we go talk am as e be.',
      'Even the people wey dey abuse government every day quiet small today.',
      'One mama for market tell us: "If na so, make dem continue." We don write am down.',
      'Na the first good news this month. We dey manage am like fuel.',
      'Our editor say make we find wetin dey wrong with am. We still dey find.',
      'Hold your praise first. We go check am again for three months.',
    ],
    bad: [
      'Nigerians are reacting. Some of the reactions cannot be printed.',
      'We went to the motor park to ask what people think. They told us. At length.',
      'As usual, na we go suffer am. The people wey cause am get generator.',
      'Dem say make we dey patient. Patient don tire.',
      'The Villa has released a statement. We read it so you do not have to.',
      'Somebody for Abuja go soon tell us say na "global phenomenon".',
      'We call the ministry. Dem say the oga travel.',
      'If you dey find who to blame, form queue. E long.',
      'Na so e dey start. We don see this film before.',
      'Our reporter ask the minister one question. Security carry am commot.',
    ],
    grave: [
      'We are not making jokes about this one.',
      'The families are asking questions. So are we.',
    ],
  },
  loyal: {
    good: [
      'Observers across the political divide agree that only decisive leadership could have achieved it.',
      'The President, characteristically, gave the credit to Nigerians.',
      'Congratulatory messages have continued to pour into the Villa.',
      'It is a reminder, to those who needed one, of what steady hands can do.',
      'Critics were unavailable for comment, having been wrong.',
      'Market women in three states are reported to have danced.',
      'History, which is slow, will record what this newspaper is glad to report today.',
      'The opposition, typically, found something to complain about.',
    ],
    bad: [
      'The Presidency has urged Nigerians to disregard mischief makers and remain calm.',
      'Sources close to the Villa say the President is working round the clock.',
      'Stakeholders have commended the President\'s measured response.',
      'It would be unpatriotic to play politics with a matter of this kind.',
      'Those spreading panic should remember that the President inherited a difficult situation.',
      'Experts say the matter has been blown out of proportion by elements with an agenda.',
      'The President is said to be saddened, focused and undeterred, in that order.',
      'Well-meaning Nigerians are urged to give the administration the benefit of the doubt.',
    ],
    grave: [
      'The President has commiserated with the families and directed that no stone be left unturned.',
      'This newspaper joins the nation in mourning.',
    ],
  },
  hostile: {
    good: [
      'It took them long enough, and it cost more than they are saying.',
      'Readers will note that the announcement comes with an election in view.',
      'The government has done one of the things it was elected to do, and wants a parade.',
      'Even this was forced on them by pressure from this newspaper and the opposition.',
      'A government that gets one thing right in a year should not be allowed to dine out on it.',
      'We note the timing. We note it every time.',
      'Ask who was awarded the contract. Then ask again.',
      'The applause from the Villa\'s own newspaper can be heard from here.',
    ],
    bad: [
      'This newspaper warned of exactly this, in these pages, and was called alarmist.',
      'Nobody in the Villa will be held responsible. Nobody ever is.',
      'It is what happens when a government governs by press release.',
      'The President was unavailable for comment. The President is frequently unavailable.',
      'There is a word for a government that is surprised by everything. The word is not "government".',
      'They will set up a committee. The committee will ask for more time.',
      'Somebody will be redeployed. Nobody will be dismissed.',
      'The same people who brought you the last one have brought you this one.',
      'How many more of these before somebody in Abuja resigns? We are keeping count.',
    ],
    grave: [
      'There will be time to ask who failed these people. That time is soon.',
      'The government owes the country an account of what it knew.',
    ],
  },
};

/** What a minister says about news in their own brief. */
export const MINISTER_PROUD = [
  'I do not want to take the credit. I will only say that I was in the room.',
  'We said we would do it, and we have done it. I am told this is unusual.',
  'This is what happens when a ministry is allowed to work.',
  'I thank {MRP} for the enabling environment.',
  'The team has not slept in three months. I have, but I supervised.',
];
export const MINISTER_EXCUSE = [
  'We are on top of the situation.',
  'We are investigating the remote and immediate causes.',
  'The ministry inherited a very difficult file.',
  'It is premature to apportion blame, and I would ask that none be apportioned to me.',
  'There is no cause for alarm. There is, I accept, some cause for concern.',
  'I was not briefed.',
];
export const VILLA_LEAK = [
  'Nobody tells the President anything unwelcome. So nobody tells the President much.',
  'The meeting ended when the generator did.',
  'There are three factions in the Villa and the President belongs to none of them.',
  'We found out from your newspaper.',
];

/** Editorial lines, chosen by what the country looks like and who is writing. */
export const EDITORIALS: { when?: Cond; chronicle?: string; street?: string; stakeholder?: string; rejoinder?: string }[] = [
  { when: v('hardship', '>', 62), chronicle: 'The government asks for patience. Patience is a currency, and it is being spent faster than the naira.', street: 'Dem say make we manage. We don manage reach where manage sef don finish.', rejoinder: 'A government that cannot bring down the price of garri should stop holding summits about it.' },
  { when: v('hardship', '<', 38), chronicle: 'The numbers are, for once, moving in the right direction. The test of a government is what it does when they stop.', street: 'E don better small. We no go lie. But make dem no relax.', stakeholder: 'Those who predicted disaster owe the President an apology. We are not holding our breath.' },
  { when: v('nation.debt', '>', 85), chronicle: 'A country that spends most of its revenue on interest is not governing. It is renting time.', street: 'All the money wey Nigeria dey make, na debt e dey pay. Na our pikin go suffer am.', rejoinder: 'They have mortgaged the country and are arguing about the curtains.' },
  { when: v('nation.debt', '<', 55), chronicle: 'The debt is falling. It is the least visible achievement a government can have, and among the most useful.', stakeholder: 'The President has done what no predecessor dared: paid the bill.' },
  { when: v('nation.integrity', '<', 22), chronicle: 'Nobody in government appears to be embarrassed any more. That is new, and it is not an improvement.', street: 'Dem no dey even hide am again.', rejoinder: 'It is no longer corruption. It is the operating system.' },
  { when: v('nation.integrity', '>', 45), chronicle: 'Publishing the accounts is not the same as governing well. It is merely the first time it has been possible to tell.', street: 'At least this one dey show us the receipt.' },
  { when: v('bloc.party', '<', 35), chronicle: 'The President has an agenda. Whether the President has a party is a separate and more urgent question.', street: 'Even the party people no dey pick President call again.', rejoinder: 'The ruling party is ruling nothing, least of all itself.' },
  { when: v('nation.power', '>', 48), chronicle: 'Electricity has improved. The fact that this is remarkable says more than the improvement.', street: 'Light dey. We dey fear to talk am loud.', stakeholder: 'Generator sellers are the only Nigerians with a complaint, and we have no sympathy.' },
  { when: v('nation.jobs', '>', 48), chronicle: 'Factories are hiring. It has been so long that several had to be reminded how.', street: 'Work dey small small. Tell your cousin.' },
  { when: v('pc', '<', 15), chronicle: 'A President without political capital still has the office. The office, by itself, has never passed a bill.', street: 'President don weak. Everybody dey do anyhow.', rejoinder: 'The President is in office and not in power. The distinction is being noticed.' },
  { when: v('debt.arrears', '>', 3), chronicle: 'A state that does not pay its contractors or its pensioners is borrowing from the people least able to lend.', street: 'Government dey owe everybody. Na so so "we go pay".', rejoinder: 'They found money for a convoy. They have not found it for a pension.' },
  { when: v('fund.abroad', '>', 1.5), chronicle: 'The fund abroad is growing. Whether a hungry country should be saving is a fair question with no comfortable answer.', street: 'Money dey abroad dey grow. Belle dey here dey empty.', rejoinder: 'Our money is earning interest in London while our people queue for rice.', stakeholder: 'For the first time, Nigeria has savings its politicians cannot reach. The politicians are furious, which is the point.' },
  { when: v('oil.gap', '<', -10), chronicle: 'The budget assumed a price for oil that the market has declined to pay. Somebody will have to explain the difference.', rejoinder: 'They built a budget on hope. Hope is trading at a discount.' },
  { when: v('nation.security', '>', 55), chronicle: 'The roads are safer than they were. People have begun to travel at night again, which is how a country measures these things.', stakeholder: 'Nigerians are sleeping with both eyes closed. They know whom to thank.' },
  { when: v('nation.security', '<', 30), chronicle: 'There are parts of this country the government no longer governs. It should say so, and then say what it will do.', rejoinder: 'The President commands an army and controls a compound.' },
  { when: v('favours', '>=', 4), chronicle: 'Half of Abuja is said to owe the President something. Debts of that kind are collected in a hurry or not at all.' },
  { when: v('debts', '>=', 3), chronicle: 'The President is said to owe a number of people a number of things. They are patient men. They are not infinitely patient.', rejoinder: 'Ask not who governs. Ask who is owed.' },
  { chronicle: 'The administration will be judged on what is still standing when it leaves, not on what it announced.', street: 'Talk is cheap. Na the result we dey find.' },
  { chronicle: 'Every government promises to hit the ground running. The ground, in our experience, is patient.', street: 'Dem all promise. Na who deliver we dey count.' },
];

// ---------------------------------------------------------------- the small box

export const SIDEBARS: { kicker: string; text: string; when?: Cond }[] = [
  { kicker: 'VOX POP', text: '"I am not angry. I am just calculating." — a tailor in Mushin, on the price of everything.', when: v('hardship', '>', 55) },
  { kicker: 'VOX POP', text: '"Small small, it is getting better. I will not say it loud so they do not relax." — a spare-parts trader, Nnewi.', when: v('hardship', '<', 42) },
  { kicker: 'QUOTE OF THE WEEK', text: '"The situation is under control." — the Minister of Information, shortly before the situation.', when: v('approval', '<', 46) },
  { kicker: 'CORRECTION', text: 'Yesterday we reported that the committee had submitted its report. The committee has asked us to clarify that it has submitted a request for an extension.', when: v('counter.committees', '>=', 1) },
  { kicker: 'OVERHEARD', text: '"Is the meeting to discuss the problem, or to discuss the meeting?" — a permanent secretary, in a lift.', when: v('nation.capacity', '<', 45) },
  { kicker: 'BY THE NUMBERS', text: 'Presidential committees constituted since inauguration: we have stopped counting. Reports published: we are still at zero.', when: v('counter.committees', '>=', 3) },
  { kicker: 'VOX POP', text: '"Before, I was buying fuel and complaining. Now I am trekking and complaining. The complaining is constant." — a civil servant, Abuja.', when: { flag: 'policy.subsidy', is: 'removed' } },
  { kicker: 'EDITORIAL', text: 'A government that is not stealing should be the minimum, not the manifesto. But we note it, and we will check again next month.', when: v('nation.integrity', '>', 40) },
  { kicker: 'EDITORIAL', text: 'When every query is "politically motivated", the phrase stops meaning anything except that there is a query.', when: v('nation.integrity', '<', 24) },
  { kicker: 'OPPOSITION', text: '{OPP}: "This government has run out of ideas." Asked for an alternative, the answer was that it would be unveiled "at the appropriate time".', when: v('approval', '<', 50) },
  { kicker: 'VOX POP', text: '"We have light for six hours yesterday. I ironed everything in the house in case." — a schoolteacher, Kaduna.', when: { all: [v('nation.power', '>', 38), v('nation.power', '<', 55)] } },
  { kicker: 'VOX POP', text: '"NEPA brought light at 2am. Who are they bringing it for, the mosquitoes?" — a barber, Aba.', when: v('nation.power', '<', 32) },
  { kicker: 'VOX POP', text: '"I have sold my generator. My neighbour says I am tempting God." — a caterer, Ibadan.', when: v('nation.power', '>', 58) },
  { kicker: 'LETTER', text: 'Sir: I have applied for my pension since 2019. I am told my file is "receiving attention". I am 74. Kindly ask the attention to hurry.', when: v('debt.pensions', '>', 0.3) },
  { kicker: 'LETTER', text: 'Sir: My pension was paid on Tuesday, in full, with the arrears. I am writing because nobody at the bank would believe me.', when: v('debt.pensions', '<', 0.05) },
  { kicker: 'OVERHEARD', text: '"Stakeholders have been engaged." "Which ones?" "The ones who came." — outside a ministry conference room.', when: v('counter.stakeholders', '>=', 2) },
  { kicker: 'STREET POLL', text: 'We asked 50 people at Berger to name one minister. 31 named the Minister of Information. None of them was complimentary.', when: v('approval', '<', 52) },
  { kicker: 'VOX POP', text: '"They say the economy is growing. Let it grow reach my side." — a bus conductor, Ojota.', when: { all: [v('nation.jobs', '>', 40), v('hardship', '>', 50)] } },
  { kicker: 'VOX POP', text: '"My son got a job at the new factory. First person in our family with a payslip." — a widow, Aba.', when: v('nation.jobs', '>', 46) },
  { kicker: 'VOX POP', text: '"Three graduates in this house. All of them riding okada." — a retired teacher, Ilorin.', when: v('nation.jobs', '<', 34) },
  { kicker: 'VOX POP', text: '"We slept in the farm last night. First time in four years nobody came." — a yam farmer, Benue.', when: v('theatre.NC', '<', 48) },
  { kicker: 'VOX POP', text: '"We pay the bandits a levy to harvest. They give receipt." — a farmer, Zamfara.', when: v('theatre.NW', '>', 66) },
  { kicker: 'VOX POP', text: '"The market opens on Monday now. For two years it did not." — a trader, Onitsha.', when: v('theatre.SE', '<', 45) },
  { kicker: 'OVERHEARD', text: '"He has been to see the President three times this year. The President has been to see him once. That is the whole story." — a governor\'s aide.', when: v('bloc.party', '<', 45) },
  { kicker: 'CORRECTION', text: 'We reported that the Minister had "resigned". The Villa has asked us to say he was "reassigned to pursue other national interests". We are happy to say it.', when: v('count.min.failing', '>=', 1) },
  { kicker: 'BY THE NUMBERS', text: 'Reforms the government has delivered: {DONE}. Reforms on its list: 50. We are keeping the receipt.', when: v('turn', '>', 12) },
  { kicker: 'LETTER', text: 'Sir: The road in front of my house was commissioned in 2019. I would be grateful if somebody could now build it.', when: v('debt.contractors', '>', 0.8) },
  { kicker: 'STREET POLL', text: 'We asked 100 people whether things are better than last year. 41 said yes, 38 said no, and 21 asked whether we had come to share something.', when: { all: [v('hardship', '>', 42), v('hardship', '<', 58)] } },
  { kicker: 'EDITORIAL', text: 'It is possible to govern well here. We know because, this month, somebody did. We reserve the right to change our mind.', when: v('approval', '>', 56) },
  { kicker: 'OVERHEARD', text: '"If I had known the job was this much reading I would have stayed governor." — attributed.', when: { turn: [4, 20] } },
  { kicker: 'BY THE NUMBERS', text: 'Oil price the budget assumed: ${BENCH}. Oil price today: ${OIL}. The difference is somebody\'s salary.', when: v('oil.gap', '<', -8) },
  { kicker: 'BY THE NUMBERS', text: 'People the President is said to owe a favour: several. People who owe the President: fewer. This is the ratio to watch.', when: v('debts', '>=', 3) },
  { kicker: 'OVERHEARD', text: '"The Chief was not at the commissioning." "The Chief paid for the commissioning." — two aides, at a commissioning.', when: v('debts', '>=', 1) },
  { kicker: 'MARKET REPORT', text: 'A bag of rice has one price in every market in the country this week. Traders say this has never happened before and that they know exactly why.', when: v('granted.ty_trade', '==', 1) },
  { kicker: 'SCORECARD', text: 'The ministerial scorecards are public. Two ministers have complained about the methodology. They are the two at the bottom.', when: v('agenda.v4', '==', 1) },
  { kicker: 'VOX POP', text: '"They say there is money saved abroad for my grandchildren. My grandchildren are hungry now." — a grandmother, Sokoto.', when: { all: [v('fund.abroad', '>', 1), v('hardship', '>', 55)] } },
  { kicker: 'OVERHEARD', text: '"Which newspaper is it in?" "The one he owns." "Then it is true, or about to be." — two senators.', when: v('tycoon.ty_media', '<', 38) },
];

// ---------------------------------------------------------------- evergreen news for a slow month
// [broadsheet, street]. Each runs once, and only while it is true.

export const FILLERS: { h: [string, string]; when?: Cond }[] = [
  { h: ['FG REITERATES COMMITMENT TO DELIVERING DIVIDENDS OF DEMOCRACY', 'GOVERNMENT SAY DIVIDEND DEY COME. WE STILL DEY WAIT'], when: v('tracks.', '<', 3) },
  { h: ['REFINERY NOW {REFINERY}% COMPLETE — MINISTER', 'REFINERY DON REACH {REFINERY}%. SINCE WHEN?'], when: { all: [v('agenda.i5', '==', 0), { not: { flag: 'refinery.sold' } }] } },
  { h: ['COMMITTEE REQUESTS MORE TIME TO SUBMIT REPORT', 'COMMITTEE WAN MORE TIME. SHOCKER'], when: v('counter.committees', '>=', 1) },
  { h: ['STAKEHOLDERS\' SUMMIT ENDS WITH 14-POINT COMMUNIQUÉ', 'ANOTHER SUMMIT, ANOTHER COMMUNIQUÉ, ANOTHER BUFFET'], when: v('counter.stakeholders', '>=', 1) },
  { h: ['SENATE ADJOURNS PLENARY FOR TWO WEEKS', 'SENATORS DON GO HOLIDAY AGAIN'] },
  { h: ['MINISTER ASSURES NIGERIANS OF STEADY POWER "SOON"', '"SOON" — MINISTER. WHICH YEAR BE SOON?'], when: v('nation.power', '<', 42) },
  { h: ['GOVERNORS\' FORUM MEETS, CALLS FOR MORE ALLOCATION', 'GOVERNORS MEET, ASK FOR MORE MONEY. AS USUAL'], when: v('agenda.t5', '==', 0) },
  { h: ['ELECTORAL COMMISSION SAYS PORTAL UPGRADE IS "ON COURSE"', 'ELECTION PORTAL DEY UPGRADE. WE DON HEAR'], when: { termTurn: [20, 44] } },
  { h: ['FG INAUGURATES TASK FORCE ON EASE OF DOING BUSINESS', 'NEW TASK FORCE TO MAKE BUSINESS EASY. FORM NA 14 PAGES'], when: v('agenda.i1', '==', 0) },
  { h: ['MINISTER COMMISSIONS BOREHOLE, HAILS "MILESTONE"', 'MINISTER FLY COME COMMISSION ONE BOREHOLE'], when: v('nation.capacity', '<', 48) },
  { h: ['HOUSE PANEL SUMMONS AGENCY HEAD OVER UNSPENT FUNDS', 'AGENCY OGA NO SHOW FOR HOUSE AGAIN'] },
  { h: ['FG RECEIVES REPORT OF PANEL ON PREVIOUS PANEL\'S REPORT', 'REPORT ON THE REPORT DON LAND'], when: v('counter.committees', '>=', 2) },
  { h: ['INDEPENDENCE ANNIVERSARY TO BE "LOW-KEY" — FG', 'LOW-KEY CELEBRATION WEY COST ₦2BN'], when: { month: [9, 10] } },
  { h: ['CENSUS POSTPONED AGAIN, NEW DATE "TO BE COMMUNICATED"', 'CENSUS DON SHIFT AGAIN. WE NO SABI HOW MANY WE BE'], when: v('active.census', '==', 0) },
  { h: ['FG, STATES TRADE BLAME OVER UNPAID COUNTERPART FUNDS', 'FEDERAL AND STATE DEY POINT FINGER'] },
  { h: ['MINISTRY RETURNS ₦4BN UNSPENT; CANNOT SAY WHAT IT WAS FOR', 'MINISTRY NO FIT SPEND MONEY, NO FIT EXPLAIN AM'], when: v('nation.capacity', '<', 42) },
  { h: ['AIRPORT RUNWAY LIGHTS FAIL; FLIGHTS DIVERTED TO NEIGHBOURING COUNTRY', 'PLANE WEY DEY COME ABUJA LAND FOR ANOTHER COUNTRY'], when: v('nation.power', '<', 40) },
  { h: ['SENATE CONSTITUTES AD-HOC COMMITTEE ON AD-HOC COMMITTEES', 'COMMITTEE TO COUNT THE COMMITTEES'] },
  { h: ['GOVERNOR COMMISSIONS PEDESTRIAN BRIDGE, DECLARES PUBLIC HOLIDAY', 'PUBLIC HOLIDAY BECAUSE OF ONE BRIDGE'] },
  { h: ['EX-GOVERNORS DEMAND UPWARD REVIEW OF THEIR PENSIONS', 'EX-GOVERNORS WAN MORE PENSION. PENSIONERS DEY QUEUE'], when: v('debt.pensions', '>', 0.2) },
  { h: ['AGENCY SPENDS ₦900M ON "SENSITISATION" AGAINST WASTE', '₦900M TO TELL US NO WASTE MONEY'], when: v('nation.integrity', '<', 40) },
  { h: ['LAWMAKERS REJECT BILL TO PUBLISH THEIR ALLOWANCES', 'SENATORS NO WAN MAKE WE KNOW THEIR SALARY'] },
  { h: ['FG LAUNCHES 25-YEAR DEVELOPMENT PLAN; PREVIOUS ONE HAS 11 YEARS LEFT', 'NEW 25-YEAR PLAN. THE OLD ONE NEVER EXPIRE'] },
  { h: ['STATE DECLARES WORK-FREE DAY TO WELCOME FEDERAL DELEGATION', 'NO WORK TODAY: ABUJA PEOPLE DEY COME'] },
  { h: ['PORT AUTHORITY SAYS CONGESTION IS "A SIGN OF ECONOMIC ACTIVITY"', 'TRAFFIC NA SIGN SAY ECONOMY DEY WORK — PORT OGA'], when: v('agenda.i1', '==', 0) },
  { h: ['MINISTER ATTENDS CONFERENCE ON REDUCING FOREIGN TRAVEL, ABROAD', 'DEM TRAVEL GO ABROAD GO LEARN HOW TO STOP TRAVEL'] },
  { h: ['NATIONAL ASSEMBLY COMPLEX RENOVATION NOW IN FIFTH YEAR', 'DEM STILL DEY RENOVATE ASSEMBLY SINCE'] },
  { h: ['TRADITIONAL RULERS SEEK CONSTITUTIONAL ROLE, AGAIN', 'KABIYESI DEM WAN ENTER CONSTITUTION'] },
  { h: ['ELECTRICITY FIRM BILLS CUSTOMER FOR MONTH HE WAS DISCONNECTED', 'NO LIGHT, BUT BILL COME'], when: v('nation.power', '<', 48) },
  { h: ['FG TO HOLD RETREAT ON OUTCOMES OF LAST RETREAT', 'RETREAT TO DISCUSS THE RETREAT'] },
];

// ---------------------------------------------------------------- stories that run over several months

export interface StoryPart { chronicle: string; street: string; body: string; fx?: Fx[] }

export interface StoryDef {
  id: string;
  topic: Topic;
  /** The series stops if this stops being true. */
  alive: Cond;
  /** Months between parts. */
  gap: number;
  parts: StoryPart[];
  /** Printed if the President removes the cause before the series ends. */
  closed?: { chronicle: string; street: string; body: string; fx?: Fx[] };
}

export const STORIES: StoryDef[] = [
  {
    id: 'drawer', topic: 'scandal', gap: 2, alive: v('exposure.total', '>', 0),
    parts: [
      { chronicle: 'QUESTIONS OVER PAYMENTS FROM VILLA ACCOUNT', street: 'WHO DEY COLLECT MONEY FROM VILLA ACCOUNT?', body: 'Part one of three. Bank records seen by this newspaper show regular withdrawals from an account controlled by the Presidency, described only as "operational". The Villa says all spending is lawful.', fx: [['pressure.scandalHeat', 4]] },
      { chronicle: 'THE VILLA ACCOUNT: WHERE THE MONEY WENT', street: 'VILLA MONEY: SEE WHERE E GO', body: 'Part two of three. The withdrawals were made in cash, on the same day each month, and signed for by the same official. Two of the recipients sit in the National Assembly.', fx: [['pressure.scandalHeat', 6], ['bloc.press', -3]] },
      { chronicle: 'THE VILLA ACCOUNT: THE NAMES', street: 'VILLA MONEY: NA THESE PEOPLE COLLECT AM', body: 'Part three of three. This newspaper today publishes the names. The Presidency was given a week to respond and did not.', fx: [['pressure.scandalHeat', 10], ['approval', -3], ['bloc.establishment', -3]] },
    ],
  },
  {
    id: 'pensioners', topic: 'labour', gap: 2, alive: v('debt.pensions', '>', 0.2),
    parts: [
      { chronicle: 'THE QUEUE: A WEEK AMONG THE PENSIONERS', street: 'THE QUEUE: OLD PEOPLE DEY SLEEP FOR ROAD', body: 'Part one of three. Outside the pension office in Abuja, four hundred retired civil servants wait to be "verified" for money the state has owed them for up to six years.', fx: [['bloc.street', -2]] },
      { chronicle: 'THE QUEUE: THE ONES WHO DID NOT LIVE TO COLLECT', street: 'THE QUEUE: SOME DON DIE DEY WAIT', body: 'Part two of three. This newspaper has traced nineteen pensioners who died after joining the queue. Their files remain open. Their families are told to bring the deceased for verification.', fx: [['approval', -1.5], ['bloc.street', -3]] },
      { chronicle: 'THE QUEUE: WHERE THE PENSION MONEY WENT', street: 'THE QUEUE: WHO CHOP THE PENSION?', body: 'Part three of three. The money was released twice. It did not arrive twice. The officials responsible have been redeployed.', fx: [['pressure.scandalHeat', 5], ['approval', -1.5]] },
    ],
    closed: { chronicle: 'THE QUEUE IS GONE', street: 'THE QUEUE DON CLEAR. PENSIONERS DON COLLECT', body: 'This newspaper began a series on the pensioners waiting outside the pension office. It ends early: they have been paid, in full, and the pavement is empty.', fx: [['approval', 1.5], ['bloc.press', 3]] },
  },
  {
    id: 'minister', topic: 'scandal', gap: 2, alive: v('story.minister', '>=', 0),
    parts: [
      { chronicle: 'MINISTRY CONTRACTS WENT TO FIRMS LINKED TO MINISTER\'S AIDES', street: 'MINISTER BOYS DON COLLECT ALL THE CONTRACT', body: 'Part one of three. Eleven companies awarded contracts by the ministry share two addresses and one telephone number. The Minister says he does not involve himself in procurement.', fx: [['pressure.scandalHeat', 4]] },
      { chronicle: 'HOW ₦40BN LEFT THE MINISTRY', street: '₦40BN WAKA COMMOT FROM MINISTRY', body: 'Part two of three. Payments were approved on a Friday and cleared before the banks reopened. The projects they were for have not been located.', fx: [['pressure.scandalHeat', 6], ['nation.integrity', -1]] },
      { chronicle: 'THE MINISTER\'S HOUSES', street: 'SEE THE MANSIONS WEY MINISTER BUILD', body: 'Part three of three. Four properties, in three cities, bought in eighteen months on a minister\'s salary. The President has not commented.', fx: [['pressure.scandalHeat', 8], ['approval', -2], ['bloc.press', -3]] },
    ],
    closed: { chronicle: 'MINISTER AT CENTRE OF CONTRACTS SERIES LEAVES OFFICE', street: 'THE MINISTER DON GO', body: 'The minister whose contracts this newspaper has been examining is no longer in the cabinet. We will continue to ask where the money is.', fx: [['bloc.press', 3]] },
  },
  {
    id: 'licence', topic: 'money', gap: 3, alive: v('turn', '>', 0),
    parts: [
      { chronicle: 'THE FRIDAY GAZETTE: WHO GOT WHAT FROM THE PRESIDENT', street: 'BIG MAN COLLECT LICENCE FOR FRIDAY NIGHT', body: 'Part one of two. A licence worth billions was gazetted late on a Friday, without tender, to a businessman who financed the ruling party. The Presidency says due process was followed.', fx: [['pressure.scandalHeat', 4], ['nation.integrity', -1]] },
      { chronicle: 'THE FRIDAY GAZETTE: WHAT IT COST YOU', street: 'THE LICENCE: NA YOU DEY PAY FOR AM', body: 'Part two of two. This newspaper has calculated what the licence adds to the price of a household\'s shopping. The businessman declined to comment. He has since been seen at the Villa.', fx: [['approval', -2], ['bloc.street', -3]] },
    ],
  },
];

export const STORY_BY_ID = Object.fromEntries(STORIES.map((x) => [x.id, x]));

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
