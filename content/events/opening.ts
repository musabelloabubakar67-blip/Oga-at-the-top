import type { GameEvent } from '../../engine/types';

// THE OPENING'S PROMISES FALL DUE (plan 02)
// Each route to power and each way of paying for the campaign left a stated
// expectation, stored as a commitment with an agreed test. Where nothing in the
// country measures it already, one of these files puts the decision on the desk
// and sets the flag the commitment is judged on.

export const OPENING_FILES: GameEvent[] = [
  {
    id: 'start.coalition_ministries', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, topic: 'politics',
    when: { all: [{ flag: 'route', is: 'coalition' }, { turn: [4] }] }, weight: 30, max: 1,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'The partners have come for their ministries',
    body: [
      'Before the election you agreed to give the coalition partners four ministries within the first year. {SENPRES} has arrived with the list, and with the partners\' leaders, who have all brought their own copies.',
      'Four ministers would have to go to make room. At least two of them are doing well.',
    ],
    reads: [
      { role: 'sap', good: 'A coalition is a promise renewed every day, {SIR}. Break this one and every partner starts negotiating with the opposition by Friday.' },
      { role: 'cos', good: 'The names on that list were chosen for loyalty to the partners, not for the briefs. The ministries will notice.' },
    ],
    choices: [
      {
        id: 'four', label: 'Give them all four, as agreed', pc: 4,
        outcomes: [{
          result: 'Four ministers are thanked and four partners\' nominees are sworn in on the same morning. The coalition holds. Two of the ministries slow down while the new people find the files.',
          fx: [['bloc.party', 6], ['nation.capacity', -3], ['person.sen_pres', 8], ['person.sen_lead', 4]],
          flags: { 'coalition.ministries': 'kept' },
          news: ['COALITION PARTNERS SWORN IN TO FOUR MINISTRIES', 'PARTNERS DON COLLECT THEIR FOUR MINISTRIES'],
          archive: 'Gave the coalition partners the four ministries promised before the election.', sig: 2,
        }],
      },
      {
        id: 'two', label: 'Offer two ministries and an agency each',
        outcomes: [{
          result: 'The partners take what is offered and describe it, on the record, as "a first instalment". Off the record they describe it differently.',
          fx: [['bloc.party', 1], ['nation.capacity', -1.5], ['person.sen_pres', -4]],
          flags: { 'coalition.ministries': 'partial' },
          news: ['COALITION PARTNERS ACCEPT TWO MINISTRIES "FOR NOW"', 'PARTNERS COLLECT HALF. DEM SAY NA FIRST INSTALMENT'],
          archive: 'Gave the coalition partners half the ministries promised.', sig: 2,
        }],
      },
      {
        id: 'refuse', label: 'Tell them the cabinet stays as it is',
        outcomes: [{
          result: 'The partners leave without a statement. Two of them are seen at Senator Dandume\'s house that evening.',
          fx: [['bloc.party', -8], ['person.sen_pres', -14], ['rival.strong', 5], ['nation.capacity', 1]],
          flags: { 'coalition.ministries': 'broken' },
          news: ['COALITION IN CRISIS AS PRESIDENT REFUSES PARTNERS\' MINISTRIES', 'PRESIDENT DON DUMP HIM PARTNERS'],
          archive: 'Refused the coalition partners the ministries promised before the election.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'start.cost_of_governance', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, topic: 'money',
    when: { all: [{ flag: 'route', is: 'mobilisation' }, { turn: [5] }] }, weight: 30, max: 1,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: 'The promise on the tape',
    body: [
      'The campaign promised to cut the cost of running the government within a year. The clip is being played again on every station: you, at the final rally, holding up a convoy key.',
      'The Chief of Staff has three options on one page. The cheapest to announce is the least to do.',
    ],
    reads: [
      { role: 'cos', good: 'Merging the agencies saves real money, {SIR}, and every agency has a senator who will defend it.' },
      { role: 'fin', good: 'The convoy is a photograph. The agencies are a budget line.', weak: 'Any cut will reassure the markets, {SIR}.' },
    ],
    choices: [
      {
        id: 'merge', label: 'Merge the duplicated agencies and cut the Villa\'s own budget', pc: 6,
        outcomes: [{
          result: 'Thirty-one agencies become twelve. The Villa\'s budget is cut by a fifth, starting with the Villa. The senators who chaired the abolished boards take it personally.',
          fx: [['bonus.fiscal', 0.006], ['bloc.street', 5], ['bloc.press', 3], ['bloc.villa', -4], ['bloc.party', -3], ['nation.capacity', -1]],
          flags: { 'promise.cost_cut': 'kept' },
          news: ['31 AGENCIES MERGED INTO 12 IN COST-CUTTING DRIVE', 'PRESIDENT DON CUT GOVERNMENT SIZE. E NO BE TALK'],
          archive: 'Kept the campaign promise to cut the cost of government: merged agencies and cut the Villa budget.', sig: 3,
        }],
      },
      {
        id: 'convoy', label: 'Cut the convoy and the foreign trips, and announce it',
        outcomes: [{
          result: 'The convoy shrinks to six cars. The announcement is warmly received. Within the month a newspaper adds up the saving and prints it beside the cost of one agency nobody uses.',
          fx: [['bloc.street', 2], ['bloc.press', -1]],
          flags: { 'promise.cost_cut': 'partial' },
          news: ['PRESIDENT CUTS CONVOY, FOREIGN TRAVEL', 'CONVOY DON SHORT. THE AGENCIES STILL DEY'],
          archive: 'Cut the convoy and called it a cut in the cost of government.', sig: 1,
        }],
      },
      {
        id: 'drop', label: 'Say the economy needs the spending now',
        outcomes: [{
          result: 'The clip is played one more time, alongside the statement. The volunteers who carried the campaign start a petition.',
          fx: [['bloc.street', -8], ['bloc.press', -5], ['approval', -2]],
          flags: { 'promise.cost_cut': 'broken' },
          news: ['PRESIDENT SHELVES PLEDGE TO CUT GOVERNMENT COSTS', 'THE PROMISE WEY E MAKE FOR RALLY DON WAKA'],
          archive: 'Dropped the campaign promise to cut the cost of government.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'start.campaign_accounts', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2, topic: 'scandal',
    when: { all: [{ flag: 'financier', is: 'small' }, { turn: [4] }] }, weight: 30, max: 1,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'The campaign\'s accounts',
    body: [
      'You promised to publish the campaign\'s accounts, contributor by contributor, within six months. The treasurer has finished them.',
      'Two million small gifts, as advertised. And eleven larger ones, routed through supporters\' clubs, from people who have since asked for meetings.',
    ],
    reads: [
      { role: 'sap', good: 'Publish everything and the eleven become a story for a week, {SIR}. Publish all but the eleven and they become a story for the rest of the term.' },
    ],
    choices: [
      {
        id: 'publish', label: 'Publish every line, the eleven included',
        outcomes: [{
          result: 'The accounts go online in full. The eleven are on page four. For a week the papers write about them; then the papers write that nobody else has ever done this.',
          fx: [['nation.integrity', 2], ['bloc.press', 4], ['pressure.scandalHeat', 2]],
          flags: { 'campaign.accounts': 'published' },
          news: ['PRESIDENT PUBLISHES FULL CAMPAIGN ACCOUNTS', 'PRESIDENT DON SHOW WHO GIVE AM MONEY. EVERYBODY'],
          archive: 'Published the campaign\'s accounts in full, as promised.', sig: 2,
        }],
      },
      {
        id: 'part', label: 'Publish the small gifts; keep the eleven back for "privacy"',
        outcomes: [{
          result: 'Two million small gifts are published. The total does not add up to what the campaign spent, which a reporter notices by lunchtime.',
          fx: [['bloc.press', -3], ['pressure.scandalHeat', 4]],
          flags: { 'campaign.accounts': 'partial' },
          news: ['CAMPAIGN ACCOUNTS PUBLISHED, BUT FIGURES DO NOT ADD UP', 'THE ACCOUNT DEY, BUT SOME MONEY NO GET NAME'],
          archive: 'Published the campaign accounts with eleven large donors left out.', sig: 2,
        }],
      },
      {
        id: 'withhold', label: 'Not yet',
        outcomes: [{
          result: 'The deadline passes. The donors who gave a thousand naira each want to know why their names were promised and not printed.',
          fx: [['bloc.press', -6], ['bloc.street', -4]],
          flags: { 'campaign.accounts': 'withheld' },
          news: ['SIX MONTHS ON, NO CAMPAIGN ACCOUNTS', 'WHERE THE ACCOUNT WEY PRESIDENT PROMISE?'],
          archive: 'Did not publish the campaign accounts as promised.', sig: 2,
        }],
      },
    ],
  },
];
