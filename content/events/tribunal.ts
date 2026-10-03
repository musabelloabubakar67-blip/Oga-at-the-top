import type { Cond, GameEvent } from '../../engine/types';

// THE COURTS AND THE HANDOVER
// A narrow win goes to the election tribunal, and how the campaign was paid for
// decides it. A new President finds the last one's files in the drawer.

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });
const all = (...c: Cond[]): Cond => ({ all: c });
const any = (...c: Cond[]): Cond => ({ any: c });

/** The campaign left something a court could find. */
const dirty: Cond = any({ flag: 'ticket.bought' }, { flag: 'opposition.split' }, v('exposure.political', '>', 0));

const rulings = (pledged: boolean): GameEvent['choices'][number]['outcomes'] => [
  {
    when: { flag: 'tribunal.fixed' },
    result: 'The panel upholds your election, five to nil, in a judgment read in nineteen minutes. Nobody is surprised, and that is the problem: nobody is surprised.',
    fx: [['bloc.press', -5], ['nation.integrity', -2], ['bloc.establishment', -2], ['pc', 4]],
    flags: { 'tribunal.done': true },
    news: ['TRIBUNAL UPHOLDS PRESIDENT\'S ELECTION, 5–0', 'TRIBUNAL SAY PRESIDENT WIN. WE DON KNOW BEFORE'],
    archive: 'Had the election upheld by a tribunal that had been spoken to.', sig: 3,
  },
  {
    when: { not: dirty },
    result: 'The panel upholds your election. It finds that the petitioners proved nothing, because there was nothing to prove. The campaign\'s accounts, which you published, are annexed to the judgment.',
    fx: [['approval', 2], ['bloc.establishment', 4], ['bloc.press', 4], ['nation.integrity', 2], ['pc', 6]],
    flags: { 'tribunal.done': true, 'tribunal.clean': true },
    news: ['TRIBUNAL DISMISSES PETITION: "NOTHING TO ANSWER"', 'TRIBUNAL CLEAR PRESIDENT. THE ELECTION CLEAN'],
    archive: 'Won at the election tribunal on a clean campaign.', sig: 3,
  },
  {
    when: v('bench.loyal', '>=', 4),
    result: 'The petition goes up on appeal, as everyone knew it would, and the Supreme Court upholds your election four to three. Four of the justices in the majority were appointed by you. The minority judgment says so, in the first paragraph.',
    fx: [['bloc.press', -4], ['nation.integrity', -2], ['pc', 2]],
    flags: { 'tribunal.done': true },
    news: ['SUPREME COURT UPHOLDS PRESIDENT, 4–3', 'SUPREME COURT: PRESIDENT JUDGES DON SAVE AM'],
    archive: 'Had the election upheld by a Supreme Court of your own appointing.', sig: 3,
  },
  {
    when: v('bench.honest', '>=', 4), chance: 0.55,
    result: 'The panel finds that money changed hands at the convention and on election day, and annuls the result. A court that could not be reached has done what such courts do. The Vice President is sworn in at four o\'clock.',
    fx: [['bloc.press', pledged ? 6 : -4]],
    ends: 'annulled',
    news: ['TRIBUNAL ANNULS PRESIDENTIAL ELECTION', 'TRIBUNAL DON CANCEL THE ELECTION. PRESIDENT DON GO'],
    newsWeight: 10,
    archive: 'Had the election annulled by the tribunal.', sig: 3,
  },
  {
    chance: 0.5,
    result: 'The panel orders the election re-run in four states. You win the re-run, narrowly, with the whole country watching every polling unit. It has cost you most of a year.',
    fx: [['pc', -14], ['approval', -3], ['bloc.party', -5], ['bloc.press', -3], ['pressure.scandalHeat', 8]],
    flags: { 'tribunal.done': true },
    news: ['TRIBUNAL ORDERS RE-RUN IN FOUR STATES; PRESIDENT HOLDS ON', 'RE-RUN FOR FOUR STATE. PRESIDENT SURVIVE AM'],
    archive: 'Survived a court-ordered re-run in four states.', sig: 3,
  },
  {
    result: 'The panel upholds your election, three to two. The dissenting judgments are longer than the ruling and are quoted for months.',
    fx: [['pc', -4], ['bloc.press', -3], ['pressure.scandalHeat', 5]],
    flags: { 'tribunal.done': true },
    news: ['SPLIT TRIBUNAL UPHOLDS PRESIDENT, 3–2', 'TRIBUNAL: PRESIDENT WIN BY THREE JUDGES TO TWO'],
    archive: 'Had the election upheld by a divided tribunal.', sig: 3,
  },
];

export const TRIBUNAL: GameEvent[] = [
  {
    id: 'tribunal.petition', kind: 'chain', slot: 'lead', category: 'politics', tone: 'dry', intensity: 4, reactive: true, max: 1,
    office: 'Presidential Election Petition Tribunal', stamp: 'URGENT',
    title: 'The election is going to court',
    body: [
      '{OPP} has filed a petition asking the tribunal to annul your election. You won by few enough votes that the tribunal must hear it in full.',
      { when: { flag: 'ticket.bought' }, text: 'Their lawyers have the bureau de change records from the week of your party\'s convention.' },
      { when: { flag: 'opposition.split' }, text: 'They have subpoenaed the bank accounts of the fourth candidate, whose party did not exist until somebody paid for it.' },
      { when: v('exposure.political', '>', 0), text: 'The petition lists money that moved through the campaign and asks where it came from. Some of the people who moved it have been asked to give evidence.' },
      { when: { not: dirty }, text: 'The Attorney General has read the petition twice. It alleges a great deal and attaches nothing, because your campaign left nothing to attach.' },
      { when: v('bench.loyal', '>=', 4), text: 'Whatever the tribunal decides, the appeal ends at a Supreme Court where four of the seven owe you their seats.' },
      { when: all(v('bench.loyal', '<', 4), v('bench.honest', '>=', 4)), text: 'The appeal ends at a Supreme Court where most of the justices cannot be reached. They will decide it on the evidence.' },
      { when: all(v('bench.loyal', '<', 4), v('bench.honest', '<', 4)), text: 'The Supreme Court is divided and some of it can be reached. That cuts both ways.' },
    ],
    trace: [['flag:ticket.bought', 1], ['flag:opposition.split', 1]],
    reads: [
      { role: 'sap', good: 'What you did in the campaign is now evidence, {SIR}. If there is nothing, let them look. If there is something, the question is whether you would rather be embarrassed or exposed.' },
    ],
    choices: [
      {
        id: 'defend', label: 'Defend the result in open court',
        outcomes: [{
          result: 'Your lawyers enter an appearance. The hearing will take months, and the government will be run in the gaps between sittings.',
          fx: [['pc', -3]],
          follow: [{ event: 'tribunal.ruling', after: [4, 6] }],
          news: ['PRESIDENT TO DEFEND ELECTION AT TRIBUNAL', 'PRESIDENT AND OPPOSITION GO MEET FOR COURT'],
          archive: 'Defended the election result at the tribunal.',
        }],
      },
      {
        id: 'publish', label: 'Publish the campaign\'s accounts and invite the tribunal to read them',
        requires: { not: dirty }, locked: 'The campaign\'s accounts cannot be published.',
        outcomes: [{
          result: 'Every naira the campaign received and spent is published the same afternoon. The petitioners\' lawyers ask for an adjournment to read it.',
          fx: [['bloc.press', 5], ['nation.integrity', 2], ['approval', 1.5]],
          follow: [{ event: 'tribunal.ruling', after: [3, 4] }],
          news: ['PRESIDENT PUBLISHES CAMPAIGN ACCOUNTS', 'PRESIDENT SHOW HOW E SPEND CAMPAIGN MONEY'],
          archive: 'Published the campaign accounts in answer to the election petition.', sig: 2,
        }],
      },
      {
        id: 'panel', label: 'Make sure the panel understands what is at stake', purse: 20,
        outcomes: [{
          result: 'A retired judge is asked to convey the Presidency\'s respects to the panel. He is thorough. The result is no longer in doubt, and five more people know why.',
          fx: [['nation.integrity', -4]],
          flags: { 'tribunal.fixed': true },
          exposure: { kind: 'political', amount: 20, witnesses: ['min_justice', 'judges'], trail: 3 },
          follow: [{ event: 'tribunal.ruling', after: [3, 4] }],
          archive: 'Had the election tribunal spoken to.', sig: 3,
        }],
      },
      {
        id: 'deal', label: 'Offer the petitioner a place in the government', pc: 10,
        outcomes: [{
          result: 'The petition is withdrawn "in the national interest". Its author is sworn in as a minister the following month. Your own party would like to know what they campaigned for.',
          fx: [['bloc.party', -7], ['bloc.establishment', 3], ['bloc.press', -3], ['rival.alt', -6], ['rival.strong', -6], ['rival.fire', -6], ['nation.capacity', -1.5]],
          flags: { 'tribunal.done': true, 'tribunal.settled': true },
          news: ['PETITION WITHDRAWN AS OPPOSITION JOINS GOVERNMENT', 'OPPOSITION DON ENTER GOVERNMENT. COURT CASE DON END'],
          archive: 'Bought off the election petition with a seat in government.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'tribunal.ruling', kind: 'chain', slot: 'lead', category: 'politics', tone: 'dry', intensity: 5, reactive: true, max: 1,
    office: 'Presidential Election Petition Tribunal', stamp: 'URGENT',
    title: 'Judgment day at the tribunal',
    body: [
      'The tribunal delivers judgment at nine tomorrow morning. Abuja has emptied. Both parties have hired the same hall for a victory reception.',
      { when: { flag: 'tribunal.fixed' }, text: 'You already know what it will say.' },
      { when: all({ not: { flag: 'tribunal.fixed' } }, dirty), text: 'The evidence about the campaign\'s money was heard in full. Your lawyers describe the panel as "attentive", which is not the word they were hoping to use.' },
      { when: all({ not: { flag: 'tribunal.fixed' } }, { not: dirty }), text: 'Your lawyers are relaxed. There was nothing in the campaign to find, and nothing was found.' },
    ],
    reads: [
      { role: 'sap', good: 'Whatever they say, {SIR}, say tonight that you will obey it. If it goes well it costs nothing. If it goes badly it is the only thing anyone will remember kindly.' },
    ],
    choices: [
      {
        id: 'pledge', label: 'Say tonight, on television, that you will obey the judgment whatever it is',
        outcomes: rulings(true).map((o) => ({ ...o, fx: [...(o.fx ?? []), ['nation.integrity', 1.5]] as typeof o.fx })),
      },
      {
        id: 'wait', label: 'Say nothing and wait',
        outcomes: rulings(false),
      },
    ],
  },

  // ---------------------------------------------------------------- what the last President left in the drawer
  {
    id: 'inherit.matters', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3, reactive: true,
    when: all({ flag: 'inherit.exposures' }, { turn: [3, 16] }), weight: 16,
    office: 'Office of the Attorney General of the Federation', stamp: 'SECRET',
    title: 'Matters arising from the previous administration',
    body: [
      'The Attorney General has brought you a file on {PRED}. It was assembled by civil servants who kept copies.',
      { when: v('pred.kept', '>=', 10), text: 'It traces money out of the Villa over several years, into accounts and properties. The trail is not complete. It is complete enough.' },
      { when: v('pred.kept', '<', 10), text: 'It lists what was signed, who benefited, and which objections were overruled in writing.' },
      { when: v('pred.same', '==', 1), text: 'Your predecessor is of your own party. So are most of the names in the annexes.' },
      { when: v('pred.same', '==', 0), text: 'Your predecessor is of the other party. Your own supporters expect a trial. Your own ministers have noticed what a precedent is.' },
      'Whatever you do with this file is what your successor will do with yours.',
    ],
    reads: [
      { role: 'sap', good: 'A probe pleases the street and frightens everybody in this building with something to hide, {SIR}. That is nearly everybody. Letting it rest pleases them and tells the street what you are.' },
    ],
    choices: [
      {
        id: 'probe', label: 'Send the file to the prosecutors and say so', pc: 8,
        outcomes: [
          {
            when: v('pred.same', '==', 1),
            result: 'The file goes to the prosecutors. Your own party treats it as a declaration of war, because for several of them it is.',
            fx: [['nation.integrity', 5], ['approval', 3], ['bloc.street', 5], ['bloc.press', 5], ['bloc.party', -10], ['pressure.scandalHeat', -12]],
            later: [{ after: [8, 12], fx: [['nation.fiscalSpace', 0.4], ['nation.integrity', 2]], label: 'Assets recovered from the last administration are paid into the treasury.', note: ['₦400BN RECOVERED FROM FORMER OFFICIALS', 'DEM DON RECOVER ₦400BN FROM THE OLD GOVERNMENT PEOPLE'] }],
            flags: { 'precedent.probe': true },
            ops: [['governors', -4], ['senators', -4]],
            news: ['PRESIDENT ORDERS PROSECUTION OF PREDECESSOR\'S OFFICIALS', 'NEW PRESIDENT DON OPEN THE OLD PRESIDENT FILE'],
            archive: 'Sent the previous administration\'s file to the prosecutors.', sig: 3,
          },
          {
            result: 'The file goes to the prosecutors. The street approves. Your own ministers approve in public and take a new interest in record-keeping.',
            fx: [['nation.integrity', 5], ['approval', 3], ['bloc.street', 5], ['bloc.press', 5], ['bloc.party', -3], ['bloc.villa', -3], ['pressure.scandalHeat', -12], ['rival.strong', 4]],
            later: [{ after: [8, 12], fx: [['nation.fiscalSpace', 0.4], ['nation.integrity', 2]], label: 'Assets recovered from the last administration are paid into the treasury.', note: ['₦400BN RECOVERED FROM FORMER OFFICIALS', 'DEM DON RECOVER ₦400BN FROM THE OLD GOVERNMENT PEOPLE'] }],
            flags: { 'precedent.probe': true },
            news: ['PRESIDENT ORDERS PROSECUTION OF PREDECESSOR\'S OFFICIALS', 'NEW PRESIDENT DON OPEN THE OLD PRESIDENT FILE'],
            archive: 'Sent the previous administration\'s file to the prosecutors.', sig: 3,
          },
        ],
      },
      {
        id: 'settle', label: 'Have the money returned quietly, and nothing said',
        outcomes: [{
          result: 'Intermediaries are found. A sum is returned to the treasury through a foundation. Nobody is charged and nobody is thanked.',
          fx: [['nation.fiscalSpace', 0.3], ['nation.integrity', -2], ['bloc.party', 3], ['pressure.scandalHeat', 4]],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['min_justice'], trail: 2 },
          flags: { 'precedent.settled': true },
          archive: 'Settled the previous administration\'s file quietly.',
        }],
      },
      {
        id: 'rest', label: 'Let it rest. The country must move on',
        outcomes: [{
          result: 'You say the government is "focused on the future". The file goes back into the cabinet it came from. Everyone in the building breathes out.',
          fx: [['bloc.party', 5], ['bloc.villa', 3], ['nation.integrity', -3], ['bloc.press', -4], ['bloc.street', -3], ['approval', -1.5]],
          flags: { 'precedent.rest': true },
          news: ['PRESIDENT: "NO WITCH-HUNT" OF PREDECESSOR', 'NEW PRESIDENT SAY E NO GO PROBE THE OLD ONE'],
          archive: 'Let the previous administration\'s file rest.', sig: 2,
        }],
      },
    ],
  },
];
