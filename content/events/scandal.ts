import type { GameEvent } from '../../engine/types';

// STORYLINE: The Minister and the ₦38.7bn. Plus the temptations (GDD 3.12)
// and the moment the President's own exposure surfaces.

export const SCANDAL: GameEvent[] = [
  {
    id: 'minister.report', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3,
    when: { turn: [7] }, weight: 14, weightBy: 'pressure.scandalHeat',
    office: 'Office of the Auditor-General for the Federation', stamp: 'CONFIDENTIAL',
    title: 'Query: ₦38.7bn on "strategic capacity-building interventions"',
    body: [
      'The Auditor-General has queried ₦38.7bn spent by the Ministry of Special Duties and Strategic Interventions under the heading "strategic capacity-building interventions".',
      'The expenditure covers 211 workshops. 190 were held in the same hotel in Abuja, which has 60 rooms.',
      'The Honourable Minister, {SPECIAL}, was nominated by the Governors\' Forum.',
      { when: { v: ['owing.gov_ss', '>', 0] }, text: 'You already owe Governor Koroye for three states. He regards his minister as part of the same account.' },
      { when: { v: ['tycoon.ty_media', '<', 38] }, text: 'The Daily Stakeholder has the invoices too, and its owner is no longer a friend of yours.' },
    ],
    statement: 'The Ministry wishes to state categorically that all expenditures followed extant provisions.',
    trace: [['pressure.scandalHeat', 1], ['nation.integrity', -1]],
    reads: [
      { role: 'sap', good: 'Nobody knows what the extant provisions are, {SIR}, including the Ministry. Agbo is {GOVCHAIR}\'s man. Touch him and you will hear from twelve governors.' },
      { role: 'cos', good: '{EDITOR} already has the hotel invoices. I would assume we have a week.' },
    ],
    choices: [
      {
        id: 'suspend', label: 'Direct the Minister to step aside pending investigation', pc: 8,
        outcomes: [{
          result: 'The Minister steps aside "to allow for an unfettered investigation", a phrase he reads from a card.',
          fx: [['nation.integrity', 2], ['bloc.press', 4], ['bloc.party', -6], ['pressure.scandalHeat', -8], ['approval', 1], ['person.gov_ss', -8]],
          flags: { 'minister.special': 'suspended' },
          follow: [{ event: 'minister.sponsor', after: 1 }, { event: 'minister.outcome', after: [4, 6] }],
          news: ['MINISTER STEPS ASIDE OVER ₦38.7BN AUDIT QUERY', '₦38.7BN WORKSHOP: MINISTER DON STEP ASIDE'],
          archive: 'Suspended the Minister of Special Duties pending investigation.', sig: 2,
        }],
      },
      {
        id: 'confidence', label: 'Express full confidence in the Minister',
        outcomes: [{
          result: 'The statement of confidence is issued at noon. The hotel invoices are published at four.',
          fx: [['bloc.party', 4], ['bloc.press', -6], ['nation.integrity', -2], ['pressure.scandalHeat', 10], ['approval', -1.5], ['person.gov_ss', 6]],
          favour: ['gov_ss', 'owed', 2],
          flags: { 'minister.special': 'confidence' },
          follow: [{ event: 'minister.hearing', after: [2, 3] }],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['special'], trail: 1 },
          news: ['PRESIDENCY EXPRESSES CONFIDENCE IN EMBATTLED MINISTER', '211 WORKSHOPS, ONE SMALL HOTEL. PRESIDENCY: "WE TRUST AM"'],
          archive: 'Expressed full confidence in the Minister of Special Duties.', sig: 2,
        }],
      },
      {
        id: 'motivated', label: 'Describe the allegations as politically motivated',
        outcomes: [{
          result: 'The Presidency blames "desperate elements in the opposition". The Auditor-General, a civil servant of thirty-one years, is surprised to learn he is in the opposition.',
          fx: [['bloc.party', 5], ['bloc.press', -8], ['nation.integrity', -2.5], ['pressure.scandalHeat', 12], ['bloc.street', -2], ['person.gov_ss', 4]],
          flags: { 'minister.special': 'confidence' },
          follow: [{ event: 'minister.hearing', after: [2, 3] }],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['special'], trail: 1 },
          news: ['PRESIDENCY: AUDIT QUERY IS "POLITICALLY MOTIVATED"', 'SO AUDITOR-GENERAL NA OPPOSITION NOW?'],
          archive: 'Called the audit query politically motivated.',
        }],
      },
      {
        id: 'redeploy', label: 'Redeploy the Minister to another ministry',
        outcomes: [{
          result: 'The Minister is moved to the Ministry of Youth Development "in a minor cabinet adjustment". The query stays with the file he left behind.',
          fx: [['bloc.party', 2], ['bloc.press', -3], ['nation.integrity', -1], ['pressure.scandalHeat', 4]],
          flags: { 'minister.special': 'redeployed' },
          follow: [{ event: 'minister.hearing', after: [3, 5], chance: 0.6 }],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['special'], trail: 0 },
          news: ['PRESIDENT REDEPLOYS MINISTER IN MINOR RESHUFFLE', 'WORKSHOP MINISTER MOVED. MONEY NO MOVE'],
          archive: 'Redeployed the Minister of Special Duties to another ministry.',
        }],
      },
      {
        id: 'committee', label: 'Refer the query to an administrative committee',
        outcomes: [{
          result: 'A committee of permanent secretaries is asked to "look into the matter and report in due course".',
          fx: [['nation.integrity', -1.5], ['counter.committees', 1], ['bloc.press', -3], ['pressure.scandalHeat', 5]],
          flags: { 'minister.special': 'committee' },
          follow: [{ event: 'minister.hearing', after: [3, 4], chance: 0.7 }],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['special'], trail: 0 },
          news: ['PANEL TO REVIEW AUDIT QUERY ON MINISTRY SPENDING', 'COMMITTEE GO LOOK INTO AM. YOU KNOW WETIN THAT MEAN'],
          archive: 'Referred the ₦38.7bn query to a committee.',
        }],
      },
      {
        id: 'trade', label: 'Tell Koroye his man goes quietly, and that it closes the account between you',
        requires: { v: ['owing.gov_ss', '>', 0] },
        outcomes: [{
          result: 'The Minister resigns "on personal grounds" before the invoices are printed. Governor Koroye accepts that his three states have now been paid for. He would have preferred a different currency.',
          fx: [['nation.integrity', 1], ['bloc.party', -2], ['pressure.scandalHeat', -6], ['bloc.press', 1], ['person.gov_ss', -3]],
          ops: [['settle', 'gov_ss']],
          flags: { 'minister.special': 'resigned' },
          news: ['MINISTER RESIGNS "ON PERSONAL GROUNDS" AHEAD OF AUDIT REPORT', 'WORKSHOP MINISTER DON RESIGN BEFORE THE GIST COMMOT'],
          archive: 'Traded the Minister of Special Duties\' resignation against a debt to the Governors\' Forum.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'minister.sponsor', kind: 'chain', slot: 'minor', category: 'politics', tone: 'dry', intensity: 2,
    office: 'Phone', channel: 'phone', from: '{GOVCHAIR}',
    title: 'A call from the Governors\' Forum',
    body: [
      'Your Excellency, good evening. I am not calling about Titus. I am only calling to say the governors are watching how our people are treated.',
      'We delivered. We remain fully committed. But commitment is a two-way street, Your Excellency.',
    ],
    reads: [{ role: 'sap', good: 'He is calling about Titus, {SIR}. He wants the investigation to end with a warning letter.' }],
    choices: [
      {
        id: 'hold', label: '"The investigation will take its course."',
        outcomes: [{
          result: 'There is a pause. "Of course, Your Excellency. Due process." He does not say goodbye.',
          fx: [['bloc.party', -4], ['nation.integrity', 1], ['person.gov_ss', -8]],
          news: ['GOVERNORS "CONCERNED" OVER TREATMENT OF MINISTER', 'GOVERNORS DEY VEX FOR VILLA'],
          archive: 'Declined the governors\' request to go easy on the Minister.',
        }],
      },
      {
        id: 'assure', label: '"He is one of us. It will be handled."',
        outcomes: [{
          result: '"I knew you would understand, Your Excellency." The investigating panel is told to "be thorough", which it understands.',
          fx: [['bloc.party', 5], ['nation.integrity', -2], ['person.gov_ss', 8]],
          favour: ['gov_ss', 'owed', 1],
          flags: { 'minister.fix': true },
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['govchair'], trail: 0 },
          news: ['GOVERNORS AFFIRM SUPPORT FOR PRESIDENT', 'GOVERNORS AND VILLA DON SETTLE'],
          archive: 'Assured the governors that the investigation would be handled.',
        }],
      },
    ],
    ignored: {
      result: 'You do not return the call. He notes it.',
      fx: [['bloc.party', -2], ['person.gov_ss', -4]],
      archive: 'Did not return the Governors\' Forum chairman\'s call.',
    },
  },
  {
    id: 'minister.outcome', kind: 'chain', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3,
    when: { flag: 'minister.special', is: 'suspended' },
    office: 'Office of the Attorney General of the Federation', stamp: 'CONFIDENTIAL',
    title: 'Investigation report: Ministry of Special Duties',
    body: [
      { when: { not: { flag: 'minister.fix' } }, text: 'The investigation finds that ₦31bn of the ₦38.7bn cannot be supported by any record. 164 of the workshops have no attendance list. Nine were held on public holidays.' },
      { when: { flag: 'minister.fix' }, text: 'The investigation finds "procedural lapses" and recommends that the Minister be "strongly advised". It notes that workshops are, by their nature, difficult to verify.' },
      'The Attorney General requests {MRP}\'s directive.',
      { when: { v: ['agenda.c2', '==', 1] }, text: 'The new anti-corruption courts could hear it within the year. Under the old ones it would outlive your presidency.' },
    ],
    trace: [['flag:minister.special', 1], ['flag:minister.fix', 1]],
    reads: [{ role: 'sap', good: 'Whatever you do now is the precedent, {SIR}. Every minister is watching this file.' }],
    choices: [
      {
        id: 'prosecute', label: 'Dismiss the Minister and refer the file for prosecution', pc: 12,
        requires: { not: { flag: 'minister.fix' } }, locked: 'The report you asked for does not support a prosecution.',
        outcomes: [{
          result: 'The Minister is dismissed and arraigned. He arrives at court in a wheelchair he did not need the previous week.',
          fx: [['nation.integrity', 5], ['bloc.press', 6], ['bloc.street', 4], ['bloc.party', -10], ['approval', 2.5], ['pressure.scandalHeat', -15], ['person.gov_ss', -10]],
          ops: [['charge', 'special', 'Workshops that never happened: ₦31bn', 0.031], ['governors', -2]],
          flags: { 'minister.special': 'prosecuted' },
          news: ['EX-MINISTER ARRAIGNED OVER ₦31BN', 'WORKSHOP MINISTER LANDS FOR COURT — ON WHEELCHAIR'],
          archive: 'Dismissed and prosecuted the Minister of Special Duties.', sig: 3,
        }],
      },
      {
        id: 'dismiss', label: 'Accept his resignation; no further action', pc: 5,
        outcomes: [{
          result: 'The Minister resigns "to pursue other interests". He is seen at a governorship declaration the following month.',
          fx: [['nation.integrity', 1], ['bloc.press', -1], ['bloc.party', -4], ['pressure.scandalHeat', -6]],
          flags: { 'minister.special': 'resigned' },
          news: ['MINISTER RESIGNS; PRESIDENCY "WISHES HIM WELL"', 'HE RESIGN, HE NO RETURN SHISHI'],
          archive: 'Let the Minister of Special Duties resign quietly.', sig: 2,
        }],
      },
      {
        id: 'reinstate', label: 'Reinstate the Minister',
        outcomes: [{
          result: 'The Minister returns to his desk and announces a workshop on transparency.',
          fx: [['nation.integrity', -3], ['bloc.press', -7], ['bloc.party', 6], ['approval', -2], ['pressure.scandalHeat', 10], ['person.gov_ss', 8]],
          favour: ['gov_ss', 'owed', 2],
          flags: { 'minister.special': 'reinstated' },
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['special'], trail: 2 },
          news: ['SUSPENDED MINISTER RECALLED', 'HE IS BACK! AND HE IS HOLDING A WORKSHOP'],
          archive: 'Reinstated the Minister of Special Duties.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'minister.hearing', kind: 'chain', slot: 'lead', category: 'scandal', tone: 'absurd', intensity: 3,
    office: 'Senate Committee on Public Accounts', stamp: 'URGENT',
    title: 'The Minister collapses at the Senate hearing',
    body: [
      'The Senate Committee on Public Accounts summoned {SPECIAL} to account for the ₦38.7bn.',
      'Twenty-two minutes into questioning, when asked to name one participant at any workshop, the Honourable Minister slumped forward on the desk.',
      'The Chairman was heard on a live microphone telling the Clerk to switch off the microphone. The hearing has been adjourned indefinitely on medical grounds.',
      'The Minister was discharged from hospital the same evening and attended a wedding on Saturday.',
    ],
    statement: 'The Honourable Minister is responding to treatment and remains eager to clear his name at the appropriate time.',
    trace: [['flag:minister.special', 1]],
    reads: [
      { role: 'sap', good: 'The country is laughing, {SIR}. The danger is when they stop laughing and ask who kept him.' },
    ],
    choices: [
      {
        id: 'dismiss', label: 'Relieve the Minister of his appointment', pc: 8,
        outcomes: [{
          result: 'The Minister is relieved. His statement thanks {MRP} for the opportunity to serve and makes no reference to his health.',
          fx: [['nation.integrity', 2], ['bloc.press', 3], ['bloc.party', -6], ['pressure.scandalHeat', -8], ['approval', 1], ['person.gov_ss', -6]],
          flags: { 'minister.special': 'dismissed' },
          news: ['PRESIDENT SACKS MINISTER AFTER SENATE HEARING', 'FAINTING MINISTER DON GO'],
          archive: 'Dismissed the Minister of Special Duties after the Senate hearing.', sig: 2,
        }],
      },
      {
        id: 'wish', label: 'Wish the Minister a speedy recovery',
        outcomes: [{
          result: 'The Presidency wishes the Minister well. The hearing is never reconvened. The clip is still being shared.',
          fx: [['nation.integrity', -2], ['bloc.press', -4], ['approval', -1.5], ['bloc.party', 3], ['pressure.scandalHeat', 6]],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['special'], trail: 1 },
          news: ['PRESIDENCY WISHES AILING MINISTER QUICK RECOVERY', '"OFF THE MIC!" — CLIP OF THE YEAR'],
          archive: 'Wished the Minister a speedy recovery and left him in post.',
        }],
      },
      {
        id: 'insist', label: 'Ask the Senate to reconvene the hearing with a doctor present', pc: 4,
        outcomes: [{
          result: 'The Senate declines, citing "respect for the dignity of the human person". Several committee members attended the same workshops.',
          fx: [['bloc.press', 3], ['bloc.party', -3], ['nation.integrity', 1], ['person.sen_pres', -5], ['counter.insisted', 1]],
          news: ['SENATE DECLINES TO RECONVENE MINISTER\'S HEARING', 'SENATE NO WAN HEAR THE REST OF THE STORY'],
          archive: 'Asked the Senate to resume the Minister\'s hearing. It declined.',
        }],
      },
    ],
  },

  // ---------------------------------------------------------------- temptations

  {
    id: 'tempt.security_vote', kind: 'calendar', slot: 'lead', category: 'temptation', tone: 'dry', intensity: 2,
    // A predecessor who put it on the books left nothing unaudited to tempt anyone.
    when: { all: [{ turn: [3, 6] }, { not: { flag: 'pred.drawer', is: 'sealed' } }] }, max: 1,
    office: 'Office of the Chief of Staff', stamp: 'SECRET',
    title: 'The security vote',
    body: [
      'There is a standing allocation under the Presidency known as the security vote. It is released monthly. By convention it is not audited, receipted or discussed.',
      { when: { not: { flag: 'pred.drawer', is: 'left' } }, text: 'Your predecessor drew it in full every month. The Chief of Staff has placed the first month\'s papers in the left-hand drawer of the desk and has not said anything further.' },
      { when: { flag: 'pred.drawer', is: 'left' }, text: 'Your predecessor never touched it, and never put it on the books either. It has been accumulating. The Chief of Staff has placed the papers in the left-hand drawer of the desk and has not said anything further.' },
      'The drawer has a key.',
      '{NSA} notes, for the record, that about a third of it has historically been spent on security.',
    ],
    reads: [
      { role: 'cos', good: 'It is entirely at your discretion, {SIR}. Some of it is genuinely needed for security. I only keep the drawer.' },
      { role: 'sap', good: 'Every President finds a use for it. Elections cost money, and the Senate does not move on goodwill. I say this as information, not advice.' },
    ],
    choices: [
      {
        id: 'take', label: 'Keep the key',
        outcomes: [{
          result: 'You put the key in your pocket. The drawer is now available from the desk. Nobody will mention it again.',
          flags: { 'drawer.open': true },
          archive: 'Kept the key to the drawer.', sig: 1,
        }],
      },
      {
        id: 'audit', label: 'Direct that the security vote be published and audited', pc: 10,
        outcomes: [{
          result: 'The directive is issued. The Villa goes very quiet. Three service chiefs request a meeting.',
          fx: [['nation.integrity', 4], ['bloc.villa', -6], ['bloc.establishment', -5], ['bloc.press', 5], ['approval', 1.5]],
          flags: { 'drawer.open': false, 'drawer.sealed': true },
          news: ['PRESIDENT ORDERS AUDIT OF SECURITY VOTE', 'SECURITY VOTE GO GET RECEIPT? WE SHOCK'],
          archive: 'Ordered the security vote to be published and audited.', sig: 3,
        }],
      },
      {
        id: 'leave', label: 'Leave the key with the Chief of Staff',
        outcomes: [{
          result: 'You leave the key where it is. The drawer remains, and so does the offer.',
          flags: { 'drawer.open': true },
          archive: 'Left the drawer key with the Chief of Staff.', sig: 1,
        }],
      },
    ],
  },
  {
    id: 'tempt.contractor', kind: 'recurring', slot: 'lead', category: 'temptation', tone: 'dry', intensity: 2,
    // There is no corridor to tender for once the corridors have been rebuilt.
    when: { all: [{ turn: [6] }, { v: ['agenda.p2', '==', 0] }] }, weight: 7, max: 1,
    office: 'Bureau of Public Procurement', stamp: 'CONFIDENTIAL',
    title: 'Award of contract: the Abuja–Kano transmission corridor',
    body: [
      'Two bids are before {MRP} for the ₦310bn transmission corridor.',
      'The lowest responsive bid is from a consortium with a record of finishing. The Bureau recommends it.',
      'The second bid, ₦84bn higher, is from {CONTRACTOR}, incorporated fourteen months ago. Its chairman is a nephew of {BACKER}, who paid for your campaign. An intermediary indicates that the award would be remembered, and that "the President\'s interest will be protected".',
      { when: { v: ['debt.contractors', '>', 1] }, text: 'The consortium that would do the work is still owed for the last federal job it finished.' },
    ],
    reads: [
      { role: 'sap', good: 'The interest meant is twelve billion, {SIR}. It would also square you with {BACKER_SHORT}, for now. And there will be a next contract.' },
      { role: 'fin', good: 'The second firm has never built anything. We will pay more and get less, later.', weak: 'Both firms seem capable, {SIR}.' },
    ],
    choices: [
      {
        id: 'clean', label: 'Approve the Bureau\'s recommendation', sign: true,
        outcomes: [{
          result: 'The award goes to the lowest responsive bidder. {BACKER_SHORT} sends regards and nothing else.',
          fx: [['nation.integrity', 1.5], ['bloc.party', -4], ['bloc.establishment', 2]],
          ops: [['backer', -8]],
          later: [{ after: [14, 18], fx: [['nation.power', 6]], label: 'The transmission corridor is energised.', note: ['ABUJA–KANO TRANSMISSION LINE ENERGISED', 'LIGHT REACH KANO. E BE LIKE DREAM'] }],
          news: ['FG AWARDS ₦310BN TRANSMISSION CONTRACT', 'CONTRACT GO PERSON WEY SABI WORK. FOR ONCE'],
          archive: 'Awarded the transmission contract to the lowest responsive bidder.', sig: 2,
        }],
      },
      {
        id: 'preferred', label: 'Approve the preferred contractor', sign: true,
        outcomes: [{
          result: 'The award is signed. A week later the drawer is heavier by ₦12bn. Mobilisation is paid. The site is cleared and fenced.',
          fx: [['purse', 12], ['nation.integrity', -3], ['bloc.party', 5], ['nation.fiscalSpace', -0.08]],
          ops: [['backer', 8, 'settle']],
          flags: { 'drawer.open': true },
          later: [{ after: [14, 18], fx: [['nation.power', 1.5]], label: 'The transmission corridor is reported 62% complete.', note: ['TRANSMISSION CORRIDOR "62% COMPLETE" — MINISTRY', 'CONTRACTOR COLLECT MONEY, FENCE BUSH'] }],
          exposure: { kind: 'personal', amount: 12, witnesses: ['financier', 'cos'], trail: 2 },
          news: ['FG AWARDS ₦394BN TRANSMISSION CONTRACT', '14-MONTH-OLD COMPANY WINS ₦394BN CONTRACT'],
          archive: 'Awarded the transmission contract to the preferred contractor.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'tempt.windfall', kind: 'standalone', slot: 'lead', category: 'temptation', tone: 'dry', intensity: 2,
    when: { all: [{ turn: [14] }, { flag: 'drawer.open' }] }, weight: 8,
    office: 'Office of the Accountant-General of the Federation', stamp: 'SECRET',
    title: 'An account nobody has counted',
    body: [
      'A dormant account has been found at the central bank. It holds $410m in recovered funds lodged by a previous administration and never brought into the budget.',
      'It appears in no ledger. Four people know it exists. Two of them are in this room.',
      { when: { v: ['debt.arrears', '>', 1] }, text: 'It is about what the government owes its pensioners.' },
    ],
    reads: [
      { role: 'fin', good: 'It belongs in the Federation Account, {SIR}, today, with a press release, before anyone has an idea.', weak: 'I leave the matter entirely to your wisdom, {SIR}.' },
    ],
    choices: [
      {
        id: 'declare', label: 'Pay it into the Federation Account and announce it',
        outcomes: [{
          result: 'The recovery is announced. The governors ask for their share by close of business.',
          fx: [['nation.fiscalSpace', 0.6], ['nation.integrity', 2], ['bloc.press', 3], ['approval', 1]],
          ops: [['governors', -2]],
          news: ['FG DISCOVERS $410M IN DORMANT RECOVERY ACCOUNT', '$410M JUST DEY SIT DOWN FOR CBN'],
          archive: 'Declared a $410m dormant account and paid it into the Federation Account.', sig: 2,
        }],
      },
      {
        id: 'logistics', label: 'Hold it for "strategic political logistics"',
        outcomes: [{
          result: 'The account is renamed. Half is moved where it can be useful to the party.',
          fx: [['purse', 60], ['nation.integrity', -4]],
          exposure: { kind: 'political', amount: 60, witnesses: ['fin', 'cbn', 'cos'], trail: 2 },
          archive: 'Diverted a dormant recovery account for political use.', sig: 2,
        }],
      },
      {
        id: 'keep', label: 'Move it somewhere quiet',
        outcomes: [{
          result: 'The funds leave in six transfers to four jurisdictions. The account is closed and its file is mislaid.',
          fx: [['purse', 150], ['nation.integrity', -6]],
          exposure: { kind: 'personal', amount: 150, witnesses: ['fin', 'cbn', 'cos'], trail: 3 },
          archive: 'Moved a dormant recovery account offshore.', sig: 3,
        }],
      },
      {
        id: 'save', label: 'Declare it, and pay it straight into the fund abroad',
        outcomes: [{
          result: 'The recovery is announced on the same day it is transferred to the Future Generations Fund. There is nothing left in Abuja for anybody to ask for a share of.',
          fx: [['fund.abroad', 0.6], ['nation.integrity', 2.5], ['bloc.press', 3], ['bloc.establishment', 3], ['bloc.party', -3]],
          ops: [['governors', -3]],
          news: ['$410M DORMANT FUNDS MOVED TO SOVEREIGN FUND', 'THE $410M DON ENTER SAVINGS. NOBODY FIT SHARE AM'],
          archive: 'Declared a $410m dormant account and saved it abroad.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'exposure.comment', kind: 'threshold', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 4,
    when: { all: [{ v: ['exposure.total', '>=', 20] }, { v: ['pressure.scandalHeat', '>', 55] }] },
    cooldown: 14,
    office: 'Office of the Special Adviser, Media and Publicity', stamp: 'URGENT',
    title: 'A request for comment',
    body: [
      '{EDITOR} has written to the Villa. Her paper intends to publish on Sunday.',
      'The questions are specific. They include dates, amounts and the name of a company. She asks whether the Presidency wishes to comment before publication.',
      'She appears to have a source inside the building.',
      { when: { v: ['tycoon.ty_media', '>=', 55] }, text: 'Otunba Oyewole\'s paper has the same documents and has not used them. He has let it be known that this is a courtesy.' },
    ],
    trace: [['pressure.scandalHeat', 1], ['nation.integrity', -1]],
    reads: [
      { role: 'sap', good: 'She does not bluff, {SIR}. Whatever you say, she will print. The only question is what else she prints beside it.' },
      { role: 'cos', good: 'The list of people who knew is short, {SIR}. I would not start asking who talked. They will all assume you mean them.' },
    ],
    choices: [
      {
        id: 'deny', label: 'Deny everything',
        outcomes: [{
          result: 'The story runs on Sunday across four pages, with the Presidency\'s denial in a box beside the bank transfers.',
          fx: [['bloc.press', -10], ['approval', -5, 1], ['bloc.street', -6], ['bloc.party', -5], ['nation.integrity', -2], ['pressure.scandalHeat', -20]],
          news: ['PRESIDENCY DENIES REPORT ON "LOGISTICS" PAYMENTS', 'THE RECEIPTS ARE OUT. VILLA SAYS "FAKE NEWS"'],
          archive: 'Denied a press investigation into the Presidency\'s finances.', sig: 3,
        }],
      },
      {
        id: 'animal', label: 'State that the relevant records were destroyed by termites',
        outcomes: [{
          result: 'The explanation is issued with a photograph of a damaged filing cabinet. The country stops what it is doing. The story runs for three weeks instead of one.',
          fx: [['bloc.press', -8], ['approval', -3, 1], ['nation.integrity', -4], ['pressure.scandalHeat', -10], ['bloc.street', -3]],
          news: ['PRESIDENCY: FINANCIAL RECORDS "DESTROYED BY TERMITES"', 'TERMITES CHOP THE FILE! NIGERIA WE HAIL THEE'],
          archive: 'Stated that the Presidency\'s financial records were destroyed by termites.', sig: 3,
        }],
      },
      {
        id: 'envelope', label: 'Offer the editor an arrangement', purse: 10,
        outcomes: [{
          result: 'The envelope is returned unopened, photographed, and printed on the front page above the original story.',
          fx: [['bloc.press', -15], ['approval', -6, 1], ['bloc.street', -6], ['nation.integrity', -3], ['pressure.scandalHeat', -10]],
          exposure: { kind: 'political', amount: 10, witnesses: ['editor'], trail: 3 },
          news: ['EDITOR SAYS VILLA OFFERED ₦10BN TO KILL STORY', 'THEY TRY BRIBE ZAINAB. SHE POST THE ENVELOPE'],
          archive: 'Tried to pay a newspaper editor to drop an investigation.', sig: 3,
        }],
      },
      {
        id: 'own', label: 'Publish the accounts yourself and invite an inquiry', pc: 15,
        outcomes: [{
          result: 'The Villa publishes first. It is a bad week. It is one week.',
          fx: [['bloc.press', 4], ['approval', -3], ['bloc.party', -8], ['bloc.villa', -6], ['nation.integrity', 3], ['pressure.scandalHeat', -35]],
          news: ['PRESIDENT PUBLISHES VILLA ACCOUNTS, INVITES INQUIRY', 'PRESIDENT CONFESS BEFORE DEM CATCH AM'],
          archive: 'Published the Presidency\'s own accounts ahead of an investigation.', sig: 3,
        }],
      },
      {
        id: 'oyewole', label: 'Ask Otunba Oyewole to see that it is a small story',
        requires: { v: ['tycoon.ty_media', '>=', 55] },
        outcomes: [{
          result: 'Her paper prints it on Sunday. Nobody else follows it up. The television stations lead on a football transfer. It is a story for a week instead of a season, and you now owe the man who arranged that.',
          fx: [['bloc.press', -4], ['approval', -2], ['nation.integrity', -1.5], ['pressure.scandalHeat', -18]],
          favour: ['ty_media', 'owing', 2],
          news: ['REPORT QUESTIONS VILLA PAYMENTS; PRESIDENCY SILENT', 'ZAINAB DROP THE STORY. OTHER PAPERS LOOK AWAY'],
          archive: 'Had Otunba Oyewole smother a press investigation.', sig: 2,
        }],
      },
    ],
  },
];
