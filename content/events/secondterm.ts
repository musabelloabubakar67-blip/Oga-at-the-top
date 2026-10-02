import type { GameEvent } from '../../engine/types';

// The second term, the succession, the handover, and good fortune.

export const SECOND: GameEvent[] = [
  {
    id: 'second.promise', kind: 'calendar', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3,
    when: { all: [{ term: 2 }, { termTurn: [2, 6] }, { flag: 'promise.second_term' }] }, max: 1,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'The elders have come to collect',
    body: [
      'A delegation of party elders and governors has arrived with a list. It contains fourteen names for the new cabinet and the chairmanship of nine agencies.',
      'They refer to "the understanding reached before the primary". They have brought {CHAIR}, who has brought the minutes.',
      { when: { v: ['favours', '>=', 2] }, text: 'Several of the people in the room owe you. Nobody has mentioned it, and they are hoping you will not.' },
    ],
    trace: [['flag:promise.second_term', 1], ['flag:ticket.deal', 1]],
    reads: [
      { role: 'sap', good: 'You did promise, {SIR}. You no longer need them to win anything. They know that, which is why they came early.' },
    ],
    choices: [
      {
        id: 'honour', label: 'Honour the understanding',
        outcomes: [{
          result: 'The list is accepted with two changes. The new cabinet is described by the Federal Chronicle as "a reunion".',
          fx: [['bloc.party', 8], ['nation.capacity', -4], ['nation.integrity', -2], ['bloc.press', -3]],
          ops: [['governors', 4], ['senators', 2]],
          flags: { 'promise.second_term': false },
          news: ['PRESIDENT UNVEILS SECOND-TERM CABINET', 'NEW CABINET, SAME OLD FACES'],
          archive: 'Gave the second-term cabinet to the party elders as promised.', sig: 2,
        }],
      },
      {
        id: 'half', label: 'Give them the agencies, keep the cabinet', pc: 6,
        outcomes: [{
          result: 'After a long evening they accept nine agencies and four ministries. The economic team is yours.',
          fx: [['bloc.party', 2], ['nation.capacity', -1.5], ['nation.integrity', -1]],
          flags: { 'promise.second_term': false },
          news: ['PRESIDENT RETAINS ECONOMIC TEAM IN NEW CABINET', 'ELDERS COLLECT AGENCIES, PRESIDENT HOLD CABINET'],
          archive: 'Gave the party elders agencies but kept the cabinet.', sig: 2,
        }],
      },
      {
        id: 'refuse', label: 'Tell them the election is over', pc: 12,
        outcomes: [{
          result: 'You appoint your own cabinet. The elders leave without tea. {CHAIR} tells a reporter that "power is transient", and looks at his watch.',
          fx: [['bloc.party', -14], ['nation.capacity', 3], ['nation.integrity', 2], ['bloc.press', 4]],
          ops: [['governors', -6], ['senators', -3]],
          flags: { 'promise.second_term': false, 'promise.broken': true },
          news: ['PRESIDENT NAMES "CABINET OF TECHNOCRATS"', 'PRESIDENT DON USE ELDERS FINISH, DUMP THEM'],
          archive: 'Broke the pre-primary understanding with the party elders.', sig: 3,
        }],
      },
      {
        id: 'ledger', label: 'Go round the table and remind each of them what they owe you',
        requires: { v: ['favours', '>=', 2] },
        outcomes: [{
          result: 'You go round the table, by name, with dates. By the end the list has shrunk to three agencies and one ministry nobody wanted. The cabinet is yours. Every account you held is now closed.',
          fx: [['bloc.party', -3], ['nation.capacity', 3], ['nation.integrity', 1.5], ['bloc.press', 3]],
          ops: [['spendall']],
          flags: { 'promise.second_term': false },
          news: ['PRESIDENT NAMES OWN CABINET; ELDERS "SATISFIED"', 'ELDERS COME COLLECT, PRESIDENT REMIND DEM WHO OWE WHO'],
          archive: 'Spent every favour owed to keep the second-term cabinet out of the elders\' hands.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'second.tenure', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 4,
    when: { all: [{ term: 2 }, { termTurn: [12, 30] }] }, weight: 30,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'SECRET',
    title: 'The Constitution (Single Tenure) Amendment Bill',
    body: [
      'A group of senators calling itself "Concerned Friends of Continuity" has drafted a constitutional amendment replacing two four-year terms with a single term of seven years.',
      'A transitional clause provides that the incumbent "shall be deemed to be serving the first year of the new tenure". This would keep you in office for six years beyond the present term.',
      'The sponsors say the idea is entirely theirs and that you have not been consulted. They would like to know, privately, what you think.',
      'It needs 73 senators. About {SENATE} would vote with you today, on anything.',
      { when: { v: ['rival.fire', '>', 35] }, text: 'Barr. Tega Emuobor has already printed the placards.' },
    ],
    reads: [
      { role: 'sap', good: 'Every second-term President is offered this, {SIR}. It needs two thirds of the Assembly and twenty-four state assemblies, and it has never survived the first public hearing. The ones who tried are remembered for trying.' },
      { role: 'cos', good: 'The sponsors will want funding for "consultations" in the states. A great deal of it.' },
    ],
    choices: [
      {
        id: 'kill', label: 'Disown it publicly and at once',
        outcomes: [{
          result: 'You tell a press conference that you will leave on the appointed day and not one day later. The sponsors say they were only testing the waters.',
          fx: [['approval', 3], ['bloc.press', 6], ['bloc.street', 3], ['nation.integrity', 2], ['bloc.villa', -3], ['rival.fire', -4]],
          flags: { 'tenure.disowned': true },
          news: ['"I WILL LEAVE ON MAY 29" — PRESIDENT DISOWNS TENURE BILL', 'PRESIDENT SAY E NO DEY DO THIRD TERM. WE HOLD AM FOR WORD'],
          archive: 'Publicly disowned a tenure extension bill.', sig: 3,
        }],
      },
      {
        id: 'silence', label: 'Say nothing and see how far it goes',
        outcomes: [{
          result: 'Your silence is read correctly. The bill reaches a public hearing, where it is shouted down by market women, students and three former Chief Justices. It is withdrawn.',
          fx: [['approval', -4], ['bloc.press', -7], ['bloc.street', -5], ['bloc.party', -5], ['pc', -8], ['rival.fire', 6]],
          news: ['TENURE EXTENSION BILL WITHDRAWN AFTER STORMY HEARING', 'THIRD TERM DON DIE. WE KILL AM'],
          archive: 'Stayed silent while allies pushed a tenure extension bill. It failed.', sig: 3,
        }],
      },
      {
        id: 'fund', label: 'Fund the "consultations"', purse: 25,
        outcomes: [{
          result: 'Nineteen state assemblies pass resolutions of support in one week, several in identical wording including the same spelling error. The Senate vote falls eleven short. A senator displays, on live television, the bag he was given.',
          fx: [['approval', -8, 1], ['bloc.press', -12], ['bloc.street', -8], ['nation.integrity', -5], ['bloc.party', -6], ['pc', -12], ['rival.fire', 10], ['person.sen_rebel', -15]],
          exposure: { kind: 'political', amount: 25, witnesses: ['senate', 'cos', 'governors'], trail: 3 },
          news: ['SENATOR DISPLAYS CASH "FOR TENURE BILL" ON SENATE FLOOR', 'SEE THE GHANA-MUST-GO! THIRD TERM MONEY'],
          newsWeight: 9,
          archive: 'Paid for a tenure extension bill. It failed on the Senate floor.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'second.minister_runs', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2,
    when: { all: [{ term: 2 }, { termTurn: [28, 38] }] }, weight: 24,
    office: 'Office of the Chief of Staff', stamp: 'ROUTINE',
    title: 'Ministers with ambitions',
    body: [
      'Seven ministers have purchased nomination forms for governorship and Senate primaries. Each form cost more than a minister\'s declared salary for the term.',
      '{FIN} is among them. So is {WORKS}, whose ministry awards the roads. Each proposes to remain in office while campaigning, "to ensure continuity".',
      'The Electoral Act requires appointees to resign before a primary. The seven have obtained a legal opinion that it does not mean them.',
    ],
    reads: [
      { role: 'sap', good: 'Let them stay and the ministries become campaign offices for a year, {SIR}. Make them go and you lose seven people who owe you nothing afterwards.' },
    ],
    choices: [
      {
        id: 'resign', label: 'Direct all seven to resign within the week', pc: 6,
        outcomes: [{
          result: 'Five resign, the Minister of Works among them, and a technocrat takes that desk. Two withdraw from their races and keep theirs. The ministries are run by permanent secretaries for a quarter, and several run better.',
          fx: [['nation.integrity', 2.5], ['nation.capacity', 1], ['bloc.party', -4], ['bloc.villa', -3]],
          ops: [['sack', 'min_works', 'technocrat']],
          news: ['PRESIDENT ORDERS MINISTERS WITH AMBITIONS TO RESIGN', 'IF YOU WAN CONTEST, COMMOT — PRESIDENT'],
          archive: 'Ordered ministers seeking office to resign.', sig: 2,
        }],
      },
      {
        id: 'stay', label: 'Let them remain until the primaries',
        outcomes: [{
          result: 'They remain. Ministry vehicles are seen at rallies in six states. One minister holds his declaration in the ministry car park.',
          fx: [['nation.integrity', -3], ['nation.capacity', -2.5], ['bloc.party', 4], ['bloc.press', -3]],
          ops: [['mark', 'min_works', -2, 'Ran for governor from the ministry car park']],
          later: [{ after: [4, 6], fx: [['nation.capacity', -1.5], ['nation.power', -1]], label: 'Ministries run as campaign offices stop delivering.' }],
          news: ['MINISTERS TO REMAIN IN OFFICE WHILE CAMPAIGNING', 'MINISTER DECLARE FOR GOVERNOR INSIDE MINISTRY CAR PARK'],
          archive: 'Let ministers campaign for office from their ministries.',
        }],
      },
    ],
  },
  {
    id: 'succession.choice', kind: 'calendar', slot: 'lead', category: 'politics', tone: 'dry', intensity: 4,
    when: { all: [{ term: 2 }, { termTurn: [34, 37] }] }, max: 1,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'SECRET',
    title: 'The succession',
    body: [
      'The party will choose its candidate in three months. Everyone is waiting to learn who {MRP} wants. Several people have stopped returning calls until they know.',
      'Three names are being mentioned. The Vice President, who is loyal and unexciting. {FIN}, who has a record and no structure. And {GOVCHAIR}, who has the structure, the governors, and plans of his own.',
      { when: { v: ['owing.gov_ss', '>', 0] }, text: 'You still owe Governor Koroye. He has not raised it. He does not need to.' },
      { when: { v: ['favours', '>=', 3] }, text: 'You are owed by enough people that your word would still move delegates. It will not be true for much longer.' },
    ],
    reads: [
      { role: 'sap', good: 'Anoint someone and you own their defeat, {SIR}. Stay out and you own nothing, including protection. An outgoing President is only as safe as the next one is grateful.' },
    ],
    choices: [
      {
        id: 'vp', label: 'Back the Vice President', pc: 8,
        outcomes: [{
          result: 'You raise the Vice President\'s hand at the convention. The applause is correct.',
          fx: [['bloc.party', 3], ['bloc.villa', 4], ['person.gov_ss', -8]],
          flags: { 'succession.backed': 'vp', 'succession.strength': 0 },
          follow: [{ event: 'succession.fallout', after: [2, 3] }],
          news: ['PRESIDENT ENDORSES VICE PRESIDENT AS SUCCESSOR', 'NA VP PRESIDENT WANT. THE REST DON VEX'],
          archive: 'Backed the Vice President as successor.', sig: 3,
        }],
      },
      {
        id: 'fin', label: 'Back your Finance Minister', pc: 12,
        outcomes: [{
          result: 'You back {FIN}. The markets approve. The governors do not attend the announcement.',
          fx: [['bloc.party', -6], ['bloc.establishment', 6], ['person.gov_ss', -10], ['tycoon.ty_bank', 6]],
          ops: [['governors', -3]],
          flags: { 'succession.backed': 'fin', 'succession.strength': -1 },
          follow: [{ event: 'succession.fallout', after: [2, 3] }],
          news: ['PRESIDENT BACKS FINANCE MINISTER FOR TOP JOB', 'PRESIDENT PICK BOOK PERSON. GOVERNORS DEY FROWN'],
          archive: 'Backed the Finance Minister as successor.', sig: 3,
        }],
      },
      {
        id: 'gov', label: 'Back the Chairman of the Governors\' Forum',
        outcomes: [{
          result: 'You back {GOVCHAIR}. The party is delighted. He thanks you warmly and does not look at you while doing it.',
          fx: [['bloc.party', 10], ['bloc.establishment', -3], ['nation.integrity', -1], ['person.gov_ss', 14]],
          ops: [['settle', 'gov_ss'], ['governors', 3]],
          favour: ['gov_ss', 'owed', 3],
          flags: { 'succession.backed': 'gov', 'succession.strength': 2 },
          news: ['PRESIDENT ENDORSES GOVERNORS\' FORUM CHAIRMAN', 'ALLOCATION FOR PRESIDENT? STRUCTURE DON WIN'],
          archive: 'Backed the Governors\' Forum chairman as successor.', sig: 3,
        }],
      },
      {
        id: 'neutral', label: 'Stay neutral: "the party will decide"',
        outcomes: [{
          result: 'You announce that you have no anointed candidate. Nobody believes it for a month. Then they do, and the telephone goes quiet.',
          fx: [['bloc.party', -3], ['pc', -6], ['nation.integrity', 2], ['bloc.press', 3]],
          flags: { 'succession.strength': -2 },
          news: ['"I HAVE NO ANOINTED CANDIDATE" — PRESIDENT', 'PRESIDENT SAY E NO GET CANDIDATE. NA LIE?'],
          archive: 'Declined to anoint a successor.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'succession.fallout', kind: 'chain', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'The governors have their own candidate',
    body: [
      '{GOVCHAIR} has declared for the presidency, against your choice. Fourteen governors stood behind him at the declaration.',
      'He described you as "our leader and father", which in this party is how one announces a patricide.',
      'About {DELEGATES} in every hundred delegates would still follow you into a primary.',
    ],
    trace: [['flag:succession.backed', 1]],
    reads: [
      { role: 'sap', good: 'You can still win this primary for your candidate, {SIR}, but only by spending what authority you have left. Or you can make peace and be the father of whoever wins.' },
    ],
    choices: [
      {
        id: 'fight', label: 'Fight for your candidate', pc: 12,
        outcomes: [
          {
            when: { v: ['delegates', '>=', 50] },
            result: 'Your candidate wins a bitter primary. Half the governors work for the party in the general election. The other half are busy.',
            fx: [['bloc.party', -8], ['person.gov_ss', -12]],
            ops: [['governors', -4]],
            flags: { 'succession.strength': 1 },
            news: ['PRESIDENT\'S CANDIDATE WINS PARTY PRIMARY', 'PRESIDENT CANDIDATE WIN. GOVERNORS DEY PLAN'],
            archive: 'Forced your chosen successor through the primary.', sig: 2,
          },
          {
            result: 'Your candidate loses the primary. The party\'s flagbearer owes you nothing, and says so warmly.',
            fx: [['bloc.party', -10], ['bloc.villa', -6]],
            flags: { 'succession.strength': 0, 'succession.backed': false },
            news: ['PRESIDENT\'S CANDIDATE DEFEATED IN PRIMARY', 'PRESIDENT CANDIDATE LOSE PRIMARY. GOVERNORS DEY LAUGH'],
            archive: 'Fought for your chosen successor and lost the primary.', sig: 2,
          },
        ],
      },
      {
        id: 'peace', label: 'Make peace: accept the governors\' candidate',
        outcomes: [{
          result: 'You raise a different hand at the convention. Your original candidate is offered the Senate.',
          fx: [['bloc.party', 8], ['bloc.villa', -5], ['person.gov_ss', 10]],
          favour: ['gov_ss', 'owed', 2],
          flags: { 'succession.backed': 'gov', 'succession.strength': 2 },
          news: ['PRESIDENT, GOVERNORS UNITE BEHIND CONSENSUS CANDIDATE', 'PRESIDENT DON BEND FOR GOVERNORS'],
          archive: 'Abandoned your chosen successor for the governors\' candidate.', sig: 2,
        }],
      },
      {
        id: 'buy', label: 'Settle the delegates', purse: 18,
        outcomes: [{
          result: 'Your candidate wins by a margin that surprises the governors and nobody at the bureau de change.',
          fx: [['bloc.party', -3], ['nation.integrity', -3]],
          flags: { 'succession.strength': 2 },
          exposure: { kind: 'political', amount: 18, witnesses: ['delegates', 'chair'], trail: 2 },
          news: ['PRESIDENT\'S CANDIDATE SWEEPS PRIMARY', 'DELEGATES DON CHOP AGAIN. PRESIDENT CANDIDATE WIN'],
          archive: 'Bought the primary for your chosen successor.', sig: 2,
        }],
      },
      {
        id: 'favours', label: 'Call in everything you are owed, all at once',
        requires: { v: ['favours', '>=', 3] },
        outcomes: [{
          result: 'You spend a week on the telephone. Governors, senators and the men who pay for conventions each discover an old obligation. Your candidate wins without a naira changing hands. You leave office owed nothing by anybody.',
          fx: [['bloc.party', -2], ['person.gov_ss', -8], ['nation.integrity', 1]],
          ops: [['spendall']],
          flags: { 'succession.strength': 2 },
          news: ['PRESIDENT\'S CANDIDATE WINS PRIMARY AS GOVERNORS FALL IN LINE', 'PRESIDENT CALL EVERYBODY WEY OWE AM. CANDIDATE WIN'],
          archive: 'Spent every favour owed to carry your successor through the primary.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'second.override', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3,
    when: { all: [{ term: 2 }, { termTurn: [38, 46] }] }, weight: 30,
    office: 'Office of the Senate President', stamp: 'URGENT',
    title: 'The Assembly proposes to buy itself cars',
    body: [
      'The National Assembly has passed a bill appropriating ₦160bn for "legislative mobility": one imported sport utility vehicle for each of its 469 members, plus an "outfit allowance".',
      'It has indicated that if you withhold assent it has the two thirds to override. It did not have two thirds a year ago.',
      'An override needs 73 senators. About {SENATE} are yours.',
    ],
    statement: 'Distinguished Senators cannot be expected to perform oversight functions on bad roads.',
    reads: [
      { role: 'sap', good: 'They are counting your remaining months, {SIR}. An override would be the first in a decade and they would enjoy it.' },
    ],
    choices: [
      {
        id: 'veto', label: 'Withhold assent and say why, on television', pc: 8,
        outcomes: [
          {
            when: { v: ['senate', '>=', 58] },
            result: 'Your senators are unavoidably absent on the day. The override fails for want of numbers, and the Senate President adjourns before anyone can count again.',
            fx: [['approval', 2], ['bloc.street', 3], ['bloc.party', -3], ['bloc.press', 3], ['person.sen_pres', -6]],
            news: ['OVERRIDE FAILS AS SENATORS STAY AWAY; VEHICLE BILL DEAD', 'SENATORS NO SHOW. JEEP MONEY DON DIE'],
            archive: 'Vetoed the Assembly\'s vehicle bill; your senators killed the override.', sig: 2,
          },
          {
            when: { v: ['approval', '>=', 44] },
            result: 'You read the price of the vehicle and the minimum wage in the same sentence. The override vote is quietly never scheduled.',
            fx: [['approval', 3], ['bloc.street', 4], ['bloc.party', -6], ['bloc.press', 4]],
            news: ['PRESIDENT VETOES ₦160BN LAWMAKERS\' VEHICLE BILL', 'PRESIDENT BLOCK SENATORS\' JEEP MONEY'],
            archive: 'Vetoed the Assembly\'s vehicle bill and faced down an override.', sig: 2,
          },
          {
            result: 'The Assembly overrides your veto by 81 votes in the Senate. It is the first override in a decade. The vehicles are ordered.',
            fx: [['pc', -10], ['bloc.party', -6], ['nation.fiscalSpace', -0.16], ['bloc.street', 2]],
            ops: [['senators', -4]],
            news: ['NATIONAL ASSEMBLY OVERRIDES PRESIDENT\'S VETO', 'SENATORS OVERRIDE PRESIDENT, BUY JEEP'],
            archive: 'Vetoed the Assembly\'s vehicle bill and was overridden.', sig: 2,
          },
        ],
      },
      {
        id: 'sign', label: 'Sign it', sign: true,
        outcomes: [{
          result: 'You sign. The vehicles arrive in time for the campaign.',
          fx: [['bloc.party', 5], ['approval', -3], ['bloc.street', -4], ['nation.fiscalSpace', -0.16]],
          ops: [['senators', 5]],
          later: [{ after: [2, 4], fx: [['approval', -1]], label: 'The legislators\' vehicles are delivered.', note: ['469 SUVS DELIVERED TO NATIONAL ASSEMBLY', 'SENATORS\' JEEP DON LAND. SEE CONVOY'] }],
          news: ['PRESIDENT ASSENTS TO LEGISLATIVE MOBILITY BILL', '₦160BN FOR JEEP. MINIMUM WAGE NA ₦70K'],
          archive: 'Signed a ₦160bn vehicle bill for the Assembly.',
        }],
      },
      {
        id: 'zango', label: 'Have Senator Zango lose the bill in conference. He owes you',
        requires: { v: ['favour.sen_approp', '>', 0] },
        outcomes: [{
          result: 'The bill goes to a conference committee to harmonise two versions that were identical. It is still there. Senator Zango regards the matter between you as settled.',
          fx: [['approval', 1], ['bloc.press', 1]],
          ops: [['void', 'sen_approp']],
          news: ['VEHICLE BILL STALLS IN CONFERENCE COMMITTEE', 'JEEP BILL DON ENTER COMMITTEE. E NO GO COMOT'],
          archive: 'Called in a favour to bury the Assembly\'s vehicle bill.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'second.book', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 2,
    when: { all: [{ term: 2 }, { termTurn: [8, 40] }] }, weight: 9,
    office: 'Office of the Special Adviser, Media and Publicity', stamp: 'ROUTINE',
    title: 'A former aide has written a book',
    body: [
      'A former Villa spokesman has published a memoir, "The Other Room: My Years Inside". The first printing sold out in two days.',
      'It is accurate about small things and unkind about large ones. Chapter nine describes a cabinet meeting at which three ministers were asleep.',
      { when: { v: ['exposure.count', '>=', 3] }, text: 'Chapter fourteen is titled "The Drawer". It is short, and it is careful, and it stops just before it would need a lawyer.' },
      { when: { v: ['tycoon.ty_media', '<', 40] }, text: 'The Daily Stakeholder is serialising it, a chapter every Sunday.' },
    ],
    reads: [
      { role: 'sap', good: 'Sue and you sell his second printing, {SIR}. Ignore it and it is forgotten by the rains.' },
    ],
    choices: [
      {
        id: 'ignore', label: 'No comment',
        outcomes: [{
          result: 'The Presidency does not comment. The book is discussed for three weeks and then replaced by something else.',
          fx: [['bloc.press', -1]],
          news: ['EX-AIDE\'S MEMOIR STIRS DEBATE', 'THE BOOK WEY ASO ROCK NO WAN MAKE YOU READ'],
          archive: 'Ignored a former aide\'s memoir.',
        }],
      },
      {
        id: 'sue', label: 'Sue for defamation',
        outcomes: [{
          result: 'The suit is filed. The book goes into a fifth printing. Discovery begins, which is not an activity the Villa should invite.',
          fx: [['bloc.press', -5], ['approval', -1.5], ['pressure.scandalHeat', 8], ['tycoon.ty_media', -4]],
          news: ['PRESIDENT SUES FORMER AIDE OVER MEMOIR', 'PRESIDENT SUE THE WRITER. BOOK DON FINISH FOR MARKET'],
          archive: 'Sued a former aide over his memoir.',
        }],
      },
      {
        id: 'launch', label: 'Attend the book launch',
        outcomes: [{
          result: 'You arrive unannounced, buy a copy, and ask the author to sign chapter nine. The country finds this very funny, and the book loses its sting.',
          fx: [['approval', 2], ['bloc.press', 4], ['bloc.villa', 2]],
          news: ['PRESIDENT ATTENDS LAUNCH OF CRITICAL MEMOIR', 'PRESIDENT SHOW FOR BOOK LAUNCH, BUY COPY. LEVELS'],
          archive: 'Attended the launch of a critical memoir by a former aide.',
        }],
      },
    ],
  },
  {
    id: 'handover.contracts', kind: 'calendar', slot: 'lead', category: 'temptation', tone: 'dry', intensity: 3,
    when: { any: [
      { all: [{ term: 2 }, { termTurn: [45, 46] }] },
      { all: [{ term: 1 }, { termTurn: [46, 46] }, { any: [{ flag: 'election.lost' }, { flag: 'ticket.lost' }] }] },
    ] }, max: 1,
    office: 'Office of the Chief of Staff', stamp: 'SECRET',
    title: 'Before the handover: matters awaiting approval',
    body: [
      'There are 214 memoranda on the desk marked "urgent, for approval before handover".',
      'They include 61 contract awards worth ₦1.9tn, 340 appointments to boards with four-year terms, and the conversion of 2,000 personal aides into permanent civil servants.',
      'Every outgoing administration has signed such a pile in its last month. Every incoming one has spent its first year undoing it.',
      'None of it is funded. Every award becomes a debt to a contractor on the day it is signed, and whoever takes the oath next inherits it.',
      { when: { v: ['debt.contractors', '>', 1] }, text: 'The contractors the government already owes are not on the list. These are new ones.' },
    ],
    reads: [
      { role: 'cos', good: 'Some of these are genuine, {SIR}. Most are people making arrangements. Several of the contractors have asked me to say they are grateful in advance.' },
    ],
    choices: [
      {
        id: 'none', label: 'Sign only what is genuinely urgent; return the rest',
        outcomes: [{
          result: 'Nineteen memoranda are signed. One hundred and ninety-five are returned marked "for the incoming administration".',
          fx: [['nation.integrity', 3], ['nation.capacity', 1], ['bloc.villa', -6], ['bloc.party', -5], ['bloc.press', 3]],
          news: ['OUTGOING PRESIDENT DECLINES LAST-MINUTE CONTRACTS', 'PRESIDENT REFUSE TO SIGN "FAREWELL CONTRACTS"'],
          archive: 'Refused the pile of last-minute contracts and appointments.', sig: 3,
        }],
      },
      {
        id: 'all', label: 'Sign them all', sign: true,
        outcomes: [{
          result: 'You sign for two days. The incoming administration announces a review before it has been sworn in.',
          fx: [['nation.integrity', -5], ['nation.fiscalSpace', -0.8], ['debt.contractors', 1.1], ['bloc.villa', 8], ['bloc.party', 6], ['tycoon.ty_trade', 5]],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['cos'], trail: 3 },
          news: ['FG APPROVES ₦1.9TN IN CONTRACTS DAYS TO HANDOVER', '₦1.9TN CONTRACT FOR LAST WEEK. HABA'],
          archive: 'Signed ₦1.9tn of contracts and 340 appointments in the last month.', sig: 3,
        }],
      },
      {
        id: 'grateful', label: 'Sign them all, and accept the gratitude', sign: true,
        outcomes: [{
          result: 'You sign for two days. The gratitude is delivered in instalments, abroad.',
          fx: [['purse', 90], ['nation.integrity', -7], ['nation.fiscalSpace', -0.8], ['debt.contractors', 1.1], ['bloc.villa', 8], ['bloc.party', 6], ['tycoon.ty_trade', 5]],
          exposure: { kind: 'personal', amount: 90, witnesses: ['cos', 'financier'], trail: 3 },
          news: ['FG APPROVES ₦1.9TN IN CONTRACTS DAYS TO HANDOVER', '₦1.9TN CONTRACT FOR LAST WEEK. WHO DEY COLLECT?'],
          archive: 'Signed ₦1.9tn of last-minute contracts and took a share.', sig: 3,
        }],
      },
      {
        id: 'arrears', label: 'Sign nothing new. Use the last month to pay the contractors already owed',
        requires: { v: ['debt.contractors', '>', 0.3] },
        outcomes: [{
          result: 'The pile is returned unsigned. The Treasury spends its last month under you paying for work that was actually done. Your successor inherits a shorter list of people at the gate.',
          fx: [['nation.integrity', 3.5], ['bloc.villa', -7], ['bloc.party', -6], ['bloc.establishment', 4], ['bloc.press', 3]],
          ops: [['paydebt', 'contractors', 0.6]],
          news: ['OUTGOING PRESIDENT PAYS OLD CONTRACTORS, SIGNS NO NEW AWARDS', 'NO FAREWELL CONTRACT. PRESIDENT PAY OLD DEBT INSTEAD'],
          archive: 'Refused last-minute contracts and paid down what contractors were already owed.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'handover.notes', kind: 'calendar', slot: 'lead', category: 'ceremonial', tone: 'dry', intensity: 2,
    when: { termTurn: [48, 48] }, cooldown: 40,
    office: 'Office of the Secretary to the Government of the Federation', stamp: 'ROUTINE',
    title: 'The handover notes',
    body: [
      'The handover notes are ready for signature. They run to 2,600 pages.',
      'The Secretary to the Government asks how candid the treasury section should be.',
      { when: { all: [{ term: 1 }, { flag: 'election.won' }] }, text: 'As you are handing over to yourself, the question is largely philosophical. The civil service would still like an answer.' },
      { when: { v: ['debt.arrears', '>', 1] }, text: 'More than a trillion naira is owed to contractors, pensioners and gas suppliers. None of it appears in the published debt figures.' },
      'What you sign is the first thing your successor will read.',
    ],
    reads: [
      { role: 'fin', good: 'Tell them everything, {SIR}. Whatever we hide, they find in a month, and then it is our lie as well as our debt.', weak: 'I would keep it high-level, {SIR}.' },
    ],
    choices: [
      {
        id: 'candid', label: 'Full disclosure: every liability, every arrear', sign: true,
        outcomes: [{
          result: 'The treasury section runs to 400 pages and includes things you would rather it did not. It is the first set of handover notes anyone has found useful.',
          fx: [['nation.integrity', 3], ['nation.capacity', 2], ['bloc.establishment', 3]],
          flags: { 'handover.candid': true },
          news: ['OUTGOING GOVERNMENT PUBLISHES FULL LIABILITIES', 'FOR ONCE, HANDOVER NOTE WEY GET SENSE'],
          archive: 'Left candid handover notes with every liability disclosed.', sig: 2,
        }],
      },
      {
        id: 'brief', label: 'Keep the treasury section brief', sign: true,
        outcomes: [{
          result: 'The treasury section is eleven pages and describes the economy as being "on a sound footing".',
          fx: [['nation.integrity', -2]],
          news: ['HANDOVER NOTES: ECONOMY "ON A SOUND FOOTING"', 'SOUND FOOTING. WE DON HEAR THAT ONE BEFORE'],
          archive: 'Left handover notes describing the economy as "on a sound footing".',
        }],
      },
    ],
  },
  {
    id: 'handover.concede', kind: 'calendar', slot: 'lead', category: 'politics', tone: 'dry', intensity: 4,
    when: { all: [{ term: 1 }, { termTurn: [47, 47] }, { flag: 'election.lost' }] }, max: 1,
    office: 'Office of the Attorney General of the Federation', stamp: 'URGENT',
    title: 'After the result',
    body: [
      'The Electoral Commission has declared {OPP} the winner. The President-elect is waiting for a telephone call.',
      { when: { v: ['margin', '<', -3] }, text: 'The Attorney General has prepared an election petition, and rates its chances as "arguable", which is the word lawyers use before sending an invoice.' },
      { when: { v: ['margin', '>=', -3] }, text: 'The margin was under three points. The Attorney General has prepared a petition on four states where the result sheets and the accreditation figures do not agree, and for once "arguable" is meant.' },
      { when: { all: [{ v: ['margin', '>=', -3] }, { v: ['nation.integrity', '>=', 45] }] }, text: 'The courts are better than the ones you inherited. They will decide it on the sheets.' },
      { when: { all: [{ v: ['margin', '>=', -3] }, { v: ['nation.integrity', '<', 45] }] }, text: 'The courts are what they have always been. A panel can be spoken to, and the other side knows that too.' },
      'Party youths are gathering at the secretariat. They are waiting to hear what you say.',
    ],
    reads: [
      { role: 'sap', good: 'Make the call tonight, {SIR}. It is the one thing from this term they will put in the textbooks. If you go to court instead, go because the sheets are wrong, not because you can.' },
    ],
    choices: [
      {
        id: 'call', label: 'Telephone the winner and concede',
        outcomes: [{
          result: 'The call lasts four minutes. You tell the nation that no election is worth a single Nigerian life. The youths at the secretariat go home.',
          fx: [['approval', 6], ['bloc.press', 8], ['bloc.establishment', 5], ['nation.integrity', 3], ['bloc.party', -5]],
          flags: { conceded: true },
          news: ['PRESIDENT CONCEDES, CALLS WINNER', 'PRESIDENT CALL OPPONENT, CONCEDE. RESPECT'],
          newsWeight: 9,
          archive: 'Conceded the election by telephone on the night of the declaration.', sig: 3,
        }],
      },
      {
        id: 'petition', label: 'File the petition',
        outcomes: [{
          when: { all: [{ v: ['margin', '>=', -3] }, { v: ['nation.integrity', '>=', 45] }] }, chance: 0.45,
          result: 'The tribunal sits through the handover weeks and reads every result sheet from the four states. It finds the declared figures cannot be reconciled with the accreditation, orders a re-run there, and you carry three of the four. The Commission withdraws one certificate and issues another. You will be sworn in on the appointed day, to a country half of which believes it.',
          fx: [['pc', -6], ['approval', -2], ['bloc.party', 14], ['bloc.villa', 8], ['bloc.press', -2], ['bloc.establishment', 2], ['rival.alt', 5], ['rival.fire', 5]],
          flags: { 'election.lost': false, 'election.won': true, 'tribunal.done': true, 'tribunal.overturned': true },
          news: ['TRIBUNAL ORDERS RE-RUN; PRESIDENT RETURNED AFTER FOUR-STATE VOTE', 'COURT DON TURN AM! PRESIDENT WIN FOR RE-RUN'],
          newsWeight: 10,
          archive: 'Overturned a narrow election defeat at the tribunal, on the result sheets.', sig: 3,
        }, {
          result: 'The petition is filed. It is dismissed at the tribunal, on appeal, and at the Supreme Court, in that order, at a cost the party would rather not discuss.',
          fx: [['approval', -3], ['bloc.press', -4], ['bloc.party', 3], ['bloc.establishment', -3]],
          news: ['PRESIDENT HEADS TO TRIBUNAL', 'PRESIDENT NO GREE. "WE GO MEET FOR COURT"'],
          archive: 'Contested the election result in court and lost.', sig: 3,
        }],
      },
      {
        id: 'panel', label: 'File the petition, and have the panel spoken to', purse: 30,
        requires: { all: [{ v: ['margin', '>=', -5] }, { v: ['nation.integrity', '<', 45] }] },
        outcomes: [{
          chance: 0.6,
          result: 'The panel annuls the result in four states, three to two, in a judgment nobody can follow. You win the re-run. Everyone knows how. You will be sworn in on the appointed day and governed, for four years, by that knowledge.',
          fx: [['pc', -10], ['approval', -6], ['bloc.party', 12], ['bloc.villa', 8], ['bloc.press', -10], ['bloc.establishment', -6], ['nation.integrity', -5], ['pressure.scandalHeat', 15], ['rival.alt', 8], ['rival.fire', 10]],
          flags: { 'election.lost': false, 'election.won': true, 'tribunal.done': true, 'tribunal.overturned': true, 'tribunal.fixed': true },
          exposure: { kind: 'political', amount: 30, witnesses: ['justice', 'cos'], trail: 3 },
          news: ['SPLIT TRIBUNAL ANNULS RESULT IN FOUR STATES; PRESIDENT WINS RE-RUN', 'THREE JUDGES TO TWO. NIGERIA KNOW WETIN HAPPEN'],
          newsWeight: 10,
          archive: 'Had a tribunal panel spoken to, and reversed an election defeat.', sig: 3,
        }, {
          result: 'One of the five judges records the approach in open court and recuses himself. The petition is dismissed with costs. You leave office as the President who lost twice.',
          fx: [['approval', -8], ['bloc.press', -10], ['bloc.establishment', -6], ['nation.integrity', -3], ['pressure.scandalHeat', 20]],
          exposure: { kind: 'political', amount: 30, witnesses: ['justice', 'cos'], trail: 3 },
          news: ['JUDGE: "I WAS APPROACHED" — PETITION DISMISSED WITH COSTS', 'JUDGE TALK AM FOR OPEN COURT: DEM COME MEET ME'],
          newsWeight: 10,
          archive: 'Tried to buy an election tribunal and was named in open court.', sig: 3,
        }],
      },
    ],
  },

  // ---------------------------------------------------------------- fortune

  {
    id: 'fortune.harvest', kind: 'recurring', slot: 'lead', category: 'fortune', tone: 'dry', intensity: 1,
    when: { all: [{ month: [10, 11, 12] }, { turn: [5] }, { v: ['theatre.NC', '<', 58] }] }, weight: 9, cooldown: 30,
    office: 'Federal Ministry of Agriculture', stamp: 'ROUTINE',
    title: 'A bumper harvest',
    body: [
      'Good rains and a quiet season in the farm belt have produced the largest grain harvest in a decade.',
      'Prices at the farm gate are falling. Farmers are asking the government to buy the surplus before they are ruined by their own success.',
      'The Honourable Minister would like it noted that the Ministry predicted this.',
      { when: { v: ['tycoon.ty_trade', '>=', 30] }, text: 'Chief Obinna Ezeudu, whose licences bring in the rice this harvest would replace, would prefer that the silos stay empty.' },
    ],
    reads: [
      { role: 'fin', good: 'Buy the surplus into the grain reserve, {SIR}. It is cheap now and we will want it in a bad year.', weak: 'The market will sort itself out, {SIR}.' },
    ],
    choices: [
      {
        id: 'reserve', label: 'Buy the surplus into the strategic grain reserve', naira: 0.15,
        outcomes: [{
          result: 'The silos are filled for the first time since they were built. The farmers are paid within the month.',
          fx: [['nation.inflation', -1.5], ['approval', 1.5], ['zone.NW.approval', 3], ['zone.NC.approval', 3], ['tycoon.ty_trade', -6]],
          ops: [['mark', 'min_agric', 1, 'Filled the grain reserve from a record harvest']],
          flags: { 'grain.reserve': true, 'econ.inflBias': 2 },
          news: ['FG BUYS RECORD HARVEST INTO GRAIN RESERVE', 'FOOD DON CHEAP SMALL. FARMERS DON COLLECT'],
          archive: 'Bought a bumper harvest into the grain reserve.', sig: 2,
        }],
      },
      {
        id: 'credit', label: 'Hold a national thanksgiving and take the credit',
        outcomes: [{
          result: 'The thanksgiving is held. The surplus rots in the villages for want of buyers. Next year, fewer farmers plant.',
          fx: [['approval', 1], ['nation.inflation', -0.5], ['tycoon.ty_trade', 4]],
          ops: [['mark', 'min_agric', -1, 'Let a record harvest rot for want of buyers']],
          later: [{ after: [10, 12], fx: [['nation.inflation', 1.5]], label: 'Farmers who could not sell last year\'s surplus plant less.' }],
          news: ['PRESIDENT LEADS NATIONAL THANKSGIVING FOR HARVEST', 'GOVERNMENT DEY THANK GOD. FARMERS DEY FIND BUYER'],
          archive: 'Held a thanksgiving for the harvest and did not buy the surplus.',
        }],
      },
    ],
  },
  {
    id: 'fortune.football', kind: 'standalone', slot: 'lead', category: 'ceremonial', tone: 'farce', intensity: 1,
    when: { turn: [8] }, weight: 9,
    office: 'Federal Ministry of Sports Development', stamp: 'ROUTINE',
    title: 'The national team has won',
    body: [
      'The national football team has won the continental championship. For one night there is no North, no South, no party and no price of anything.',
      'The players are owed match bonuses from the last two tournaments. The federation says the money "was released". The players say it did not arrive. Both are probably true.',
      'The Minister proposes a reception, national honours, and a plot of land in Abuja for each player.',
    ],
    reads: [
      { role: 'sap', good: 'Pay what they are owed first, {SIR}, on camera. The land can wait. Land in Abuja has a way of being someone else\'s.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay every outstanding bonus tonight, then celebrate', naira: 0.01,
        outcomes: [{
          result: 'The bonuses are paid at the reception, by transfer, with the players reading out the alerts. The captain says it is the first promise kept to the team in his career.',
          fx: [['approval', 3], ['bloc.street', 4], ['bloc.press', 2]],
          news: ['PRESIDENT HOSTS CHAMPIONS, CLEARS ALL BONUSES', 'ALERT ENTER FOR PLAYERS LIVE! PRESIDENT DO WELL'],
          archive: 'Paid the national team\'s outstanding bonuses after the championship.',
        }],
      },
      {
        id: 'land', label: 'Announce houses, land and national honours',
        outcomes: [{
          result: 'The announcement is cheered. An earlier championship squad sends a message: they are still waiting for theirs.',
          fx: [['approval', 2], ['bloc.street', 2]],
          later: [{ after: [9, 14], fx: [['approval', -1.5], ['bloc.press', -2]], label: 'The champions have not received their houses.', note: ['CHAMPIONS STILL AWAIT PROMISED HOUSES', 'THE HOUSE WEY DEM PROMISE PLAYERS, NA STORY'] }],
          news: ['PRESIDENT REWARDS CHAMPIONS WITH HOUSES, HONOURS', 'HOUSE AND LAND FOR EVERY PLAYER — PRESIDENT'],
          archive: 'Promised the national team houses and land.',
        }],
      },
    ],
  },
  {
    id: 'fortune.startup', kind: 'standalone', slot: 'lead', category: 'fortune', tone: 'dry', intensity: 1,
    when: { turn: [12] }, weight: 8,
    office: 'Federal Ministry of Communications and Digital Economy', stamp: 'ROUTINE',
    title: 'A Nigerian company lists abroad',
    body: [
      'A payments company founded in a Yaba flat nine years ago has listed in New York at a valuation of $6bn. It employs 3,000 people here.',
      'Its founders say their largest obstacles were, in order: electricity, foreign exchange, and a regulator that banned their product twice.',
      'They have been invited to the Villa. They would like to discuss the third item.',
      'The bans were asked for by the commercial banks, Mrs Folake Adetoro\'s among them.',
    ],
    reads: [
      { role: 'fin', good: 'They have built more export revenue than three ministries, {SIR}, and all they are asking for is to be left alone in a predictable way.', weak: 'We should explore how to tax this, {SIR}.' },
    ],
    choices: [
      {
        id: 'sandbox', label: 'Direct the regulators to adopt a licensing sandbox', pc: 4,
        outcomes: [{
          result: 'A sandbox regime is gazetted. Two more companies announce that they will stay rather than move to another jurisdiction.',
          fx: [['bloc.establishment', 5], ['nation.capacity', 2], ['bloc.street', 3], ['tycoon.ty_bank', -5]],
          later: [{ after: [10, 14], fx: [['nation.fiscalSpace', 0.2], ['approval', 1]], label: 'The technology sector expands under the sandbox regime.' }],
          news: ['FG ADOPTS REGULATORY SANDBOX FOR FINTECH', 'TECH BROS HAPPY: GOVERNMENT GO FREE THEM SMALL'],
          archive: 'Adopted a regulatory sandbox after a Nigerian company listed abroad.', sig: 2,
        }],
      },
      {
        id: 'photo', label: 'Host them, take the photograph',
        outcomes: [{
          result: 'The photograph is taken in front of the coat of arms. The regulator bans a third product the following month.',
          fx: [['approval', 1]],
          news: ['PRESIDENT HOSTS FOUNDERS OF $6BN COMPANY', 'PRESIDENT SNAP PICTURE WITH TECH FOUNDERS'],
          archive: 'Hosted the founders of a newly listed company at the Villa.',
        }],
      },
      {
        id: 'levy', label: 'Announce a levy on digital transactions',
        outcomes: [{
          result: 'The levy is announced. The company moves its headquarters to another country within the year, and takes its tax with it.',
          fx: [['nation.fiscalSpace', 0.1], ['bloc.establishment', -6], ['bloc.street', -4], ['approval', -1.5], ['tycoon.ty_bank', 4], ['nation.jobs', -1]],
          news: ['FG INTRODUCES DIGITAL TRANSACTIONS LEVY', 'DEM DON START TO TAX TRANSFER. E NO GO BETTER'],
          archive: 'Imposed a levy on digital transactions.',
        }],
      },
      {
        id: 'stake', label: 'Adopt the sandbox, and have the growth fund back the next ten', pc: 4,
        requires: { v: ['fund.growth', '>=', 0.3] },
        outcomes: [{
          result: 'The sandbox is gazetted and the fund takes small stakes in ten companies nobody has heard of. Seven will fail. The fund\'s managers say that is what the other three are for.',
          fx: [['fund.growth', -0.3], ['bloc.establishment', 4], ['nation.capacity', 2], ['bloc.street', 3], ['tycoon.ty_bank', -5]],
          later: [{ after: [12, 16], fx: [['fund.growth', 0.55], ['nation.jobs', 2], ['approval', 1]], label: 'Three of the ten companies the growth fund backed are worth more than the fund paid for all of them.', note: ['GROWTH FUND\'S TECH STAKES RETURN NEARLY DOUBLE', 'GOVERNMENT PUT MONEY FOR TECH, E DON YIELD'] }],
          news: ['FG ADOPTS FINTECH SANDBOX; GROWTH FUND TO BACK TEN START-UPS', 'GOVERNMENT GO INVEST FOR YABA BOYS'],
          archive: 'Adopted a regulatory sandbox and put the growth fund behind ten young companies.', sig: 2,
        }],
      },
    ],
  },
];
