import { CONTRACT_VERSION } from '../../engine/contracts';
import type { GameEvent } from '../../engine/types';

// Party, Assembly and survival: screening, letters, defections, the ticket,
// the five breaking chains and removal proceedings.

export const POLITICS: GameEvent[] = [
  {
    id: 'senate.screening', kind: 'calendar', slot: 'lead', category: 'politics', tone: 'farce', intensity: 2,
    when: { turn: [1, 1] }, max: 1,
    office: 'Office of the Senate President', stamp: 'ROUTINE',
    title: 'Screening of ministerial nominees',
    body: [
      'The Senate has begun screening your ministerial nominees.',
      'Nominees who previously served in the National Assembly were asked to take a bow and go. This took four minutes each.',
      '{FIN}, your nominee for Finance, is next. {SENPRES} has let it be known that the Senate "expects to be carried along" on board appointments.',
      'Senator Maigari decides which bills are heard. Every reform of yours that needs a law will pass across his desk, and so will every budget.',
    ],
    reads: [
      { role: 'sap', good: 'He wants six board chairmanships, {SIR}. He will settle for three and a road in his district. Or he can make the next four years slow.' },
    ],
    choices: [
      {
        id: 'carry', label: 'Carry the Senate along: three boards and a road',
        outcomes: [{
          result: 'All nominees are confirmed by voice vote before lunch. The Senate President describes them as "eminently qualified", and understands that he now owes you a small courtesy in return.',
          fx: [['bloc.party', 5], ['nation.integrity', -1.5], ['pc', 3], ['person.sen_pres', 4]],
          favour: ['sen_pres', 'owed', 1],
          flags: { 'senate.friendly': true },
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['sen_pres'], trail: 0 },
          news: ['SENATE CONFIRMS ALL MINISTERIAL NOMINEES', 'BOW AND GO: SENATE CLEARS EVERYBODY SHARP-SHARP'],
          archive: 'Traded board appointments for a smooth Senate confirmation.',
        }],
      },
      {
        id: 'merit', label: 'Decline; let the nominees be screened on merit', pc: 5,
        outcomes: [
          {
            when: { v: ['char.fin.clout', '>=', 4] },
            result: 'Your Finance nominee is asked to take a bow and go. The rest are held for a fortnight "pending security clearance".',
            fx: [['bloc.party', -3], ['nation.integrity', 1.5], ['bloc.press', 2]],
            news: ['SENATE CONFIRMS FINANCE MINISTER, STEPS DOWN OTHERS', 'SENATE DEY DRAG MINISTERS\' LIST'],
            archive: 'Refused to trade appointments for Senate confirmation.',
          },
          {
            result: 'Your Finance nominee is questioned for three hours, mostly on the price of garri and the state of a road in the Chairman\'s district. Confirmation takes five weeks.',
            fx: [['bloc.party', -6], ['nation.integrity', 2], ['bloc.press', 3], ['bloc.villa', -2]],
            news: ['SENATE GRILLS FINANCE NOMINEE FOR THREE HOURS', '"HOW MUCH IS GARRI?" — SENATOR TO NOMINEE'],
            archive: 'Refused to trade appointments for Senate confirmation.',
          },
        ],
      },
    ],
  },
  {
    id: 'elder.letter', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2,
    when: { all: [{ turn: [9] }, { any: [{ v: ['approval', '<', 46] }, { v: ['bloc.party', '<', 45] }] }] },
    weight: 9, cooldown: 34, max: 2,
    office: 'Office of the Special Adviser, Media and Publicity', stamp: 'ROUTINE',
    title: 'An open letter from {ELDER}',
    body: [
      { when: { v: ['count.elder.letter', '<', 2] }, text: '{ELDER} has published an eighteen-page open letter titled "Before It Is Too Late".' },
      { when: { v: ['count.elder.letter', '<', 2] }, text: 'It accuses the administration of "drift", recalls his own period of service favourably, and was released to the press before it reached the Villa.' },
      { when: { v: ['count.elder.letter', '<', 2] }, text: 'He remains a member of your party. He has written such letters to every President since the return to civil rule, usually in the second year.' },
      // The second letter answers what was done with the first.
      { when: { v: ['count.elder.letter', '>=', 2] }, text: '{ELDER} has written again. The second letter is shorter than the first and was sent to the governors before the press.' },
      { when: { all: [{ v: ['count.elder.letter', '>=', 2] }, { flag: 'elder.first', is: 'visit' }] }, text: 'It recalls your visit to his library warmly, and says that being listened to attentively has turned out to be all he received.' },
      { when: { all: [{ v: ['count.elder.letter', '>=', 2] }, { flag: 'elder.first', is: 'rebut' }] }, text: 'It quotes your rebuttal back to you, paragraph by paragraph, against what has happened since.' },
      { when: { all: [{ v: ['count.elder.letter', '>=', 2] }, { flag: 'elder.first', is: 'ignore' }] }, text: 'It begins with the two lines your office sent last time, printed in full, and observes that fatherly counsel is easier to thank than to take.' },
      { when: { v: ['govs', '<', 3] }, text: 'Three of your own governors are quoted in it, anonymously and at length.' },
    ],
    reads: [
      { role: 'sap', good: 'He wants to be visited, {SIR}. A photograph in his sitting room ends this. A rebuttal gives him a second letter.' },
    ],
    choices: [
      {
        id: 'visit', label: 'Pay him a courtesy visit',
        outcomes: [{
          result: 'You are received in his library. He tells the press afterwards that {MRP} "listened attentively", which is his highest praise.',
          fx: [['bloc.party', 4], ['bloc.establishment', 3], ['pc', -2]],
          ops: [['governors', 2]],
          flags: { 'elder.first': 'visit' },
          news: ['PRESIDENT VISITS ELDER STATESMAN AFTER LETTER', 'PRESIDENT GO BEG BABA'],
          archive: 'Visited the elder statesman after his open letter.',
        }],
      },
      {
        id: 'rebut', label: 'Issue a point-by-point rebuttal',
        outcomes: [{
          result: 'The rebuttal runs to twenty-two pages. He replies within the week, at twenty-six.',
          fx: [['bloc.party', -4], ['bloc.press', -2], ['bloc.establishment', -3]],
          later: [{ after: [3, 5], fx: [['bloc.party', -3], ['approval', -1]], label: 'The elder statesman publishes a third letter.', note: ['ELDER STATESMAN WRITES PRESIDENT AGAIN', 'BABA DON WRITE LETTER NUMBER THREE'] }],
          flags: { 'elder.first': 'rebut' },
          news: ['PRESIDENCY REPLIES ELDER STATESMAN', 'LETTER FIGHT: VILLA VS BABA, ROUND TWO'],
          archive: 'Issued a rebuttal to the elder statesman\'s open letter.',
        }],
      },
      {
        id: 'ignore', label: 'Thank him for his "fatherly counsel" and move on',
        outcomes: [{
          result: 'A two-line statement is issued. He is reported to be drafting.',
          fx: [['bloc.party', -1]],
          flags: { 'elder.first': 'ignore' },
          news: ['PRESIDENCY THANKS ELDER FOR "FATHERLY ADVICE"', 'VILLA TO BABA: "NOTED"'],
          archive: 'Acknowledged the elder statesman\'s open letter in two lines.',
        }],
      },
    ],
  },
  {
    id: 'senate.fight', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'farce', intensity: 2,
    // There must be a tax bill in the Senate: the tax reform (t1) is under way.
    when: { all: [{ turn: [8] }, { v: ['active.t1', '==', 1] }] }, weight: 9,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: 'An incident during the tax debate',
    body: [
      'During the second reading of your Tax Administration Bill, two Distinguished Senators began threatening each other on the floor of the chamber, live on national television.',
      'One invited the other to "meet me outside". The other accepted. The Sergeant-at-Arms intervened at the door.',
      'Neither senator had read the bill. The disagreement concerned seating.',
      'The bill has been stepped down to allow tempers to cool.',
      'This is the bill behind your tax reform. Every week it sits is a week the reform does not move.',
    ],
    reads: [
      { role: 'sap', good: 'The bill is not dead, {SIR}, it is embarrassed. {SENPRES} needs a way to bring it back without it looking like your idea.' },
    ],
    choices: [
      {
        id: 'quiet', label: 'Let the Senate President reintroduce it as a Senate initiative', pc: 4,
        outcomes: [{
          result: 'The bill returns as the "Senate Fiscal Harmony Bill". It is your bill with a new title. It passes.',
          fx: [['nation.capacity', 2], ['nation.fiscalSpace', 0.2], ['bloc.party', 3], ['person.sen_pres', 7], ['person.sen_lead', 4]],
          later: [{ after: [8, 12], fx: [['nation.fiscalSpace', 0.4], ['nation.debt', -2]], label: 'The tax administration reforms begin to raise collection.' }],
          news: ['SENATE PASSES FISCAL HARMONY BILL', 'AFTER THE FIGHT, DEM PASS THE BILL'],
          archive: 'Let the Senate take credit for the tax administration bill.', sig: 2,
        }],
      },
      {
        id: 'public', label: 'Condemn the conduct and demand passage',
        outcomes: [
          {
            when: { v: ['approval', '>=', 50] },
            result: 'Public opinion is with you. The Senate passes the bill within the month and resents every minute of it.',
            fx: [['nation.capacity', 2], ['nation.fiscalSpace', 0.2], ['bloc.party', -5], ['approval', 1.5], ['bloc.press', 2], ['person.sen_pres', -8]],
            later: [{ after: [8, 12], fx: [['nation.fiscalSpace', 0.4], ['nation.debt', -2]], label: 'The tax administration reforms begin to raise collection.' }],
            news: ['PRESIDENT REBUKES SENATE; TAX BILL PASSES', 'PRESIDENT SHAME SENATORS, BILL PASS'],
            archive: 'Shamed the Senate into passing the tax administration bill.', sig: 2,
          },
          {
            result: 'The Senate passes a resolution deploring "executive interference". The bill is referred to a committee whose chairman is one of the two senators.',
            fx: [['bloc.party', -7], ['bloc.press', 1], ['person.sen_pres', -10], ['person.sen_approp', -5], ['counter.rebuffed', 1]],
            news: ['SENATE REBUFFS PRESIDENT OVER TAX BILL', 'SENATORS VEX: "PRESIDENT NO FIT TALK TO US ANYHOW"'],
            archive: 'Tried to shame the Senate over the tax bill. It did not work.',
          },
        ],
      },
      {
        id: 'drop', label: 'Withdraw the bill',
        outcomes: [{
          result: 'The bill is withdrawn "for further consultation". The clip of the two senators outlives it.',
          fx: [['bloc.establishment', -3], ['bloc.party', 2], ['tycoon.ty_bank', -4], ['counter.withdrawn', 1]],
          news: ['FG WITHDRAWS TAX BILL', 'TAX BILL DON DIE. THE FIGHT STILL DEY TREND'],
          archive: 'Withdrew the tax administration bill.',
        }],
      },
    ],
  },
  {
    id: 'party.decamp', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3,
    when: { all: [{ turn: [12] }, { v: ['bloc.party', '<', 50] }] },
    weight: 10, cooldown: 30, max: 2,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'Defections',
    body: [
      { when: { v: ['count.party.decamp', '<', 2] }, text: 'Eleven members of the House and two state party chairmen have announced their defection to the {OPPARTY}.' },
      // The second wave is smaller, and it remembers how the first was handled.
      { when: { v: ['count.party.decamp', '>=', 2] }, text: 'A second wave: seven more members of the House, a senator and a deputy governor have announced their defection to the {OPPARTY}.' },
      { when: { all: [{ v: ['count.party.decamp', '>=', 2] }, { flag: 'decamp.first', is: 'call' }] }, text: 'Two of them came back after your telephone calls last time. Being called once, it turns out, was not the same as being kept.' },
      { when: { all: [{ v: ['count.party.decamp', '>=', 2] }, { flag: 'decamp.first', is: 'seats' }] }, text: 'The suit against the first group has still not been heard. This group has read the cause list.' },
      { when: { all: [{ v: ['count.party.decamp', '>=', 2] }, { flag: 'decamp.first', is: 'logistics' }] }, text: 'Three of them came back last time for "the benefits of membership". The benefits have been spent, and so has their loyalty.' },
      { when: { all: [{ v: ['count.party.decamp', '>=', 2] }, { flag: 'decamp.first', is: 'go' }] }, text: 'You let the first group go. The House majority was seven after they left. This group would leave it at two.' },
      { when: { v: ['rival.strong', '>', 40] }, text: 'Senator Dandume\'s people met them at the airport. He built half of your party\'s structure and is taking it back a ward at a time.' },
      { when: { v: ['govs', '<', 3] }, text: 'None of your governors tried to stop them. Fewer than half of the six are still firmly with you.' },
      'Each cited "irreconcilable division in the party at the national level", the form of words required by the Constitution for a legislator to defect and keep the seat.',
      'There is no division at the national level. {CHAIR} is now considering creating one, so that the next group can leave lawfully.',
    ],
    trace: [['bloc.party', -1]],
    reads: [
      { role: 'sap', good: 'They are not leaving over ideology, {SIR}. Nobody here has one. They are leaving because they think you will lose, or because nobody has called them.' },
    ],
    choices: [
      {
        id: 'call', label: 'Call each of them personally', pc: 6,
        outcomes: [{
          result: 'Four of the legislators return, describing their defection as "a misunderstanding". The rest do not pick up.',
          fx: [['bloc.party', 6]],
          ops: [['senators', 2]],
          flags: { 'decamp.first': 'call' },
          news: ['FOUR LAWMAKERS RETURN TO RULING PARTY', 'DEFECTORS DON COME BACK. NA SO DEM DEY DO'],
          archive: 'Personally called defecting legislators back to the party.',
        }],
      },
      {
        id: 'seats', label: 'Ask the courts to declare their seats vacant',
        outcomes: [{
          result: 'The suit is filed. It will be heard in due course, which is after the next election.',
          fx: [['bloc.party', -3], ['bloc.press', -1]],
          flags: { 'decamp.first': 'seats' },
          news: ['RULING PARTY SUES DEFECTORS', 'PARTY RUN GO COURT. SEE YOU IN 2035'],
          archive: 'Sued defecting legislators for their seats.',
        }],
      },
      {
        id: 'logistics', label: 'Remind them of the benefits of membership', purse: 6,
        outcomes: [{
          result: 'All but two of them rediscover their faith in the party\'s manifesto.',
          fx: [['bloc.party', 10], ['nation.integrity', -1.5]],
          exposure: { kind: 'political', amount: 6, witnesses: ['sen_lead', 'chair'], trail: 1 },
          flags: { 'decamp.first': 'logistics' },
          news: ['DEFECTORS RETURN, AFFIRM LOYALTY TO PRESIDENT', 'THEY RETURN OVERNIGHT. HOW MUCH?'],
          archive: 'Paid defecting legislators to return.',
        }],
      },
      {
        id: 'go', label: 'Let them go',
        outcomes: [{
          when: { v: ['count.party.decamp', '>=', 2] },
          result: 'The Presidency wishes them well again. The party\'s majority in the House is down to two, and every vote from now on is a negotiation.',
          fx: [['bloc.party', -6], ['pc', -5], ['nation.integrity', 0.5], ['rival.strong', 5], ['person.sen_lead', -4]],
          news: ['SECOND WAVE OF DEFECTIONS CUTS RULING PARTY\'S HOUSE MAJORITY TO TWO', 'PRESIDENT SAY MAKE DEM GO. HOUSE MAJORITY DON THIN'],
          archive: 'Let a second wave of legislators defect; the House majority fell to two.',
        }, {
          result: 'The Presidency wishes them well. The party\'s majority in the House is now seven.',
          fx: [['bloc.party', -6], ['pc', -4], ['nation.integrity', 0.5], ['rival.strong', 5]],
          flags: { 'decamp.first': 'go' },
          news: ['PRESIDENCY UNMOVED BY DEFECTIONS', 'PRESIDENT: "MAKE DEM GO"'],
          archive: 'Let eleven legislators and two party chairmen defect.',
        }],
      },
    ],
  },
  {
    // Every first term meets it once, in month 34. Against a President projected to win by six or more, the merger is broad.
    id: 'opposition.unites', kind: 'threshold', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, max: 1,
    when: { all: [{ term: 1 }, { termTurn: [34, 38] }] },
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'The opposition is discussing a merger',
    body: [
      'Your three rivals are in talks to field a single candidate against you. {OPP}, the strongest of them today, is the likely flagbearer.',
      { when: { flag: 'rival.strong.in' }, text: 'Senator Dandume, who is back in your party, is not at the table. That is one fewer than they hoped for.' },
      { when: { flag: 'rival.alt.in' }, text: 'Dr Malumfashi, who now chairs your economic council, is not at the table.' },
      { when: { v: ['debts', '>', 0] }, text: 'The businessmen who are against you are paying for the hotel.' },
      'The talks are being held in a hotel in Abuja. They have so far failed to agree on a name, a logo, a chairman or a venue for the next meeting.',
      { when: { v: ['outlook', '>=', 6] }, text: 'You are far enough ahead that none of them can win alone, and every one of them knows it. They will not fall out this time unless somebody makes them.' },
      'A united opposition would cost you an estimated six points nationally.',
    ],
    reads: [
      { role: 'sap', good: 'They will fall out on their own if left alone, {SIR}. Probably. One of the small parties\' chairmen has let it be known he is open to conversation.' },
    ],
    choices: [
      {
        id: 'leave', label: 'Leave them to it',
        outcomes: [
          {
            chance: 0.5, when: { v: ['outlook', '<', 6] },
            result: 'The talks collapse over the vice-presidential slot. Two of the parties announce their own candidates the same afternoon.',
            flags: { 'opposition.split': true },
            news: ['OPPOSITION MERGER TALKS COLLAPSE', 'OPPOSITION SCATTER OVER WHO GO BE VICE'],
            archive: 'Left the opposition merger talks alone. They collapsed.',
          },
          {
            when: { v: ['outlook', '>=', 6] },
            result: 'They agree within a day. Against a President this far ahead, every one of them would rather share a ticket than lose alone. {OPP} is the joint candidate, and the merger draws in everyone who wants a change, whoever they are.',
            fx: [['approval', -2], ['bloc.party', -4], ['rival.alt', 4], ['rival.fire', 4], ['rival.strong', 4]],
            flags: { 'opposition.united': true, 'opposition.broad': true },
            news: ['OPPOSITION PARTIES MERGE AGAINST PRESIDENT', 'EVERYBODY DON GATHER AGAINST ONE MAN'],
            archive: 'Left the opposition merger talks alone. Against a President so far ahead, they united at once.',
          },
          {
            result: 'Against expectation, they agree. {OPP} is unveiled as the joint candidate under a logo that took eleven hours to negotiate.',
            fx: [['approval', -2], ['bloc.party', -4], ['rival.alt', 3], ['rival.fire', 3], ['rival.strong', 3]],
            flags: { 'opposition.united': true },
            news: ['OPPOSITION PARTIES MERGE, ADOPT SINGLE CANDIDATE', 'OPPOSITION DON GATHER. 2031 GO HOT'],
            archive: 'Left the opposition merger talks alone. They succeeded.',
          },
        ],
      },
      {
        id: 'record', label: 'Answer them with the record: a national tour', pc: 6,
        outcomes: [{
          when: { v: ['outlook', '>=', 6] },
          result: 'You spend three weeks commissioning things. The merger goes ahead anyway, and broad: against a President this far ahead, everyone who wants a change has somewhere to go.',
          fx: [['approval', 1.5], ['bloc.party', 3]],
          flags: { 'opposition.united': true, 'opposition.broad': true },
          news: ['PRESIDENT BEGINS NATIONWIDE PROJECT TOUR', 'PRESIDENT DEY COMMISSION EVERYTHING WEY GET RIBBON'],
          archive: 'Answered the opposition merger with a national tour. It went ahead regardless.',
        }, {
          result: 'You spend three weeks commissioning things. The merger goes ahead, into more of a headwind than it expected.',
          fx: [['approval', 1.5], ['bloc.party', 3]],
          flags: { 'opposition.united': true },
          news: ['PRESIDENT BEGINS NATIONWIDE PROJECT TOUR', 'PRESIDENT DEY COMMISSION EVERYTHING WEY GET RIBBON'],
          archive: 'Answered the opposition merger with a national tour.',
        }],
      },
      {
        id: 'chairman', label: 'Have a conversation with the open-minded chairman', purse: 20,
        outcomes: [{
          chance: 0.6,
          result: 'The chairman withdraws his party from the talks, citing "irreconcilable ideological differences" with people he met last week.',
          fx: [['nation.integrity', -2], ['approval', 1]],
          flags: { 'opposition.split': true },
          exposure: { kind: 'political', amount: 8, witnesses: ['opposition'], trail: 2 },
          news: ['PARTY PULLS OUT OF OPPOSITION MERGER', 'ONE CHAIRMAN DON COLLECT. MERGER SCATTER'],
          archive: 'Paid a party chairman to wreck the opposition merger.', sig: 2,
        }, {
          result: 'The chairman takes the money and stays in the talks. The merger is announced a week later. So, by someone who was in the room, is the offer.',
          fx: [['nation.integrity', -3], ['approval', -2], ['bloc.press', -4]],
          flags: { 'opposition.united': true },
          exposure: { kind: 'political', amount: 20, witnesses: ['opposition'], trail: 3 },
          news: ['OPPOSITION: PRESIDENCY TRIED TO BUY OUR CHAIRMAN', 'DEM TRY BUY CHAIRMAN. E COLLECT, E NO GO'],
          archive: 'Paid a party chairman to wreck the opposition merger. He took the money and the merger went ahead.', sig: 2,
        }],
      },
    ],
  },

  // ---------------------------------------------------------------- the ticket

  {
    id: 'ticket.elders', kind: 'calendar', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3,
    when: { all: [{ term: 1 }, { termTurn: [33, 35] }] }, cooldown: 60,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'A meeting of stakeholders, to which you were not invited',
    body: [
      'Party elders, nine governors and {CHAIR} met last night at a private residence in Asokoro. The meeting was described as a birthday dinner. Nobody present has a birthday this month.',
      'The primaries open in three months. The agenda was "the way forward", which is to say, the ticket.',
      { when: { v: ['delegates', '<', 47] }, text: 'A name other than yours was discussed, and nobody objected. By the Special Adviser\'s count only {DELEGATES}% of convention delegates are yours. The primary is in a few months. Governors and senators bring delegates; so do the ones who owe you.' },
      { when: { v: ['delegates', '>=', 47] }, text: 'They intend to support you: {DELEGATES}% of convention delegates are yours by the Special Adviser\'s count. They would like to discuss what that support is worth.' },
    ],
    trace: [['bloc.party', -1]],
    reads: [
      { role: 'sap', good: 'This is the bill for four years, {SIR}. Every call you did not return is on it. They want the party secretariat, the next cabinet list, and to be asked.' },
    ],
    choices: [
      {
        id: 'terms', label: 'Meet them and agree terms', pc: 5,
        outcomes: [{
          result: 'You concede the party secretariat and "consultation" on second-term appointments. The elders issue a communiqué affirming their "unalloyed loyalty".',
          fx: [['bloc.party', 10], ['nation.integrity', -1.5]],
          ops: [['governors', 5], ['senators', 4]],
          // `elders.terms` is set only together with the record, so the second term can address it safely.
          flags: { 'ticket.deal': true, 'promise.second_term': true, 'elders.terms': true },
          domain: { version: CONTRACT_VERSION, effects: [{ type: 'commitment.open', id: 'elders.terms.$ADMIN', responsible: { office: 'president' }, object: 'elders-second-term-terms', text: 'Concede the party secretariat to the elders, and consult them on second-term appointments.', afterMonths: 24, visibility: 'private', verify: { flag: 'elders.verdict', is: 'kept' } }] },
          news: ['PARTY ELDERS ENDORSE PRESIDENT FOR SECOND TERM', 'ELDERS DON COLLECT. PRESIDENT GET TICKET'],
          archive: 'Agreed terms with the party elders for the ticket.', sig: 2,
        }],
      },
      {
        id: 'record', label: 'Tell them the ticket will be won on the record',
        outcomes: [{
          result: 'They listen politely. {CHAIR} says the party "belongs to all of us", the most threatening sentence in Nigerian politics.',
          fx: [['bloc.party', -5], ['nation.integrity', 1], ['bloc.press', 2]],
          ops: [['governors', -3]],
          news: ['PRESIDENT: "MY RECORD IS MY CAMPAIGN"', 'PRESIDENT TELL ELDERS: I NO DEY SHARE'],
          archive: 'Refused to bargain with the party elders for the ticket.', sig: 2,
        }],
      },
      {
        id: 'delegates', label: 'Go around them: provide for the delegates directly', purse: 12,
        outcomes: [{
          result: 'Delegates in thirty states receive "transport allowance" in a currency that is not the naira. The elders discover they have been bypassed and have nothing to sell.',
          fx: [['bloc.party', 14], ['nation.integrity', -3]],
          ops: [['governors', -4], ['senators', 6]],
          flags: { 'ticket.bought': true },
          exposure: { kind: 'political', amount: 12, witnesses: ['chair', 'delegates', 'sen_lead'], trail: 2 },
          news: ['DELEGATES DECLARE FOR PRESIDENT AHEAD OF PRIMARY', 'DOLLAR RAIN FOR DELEGATES — SOURCES'],
          archive: 'Paid the delegates directly ahead of the primary.', sig: 2,
        }],
      },
      {
        id: 'favours', label: 'Call in everything you are owed, before the convention',
        requires: { v: ['favours', '>=', 2] }, locked: 'You are owed too little. Favours are made by giving governors and senators what they want.',
        outcomes: [{
          result: 'You spend a week on the telephone. Nobody is offered anything new. Everybody is reminded of something old. The dinner party in Asokoro does not reconvene.',
          fx: [['bloc.party', 12], ['pc', 4]],
          ops: [['spendall'], ['governors', 6], ['senators', 6]],
          news: ['GOVERNORS, SENATORS RALLY TO PRESIDENT AHEAD OF PRIMARY', 'EVERYBODY WEY PRESIDENT HELP DON SHOW FACE'],
          archive: 'Called in every favour owed ahead of the primary.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'ticket.primary', kind: 'calendar', slot: 'lead', category: 'politics', tone: 'dry', intensity: 5,
    when: { all: [{ term: 1 }, { termTurn: [37, 39] }] }, cooldown: 60,
    office: '{PARTY}: National Convention', stamp: 'URGENT',
    title: 'The presidential primary',
    body: [
      'The party\'s special convention is under way at Eagle Square. 2,300 delegates will vote. Delegates belong to governors and senators: one who is with you brings them, and so does one who owes you.',
      'The Special Adviser\'s count: {DELEGATES}% of delegates are yours.',
      { when: { v: ['delegates', '>=', 62] }, text: 'No other aspirant has purchased a form. {CHAIR} proposes affirmation by voice vote.' },
      { when: { all: [{ v: ['delegates', '>=', 47] }, { v: ['delegates', '<', 62] }] }, text: 'A challenger backed by several governors has purchased a form. You are ahead, though by less than the Special Adviser would like.' },
      { when: { v: ['delegates', '<', 47] }, text: 'A challenger backed by governors you neglected has purchased a form. The count has you behind. It is too late to win them now; it was not too late last year.' },
      { when: { all: [{ v: ['delegates', '<', 47] }, { v: ['approval', '>=', 55] }, { v: ['delegates', '>=', 36] }] }, text: 'You are popular enough in the country that some delegates will defy their governors. It may be enough.' },
    ],
    trace: [['bloc.party', -1]],
    reads: [
      { role: 'sap', good: 'Delegates are honest people, {SIR}. Once they are bought, they stay bought until someone pays more. The count tonight is the count at breakfast, not at midnight.' },
    ],
    choices: [
      {
        id: 'contest', label: 'Go to the floor',
        outcomes: [
          {
            when: { v: ['delegates', '>=', 62] },
            result: 'The ayes have it. The convention lasts six hours, five of them speeches.',
            fx: [['pc', 8], ['bloc.party', 3]],
            news: ['PRESIDENT EMERGES PARTY FLAGBEARER BY AFFIRMATION', 'NA VOICE VOTE: PRESIDENT GET TICKET'],
            archive: 'Won the party ticket by affirmation.', sig: 3,
          },
          {
            when: { any: [{ v: ['delegates', '>=', 47] }, { all: [{ v: ['approval', '>=', 55] }, { v: ['delegates', '>=', 36] }] }] },
            result: 'Counting ends at 4am. You win with 58% of delegates. The challenger pledges loyalty through visibly clenched teeth.',
            fx: [['pc', 5], ['bloc.party', -3]],
            news: ['PRESIDENT WINS PARTY PRIMARY', 'PRESIDENT SURVIVE PRIMARY. E NO EASY'],
            archive: 'Won a contested party primary.', sig: 3,
          },
          {
            result: 'Counting ends at 4am. You lose by 212 delegates. A sitting President has been denied the ticket of the party that holds the Villa.',
            fx: [['pc', -25], ['bloc.party', -15], ['bloc.villa', -12]],
            flags: { 'ticket.lost': true },
            news: ['SHOCK AS PRESIDENT LOSES PARTY TICKET', 'EARTHQUAKE! PARTY DUMPS SITTING PRESIDENT'],
            newsWeight: 9,
            archive: 'Lost the party primary as a sitting President.', sig: 3,
          },
        ],
      },
      {
        id: 'buy', label: 'Go to the floor, with logistics for every delegation', purse: 15,
        outcomes: [{
          result: 'You win with 81% of delegates. Bureau de change operators in Abuja report an unusually good week.',
          fx: [['pc', 5], ['bloc.party', 4], ['nation.integrity', -3]],
          flags: { 'ticket.bought': true },
          exposure: { kind: 'political', amount: 15, witnesses: ['delegates', 'chair'], trail: 2 },
          news: ['PRESIDENT SWEEPS PARTY PRIMARY', 'DELEGATES SMILE HOME. DOLLAR SCARCE FOR ABUJA'],
          archive: 'Bought the party primary.', sig: 3,
        }],
      },
    ],
  },

  // ---------------------------------------------------------------- breaking

  {
    id: 'break.street', kind: 'threshold', slot: 'lead', category: 'labour', tone: 'grave', intensity: 5,
    when: { v: ['bloc.street', '<', 20] }, cooldown: 12,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'Total shutdown',
    body: [
      'Protests are under way in twenty-two state capitals. They began over prices and no longer have a single demand or a single organiser.',
      'Markets, motor parks and campuses are closed. A food warehouse in one state capital has been broken open and emptied.',
      'The police have asked for instructions. The Inspector-General has asked that they be given in writing.',
      { when: { v: ['debt.pensions', '>', 0.5] }, text: 'Pensioners who have not been paid in years are at the front of several of the marches.' },
      { when: { v: ['rival.fire', '>', 45] }, text: 'Barr. Tega Emuobor did not call these protests. Every placard carries a line from one of the speeches.' },
      { when: { flag: 'street.last', is: 'relief' }, text: 'The relief package announced the last time has reached some states and not others. The marchers in the others carry printed copies of your broadcast.' },
      { when: { flag: 'street.last', is: 'wait' }, text: 'The last protests were waited out. The organisers say they learned from it: this time they have brought food for a month.' },
      { when: { flag: 'protest.deaths' }, text: 'The marchers carry photographs of the fourteen who were killed the last time.' },
    ],
    trace: [['bloc.street', -1], ['pressure.wageGrievance', 1]],
    reads: [
      { role: 'nsa', good: 'If one officer fires, {SIR}, this becomes a different country by evening. Keep them back and let it be heard.' },
      { role: 'sap', good: 'They are not asking for much. They are asking to be told that you know.' },
    ],
    choices: [
      {
        id: 'relief', label: 'Emergency relief package and a national broadcast', naira: 0.6, pc: 5,
        outcomes: [{
          result: 'You speak for nine minutes without notes and announce the package. It does not end the anger. It ends the week.',
          fx: [['bloc.street', 16], ['approval', 3], ['pressure.wageGrievance', -15], ['bloc.establishment', -2]],
          news: ['PRESIDENT ANNOUNCES EMERGENCY RELIEF AS PROTESTS SPREAD', '"I HAVE HEARD YOU" — PRESIDENT. WE DEY WATCH'],
          flags: { 'street.last': 'relief' }, archive: 'Answered nationwide protests with relief and a broadcast.', sig: 3,
        }],
      },
      {
        id: 'wait', label: 'Keep the police back and wait it out',
        outcomes: [{
          result: 'The protests run for twelve days and exhaust themselves. Nobody is killed. Nothing is resolved.',
          fx: [['bloc.street', 6], ['bloc.establishment', -6], ['approval', -2], ['pc', -6]],
          news: ['PROTESTS EBB AFTER TWELVE DAYS', 'PROTEST DON END. THE HUNGER STILL DEY'],
          flags: { 'street.last': 'wait' }, archive: 'Waited out nationwide protests without force.', sig: 2,
        }],
      },
      {
        id: 'force', label: 'Direct the security agencies to restore order', pc: 10,
        outcomes: [{
          result: 'Order is restored in four days. Fourteen people are dead in three cities. A judicial panel of inquiry is demanded, and you will be asked about this day for the rest of your life.',
          fx: [['bloc.street', -5], ['approval', -8, 1], ['bloc.press', -12], ['bloc.establishment', 4], ['nation.integrity', -3], ['rival.fire', 10], ['theatre.SW', 4], ['theatre.SE', 4]],
          flags: { 'protest.deaths': true },
          news: ['FOURTEEN DEAD AS SECURITY FORCES CLEAR PROTESTS', 'THEY KILLED THEM. WE WILL NOT FORGET'],
          newsWeight: 9,
          archive: 'Ordered security forces to clear protests. Fourteen people were killed.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'break.party', kind: 'threshold', slot: 'lead', category: 'politics', tone: 'dry', intensity: 4,
    when: { v: ['bloc.party', '<', 20] }, cooldown: 12,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'SECRET',
    title: 'The party has held a "stakeholders\' meeting"',
    body: [
      'The National Working Committee has passed a vote of confidence in {CHAIR} and pointedly not in you.',
      'A faction calling itself the "{PSHORT} Renewal Forum" has opened a separate secretariat. It has more governors than yours.',
      'In the Assembly, your bills are being referred to committees that do not exist.',
      { when: { v: ['rival.strong', '>', 40] }, text: 'Senator Dandume has been seen at the Renewal Forum\'s secretariat. He was given a seat at the front.' },
      'By the Special Adviser\'s count, {DELEGATES}% of convention delegates are still yours.',
      { when: { flag: 'party.last', is: 'concede' }, text: 'The governors were given the last reshuffle. Having learned that a revolt pays, they have organised another.' },
      { when: { flag: 'party.last', is: 'purge' }, text: 'The last move against the chairman is still in the courts. This revolt is led by people who were on your side of it.' },
      { when: { flag: 'party.last', is: 'ride' }, text: 'The last stand-off ended with neither side tiring. It did not end.' },
      { when: { flag: 'party.last', is: 'buy' }, text: 'The Working Committee\'s confidence was bought the last time. It has been explained to the Special Adviser that confidence depreciates.' },
    ],
    trace: [['bloc.party', -1]],
    reads: [{ role: 'sap', good: 'You can still buy this back, {SIR}, but the price is now set by them.' }],
    choices: [
      {
        id: 'concede', label: 'Concede: the party gets the next reshuffle', pc: 8,
        outcomes: [{
          result: 'Six ministers are replaced with nominees of the governors. The Renewal Forum closes its secretariat and keeps the furniture.',
          fx: [['bloc.party', 20], ['nation.capacity', -3], ['nation.integrity', -2], ['bloc.villa', -5]],
          ops: [['governors', 8], ['senators', 5]],
          news: ['PRESIDENT RESHUFFLES CABINET IN PEACE DEAL WITH PARTY', 'GOVERNORS DON TAKE OVER CABINET'],
          flags: { 'party.last': 'concede' }, archive: 'Handed the party a cabinet reshuffle to end a revolt.', sig: 3,
        }],
      },
      {
        id: 'purge', label: 'Move against the chairman', pc: 18,
        outcomes: [
          {
            when: { v: ['approval', '>=', 48] },
            result: 'A court restrains {CHAIR} from parading himself as chairman. A caretaker committee is installed. It is ugly and it works.',
            fx: [['bloc.party', 14], ['bloc.press', -4], ['nation.integrity', -2]],
            news: ['COURT SACKS RULING PARTY CHAIRMAN', 'PRESIDENT DON CAPTURE THE PARTY'],
            flags: { 'party.last': 'purge' }, archive: 'Removed the party chairman through the courts.', sig: 3,
          },
          {
            result: 'The court order is obtained and ignored. There are now two chairmen, two secretariats, and one of each is suing the other.',
            fx: [['bloc.party', -4], ['bloc.press', -4], ['nation.integrity', -2], ['bloc.establishment', -4]],
            news: ['RULING PARTY SPLITS INTO TWO FACTIONS', 'TWO CHAIRMEN, ONE PARTY, PLENTY WAHALA'],
            flags: { 'party.last': 'purge' }, archive: 'Tried to remove the party chairman. The party split.', sig: 3,
          },
        ],
      },
      {
        id: 'ride', label: 'Govern without them',
        outcomes: [{
          result: 'You carry on. Nothing you send to the Assembly moves. The party waits to see which of you gets tired first.',
          fx: [['bloc.party', 5], ['bloc.establishment', -3], ['nation.integrity', 1], ['rival.strong', 4]],
          ops: [['governors', -3]],
          later: [{ after: [3, 5], fx: [['pc', -6]], label: 'The stand-off with the party drains the Presidency.' }],
          news: ['PRESIDENT, PARTY IN OPEN STAND-OFF', 'PRESIDENT AND PARTY NO DEY TALK'],
          flags: { 'party.last': 'ride' }, archive: 'Chose to govern without the party during its revolt.', sig: 2,
        }],
      },
      {
        id: 'buy', label: 'Service the structure', purse: 14,
        outcomes: [{
          result: 'The National Working Committee reconvenes and discovers that its confidence in {MRP} is, on reflection, total.',
          fx: [['bloc.party', 24], ['nation.integrity', -2.5]],
          ops: [['governors', 7], ['senators', 7]],
          exposure: { kind: 'political', amount: 14, witnesses: ['chair', 'sen_pres', 'gov_ss'], trail: 2 },
          news: ['PARTY LEADERSHIP PASSES VOTE OF CONFIDENCE IN PRESIDENT', 'NWC DON CHANGE MOUTH. STRUCTURE DON CHOP'],
          flags: { 'party.last': 'buy' }, archive: 'Paid the party leadership to end a revolt.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'break.villa', kind: 'threshold', slot: 'lead', category: 'politics', tone: 'dry', intensity: 4,
    when: { v: ['bloc.villa', '<', 20] }, cooldown: 12,
    office: 'Office of the Chief of Staff', stamp: 'SECRET',
    title: 'The exodus',
    body: [
      'Three ministers and your spokesman have resigned within a week. Two did so on television.',
      'Drafts of memoranda you have not yet read are appearing in {STREET}.',
      'A former aide has announced a book. Its working title is "Inside the Drift".',
      { when: { flag: 'villa.last', is: 'reset' }, text: 'The team brought in after the last exodus is the team leaving now.' },
      { when: { flag: 'villa.last', is: 'loyalists' }, text: 'The loyalists appointed last time have stayed. The people leaving are the last ones who told you no.' },
      { when: { flag: 'villa.last', is: 'appreciate' }, text: 'Those paid to stay the last time stayed until the money ran out.' },
    ],
    trace: [['bloc.villa', -1]],
    reads: [{ role: 'cos', good: 'People are leaving because they do not know what you want, {SIR}, or because they do and cannot get in to see you.' }],
    choices: [
      {
        id: 'reset', label: 'Reset: a new team, and open the door', pc: 10,
        outcomes: [{
          result: 'You replace the inner office and hold the first full cabinet meeting in five months. It runs for seven hours. People say things.',
          fx: [['bloc.villa', 22], ['nation.capacity', 1], ['bloc.press', 2]],
          news: ['PRESIDENT OVERHAULS VILLA TEAM', 'NEW BROOM FOR ASO ROCK'],
          flags: { 'villa.last': 'reset' }, archive: 'Overhauled the Villa team after a wave of resignations.', sig: 2,
        }],
      },
      {
        id: 'loyalists', label: 'Close ranks: appoint only people you know',
        outcomes: [{
          result: 'The vacancies are filled by a classmate, a cousin and a former driver\'s lawyer. The leaks stop. So does the advice.',
          fx: [['bloc.villa', 16], ['nation.capacity', -3], ['nation.integrity', -2], ['bloc.press', -4]],
          news: ['PRESIDENT FILLS VACANCIES WITH CLOSE ASSOCIATES', 'ASO ROCK NA FAMILY MEETING NOW'],
          flags: { 'villa.last': 'loyalists' }, archive: 'Filled the Villa with personal loyalists.', sig: 2,
        }],
      },
      {
        id: 'appreciate', label: 'Appreciate those who stayed', purse: 6,
        outcomes: [{
          result: 'Morale in the Villa improves sharply and for reasons nobody puts in writing.',
          fx: [['bloc.villa', 20], ['nation.integrity', -1.5]],
          exposure: { kind: 'political', amount: 6, witnesses: ['cos', 'villa'], trail: 1 },
          news: ['VILLA: "THE PRESIDENT\'S TEAM IS UNITED"', 'ASO ROCK STAFF DEY SMILE. WETIN HAPPEN?'],
          flags: { 'villa.last': 'appreciate' }, archive: 'Paid Villa staff to stop the resignations.',
        }],
      },
    ],
  },
  {
    id: 'break.establishment', kind: 'threshold', slot: 'lead', category: 'economy', tone: 'dry', intensity: 4,
    when: { v: ['bloc.establishment', '<', 20] }, cooldown: 12,
    office: 'Central Bank', stamp: 'SECRET',
    title: 'The quiet withdrawal',
    body: [
      '{CBN} reports that $3.1bn has left the country in six weeks. Two banks have asked for emergency liquidity.',
      'Permanent secretaries are on leave in unusual numbers. Files sent to three ministries have not come back.',
      'Nobody has said anything in public. That is how this group communicates.',
      { when: { v: ['tycoon.ty_bank', '<', 50] }, text: 'One of the two banks is chaired by Mrs Folake Adetoro. Her own money left in the first week.' },
      { when: { v: ['fund.abroad', '>=', 1] }, text: 'The fund abroad holds dollars. It was built for a rainy day, and it is raining.' },
      { when: { flag: 'est.last', is: 'credible' }, text: 'The accounts were published and a debt ceiling set the last time. The money leaving now is testing whether the ceiling is real.' },
      { when: { flag: 'est.last', is: 'reassure' }, text: 'Most of the guests at the last Villa dinner are among those moving money now.' },
      { when: { flag: 'est.last', is: 'controls' }, text: 'The capital controls imposed last time are still in force. The money leaves through the parallel market instead.' },
      { when: { flag: 'est.last', is: 'fund' }, text: 'The fund abroad defended the naira the last time. There is less in it now, and the people moving money know how much.' },
    ],
    trace: [['bloc.establishment', -1], ['nation.debt', 1]],
    reads: [
      { role: 'fin', good: 'They do not believe us, {SIR}. Not our numbers, not our word. Give them one thing they can verify.', weak: 'Market sentiment is cyclical, {SIR}.' },
    ],
    choices: [
      {
        id: 'credible', label: 'Publish the full fiscal accounts and commit to a debt ceiling', pc: 10,
        outcomes: [{
          result: 'The accounts are worse than rumoured and better than feared. Publishing them is taken as the first serious act in a year.',
          fx: [['bloc.establishment', 20], ['nation.integrity', 2], ['nation.capacity', 1], ['bloc.street', -2], ['tycoon.ty_bank', 12]],
          news: ['FG PUBLISHES FULL ACCOUNTS, SETS DEBT CEILING', 'GOVERNMENT SHOW US THE BOOK. E NO FINE'],
          flags: { 'est.last': 'credible' }, archive: 'Published the fiscal accounts and set a debt ceiling.', sig: 3,
        }],
      },
      {
        id: 'reassure', label: 'Host a dinner for captains of industry',
        outcomes: [{
          result: 'Forty chief executives attend. They applaud. Eleven of them move further funds abroad the next morning.',
          fx: [['bloc.establishment', 7], ['debt.bonds', 0.6], ['tycoon.ty_bank', 4], ['tycoon.ty_maker', 4]],
          news: ['PRESIDENT REASSURES BUSINESS LEADERS AT VILLA DINNER', 'BIG MEN CHOP FOR VILLA. DOLLAR STILL DEY RUN'],
          flags: { 'est.last': 'reassure' }, archive: 'Hosted a dinner to reassure business leaders.',
        }],
      },
      {
        id: 'controls', label: 'Impose capital controls',
        outcomes: [{
          result: 'Outflows stop on paper. A parallel market opens within the week, at a rate nobody will quote on the record.',
          fx: [['bloc.establishment', 10], ['nation.inflation', 3], ['debt.ways', 1], ['tycoon.ty_bank', -10], ['tycoon.ty_trade', -6], ['nation.jobs', -2]],
          news: ['CENTRAL BANK RESTRICTS FOREIGN EXCHANGE TRANSFERS', 'DOLLAR DON ENTER BLACK MARKET AGAIN'],
          flags: { 'est.last': 'controls' }, archive: 'Imposed capital controls to stop capital flight.', sig: 2,
        }],
      },
      {
        id: 'fund', label: 'Bring ₦1tn home from the fund abroad to defend the currency',
        requires: { v: ['fund.abroad', '>=', 1] },
        outcomes: [{
          result: 'The central bank meets every demand for dollars for six weeks, visibly, from money the country saved. The outflow stops because it is no longer a good bet.',
          fx: [['fund.abroad', -1], ['bloc.establishment', 16], ['nation.inflation', -1.5], ['tycoon.ty_bank', 8]],
          news: ['SOVEREIGN FUND DEPLOYED AS CENTRAL BANK STEADIES NAIRA', 'THE MONEY DEM SAVE DON SAVE NAIRA'],
          flags: { 'est.last': 'fund' }, archive: 'Drew on the fund abroad to stop a run on the currency.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'break.press', kind: 'threshold', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3,
    when: { v: ['bloc.press', '<', 20] }, cooldown: 12,
    office: 'Office of the Special Adviser, Media and Publicity', stamp: 'URGENT',
    title: 'Open season',
    body: [
      'Every national daily led this week with a different story about the Presidency. None was favourable. Four were accurate.',
      '{INFO} has proposed a "media engagement retreat" and, separately, a bill to regulate online publications.',
      { when: { v: ['tycoon.ty_media', '<', 38] }, text: 'The Daily Stakeholder led the pack. Its owner, Otunba Gbenga Oyewole, no longer pretends to be a friend.' },
      { when: { v: ['tycoon.ty_media', '>=', 55] }, text: 'Only The Daily Stakeholder held back, and its owner would like you to have noticed.' },
      { when: { flag: 'press.last', is: 'chat' }, text: 'You faced the press for two hours last time. Several of the questions you dodged have since become stories of their own.' },
      { when: { flag: 'press.gag' }, text: 'The online publications bill is still before the Assembly. Every story this week mentions it.' },
      { when: { flag: 'press.last', is: 'envelopes' }, text: 'The editors paid last time have been named, with dates, in {EDITOR}\'s paper. Their coverage is now the harshest of all.' },
      { when: { flag: 'press.last', is: 'owner' }, text: 'Otunba Oyewole was given what he asked for last time. His papers were patient for a while. The bill for their patience has arrived.' },
    ],
    trace: [['bloc.press', -1]],
    reads: [{ role: 'sap', good: 'They are not hostile because they are biased, {SIR}. They are hostile because we lied to them and it was in writing.' }],
    choices: [
      {
        id: 'chat', label: 'Hold an unscripted two-hour media chat', pc: 6,
        outcomes: [
          {
            when: { v: ['nation.integrity', '>=', 30] },
            result: 'You take forty questions and dodge three. The coverage the next day is critical and, for the first time in months, fair.',
            fx: [['bloc.press', 20], ['approval', 1.5]],
            news: ['PRESIDENT FACES PRESS FOR TWO HOURS', 'PRESIDENT ANSWER QUESTION. NO TELEPROMPTER'],
            flags: { 'press.last': 'chat' }, archive: 'Held an unscripted media chat.', sig: 2,
          },
          {
            result: 'You take forty questions. The answers to six of them become headlines you did not want.',
            fx: [['bloc.press', 10], ['approval', -2]],
            news: ['PRESIDENT STRUGGLES IN MEDIA CHAT', 'MEDIA CHAT: SIX ANSWERS WEY GO HAUNT AM'],
            flags: { 'press.last': 'chat' }, archive: 'Held an unscripted media chat. It went badly.', sig: 2,
          },
        ],
      },
      {
        id: 'bill', label: 'Send the online publications bill to the Assembly',
        outcomes: [{
          result: 'The bill is read a first time. Coverage of the Presidency becomes more careful, and coverage of the bill is everywhere.',
          fx: [['bloc.press', 6], ['bloc.street', -6], ['nation.integrity', -3], ['approval', -2]],
          flags: { 'press.gag': true },
          news: ['FG SENDS ONLINE MEDIA BILL TO NATIONAL ASSEMBLY', '#NOTOGAGBILL: THEY WANT TO SHUT US UP'],
          archive: 'Sent a bill to regulate online publications to the Assembly.', sig: 3,
        }],
      },
      {
        id: 'envelopes', label: 'Improve relations with selected editors', purse: 8,
        outcomes: [{
          result: 'Coverage softens across most titles. {EDITOR}\'s paper runs a piece on which titles softened, and when.',
          fx: [['bloc.press', 16], ['nation.integrity', -2]],
          exposure: { kind: 'political', amount: 8, witnesses: ['editors'], trail: 2 },
          news: ['EDITORS\' GUILD HOLDS "FRUITFUL" MEETING WITH PRESIDENCY', 'BROWN ENVELOPE SEASON? SOME PAPERS DON QUIET'],
          flags: { 'press.last': 'envelopes' }, archive: 'Paid selected editors for softer coverage.',
        }],
      },
      {
        id: 'owner', label: 'See Otunba Oyewole, and give him what he has been asking for',
        requires: { v: ['granted.ty_media', '==', 0] },
        outcomes: [{
          result: 'You see him. His paper and his television station change their tune the same week, and the others, who share his advertisers, follow at a distance.',
          fx: [['bloc.press', 12]],
          ops: [['grant', 'ty_media']],
          news: ['PRESIDENT, MEDIA OWNERS IN "FRANK" TALKS', 'PRESIDENT DON SETTLE THE OGA OF THE NEWSPAPER'],
          flags: { 'press.last': 'owner' }, archive: 'Bought peace with the press through its largest owner.', sig: 2,
        }],
      },
    ],
  },

  // ---------------------------------------------------------------- removal

  {
    id: 'removal.notice', kind: 'chain', slot: 'lead', category: 'politics', tone: 'dry', intensity: 5,
    office: 'Office of the Clerk to the National Assembly', stamp: 'URGENT',
    title: 'Notice of allegations of gross misconduct',
    body: [
      'A notice of allegations of gross misconduct against the President, signed by more than one third of the members of the National Assembly, has been presented to the Senate President.',
      'Under the Constitution, each chamber must now resolve by a two-thirds majority whether the allegations are to be investigated.',
      'The vote is in fourteen days.',
      'By the Special Adviser\'s count the Senate stands at {SENATE} for you, where 50 is a majority. It is decided by Senators Maigari, Onuoha, Zango and Akpojotor, and by the mood of the party.',
      { when: { v: ['favours', '>', 0] }, text: 'There are people who owe you. This is what that is for.' },
    ],
    trace: [['bloc.party', -1], ['bloc.street', -1], ['bloc.villa', -1], ['bloc.establishment', -1], ['bloc.press', -1]],
    reads: [
      { role: 'sap', good: 'They need seventy-three senators, {SIR}. They have about sixty-five. Each of the remaining eight has a price or a grievance, and we have two weeks to learn which.' },
    ],
    choices: [
      {
        id: 'fight', label: 'Fight it vote by vote', pc: 10,
        outcomes: [{
          result: 'You begin calling senators yourself. Some take the call.',
          fx: [['bloc.party', 6]],
          ops: [['senators', 4]],
          follow: [{ event: 'removal.vote', after: 1 }],
          news: ['IMPEACHMENT NOTICE SERVED ON PRESIDENT', 'IMPEACHMENT! DEM WAN COMMOT PRESIDENT'],
          newsWeight: 9,
          archive: 'Was served an impeachment notice and chose to fight it.', sig: 3,
        }],
      },
      {
        id: 'logistics', label: 'Fight it with logistics', purse: 20,
        outcomes: [{
          result: 'Eleven signatories withdraw their signatures, explaining that they had signed an attendance register in error.',
          fx: [['bloc.party', 18], ['nation.integrity', -3]],
          ops: [['senators', 10]],
          follow: [{ event: 'removal.vote', after: 1 }],
          exposure: { kind: 'political', amount: 20, witnesses: ['sen_pres', 'sen_approp'], trail: 2 },
          news: ['ELEVEN LAWMAKERS WITHDRAW FROM IMPEACHMENT NOTICE', '"I THOUGHT NA ATTENDANCE" — SENATOR'],
          newsWeight: 9,
          archive: 'Paid legislators to withdraw from an impeachment notice.', sig: 3,
        }],
      },
      {
        id: 'favours', label: 'Call in everything you are owed',
        requires: { v: ['favours', '>=', 2] },
        outcomes: [{
          result: 'You make the calls yourself and offer nothing. You remind. By the end of the week nine signatures have been withdrawn by people who have remembered what they owe.',
          fx: [['bloc.party', 12]],
          ops: [['spendall'], ['senators', 12], ['governors', 5]],
          follow: [{ event: 'removal.vote', after: 1 }],
          news: ['NINE LAWMAKERS WITHDRAW FROM IMPEACHMENT NOTICE', 'DEM DON REMEMBER WHO HELP DEM. NINE DON WITHDRAW'],
          newsWeight: 9,
          archive: 'Called in every favour owed to fight an impeachment notice.', sig: 3,
        }],
      },
      {
        id: 'resign', label: 'Resign',
        outcomes: [{
          result: 'You address the nation for six minutes and leave the Villa by the side gate.',
          ends: 'resigned',
          archive: 'Resigned the Presidency.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'removal.vote', kind: 'chain', slot: 'lead', category: 'politics', tone: 'dry', intensity: 5,
    office: 'Office of the Clerk to the National Assembly', stamp: 'URGENT',
    title: 'The vote',
    body: [
      'Both chambers sit today to vote on whether the allegations shall be investigated.',
      'The galleries are full. The Senate President has the gavel and, you are told, a telephone that has not stopped ringing.',
      'The Special Adviser\'s last count has the Senate at {SENATE} for you. Below 44, it is lost.',
    ],
    reads: [
      { role: 'sap', good: 'I have counted four times, {SIR}. I have four different answers.' },
    ],
    choices: [
      {
        id: 'watch', label: 'Watch from the Villa',
        outcomes: [
          {
            when: { any: [{ v: ['senate', '>=', 44] }, { v: ['pc', '>=', 45] }] },
            result: 'The motion falls nine votes short in the Senate. The Senate President describes the outcome as "a victory for democracy" and requests a meeting.',
            fx: [['pc', 8], ['bloc.party', 6], ['bloc.villa', 8], ['bloc.establishment', 5]],
            flags: { 'removal.active': false, 'removal.survived': true },
            news: ['IMPEACHMENT MOTION FAILS IN SENATE', 'PRESIDENT SURVIVE! NINE VOTES'],
            newsWeight: 9,
            archive: 'Survived an impeachment vote.', sig: 3,
          },
          {
            result: 'The motion is carried in both chambers. The Chief Justice appoints a panel of seven. It reports in eleven weeks and its report is adopted. You are removed from office.',
            ends: 'removed',
            news: ['PRESIDENT REMOVED FROM OFFICE', 'IT IS OVER'],
            archive: 'Was removed from office by the National Assembly.', sig: 3,
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- debt

  {
    id: 'debt.crisis', kind: 'threshold', slot: 'lead', category: 'economy', tone: 'dry', intensity: 5,
    when: { v: ['nation.debt', '>', 96] }, cooldown: 18,
    office: 'Debt Management Office', stamp: 'SECRET',
    title: 'Debt service has exceeded revenue',
    body: [
      'For the first time, debt service this quarter is larger than retained revenue. Salaries are being paid from new borrowing.',
      'A bond auction on Wednesday was undersubscribed. A foreign lender has offered a three-year facility. The conditions run to forty pages and begin with the petrol price.',
      { when: { v: ['debt.arrears', '>', 3] }, text: 'On top of the bonds, the government owes more than ₦3tn to its own contractors and pensioners, who cannot be rolled over.' },
      { when: { v: ['fund.abroad', '>=', 1.5] }, text: 'The fund abroad could retire the dearest of the foreign bonds outright.' },
      { when: { flag: 'lender.programme' }, text: 'The lender\'s programme is already in force. Its reviewers write that this is the situation it was meant to prevent, and ask what has been spent that was not in it.' },
      { when: { flag: 'crisis.last', is: 'print' }, text: 'The central bank financed the last crisis and prices have not recovered from it. {CBN} has written that it will not be done again without a law that says so.' },
      { when: { flag: 'crisis.last', is: 'restructure' }, text: 'The debt was restructured once already. The new bonds carry a clause that makes a second restructuring harder and slower.' },
      { when: { flag: 'crisis.last', is: 'fund' }, text: 'The fund abroad was spent in the last crisis.' },
    ],
    trace: [['nation.debt', 1]],
    reads: [
      { role: 'fin', good: 'There is no version of this that does not hurt, {SIR}. The programme hurts on a schedule. The alternative hurts at random.', weak: 'We are exploring innovative financing options, {SIR}.' },
    ],
    choices: [
      {
        id: 'programme', label: 'Accept the lender\'s programme, petrol price condition included', pc: 12, sign: true,
        outcomes: [{
          when: { flag: 'policy.subsidy', is: 'removed' },
          result: 'The programme is signed. The petrol condition is already met, which the lender notes approvingly in paragraph one. The first tranche arrives. So do the reviewers, quarterly, with laptops.',
          fx: [['debt.eurobond', -3.4], ['debt.lender', 4.4], ['nation.fiscalSpace', 1], ['bloc.establishment', 10], ['bloc.street', -4], ['approval', -2], ['nation.capacity', 2], ['tycoon.ty_bank', 8]],
          flags: { 'lender.programme': true },
          news: ['FG SIGNS THREE-YEAR FACILITY WITH LENDER', 'WE DON ENTER LENDER HAND. CONDITIONS FULL GROUND'],
          archive: 'Accepted a foreign lender\'s programme to avert default.', sig: 3,
        }, {
          result: 'The programme is signed. Its first condition takes effect at midnight: the petrol subsidy ends, by the lender\'s timetable rather than yours. The first tranche arrives. So do the reviewers, quarterly, with laptops.',
          fx: [['debt.eurobond', -3.4], ['debt.lender', 4.4], ['nation.fiscalSpace', 1], ['bloc.establishment', 10], ['bloc.street', -8], ['approval', -3], ['nation.capacity', 2], ['nation.petrolPrice', 250], ['tycoon.ty_bank', 8], ['tycoon.ty_fuel', -10]],
          flags: { 'policy.subsidy': 'removed', 'lender.programme': true },
          // The same beats as any other removal: the pump price, labour's answer, and the dividend a year on.
          follow: [{ event: 'subsidy.pump', after: 1 }, { event: 'subsidy.ultimatum', after: [2, 3] }, { event: 'subsidy.dividend', after: [12, 14], when: { flag: 'policy.subsidy', is: 'removed' } }],
          news: ['FG SIGNS LENDER PROGRAMME; PETROL SUBSIDY ENDS AT MIDNIGHT', 'LENDER DON REMOVE SUBSIDY FOR US. FUEL DON COST'],
          archive: 'Accepted a foreign lender\'s programme to avert default, ending the petrol subsidy as its first condition.', sig: 3,
        }],
      },
      {
        id: 'print', label: 'Direct the central bank to finance the deficit',
        outcomes: [{
          result: '{CBN} complies under protest and in writing. Bonds the market would not buy are bought by the central bank with money it creates. The overdraft is larger by ₦3.5tn, and the price of bread responds within the month.',
          fx: [['debt.bonds', -3], ['debt.ways', 3.5], ['nation.inflation', 3], ['bloc.establishment', -8], ['bloc.street', -4], ['tycoon.ty_bank', -12]],
          news: ['CENTRAL BANK EXTENDS ₦3.5TN ADVANCE TO FG', 'DEM DON START TO PRINT MONEY. PRICE GO CRAZE'],
          flags: { 'crisis.last': 'print' }, archive: 'Ordered the central bank to finance the deficit.', sig: 3,
        }],
      },
      {
        id: 'restructure', label: 'Open restructuring talks with creditors', pc: 8,
        outcomes: [{
          result: 'Talks open in London. The ratings agencies call it a selective default. It is a year before anyone will lend again.',
          // A haircut: about a third of the bonds' principal written off, at the cost of the country's credit.
          fx: [['debt.eurobond', -2], ['debt.bonds', -3.5], ['debt.rates', 4], ['bloc.establishment', -10], ['nation.fiscalSpace', -0.3], ['nation.power', -2], ['tycoon.ty_bank', -8]],
          news: ['NIGERIA SEEKS DEBT RESTRUCTURING', 'WE NO FIT PAY. GOVERNMENT GO BEG CREDITORS'],
          flags: { 'crisis.last': 'restructure' }, archive: 'Opened debt restructuring talks.', sig: 3,
        }],
      },
      {
        id: 'fund', label: 'Bring the fund abroad home and retire the dearest debt with it',
        requires: { v: ['fund.abroad', '>=', 1.5] },
        outcomes: [{
          result: 'The fund is liquidated and ₦1.5tn of foreign bonds is retired at once. It is everything the country saved. It is also what saving is for.',
          fx: [['fund.abroad', -1.5], ['debt.eurobond', -1.5], ['bloc.establishment', 8], ['tycoon.ty_bank', 6]],
          news: ['SOVEREIGN FUND USED TO RETIRE FOREIGN DEBT', 'THE SAVINGS DON PAY DEBT. E PAIN, BUT E WORK'],
          flags: { 'crisis.last': 'fund' }, archive: 'Used the fund abroad to retire foreign debt in a crisis.', sig: 3,
        }],
      },
    ],
  },
];
