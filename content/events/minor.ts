import { CONTRACT_VERSION, type DomainEffect, type DomainOutcome } from '../../engine/contracts';
import type { GameEvent } from '../../engine/types';

// Minor matters. They arrive on the phone, take one tap, and can be left on
// read. Leaving them on read is a decision and is recorded as one.

const phone = { slot: 'minor', channel: 'phone', office: 'Phone', intensity: 1 } as const;
const domain = (...effects: DomainEffect[]): DomainOutcome => ({ version: CONTRACT_VERSION, effects });

// The governor's road: one request per administration (the file fires once).
const ROAD_REQUEST: DomainEffect = {
  type: 'request.open', id: 'road.ss.$ADMIN', requester: { office: 'gov_ss' }, object: 'federal-road-in-governor-state',
  text: 'Fund and finish the stalled federal road in the governor\'s state.',
};

export const MINOR: GameEvent[] = [
  {
    ...phone, id: 'minor.governor_call', kind: 'recurring', category: 'politics', tone: 'dry',
    when: { turn: [2] }, weight: 8, max: 1,
    from: '{GOVCHAIR}',
    title: 'Please call urgently',
    body: [
      'Your Excellency, good morning. Please call when you are less busy. It is about the federal road in my state. Nothing serious. But urgent.',
    ],
    reads: [{ role: 'sap', good: 'It is not about the road, {SIR}. He wants to be seen to have access. Ten minutes on the phone is worth a month of goodwill.' }],
    choices: [
      {
        id: 'call', label: 'Call him back',
        outcomes: [{
          result: 'You speak for twelve minutes. The road is mentioned once. He tells four other governors that you called.',
          fx: [['bloc.party', 3], ['person.gov_ss', 4]],
          domain: domain(ROAD_REQUEST, { type: 'request.close', id: 'road.ss.$ADMIN', status: 'withdrawn', response: 'Raised once in a twelve-minute call and not pressed. Access, not the road, was the point.' }),
          archive: 'Returned the Governors\' Forum chairman\'s call.',
        }],
      },
      {
        id: 'road', label: 'Call him, and actually fund the road', naira: 0.05,
        outcomes: [{
          result: 'The road is funded. He is astonished. He had not expected to be taken literally, and now owes you for it.',
          fx: [['bloc.party', 5], ['zone.SS.approval', 2], ['person.gov_ss', 8]],
          favour: ['gov_ss', 'owed', 1],
          flags: { 'road.funded': true },
          follow: [{ event: 'react.road_done', after: [10, 14] }],
          // The road is now a public commitment of the Works ministry, due within the year.
          domain: domain(
            ROAD_REQUEST,
            { type: 'request.close', id: 'road.ss.$ADMIN', status: 'granted', response: 'Funded the same day.' },
            { type: 'commitment.open', id: 'road.ss.finish.$ADMIN', responsible: { office: 'min_works' }, object: 'finish-federal-road-in-governor-state', text: 'Finish the federal road in the Governors\' Forum chairman\'s state.', afterMonths: 12, visibility: 'public' },
          ),
          archive: 'Funded a federal road at a governor\'s request.',
        }],
      },
    ],
    ignored: {
      result: 'You did not call. He has told four other governors that you did not call.',
      fx: [['bloc.party', -3], ['person.gov_ss', -5]],
      domain: domain(ROAD_REQUEST, { type: 'request.close', id: 'road.ss.$ADMIN', status: 'refused', response: 'The message was not returned.' }),
      archive: 'Left the Governors\' Forum chairman\'s message unanswered.',
    },
  },
  {
    ...phone, id: 'minor.birthday', kind: 'standalone', category: 'temptation', tone: 'dry',
    when: { turn: [5] }, weight: 8,
    from: '{COS}',
    title: 'A birthday present',
    body: [
      '{SIR}, a contractor has sent a birthday present to the Villa. It is a wristwatch. I had it valued. It is worth more than this building\'s annual diesel budget.',
      'He says it is "just goodwill". His firm has a bid before the procurement bureau on Thursday.',
      { when: { v: ['debt.contractors', '>', 1] }, text: 'His firm is also among those the government has not paid for the last job. He has not mentioned that, which is the point of the watch.' },
    ],
    choices: [
      {
        id: 'return', label: 'Return it with a note',
        outcomes: [{
          result: 'The watch is returned. Word of it travels through the contractor community faster than a circular.',
          fx: [['nation.integrity', 1.5], ['bloc.party', -1]],
          archive: 'Returned a contractor\'s birthday gift.',
        }],
      },
      {
        id: 'keep', label: 'Keep it. It is only a watch.',
        outcomes: [{
          result: 'You keep it. On Thursday his bid is successful. Nobody told the bureau anything; nobody needed to.',
          fx: [['purse', 2], ['nation.integrity', -1.5]],
          flags: { 'drawer.open': true },
          exposure: { kind: 'personal', amount: 2, witnesses: ['cos', 'financier'], trail: 1 },
          archive: 'Kept a contractor\'s birthday gift.',
        }],
      },
      {
        id: 'declare', label: 'Declare it and hand it to the national museum',
        outcomes: [{
          result: 'The watch goes on display with a label. The contractor visits the museum to look at it, sadly.',
          fx: [['nation.integrity', 2], ['approval', 1], ['bloc.press', 2]],
          news: ['PRESIDENT DONATES CONTRACTOR\'S GIFT TO MUSEUM', 'CONTRACTOR DASH PRESIDENT WATCH. PRESIDENT DASH MUSEUM'],
          archive: 'Declared a contractor\'s gift and gave it to the national museum.',
        }],
      },
    ],
    ignored: {
      result: 'The watch stays in the Chief of Staff\'s safe, which is its own kind of answer.',
      fx: [['nation.integrity', -0.5]],
      archive: 'Did not decide what to do with a contractor\'s gift.',
    },
  },
  {
    ...phone, id: 'minor.cousin', kind: 'standalone', category: 'temptation', tone: 'farce',
    when: { turn: [4] }, weight: 8,
    from: '{COUSIN}',
    title: 'Your brother from the village',
    body: [
      'My President!!! Na your brother Friday. God has done it. I have registered a company, Friday & Sons Integrated Services. We do everything: road, catering, consultancy, borehole.',
      'Just one small contract to start. Even supply of biro. Family is family. Mama says greet you.',
    ],
    reads: [{ role: 'sap', good: 'Every President has a Friday, {SIR}. The ones who say yes end up with forty.' }],
    choices: [
      {
        id: 'no', label: '"Friday, the answer is no. Greet Mama."',
        outcomes: [{
          result: 'He replies with a crying emoji and a voice note of four minutes. Mama calls on Sunday.',
          fx: [['nation.integrity', 1]],
          archive: 'Refused a relative\'s request for a contract.',
        }],
      },
      {
        id: 'yes', label: 'Ask the Chief of Staff to "see what can be done"',
        outcomes: [{
          result: 'Friday & Sons is awarded the supply of stationery to nine ministries. It delivers to four. Friday buys a car and a second phone.',
          fx: [['nation.integrity', -2.5], ['pressure.scandalHeat', 6]],
          exposure: { kind: 'personal', amount: 1, witnesses: ['cos', 'cousin'], trail: 2 },
          later: [{ after: [6, 10], fx: [['bloc.press', -4], ['approval', -2]], label: 'The press finds the President\'s cousin\'s stationery contract.', note: ['PRESIDENT\'S RELATIVE WON ₦900M STATIONERY CONTRACT', 'FRIDAY & SONS: PRESIDENT COUSIN DEY SUPPLY BIRO FOR ₦900M'] }],
          archive: 'Arranged a government contract for a relative.',
        }],
      },
      {
        id: 'job', label: 'Send him money from your own pocket instead',
        outcomes: [{
          result: 'You send him something from your salary. He is offended for a week and grateful for a month.',
          archive: 'Gave a relative money from your own pocket instead of a contract.',
        }],
      },
    ],
    ignored: {
      result: 'He sends eleven more messages and a photograph of the company signboard.',
      archive: 'Ignored a relative\'s request for a contract.',
    },
  },
  {
    ...phone, id: 'minor.chair', kind: 'recurring', category: 'politics', tone: 'dry',
    when: { turn: [6] }, weight: 8, max: 1,
    from: '{CHAIR}',
    title: 'The structure',
    body: [
      'Your Excellency. The party secretariat has not paid staff for three months. The structure needs servicing. A party is like a generator.',
      'I am not asking for myself.',
      'He adds that about {DELEGATES} in every hundred convention delegates are with you today, and that delegates have long memories for who serviced the structure.',
    ],
    reads: [{ role: 'sap', good: 'He is partly asking for himself, {SIR}. But the staff really have not been paid.' }],
    choices: [
      {
        id: 'dues', label: 'Propose a transparent membership dues scheme',
        outcomes: [{
          result: 'He thanks you for the "innovative suggestion" and does not raise it again. Neither does he stop being short of money.',
          fx: [['bloc.party', -2], ['nation.integrity', 1]],
          archive: 'Offered the party a dues scheme instead of money.',
        }],
      },
      {
        id: 'service', label: 'Service the structure', purse: 4,
        outcomes: [{
          result: 'The secretariat staff are paid. So, it is understood, is the Chairman.',
          fx: [['bloc.party', 7], ['nation.integrity', -1]],
          exposure: { kind: 'political', amount: 4, witnesses: ['chair'], trail: 1 },
          archive: 'Funded the party secretariat from the drawer.',
        }],
      },
      {
        id: 'boards', label: 'Offer him two board appointments to distribute',
        outcomes: [{
          result: 'He accepts the appointments and distributes them within the hour.',
          fx: [['bloc.party', 4], ['nation.integrity', -1.5], ['nation.capacity', -0.5]],
          archive: 'Gave the party chairman board appointments to distribute.',
        }],
      },
    ],
    ignored: {
      result: 'He does not follow up. He has other people he can ask, and he asks them.',
      fx: [['bloc.party', -3]],
      archive: 'Left the party chairman\'s request unanswered.',
    },
  },
  {
    ...phone, id: 'minor.independence', kind: 'calendar', category: 'ceremonial', tone: 'dry',
    when: { month: [10] }, weight: 200, cooldown: 40, max: 2,
    from: 'Speechwriter',
    title: 'Independence Day broadcast',
    body: [
      '{SIR}, the 1 October broadcast is due at the studio by six. I have two drafts.',
      'Draft A lists achievements. Draft B admits what has not worked and says what happens next. Draft A is longer.',
      // A second year is judged against the first.
      { when: { all: [{ v: ['count.minor.independence', '>=', 2] }, { flag: 'independence.last', is: 'b' }] }, text: 'Last year you apologised. Draft B opens with that apology and goes through what was done about each thing you named. Several journalists have kept last year\'s transcript.' },
      { when: { all: [{ v: ['count.minor.independence', '>=', 2] }, { flag: 'independence.last', is: 'a' }] }, text: 'Last year\'s list of achievements has been checked by a fact-checking site, item by item. Draft A has quietly dropped four of them.' },
    ],
    choices: [
      {
        id: 'a', label: 'Draft A: achievements',
        outcomes: [
          {
            when: { v: ['hardship', '<', 50] },
            result: 'The broadcast runs for 31 minutes. It is fair, and it is received as fair.',
            fx: [['approval', 1], ['bloc.party', 1]],
            flags: { 'independence.last': 'a' },
            archive: 'Gave an Independence Day broadcast listing achievements.',
          },
          {
            result: 'The broadcast runs for 31 minutes. Viewers compare the list with their week.',
            fx: [['approval', -1.5], ['bloc.street', -2]],
            flags: { 'independence.last': 'a' },
            news: ['PRESIDENT LISTS GAINS IN INDEPENDENCE BROADCAST', 'WHICH COUNTRY PRESIDENT DEY TALK ABOUT?'],
            archive: 'Gave an Independence Day broadcast listing achievements while prices rose.',
          },
        ],
      },
      {
        id: 'b', label: 'Draft B: candour',
        outcomes: [{
          when: { all: [{ flag: 'independence.last', is: 'b' }, { v: ['hardship', '<', 50] }] },
          result: 'You read last year\'s apology, then what was done about each item on it. It is the first broadcast anyone has checked against the one before, and it survives the check.',
          fx: [['approval', 2], ['bloc.press', 3], ['bloc.street', 2]],
          news: ['PRESIDENT REPORTS BACK ON LAST YEAR\'S PLEDGES', 'LAST YEAR E SAY SORRY. THIS YEAR E SHOW WETIN E DO'],
          archive: 'Reported back on last year\'s Independence Day apology.',
        }, {
          when: { flag: 'independence.last', is: 'b' },
          result: 'You read last year\'s apology, then what was done about each item on it. The list of what was done is shorter than the apology. The country notices the arithmetic.',
          fx: [['approval', -1], ['bloc.press', 1], ['bloc.street', -1]],
          news: ['PRESIDENT REVISITS LAST YEAR\'S APOLOGY', 'SORRY AGAIN? THE LIST NEVER CHANGE'],
          archive: 'Revisited last year\'s Independence Day apology with little to show.',
        }, {
          result: 'You speak for eleven minutes. You say the word "sorry" once. Nobody can remember the last time that word was in the broadcast.',
          fx: [['approval', 1.5], ['bloc.press', 3], ['bloc.street', 2], ['bloc.party', -1]],
          flags: { 'independence.last': 'b' },
          news: ['"WE HAVE NOT DONE ENOUGH" — PRESIDENT', 'PRESIDENT TALK TRUE FOR ONCE. ELEVEN MINUTES'],
          archive: 'Gave a candid Independence Day broadcast.',
        }],
      },
    ],
    ignored: {
      result: 'The speechwriter sends Draft A. It is what speechwriters send.',
      fx: [['approval', -0.5]],
      archive: 'Left the Independence Day broadcast to the speechwriter.',
    },
  },
  {
    ...phone, id: 'minor.honours', kind: 'recurring', category: 'ceremonial', tone: 'dry',
    when: { all: [{ month: [9, 10, 11] }, { turn: [10] }] }, weight: 9, max: 1,
    from: '{COS}',
    title: 'The national honours list',
    body: [
      '{SIR}, the honours committee has sent 80 names. Since Monday I have received a further 370 "for your kind consideration", including nine from one governor, a serving minister who nominated himself, and Alhaji Kabir Birniwa, proposed for the second-highest honour by three separate intermediaries.',
    ],
    choices: [
      {
        id: 'eighty', label: 'The committee\'s 80, and nobody else',
        outcomes: [{
          result: 'The list includes a midwife, a retired teacher and a police corporal who returned a lost bag of dollars. 370 people are disappointed in you.',
          fx: [['nation.integrity', 1.5], ['bloc.party', -3], ['approval', 1], ['tycoon.ty_maker', -4]],
          ops: [['governors', -1]],
          news: ['MIDWIFE, CORPORAL AMONG 80 NATIONAL HONOURS RECIPIENTS', 'NATIONAL HONOURS WEY MAKE SENSE, FOR ONCE'],
          archive: 'Approved only the honours committee\'s list.',
        }],
      },
      {
        id: 'all', label: 'All 450',
        outcomes: [{
          result: 'The investiture takes nine hours. Recipients include three people facing trial. The medals run out at number 400.',
          fx: [['bloc.party', 5], ['nation.integrity', -1.5], ['bloc.press', -2], ['tycoon.ty_maker', 6]],
          ops: [['governors', 2], ['senators', 1]],
          news: ['450 RECEIVE NATIONAL HONOURS IN NINE-HOUR CEREMONY', 'MEDAL FINISH FOR NATIONAL HONOURS. EVERYBODY NA OFR'],
          archive: 'Gave national honours to all 450 nominees.',
        }],
      },
    ],
    ignored: {
      result: 'The list goes out as the committee and the lobbyists left it: 450.',
      fx: [['nation.integrity', -1], ['bloc.party', 3]],
      archive: 'Let the honours list go out unreviewed.',
    },
  },
  {
    ...phone, id: 'minor.trip', kind: 'recurring', category: 'politics', tone: 'farce',
    when: { turn: [3] }, weight: 8, max: 1,
    from: '{COS}',
    title: 'Delegation for the summit',
    body: [
      '{SIR}, the delegation list for next week\'s climate summit is ready for approval. It has 1,411 names.',
      'It includes eleven governors, their aides, a gospel singer, and a delegation from the Ministry of Interior described as "observers". The host country has asked whether there has been a typing error.',
    ],
    choices: [
      {
        id: 'cut', label: 'Cut it to 40 people who have read the agenda',
        outcomes: [{
          result: 'The list is cut. 1,371 people learn they are not going and tell the party about it.',
          fx: [['nation.integrity', 1.5], ['bloc.party', -3], ['nation.fiscalSpace', 0.02], ['approval', 1]],
          ops: [['governors', -1]],
          news: ['PRESIDENT SLASHES SUMMIT DELEGATION TO 40', 'ESTACODE DON CAST: ONLY 40 PEOPLE DEY GO'],
          archive: 'Cut a 1,411-person summit delegation to 40.',
        }],
      },
      {
        id: 'approve', label: 'Approve it',
        outcomes: [{
          result: 'Nigeria sends the largest delegation at the summit, ahead of the host. A photograph of the hotel lobby circulates.',
          fx: [['bloc.party', 3], ['approval', -1.5], ['bloc.press', -2], ['nation.fiscalSpace', -0.03]],
          ops: [['governors', 1]],
          news: ['NIGERIA SENDS 1,411 DELEGATES TO SUMMIT', '1,411 PEOPLE GO SUMMIT. WHO DEY PAY?'],
          archive: 'Approved a 1,411-person summit delegation.',
        }],
      },
    ],
    ignored: {
      result: 'Unreviewed, the list grows to 1,460 by the time of departure.',
      fx: [['approval', -1.5], ['bloc.press', -2], ['nation.fiscalSpace', -0.03]],
      archive: 'Let a 1,460-person summit delegation travel.',
    },
  },
  {
    ...phone, id: 'minor.title', kind: 'standalone', category: 'ceremonial', tone: 'farce',
    when: { turn: [9] }, weight: 7,
    from: 'Palace Secretary',
    title: 'A chieftaincy title',
    body: [
      'Your Excellency, His Royal Majesty wishes to confer on you the title of "Pillar That Holds The Roof Of The Kingdom".',
      'The ceremony requires your presence for six hours, a horse, and a donation toward the palace renovation "at Your Excellency\'s discretion".',
    ],
    choices: [
      {
        id: 'accept', label: 'Accept, with gratitude',
        outcomes: [{
          result: 'You are installed. The horse is spirited. The title is added to the six you already hold, and to every future programme of events.',
          fx: [['bloc.establishment', 3], ['approval', 0.5]],
          archive: 'Accepted a chieftaincy title.',
        }],
      },
      {
        id: 'decline', label: 'Decline until you have left office',
        outcomes: [{
          result: 'The palace is surprised and, on reflection, impressed. The offer is left open.',
          fx: [['nation.integrity', 1], ['bloc.establishment', -1], ['bloc.press', 1]],
          archive: 'Declined a chieftaincy title while in office.',
        }],
      },
    ],
    ignored: {
      result: 'The palace confers the title in absentia and sends the invoice for the horse.',
      archive: 'Did not reply to a palace offering a chieftaincy title.',
    },
  },
  {
    ...phone, id: 'minor.radar', kind: 'recurring', category: 'politics', tone: 'dry',
    when: { all: [{ turn: [8] }, { v: ['bloc.party', '<', 55] }] }, weight: 9, max: 1,
    from: '{SAP}',
    title: 'Something you should know',
    body: [
      '{SIR}. There is a group called "NWC — REAL". You are not in it. I am, under another name.',
      'Yesterday {CHAIR} wrote: "Let him enjoy the seat. We will discuss the ticket when the time comes." Eleven thumbs up. One governor replied with a clock emoji.',
      'By my count about {DELEGATES} in every hundred delegates would be yours at a convention held today.',
    ],
    choices: [
      {
        id: 'mend', label: 'Start mending fences, quietly', pc: 4,
        outcomes: [{
          result: 'You begin with the governor who sent the clock. He is surprised to be called. Within a week the group is discussing something else.',
          fx: [['bloc.party', 6]],
          ops: [['governors', 2]],
          archive: 'Quietly repaired relations after a warning from the Special Adviser.',
        }],
      },
      {
        id: 'confront', label: 'Let the Chairman know you have seen it',
        outcomes: [{
          result: 'He denies everything, warmly. That evening a third group is created. Your adviser is not in it.',
          fx: [['bloc.party', -3], ['rel.sap', -8]],
          memory: [['sap', -8, 'You burned his source in the party WhatsApp group.']],
          archive: 'Confronted the party chairman with a leaked group message.',
        }],
      },
    ],
    ignored: {
      result: 'You read it and say nothing. He takes that as an instruction to keep watching.',
      archive: 'Noted a warning from the Special Adviser without acting.',
    },
  },
  {
    ...phone, id: 'minor.labour', kind: 'recurring', category: 'labour', tone: 'dry',
    when: { all: [{ turn: [6] }, { v: ['pressure.wageGrievance', '>', 40] }] }, weight: 10, cooldown: 30, max: 2,
    from: '{LABOUR}',
    title: 'A courtesy',
    body: [
      '{MRP}. I am writing as a courtesy and not as a threat. My executive council meets on Friday. My members are hungry and I cannot keep telling them to wait.',
      'Give me something to carry into that room.',
      { when: { v: ['debt.pensions', '>', 0.3] }, text: 'And the pensioners sit in my office every morning. They are not asking for a rise. They are asking for what is theirs.' },
    ],
    reads: [{ role: 'sap', good: 'He is asking you to help him say no to his own hardliners, {SIR}. That is worth something.' }],
    choices: [
      {
        id: 'meet', label: 'Invite him to the Villa before Friday',
        outcomes: [{
          result: 'You meet for an hour without aides. He leaves with a date for talks and a photograph. On Friday the council votes to wait.',
          fx: [['pressure.wageGrievance', -8], ['bloc.street', 2]],
          archive: 'Met the labour leader privately before his council vote.',
        }],
      },
      {
        id: 'relief', label: 'Give him something real: a transport subsidy for workers', naira: 0.12,
        outcomes: [{
          result: 'He carries it into the room. The council passes a vote of thanks, which its secretary records with visible reluctance.',
          fx: [['pressure.wageGrievance', -16], ['bloc.street', 4]],
          news: ['FG APPROVES TRANSPORT SUPPORT FOR WORKERS', 'WORKERS GO GET TRANSPORT MONEY'],
          archive: 'Gave labour a transport subsidy ahead of a council vote.',
        }],
      },
      {
        id: 'pensions', label: 'Give him the pensioners: pay half the arrears before Friday',
        requires: { v: ['debt.pensions', '>', 0.2] },
        outcomes: [{
          result: 'The payment goes out on Thursday. He carries the bank alerts into the room on his own telephone. The council votes to wait, and the hardliners have nothing to say against paying the old.',
          fx: [['pressure.wageGrievance', -14], ['bloc.street', 4], ['approval', 1]],
          ops: [['paydebt', 'pensions', 0.5]],
          news: ['FG PAYS HALF OF PENSION ARREARS', 'PENSIONERS DON SEE ALERT. HALF, BUT ALERT'],
          archive: 'Paid half the pension arrears ahead of a labour council vote.',
        }],
      },
    ],
    ignored: {
      result: 'He carries nothing into the room. The council sets a date.',
      fx: [['pressure.wageGrievance', 10], ['bloc.street', -2]],
      archive: 'Did not reply to the labour leader before his council vote.',
    },
  },
  {
    ...phone, id: 'minor.children', kind: 'standalone', category: 'ceremonial', tone: 'dry',
    when: { month: [5, 6] }, weight: 8,
    from: '{COS}',
    title: 'Children\'s Day',
    body: [
      '{SIR}, forty primary school pupils are in the Council Chamber for Children\'s Day. One of them, aged nine, has asked to put a question to the President. Her teacher is trying to stop her.',
    ],
    choices: [
      {
        id: 'take', label: 'Take the question',
        outcomes: [{
          result: 'She asks why there is light in the Villa and not in her school. You answer honestly. It takes a while. She says, "Okay," in the tone of someone who will check.',
          fx: [['approval', 1.5], ['bloc.press', 2]],
          news: ['NINE-YEAR-OLD QUIZZES PRESIDENT ON ELECTRICITY', 'SMALL GIRL ASK PRESIDENT THE QUESTION WE ALL WAN ASK'],
          archive: 'Took a nine-year-old\'s question about electricity on Children\'s Day.',
        }],
      },
      {
        id: 'photo', label: 'Group photograph only',
        outcomes: [{
          result: 'The photograph is taken. She is in the second row, not smiling.',
          archive: 'Hosted schoolchildren at the Villa.',
        }],
      },
    ],
    ignored: {
      result: 'The Vice President receives the children. The question is asked anyway.',
      archive: 'Missed the Children\'s Day visit.',
    },
  },
  {
    ...phone, id: 'minor.convoy', kind: 'standalone', category: 'scandal', tone: 'farce',
    when: { turn: [7] }, weight: 8,
    from: '{SAP}',
    title: 'A convoy',
    body: [
      '{SIR}, a Special Assistant on Protocol was filmed in a 14-vehicle convoy with siren, driving against traffic to a naming ceremony. His official entitlement is one saloon car.',
      'When stopped, he asked the traffic officer, "Do you know who I am?" The officer, on camera, said no.',
    ],
    choices: [
      {
        id: 'sack', label: 'Relieve him, and commend the officer',
        outcomes: [{
          result: 'The Special Assistant is relieved. The officer is promoted. "Do you know who I am?" "No." becomes a ringtone.',
          fx: [['approval', 2], ['bloc.street', 2], ['bloc.villa', -2]],
          news: ['PRESIDENT SACKS AIDE, COMMENDS TRAFFIC OFFICER', '"DO YOU KNOW WHO I AM?" "NO." — OFFICER GETS PROMOTION'],
          archive: 'Dismissed an aide over an illegal convoy and commended the officer who stopped him.',
        }],
      },
      {
        id: 'warn', label: 'A quiet warning',
        outcomes: [{
          result: 'He is warned. The convoy is reduced to nine.',
          fx: [['approval', -1], ['nation.integrity', -0.5]],
          archive: 'Quietly warned an aide over an illegal convoy.',
        }],
      },
    ],
    ignored: {
      result: 'Nothing is said. The officer is transferred to a border post by someone, for something.',
      fx: [['approval', -1.5], ['bloc.street', -2]],
      news: ['OFFICER WHO STOPPED AIDE\'S CONVOY TRANSFERRED', 'DEM DON TRANSFER THE OFFICER WEY TALK "NO"'],
      archive: 'Did nothing about an aide\'s illegal convoy.',
    },
  },
  {
    ...phone, id: 'minor.refinery', kind: 'recurring', category: 'infrastructure', tone: 'farce',
    when: { all: [{ turn: [5] }, { not: { flag: 'refinery.sold' } }, { not: { flag: 'refinery.exposed' } }, { not: { flag: 'refinery.audit' } }, { v: ['venture.refinery', '<', 1] }, { v: ['active.refinery', '==', 0] }] }, weight: 8, cooldown: 14, max: 4,
    from: 'Minister of State, Petroleum',
    title: 'Refinery: good news',
    body: [
      'Your Excellency, I am pleased to report that the rehabilitation of the refinery has reached mechanical completion and will commence production by the end of the quarter.',
      { when: { v: ['counter.refpaid', '==', 0] }, text: 'A further $290m is required to complete the completion.' },
      { when: { v: ['counter.refpaid', '==', 1] }, text: 'The $290m released last time has been fully absorbed by the completion. A further $410m is required to complete it.' },
      { when: { v: ['counter.refpaid', '>=', 2] }, text: 'Owing to unforeseen foreseeable circumstances, a further $600m is required. This is the final tranche, as were the previous ones.' },
      { when: { v: ['count.minor.refinery', '>=', 2] }, text: 'Apart from the amount, this message is identical to the last one.' },
      { when: { v: ['tycoon.ty_fuel', '>=', 30] }, text: 'Chief Tonye Amangala, who imports what the refinery does not make, has called its rehabilitation "a matter of national pride" and hopes it continues.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Release the funds', naira: 0.35,
        outcomes: [{
          result: 'The funds are released. A ceremony is held. A tanker is filmed leaving the gate. It is later established that the tanker had also been filmed entering.',
          fx: [['nation.integrity', -1], ['bloc.press', -2], ['tycoon.ty_fuel', 3], ['counter.refpaid', 1]],
          follow: [{ event: 'refinery.scandal', after: [6, 10], when: { v: ['counter.refpaid', '>=', 2] } }],
          news: ['REFINERY "RESUMES PRODUCTION" — MINISTER', 'REFINERY DON START? THE TANKER ENTER WITH THE FUEL'],
          archive: 'Released further funds for the refinery rehabilitation.',
        }],
      },
      {
        id: 'sell', label: 'Direct that the refinery be sold', pc: 6,
        outcomes: [{
          result: 'The refinery is put up for sale. The unions picket, four ministers object, and a buyer is found who intends to actually run it.',
          fx: [['nation.fiscalSpace', 0.3], ['bloc.establishment', 4], ['bloc.street', -2], ['bloc.party', -3], ['tycoon.ty_fuel', -8]],
          flags: { 'refinery.sold': true },
          later: [{ after: [12, 16], fx: [['pressure.fuelSupplyStress', -15], ['nation.fiscalSpace', 0.2]], label: 'The privatised refinery begins producing petrol.', note: ['PRIVATISED REFINERY SHIPS FIRST PETROL', 'REFINERY DEY WORK! ONLY TOOK SELLING AM'] }],
          news: ['FG TO SELL STATE REFINERY', 'GOVERNMENT WAN SELL REFINERY. E DON TIRE THEM'],
          archive: 'Ordered the state refinery sold.', sig: 2,
        }],
      },
      {
        id: 'visit', label: 'Announce an unscheduled visit for tomorrow',
        outcomes: [{
          result: 'You arrive at 9am. The control room has no power. A goat is asleep by the distillation unit. The Minister of State is "indisposed".',
          fx: [['nation.integrity', 1.5], ['bloc.press', 3], ['approval', 1]],
          flags: { 'refinery.exposed': true },
          follow: [{ event: 'refinery.exposed', after: 1 }],
          news: ['PRESIDENT PAYS SURPRISE VISIT TO REFINERY', 'PRESIDENT REACH REFINERY, MEET GOAT'],
          archive: 'Made an unannounced visit to the refinery and found it idle.',
        }],
      },
    ],
    ignored: {
      result: 'A reminder arrives. The completion remains incomplete.',
      archive: 'Did not reply to a request for more refinery funds.',
    },
  },
  // ---------------------------------------------------------------- the naira, the budget, the people you have hurt
  {
    ...phone, id: 'minor.cbn', kind: 'recurring', category: 'economy', tone: 'dry',
    when: { all: [{ v: ['fx.peg', '==', 1] }, { v: ['fx.reserves', '<', 18] }] }, weight: 14, cooldown: 6, max: 3,
    from: 'Governor, Central Bank',
    title: 'The reserves',
    body: [
      'Your Excellency, at the present rate of intervention the reserves will not see the year out. I can continue to defend the rate as instructed. I would be failing in my duty if I did not say that the market has already decided where it is going.',
    ],
    choices: [
      {
        id: 'move', label: 'Let it move to a managed rate',
        outcomes: [{
          result: 'The central bank stops selling at the old rate. The naira slides for a week, then steadies. The queues at the banks disappear, and so do certain businessmen\'s margins.',
          fx: [['bloc.establishment', 3], ['tycoon.ty_trade', -6]],
          flags: { 'fx.stance': 'managed' },
          news: ['CBN EASES DEFENCE OF NAIRA', 'CBN DON STOP TO SELL DOLLAR CHEAP'],
          archive: 'Let the central bank stop defending the naira.',
        }],
      },
      {
        id: 'hold', label: 'Hold the line',
        outcomes: [{
          result: 'The Governor acknowledges the instruction in writing, which is how central bankers say they disagree.',
          fx: [['bloc.establishment', -2]],
          news: ['CBN REAFFIRMS NAIRA DEFENCE', 'CBN SAY DEM GO HOLD NAIRA'],
          archive: 'Ordered the central bank to keep defending the naira.',
        }],
      },
      {
        id: 'forward', label: 'Ask the oil traders to bring forward this year\'s cargo payments', pc: 3,
        outcomes: [{
          result: 'Three months of oil money arrives in one. The reserves look healthier. They will look correspondingly worse in the spring.',
          fx: [['fx.reserves', 4], ['bloc.establishment', -1]],
          later: [{ after: [4, 6], fx: [['fx.reserves', -4]], label: 'The oil payments brought forward are missed in the months they were due.' }],
          news: ['RESERVES RISE ON EARLY OIL RECEIPTS', 'RESERVE DON RISE. NA BORROW FROM TOMORROW'],
          archive: 'Brought forward oil receipts to prop up the reserves.',
        }],
      },
    ],
    ignored: {
      result: 'The Governor keeps defending the rate. The reserves keep falling.',
      archive: 'Did not reply to the central bank about the reserves.',
    },
  },
  {
    ...phone, id: 'minor.bdc', kind: 'recurring', category: 'economy', tone: 'farce',
    when: { v: ['fx.premium', '>=', 20] }, weight: 9, cooldown: 12, max: 2,
    from: 'Chairman, Association of Bureau de Change Operators',
    title: 'We are not the problem',
    body: [
      'Your Excellency, our members are being blamed on television for the price of the dollar. We only sell what the market will pay. If the central bank sold dollars to the public at its own rate, we would have nothing to sell. We would like this to be said by someone in government.',
    ],
    choices: [
      {
        id: 'raid', label: 'Have the police raid the bureaux de change',
        outcomes: [{
          result: 'Forty kiosks are closed on live television. The street rate rises the next morning, because there are now fewer places to buy dollars.',
          fx: [['bloc.street', 1], ['nation.integrity', -1], ['bloc.establishment', -2]],
          news: ['POLICE RAID BUREAU DE CHANGE OPERATORS', 'POLICE DON CLOSE BDC. DOLLAR DON COST PASS'],
          archive: 'Had the police raid the bureaux de change.',
        }],
      },
      {
        id: 'agree', label: 'Say it: the official rate is the problem',
        outcomes: [{
          result: 'The Minister of Finance says, carefully, that the official rate "does not reflect market conditions". Importers with allocations are furious. Economists are relieved.',
          fx: [['bloc.establishment', 2], ['bloc.press', 2], ['tycoon.ty_trade', -4]],
          news: ['FG CONCEDES OFFICIAL RATE "OUT OF STEP"', 'GOVERNMENT DON AGREE SAY THEIR RATE NO REAL'],
          archive: 'Conceded publicly that the official exchange rate was unrealistic.',
        }],
      },
    ],
    ignored: { result: 'The operators keep selling dollars at the price the market pays, and keep being blamed for it.', archive: 'Ignored the bureau de change operators.' },
  },
  {
    ...phone, id: 'minor.zango', kind: 'recurring', category: 'politics', tone: 'dry',
    when: { any: [{ flag: 'budget.how', is: 'veto' }, { flag: 'budget.how', is: 'stalled' }] }, weight: 12, cooldown: 10, max: 2,
    from: '{SENPRES}\'s office, on behalf of Senator Dauda Zango',
    title: 'A word about the next budget',
    body: [
      'Senator Zango asks me to convey that the Committee on Appropriations harbours no ill will over the recent budget. The Senator merely observes that next year\'s will also pass through the committee, as will every bill the Presidency hopes to see enacted.',
    ],
    choices: [
      {
        id: 'mend', label: 'Invite the Senator to dinner, with a constituency project on the menu', naira: 0.1,
        outcomes: [{
          result: 'The dinner goes well. A borehole programme is announced for the Senator\'s district. The committee\'s ill will, which did not exist, is no longer an issue.',
          fx: [['person.sen_approp', 12], ['nation.integrity', -1]],
          news: ['FG FLAGS OFF BOREHOLE PROJECT IN ZANGO\'S DISTRICT', 'ZANGO DON GET HIM PROJECT'],
          archive: 'Made peace with the Appropriations chairman with a constituency project.',
        }],
      },
      {
        id: 'stand', label: 'Reply that the Presidency looks forward to working with the committee',
        outcomes: [{
          result: 'The reply is polite and changes nothing, which the Senator correctly reads as a refusal.',
          fx: [['person.sen_approp', -4], ['bloc.press', 1]],
          news: ['PRESIDENCY, SENATE COMMITTEE IN COLD WAR OVER BUDGET', 'PRESIDENT AND ZANGO NO DEY TALK'],
          archive: 'Declined to make peace with the Appropriations chairman.',
        }],
      },
    ],
    ignored: { result: 'The Senator files the silence alongside the veto.', archive: 'Did not reply to the Appropriations chairman.' },
  },
  {
    ...phone, id: 'minor.amangala', kind: 'standalone', category: 'economy', tone: 'dry',
    when: { v: ['active.refinery', '==', 1] }, weight: 14, max: 1,
    from: 'Chief Tonye Amangala',
    title: 'A consultancy',
    body: [
      'Your Excellency, I have followed the refinery rehabilitation with patriotic interest. My companies have long experience of the petroleum supply chain and would be honoured to advise on the project, on terms that would of course reflect the national interest and some of yours.',
    ],
    choices: [
      {
        id: 'refuse', label: 'Decline the consultancy',
        outcomes: [{
          result: 'He thanks you for your time. His lawyers file a suit against the contractor the following week.',
          fx: [['tycoon.ty_fuel', -8], ['nation.integrity', 1]],
          news: ['FUEL IMPORTERS CHALLENGE REFINERY CONTRACT IN COURT', 'AMANGALA DON CARRY REFINERY GO COURT'],
          archive: 'Turned down Chief Amangala\'s offer to "advise" the refinery project.',
        }],
      },
      {
        id: 'take', label: 'Accept, and let something come back',
        outcomes: [{
          result: 'His company is engaged as consultant. Its advice is that the project should proceed more slowly. Something arrives in the drawer.',
          fx: [['tycoon.ty_fuel', 15], ['purse', 15], ['nation.integrity', -2]],
          exposure: { kind: 'personal', amount: 15, witnesses: ['fin'], trail: 2 },
          news: ['AMANGALA FIRM HIRED AS REFINERY CONSULTANT', 'THE FUEL IMPORTER DON BECOME REFINERY ADVISER'],
          archive: 'Hired the fuel importer whose business depends on the refinery failing as its consultant, for a consideration.',
        }],
      },
    ],
    ignored: { result: 'He takes the silence as a no, and acts accordingly.', archive: 'Ignored Chief Amangala\'s approach about the refinery.' },
  },
  {
    ...phone, id: 'minor.clearair', kind: 'recurring', category: 'politics', tone: 'dry',
    cast: { WHO: 'wrongedPerson' }, weight: 10, cooldown: 8, max: 3,
    from: '{WHO}',
    title: 'Clearing the air',
    body: [
      '{WHO} would like a meeting, "to clear the air". The aide who called was careful to say that nothing has been forgotten, and equally careful to say that everything can be discussed.',
    ],
    choices: [
      {
        id: 'meet', label: 'Meet, and make amends', pc: 3,
        outcomes: [{
          result: 'The meeting runs long. Nothing is admitted on either side. Something is settled anyway.',
          fx: [['person.$WHO', 8]],
          ops: [['forgive', '$WHO']],
          news: ['PRESIDENT, {WHO_SHORT} MEET BEHIND CLOSED DOORS', 'PRESIDENT AND {WHO_SHORT} DON SETTLE?'],
          archive: 'Made amends with {WHO}.',
        }],
      },
      {
        id: 'no', label: 'Send word that the President\'s diary is full',
        outcomes: [{
          result: 'The aide thanks you for your time. The message has been received, on both sides.',
          fx: [['person.$WHO', -4]],
          news: ['{WHO_SHORT} SNUBBED BY PRESIDENCY, AIDES SAY', 'PRESIDENT NO GREE SEE {WHO_SHORT}'],
          archive: 'Refused to meet {WHO}.',
        }],
      },
    ],
    ignored: { result: 'No reply is sent. None is needed.', archive: 'Did not answer {WHO}\'s request to meet.' },
  },
];
