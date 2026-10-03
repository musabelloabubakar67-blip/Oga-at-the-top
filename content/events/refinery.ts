import type { GameEvent } from '../../engine/types';

// THE REFINERY
// What happens once the President knows the refinery has not worked in years,
// or once the money paid to "complete" it is traced.

export const REFINERY: GameEvent[] = [
  {
    id: 'refinery.exposed', kind: 'chain', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 3, max: 1,
    office: 'Office of the Chief of Staff', stamp: 'CONFIDENTIAL',
    title: 'The refinery has not worked in six years',
    body: [
      'The engineers you brought back from the visit have written it down. The refinery has not refined a barrel in six years. The "rehabilitation" has been a payroll, a fleet of vehicles and a series of tranches.',
      { when: { v: ['counter.refpaid', '>=', 1] }, text: 'Some of those tranches were released by you.' },
      'The Minister of State, Petroleum, has recovered from the indisposition and would like to explain.',
    ],
    reads: [
      { role: 'cos', good: 'Everyone in the building knows what you saw, {SIR}. What you do about the minister tells them what the rule is. A proper audit would also tell you whether the place can actually be fixed.' },
    ],
    choices: [
      {
        id: 'sack', label: 'Sack the minister and publish the engineers\' report', pc: 4,
        outcomes: [{
          result: 'The minister is relieved of the post by letter. The report is published in full, with photographs, including the goat. For the first time in years, people know what state the refinery is in.',
          fx: [['nation.integrity', 2], ['bloc.press', 3], ['bloc.party', -2], ['tycoon.ty_fuel', -4]],
          flags: { 'refinery.audit': true },
          news: ['MINISTER SACKED AS REPORT EXPOSES IDLE REFINERY', 'THE REFINERY NO DEY WORK. MINISTER DON GO'],
          archive: 'Sacked the Minister of State over the idle refinery and published the report.', sig: 2,
        }],
      },
      {
        id: 'prosecute', label: 'Sack the minister and hand the file to the prosecutors', pc: 7,
        outcomes: [{
          result: 'The minister is arrested at the airport with a ticket for a conference that does not exist. The trial will take years. The contractors start returning money before they are asked.',
          fx: [['nation.integrity', 3], ['bloc.press', 4], ['bloc.party', -4], ['bloc.establishment', -2], ['nation.fiscalSpace', 0.15], ['tycoon.ty_fuel', -6]],
          flags: { 'refinery.audit': true },
          news: ['EX-MINISTER ARRESTED OVER REFINERY FUNDS', 'DEM CATCH THE REFINERY MINISTER FOR AIRPORT'],
          archive: 'Had the Minister of State prosecuted over the refinery money.', sig: 3,
        }],
      },
      {
        id: 'keep', label: 'Keep the minister, and keep it quiet',
        outcomes: [{
          result: 'The minister thanks you for your understanding. The engineers\' report is classified. The engineers are reassigned to places without telephones.',
          fx: [['nation.integrity', -2], ['bloc.party', 2]],
          flags: { 'refinery.covered': true },
          follow: [{ event: 'refinery.scandal', after: [8, 14], chance: 0.6 }],
          news: ['PRESIDENCY: REFINERY "ON COURSE"', 'DEM SAY REFINERY DEY ON COURSE. COURSE TO WHERE?'],
          archive: 'Covered up the state of the refinery and kept the Minister of State.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'refinery.scandal', kind: 'chain', slot: 'lead', category: 'scandal', tone: 'grave', intensity: 4, max: 1,
    office: 'Office of the Special Adviser, Media', stamp: 'URGENT',
    title: 'Where the refinery money went',
    body: [
      'The Federal Chronicle has the payment records. The tranches released for the refinery went to eleven companies registered in the same month, at the same address, which is a petrol station.',
      { when: { v: ['counter.refpaid', '>=', 1] }, text: 'The releases carry your approval.' },
      { when: { flag: 'refinery.covered' }, text: 'It also has the engineers\' report you classified.' },
    ],
    reads: [
      { role: 'info', good: 'They have the documents, {SIR}. The only question is whether the story is about the minister or about you.' },
    ],
    choices: [
      {
        id: 'own', label: 'Own it: sack the minister, publish everything, order an audit', pc: 6,
        outcomes: [{
          result: 'You say you were misled and that being misled is no excuse. The audit is ordered on live television. It is not the week you wanted; it is a better week than the alternative.',
          fx: [['approval', -2], ['bloc.press', 2], ['nation.integrity', 1], ['bloc.party', -3]],
          flags: { 'refinery.audit': true, 'refinery.covered': false },
          news: ['PRESIDENT ORDERS REFINERY AUDIT: "I WAS MISLED"', 'PRESIDENT SAY DEM DECEIVE AM. AUDIT DON START'],
          archive: 'Owned the refinery scandal and ordered an audit.', sig: 3,
        }],
      },
      {
        id: 'blame', label: 'Blame the Minister of State, and nobody else',
        outcomes: [{
          result: 'The minister is sacked. The Chronicle runs the approvals with your signature on page two. Nobody believes the minister acted alone.',
          fx: [['approval', -3], ['bloc.press', -4], ['nation.integrity', -2], ['pressure.scandalHeat', 8]],
          news: ['MINISTER SACKED; QUESTIONS REMAIN OVER PRESIDENCY APPROVALS', 'DEM DON SACK MINISTER. WHO SIGN THE MONEY?'],
          archive: 'Blamed the Minister of State alone for the refinery money.', sig: 3,
        }],
      },
    ],
  },
];
