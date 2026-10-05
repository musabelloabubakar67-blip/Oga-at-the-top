import type { Cond, GameEvent } from '../../engine/types';

// THE FORMER PRESIDENT AND THE VICE PRESIDENT
// Two people who are not in the cabinet and cannot be sacked from it. The one
// before you wants things and remembers how you answered. The one beside you
// may be the one after you, or the one against you.

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });
const active = v('pred.active', '==', 1);

export const PREDECESSOR_FILES: GameEvent[] = [
  {
    id: 'pred.son', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2, max: 1, weight: 9,
    when: { all: [active, v('pred.same', '==', 1), { turn: [4, 30] }] },
    office: 'Office of the Chief of Staff', stamp: 'CONFIDENTIAL',
    title: '{PRED} has a son',
    body: [
      '{PRED} has written, by hand, about a son who has "served the party faithfully" and would serve the country as a Minister of State. The letter mentions the son\'s qualifications in one line and the father\'s support for your candidacy in four.',
    ],
    reads: [{ role: 'sap', good: 'The former President still holds the elders, {SIR}. A board seat would say thank you without saying yes.' }],
    choices: [
      { id: 'minister', label: 'Make the son a Minister of State', outcomes: [{ result: 'The son is sworn in. The father attends, and tells everyone at the reception what a good listener you are.', fx: [['pred.rel', 18], ['bloc.party', 3], ['nation.integrity', -2], ['bloc.press', -3]], flags: { 'pred.son': 'minister' }, later: [{ after: [10, 14], fx: [['pressure.scandalHeat', 6]], label: 'The Minister of State\'s department awards its contracts to his friends.', note: ['MINISTER OF STATE\'S CONTRACTS UNDER SCRUTINY', 'OGA PIKIN DON START TO CHOP'] }], news: ['FORMER PRESIDENT\'S SON NAMED MINISTER OF STATE', 'PAPA PIKIN DON ENTER CABINET'], archive: 'Made the former President\'s son a Minister of State.', sig: 2 }] },
      { id: 'board', label: 'A seat on a parastatal board instead', outcomes: [{ result: 'The son chairs the board of an agency nobody visits. The father understands the message and accepts it, mostly.', fx: [['pred.rel', 6], ['nation.integrity', -0.5]], flags: { 'pred.son': 'board' }, news: ['FORMER PRESIDENT\'S SON NAMED TO CHAIR AGENCY BOARD', 'BABA PIKIN DON GET BOARD CHAIR'], archive: 'Gave the former President\'s son a board seat.', sig: 1 }] },
      { id: 'refuse', label: 'Decline, politely and in writing', outcomes: [{ result: 'The letter is courteous. The reply, when it comes, is from the father\'s spokesman, to a newspaper.', fx: [['pred.rel', -15], ['nation.integrity', 1]], flags: { 'pred.son': 'refused' }, news: ['{PRED}\'S CAMP SAYS PRESIDENCY SNUBBED FAMILY', 'FORMER PRESIDENT PEOPLE DEY VEX OVER THE PIKIN'], archive: 'Declined to appoint the former President\'s son.', sig: 1 }] },
    ],
  },
  {
    id: 'pred.audit', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3, max: 1, weight: 10,
    when: { all: [active, { turn: [6, 30] }, { not: { flag: 'precedent.probe' } }] },
    office: 'Office of the Auditor-General', stamp: 'CONFIDENTIAL',
    title: 'The audit of the last year',
    body: [
      'The Auditor-General has finished the report on the final year of {PRED}\'s government. It finds ₦310bn spent without appropriation, most of it in the six weeks before the handover.',
      '{PRED} has telephoned the Chief of Staff to suggest the report be "reviewed for accuracy" before it is laid before the Assembly.',
    ],
    reads: [
      { role: 'cos', good: 'Publish it and you have an enemy for the rest of your life, {SIR}. Bury it and you have a witness to the burial.' },
    ],
    choices: [
      { id: 'publish', label: 'Lay it before the Assembly as it is', outcomes: [{ result: 'The report is published. The former President calls it "the work of people who were not there".', fx: [['pred.rel', -25], ['nation.integrity', 3], ['bloc.press', 4]], flags: { 'pred.audit': 'published' }, later: [{ after: [4, 8], fx: [['nation.fiscalSpace', 0.1]], label: 'Some of the unappropriated money is recovered from contractors.', note: ['₦100BN RECOVERED AFTER AUDIT OF LAST GOVERNMENT', 'DEM DON RECOVER SMALL FROM THE OLD MONEY'] }], news: ['AUDIT: ₦310BN SPENT WITHOUT APPROVAL IN LAST GOVERNMENT\'S FINAL YEAR', 'OLD GOVERNMENT SPEND MONEY WEY NOBODY APPROVE'], archive: 'Published the audit of the last government\'s final year.', sig: 2 }] },
      { id: 'review', label: 'Send it back for review', outcomes: [{ result: 'The report goes back to the Auditor-General\'s office, where it stays. The former President sends a note of thanks, which is itself a kind of evidence.', fx: [['pred.rel', 15], ['nation.integrity', -3]], flags: { 'pred.audit': 'buried' }, exposure: { kind: 'tolerated', amount: 0, witnesses: ['cos'], trail: 1 }, archive: 'Sent the audit of the last government back for "review".', sig: 2 }] },
    ],
  },
  {
    id: 'pred.state', kind: 'standalone', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 2, max: 1, weight: 7,
    when: { all: [active, v('pred.rel', '>=', 35), { turn: [8, 40] }] },
    office: 'Federal Ministry of Works', stamp: 'ROUTINE',
    title: 'A road to the former President\'s home town',
    body: [
      'The federal road to {PRED}\'s home town was started six years ago and is two-thirds done. {PRED} turns seventy in four months and has mentioned, to several people, how fine it would be to drive home on it.',
    ],
    reads: [{ role: 'sap', good: 'It is a real road, {SIR}, and the people on it are real voters. It is also a birthday present.' }],
    choices: [
      { id: 'finish', label: 'Finish it before the birthday', naira: 0.15, outcomes: [{ result: 'The road is finished in time. The former President cuts the ribbon and thanks you by name in the speech, twice.', fx: [['pred.rel', 10], ['nation.jobs', 0.5]], flags: { 'pred.road': true }, news: ['ROAD TO FORMER PRESIDENT\'S HOME TOWN COMPLETED', 'BABA ROAD DON FINISH BEFORE BIRTHDAY'], archive: 'Finished the road to the former President\'s home town.', sig: 1 }] },
      { id: 'queue', label: 'It waits its turn with the other roads', outcomes: [{ result: 'The road waits. The birthday is celebrated at a hotel in Abuja instead, and the speeches mention patience.', fx: [['pred.rel', -8]], flags: { 'pred.road': false }, quiet: 'Leaving a road in the queue is not announced.', archive: 'Left the former President\'s road in the queue.', sig: 1 }] },
    ],
  },
  {
    id: 'pred.speech', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, max: 2, cooldown: 14, weight: 9,
    when: { all: [active, v('pred.rel', '<', 30), { turn: [6] }] },
    office: 'Office of the Special Adviser, Political Matters', stamp: 'URGENT',
    title: '{PRED} gives a lecture',
    body: [
      { when: v('count.pred.speech', '<', 2), text: '{PRED} delivered the annual lecture of a university\'s alumni association yesterday. The subject was "Leadership in Difficult Times". The examples of poor leadership were all from the last eighteen months.' },
      { when: v('count.pred.speech', '<', 2), text: 'Three of your governors were in the front row.' },
      // The second lecture answers what you did about the first.
      { when: v('count.pred.speech', '>=', 2), text: '{PRED} has lectured again, this time at a business school, on "Promises and Their Keepers". Five of your governors were in the front row.' },
      { when: { all: [v('count.pred.speech', '>=', 2), { flag: 'pred.visited' }] }, text: 'He mentioned your afternoon on his veranda, kindly, and said that courtesy is not a policy.' },
      { when: { all: [v('count.pred.speech', '>=', 2), { flag: 'pred.feud' }] }, text: 'A new section answers your spokesman\'s rebuttal, point by point, at greater length than the rebuttal.' },
      { when: { all: [v('count.pred.speech', '>=', 2), { flag: 'pred.ignored' }] }, text: 'The pamphlet of the first lecture is in its third printing. He thanked the government for its silence, which he said spoke for itself.' },
    ],
    reads: [{ role: 'sap', good: 'Answer him and you make it a fight between equals, {SIR}. Ignore him and the governors decide you are afraid of him.' }],
    choices: [
      { id: 'visit', label: 'Fly down and call on him', pc: 3, outcomes: [{ result: 'You spend an afternoon on his veranda. He tells you everything you are doing wrong, and seems lighter for it.', fx: [['pred.rel', 15], ['bloc.party', 2]], flags: { 'pred.visited': true }, later: [{ after: [3, 5], fx: [['bloc.party', 1]], label: 'The former President tells the elders you came to him.' }], news: ['PRESIDENT CALLS ON {PRED} AFTER CRITICAL LECTURE', 'PRESIDENT GO SEE BABA FOR HIM HOUSE'], archive: 'Called on the former President after a hostile lecture.', sig: 1 }] },
      { id: 'answer', label: 'Have your spokesman answer, point by point', outcomes: [{ result: 'The rebuttal is accurate and long. The former President\'s reply is short and quoted more.', fx: [['pred.rel', -8], ['bloc.press', -1], ['bloc.party', -2]], flags: { 'pred.feud': true }, news: ['PRESIDENCY ANSWERS {PRED}, POINT BY POINT', 'VILLA DON ANSWER BABA. BABA GO ANSWER BACK'], archive: 'Answered the former President in public.', sig: 1 }] },
      { id: 'ignore', label: 'Say nothing', outcomes: [{ result: 'You say nothing. The lecture is printed as a pamphlet.', fx: [['bloc.party', -2], ['bloc.press', -1]], flags: { 'pred.ignored': true }, quiet: 'Silence. The pamphlet of the lecture is the only news.', archive: 'Ignored the former President\'s criticism.', sig: 1 }] },
    ],
  },
  {
    id: 'pred.campaign', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2, max: 1, weight: 10,
    when: { all: [active, v('pred.same', '==', 1), v('pred.rel', '>=', 65), { term: 1 }, { termTurn: [30, 40] }] },
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: '{PRED} offers to campaign',
    body: [
      '{PRED} has offered to campaign for you in the home zone and wherever else you would like. The offer is generous and will be remembered by the person who made it.',
    ],
    reads: [{ role: 'sap', good: 'The old man still fills a stadium in his own zone, {SIR}. Elsewhere he reminds people of the last government.' }],
    choices: [
      { id: 'home', label: 'Yes: in his home zone', outcomes: [{ result: 'He campaigns in his zone for three weeks and draws crowds bigger than yours.', fx: [['pred.rel', 5], ['bloc.party', 3]], flags: { 'pred.campaigns': 'home' }, news: ['{PRED} TO CAMPAIGN FOR PRESIDENT IN HOME ZONE', 'BABA DON ENTER CAMPAIGN FOR PRESIDENT'], archive: 'Accepted the former President\'s help in his home zone.', sig: 1 }] },
      { id: 'no', label: 'Thank him and keep him off the platform', outcomes: [{ result: 'He understands, he says. He tells the elders he offered.', fx: [['pred.rel', -6]], flags: { 'pred.campaigns': 'declined' }, quiet: 'A private conversation. He tells the elders, not the press.', archive: 'Declined the former President\'s offer to campaign.', sig: 1 }] },
    ],
  },
  // ---------------------------------------------------------------- what the Assembly built
  {
    id: 'budget.projects', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3, max: 1, weight: 10,
    when: { all: [v('counter.proj.commissioned', '>=', 150), { turn: [18] }, { not: { flag: 'projects.audited' } }] },
    office: 'Office of the Auditor-General', stamp: 'CONFIDENTIAL',
    title: 'The constituency projects',
    body: [
      'A newspaper has spent six months visiting the members\' constituency projects in your budgets: boreholes, town halls, skills centres, "empowerment" buses. It has found most of them. Many are a signboard in a field.',
      'The Auditor-General offers to verify every project before the next tranche is released. The Appropriations chairman says this would be "an assault on the independence of the legislature".',
    ],
    reads: [{ role: 'sap', good: 'Every senator has a signboard in a field somewhere, {SIR}. Audit the signboards and you audit the Senate.' }],
    choices: [
      { id: 'audit', label: 'Verify every project before another naira is released', pc: 6, outcomes: [{ result: 'The verification starts. A third of the projects are found to exist. Contractors discover that signboards are no longer enough, and some of the boreholes start producing water.', fx: [['nation.integrity', 3], ['bloc.press', 3], ['person.sen_approp', -12]], ops: [['senators', -5]], flags: { 'projects.audited': true }, later: [{ after: [6, 9], fx: [['nation.fiscalSpace', 0.08], ['bloc.street', 2]], label: 'Unfinished projects are finished or the money returned.', note: ['CONSTITUENCY PROJECTS: ₦80BN RETURNED AFTER AUDIT', 'BOREHOLE WEY NO GET WATER, DEM DON FIX AM'] }], news: ['FG ORDERS VERIFICATION OF EVERY CONSTITUENCY PROJECT', 'DEM WAN COUNT SENATORS PROJECT ONE BY ONE'], archive: 'Ordered every constituency project verified before payment.', sig: 2 }] },
      { id: 'publish', label: 'Publish the list, project by project, and let voters judge', outcomes: [{ result: 'The list goes online, with each senator\'s name beside each project. Several senators visit their constituencies for the first time in a year.', fx: [['bloc.press', 4], ['nation.integrity', 1.5]], ops: [['senators', -3]], flags: { 'projects.published': true }, archive: 'Published every constituency project with its sponsor.', sig: 2 }] },
      { id: 'leave', label: 'It is the Assembly\'s business', outcomes: [{ result: 'You leave it to the Assembly, which thanks you. The newspaper runs the series anyway.', fx: [['pressure.scandalHeat', 5], ['bloc.press', -2]], ops: [['senators', 2]], flags: { 'projects.left': true }, archive: 'Left the constituency projects to the Assembly.', sig: 1 }] },
    ],
  },
  // ---------------------------------------------------------------- the Vice President
  {
    id: 'vp.camp', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, max: 1, weight: 11,
    when: { all: [v('vp.rel', '<', 40), v('vp.ambition', '>=', 1), { turn: [10] }] },
    office: 'Office of the Chief of Staff', stamp: 'SECRET',
    title: 'The Vice President\'s people',
    body: [
      'A support group for {VP} has opened offices in eleven states. Its posters do not mention you. Several of your own governors have been seen at its launches.',
      '{VP_SHORT} says the group is "independent" and "a sign of the unity of our party".',
    ],
    reads: [{ role: 'cos', good: 'Give the Vice President something to do, {SIR}, or the Vice President will find something.' }],
    choices: [
      { id: 'brief', label: 'Hand the Vice President the economic council', pc: 3, outcomes: [{ result: 'The Vice President takes the council and is too busy to attend launches for a while.', fx: [['vp.rel', 12]], ops: [['vpbrief']], archive: 'Gave the Vice President a portfolio to end a rival campaign.', sig: 2 }] },
      { id: 'warn', label: 'Have the party chairman call the governors', outcomes: [{ result: 'The governors stop attending. The offices stay open.', fx: [['vp.rel', -10], ['bloc.party', -2]], flags: { 'vp.warned': true }, quiet: 'The chairman\'s calls to the governors are made in private.', archive: 'Warned the governors off the Vice President\'s support group.', sig: 1 }] },
      { id: 'leave', label: 'Leave it', outcomes: [{ result: 'You leave it. The group holds a rally in the Vice President\'s home zone the following month.', fx: [['bloc.party', -3]], flags: { 'vp.camp': true }, later: [{ after: [4, 6], fx: [['bloc.party', -3], ['vp.rel', -5]], label: 'The Vice President\'s support group now has a chairman in every zone.' }], quiet: 'Doing nothing is not news. The rally that follows is reported when it happens.', archive: 'Left the Vice President\'s support group alone.', sig: 1 }] },
    ],
  },
  {
    id: 'vp.ticket', kind: 'calendar', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, max: 1, weight: 10,
    when: { all: [{ term: 1 }, { termTurn: [26, 30] }, v('vp.rel', '<', 50)] },
    office: 'Party Secretariat', stamp: 'CONFIDENTIAL',
    title: 'The ticket for the second term',
    body: [
      'The party chairman asks, delicately, whether {VP} will be on the ticket again. Some of the governors would prefer a different running mate. {VP_SHORT} has heard that the question is being asked.',
      'A new running mate can be chosen from the Politics screen, under Your advisers, until a few months before the election.',
    ],
    reads: [{ role: 'sap', good: 'Dropping a running mate costs you the zone for a season, {SIR}. Keeping a disloyal one costs you for four years.' }],
    choices: [
      { id: 'keep', label: 'Say publicly that the ticket stays as it is', outcomes: [{ result: 'You say it at a rally. {VP_SHORT} is grateful, and a little surprised.', fx: [['vp.rel', 15], ['bloc.party', -1]], flags: { 'vp.kept': true }, news: ['PRESIDENT: {VP_SHORT} STAYS ON THE TICKET', 'PRESIDENT SAY E AND {VP_SHORT} STILL DEY TOGETHER'], archive: 'Kept the Vice President on the ticket.', sig: 1 }] },
      { id: 'open', label: 'Say nothing yet', outcomes: [{ result: 'You say nothing. The question stays open, and so do the governors\' offers.', fx: [['vp.rel', -5]], flags: { 'vp.open': true }, quiet: 'Saying nothing.', archive: 'Left the question of the running mate open.', sig: 1 }] },
    ],
  },
];
