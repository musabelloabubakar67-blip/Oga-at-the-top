import type { Cond, GameEvent } from '../../engine/types';

// WHAT INSTITUTIONS BRING TO YOUR DESK
// An institution that keeps running also keeps making decisions for you.

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });

export const INSTITUTION_FILES: GameEvent[] = [
  {
    id: 'inst.graft.ally', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'grave', intensity: 4, max: 1, weight: 16,
    cast: { WHO: 'dirtyMinister' }, when: { all: [v('inst.graft', '>=', 6), v('inst.graft.honest', '==', 1)] },
    office: 'The anti-corruption agency', stamp: 'SECRET',
    title: 'The agency wants to charge {WHO}',
    body: [
      'The chief of the anti-corruption agency you set up has a file on {WHO}: contracts, transfers and a house in a foreign capital that does not match a minister\'s salary. The chief wants your blessing before filing charges, and will file them anyway if you do not forbid it.',
      'This is the agency doing what you built it to do. It is also one of your own.',
    ],
    reads: [{ role: 'cos', good: 'Stop this one, {SIR}, and every investigator in that building learns who they really work for. Let it go, and every minister learns the same thing.' }],
    choices: [
      {
        id: 'proceed', label: 'Let the agency proceed',
        outcomes: [{
          result: 'Charges are filed on a Tuesday. {WHO} resigns on the Wednesday. The agency\'s phone lines are busy for a week with people who suddenly remember things.',
          fx: [['nation.integrity', 4], ['bloc.press', 4], ['bloc.party', -4], ['person.$WHO', -25], ['approval', 1.5]],
          ops: [['charge', '$WHO', 'Contracts, transfers and a house abroad', 0.06]],
          news: ['ANTI-GRAFT AGENCY CHARGES SERVING MINISTER', 'DEM DON CHARGE MINISTER. NA REAL THING?'],
          archive: 'Let the anti-corruption agency charge {WHO}.', sig: 3,
        }],
      },
      {
        id: 'stop', label: 'Have the file returned, quietly',
        outcomes: [{
          result: 'The file comes back to the Villa and stays there. The chief stays too. The investigators draw their own conclusions about whom the agency serves.',
          fx: [['nation.integrity', -3], ['person.$WHO', 10]],
          flags: { 'graft.leash': true },
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['cos'], trail: 2 },
          news: ['ANTI-GRAFT AGENCY "REVIEWING" CASE INVOLVING MINISTER', 'THE MINISTER CASE DON SLOW DOWN'],
          archive: 'Stopped the anti-corruption agency charging {WHO}.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'inst.jobs.ghosts', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3, max: 1, weight: 14,
    when: v('inst.jobs', '>=', 8),
    office: 'Office of the Auditor-General', stamp: 'CONFIDENTIAL',
    title: 'The jobs corps is paying people who do not exist',
    body: [
      'An audit of the youth jobs corps has found eleven thousand names on the payroll with no matching identity number, and four thousand more who share three bank accounts.',
      'The corps is working: the drains are being cleared. It is also being robbed.',
    ],
    reads: [{ role: 'fin', good: 'A clean-up costs a little now, {SIR}. Ghosts cost more every month, and they vote in the end.' }],
    choices: [
      {
        id: 'purge', label: 'Purge the payroll and prosecute the coordinators', pc: 4,
        outcomes: [{
          result: 'Biometric verification is ordered. Fifteen thousand names disappear. Three state coordinators are arrested. The party asks why its people are always the ones caught.',
          fx: [['nation.integrity', 2], ['bloc.party', -3], ['nation.fiscalSpace', 0.05]],
          news: ['15,000 GHOST WORKERS PURGED FROM JOBS CORPS', 'DEM DON REMOVE GHOST FROM JOBS CORPS'],
          archive: 'Purged ghost workers from the youth jobs corps.', sig: 2,
        }],
      },
      {
        id: 'quiet', label: 'Clean it up quietly',
        outcomes: [{
          result: 'The names are removed without announcement. Some of them come back the next quarter.',
          fx: [['nation.fiscalSpace', 0.02]],
          news: ['JOBS CORPS "ROUTINE PAYROLL REVIEW" CONCLUDED', 'JOBS CORPS DON CHECK PAYROLL SMALL'],
          archive: 'Quietly cleaned the jobs corps payroll.', sig: 1,
        }],
      },
      {
        id: 'ignore', label: 'Leave it: the corps is working',
        outcomes: [{
          result: 'The audit is noted. The ghosts are paid every month, and their number grows.',
          fx: [['nation.integrity', -2]],
          flags: { 'jobs.ghosts': true },
          news: ['AUDIT REPORT ON JOBS CORPS SHELVED', 'GHOST WORKERS DEY CHOP STILL'],
          archive: 'Left ghost workers on the jobs corps payroll.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'inst.zone.factory', kind: 'standalone', slot: 'lead', category: 'fortune', tone: 'dry', intensity: 2, max: 1, weight: 14,
    when: { all: [v('inst.zone', '>=', 8), v('nation.power', '>=', 45)] },
    office: 'The special economic zone authority', stamp: 'ROUTINE',
    title: 'The zone\'s first factory is ready to open',
    body: [
      'A packaging plant built by a foreign manufacturer in the special economic zone is ready to start production, with nine hundred workers hired. The company would like the President at the opening.',
    ],
    reads: [{ role: 'sap', good: 'Cut the ribbon, {SIR}. It is the first thing in a long time you can stand in front of that is finished.' }],
    choices: [
      {
        id: 'attend', label: 'Open it yourself',
        outcomes: [{
          result: 'You cut the ribbon. The first boxes come off the line on live television. Two more companies ask for plots the following week.',
          fx: [['approval', 1.5], ['bloc.establishment', 3], ['nation.jobs', 1.5], ['zone.SW.approval', 2]],
          later: [{ after: [6, 9], fx: [['nation.jobs', 2], ['bloc.establishment', 1]], label: 'Two more factories open in the zone, following the first.', note: ['TWO MORE FACTORIES OPEN IN ECONOMIC ZONE', 'MORE FACTORY DON OPEN FOR THE ZONE'] }],
          news: ['PRESIDENT OPENS FIRST FACTORY IN ECONOMIC ZONE', 'PRESIDENT DON OPEN FACTORY. WORK DON START'],
          archive: 'Opened the first factory in the special economic zone.', sig: 2,
        }],
      },
      {
        id: 'minister', label: 'Send a minister',
        outcomes: [{
          result: 'A minister cuts the ribbon. The factory opens. Nobody outside the industry notices.',
          fx: [['nation.jobs', 1]],
          news: ['FACTORY OPENS IN ECONOMIC ZONE', 'NEW FACTORY DON OPEN'],
          archive: 'Sent a minister to open the zone\'s first factory.', sig: 1,
        }],
      },
    ],
  },
  {
    id: 'inst.reserve.contract', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, max: 1, weight: 14,
    when: v('inst.reserve', '>=', 4),
    office: 'The strategic grain reserve agency', stamp: 'CONFIDENTIAL',
    title: 'Who supplies the grain reserve',
    body: [
      'The reserve agency is about to award its first large buying contract. Chief (Dr) Obinna Ezeudu, who imports more grain than anyone, has let it be known that he would be honoured to supply it, and that his gratitude would be considerable.',
    ],
    reads: [{ role: 'fin', good: 'An open tender is slower and cleaner, {SIR}. Ezeudu is faster and remembers favours, in both directions.' }],
    choices: [
      {
        id: 'ezeudu', label: 'Award it to Ezeudu',
        outcomes: [{
          result: 'Ezeudu\'s trucks fill the silos within the month, at a price nobody publishes. Something arrives in the drawer.',
          fx: [['tycoon.ty_trade', 12], ['purse', 10], ['nation.integrity', -2]],
          exposure: { kind: 'personal', amount: 10, witnesses: ['fin'], trail: 2 },
          news: ['GRAIN RESERVE CONTRACT AWARDED WITHOUT TENDER', 'WHO GET THE RESERVE CONTRACT? EZEUDU'],
          archive: 'Awarded the grain reserve contract to Chief Ezeudu, for a consideration.', sig: 2,
        }],
      },
      {
        id: 'tender', label: 'Put it out to open tender', pc: 2,
        outcomes: [{
          result: 'The tender is published. Forty firms bid. The contract goes to a cooperative of farmers in Kebbi, at a price that is published.',
          fx: [['nation.integrity', 1.5], ['tycoon.ty_trade', -5], ['zone.NW.approval', 1.5]],
          news: ['GRAIN RESERVE CONTRACT WON BY FARMERS\' COOPERATIVE', 'FARMERS DON WIN THE RESERVE CONTRACT'],
          archive: 'Put the grain reserve contract out to open tender.', sig: 1,
        }],
      },
    ],
  },
];
