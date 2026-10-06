import type { GameEvent } from '../../engine/types';

// THE QUESTIONS SUCCESS ASKS (plan 14.A7 and 14.T11)
// Each file can only arise once development has created the constituency that
// raises it, and the constituency outlives the government that created it. A
// later President inherits these as new political questions, not stronger
// versions of the old crises.

const has = (id: string) => ({ v: [`constituency.${id}`, '==', 1] as [string, '==', number] });

export const CONSTITUENCY_FILES: GameEvent[] = [
  {
    id: 'con.taxpayers', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, topic: 'money', max: 1,
    when: { all: [has('taxpayers'), { turn: [3] }] }, weight: 16,
    office: 'Office of the Chief of Staff', stamp: 'ROUTINE',
    title: 'Two million taxpayers want to see the receipts',
    body: [
      'A taxpayers\' association that did not exist three years ago has filed a freedom-of-information request for every line of last year\'s capital budget. It has a hundred thousand paying members.',
      'Its chair, a dentist from Ibadan, says: "We were told to pay. We paid. Now show us."',
    ],
    reads: [
      { role: 'fin', good: 'They are the people who make the tax base, {SIR}. Answer them and they keep paying.', weak: 'Give them a summary. The full budget would only start arguments.' },
      { role: 'cos', good: 'A government that asked people to pay cannot refuse to tell them what it bought.' },
    ],
    choices: [
      {
        id: 'publish', label: 'Publish the full budget and every release, line by line, every quarter', pc: 5,
        outcomes: [{
          result: 'The budget goes online in full. The association finds eleven projects that were paid for twice. You fix nine of them in public.',
          later: [{ after: [10, 14], fx: [['bonus.fiscal', 0.008], ['nation.integrity', 2]], label: 'With the budget public, compliance rises: people pay more readily for what they can see.' }],
          fx: [['nation.integrity', 4], ['bloc.press', 4], ['bloc.party', -4]],
          news: ['FG PUBLISHES FULL BUDGET AND RELEASES ONLINE', 'NOW WE FIT SEE WETIN DEM SPEND OUR TAX ON'],
          archive: 'Published the full budget and every release for the taxpayers\' association.', sig: 2,
        }],
      },
      {
        id: 'summary', label: 'Publish a summary and meet the association',
        outcomes: [{
          result: 'The summary is published. The association calls it "a brochure" and starts a campaign for the full version.',
          later: [{ after: [6, 10], fx: [['bonus.fiscal', -0.004], ['bloc.press', -3]], label: 'The campaign of the taxpayers spreads: "No receipts, no tax." Compliance slips.' }],
          fx: [['bloc.press', -2]],
          news: ['TAXPAYERS REJECT BUDGET SUMMARY AS "A BROCHURE"', 'DEM GIVE US BROCHURE INSTEAD OF BUDGET'],
          archive: 'Gave the taxpayers\' association a budget summary.', sig: 1,
        }],
      },
    ],
  },
  {
    id: 'con.credit', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, topic: 'money', max: 1,
    when: { all: [has('credit'), { not: { flag: 'credit.opened' } }] }, weight: 16,
    office: 'Federal Ministry of Industry, Trade and Investment', stamp: 'ROUTINE',
    title: 'The new firms cannot borrow, and the old banks will not let anyone else lend',
    body: [
      'Factories that did not exist five years ago want to expand. The banks lend to the government and to their own shareholders\' companies. Three applications for new banking licences have sat at the central bank for two years.',
      'Mrs Folake Adetoro\'s banks hold a third of all deposits. She points out, correctly, that new banks fail.',
    ],
    reads: [
      { role: 'fin', good: 'Licence the new lenders under strict capital rules, {SIR}. Growth needs credit, and competition is the only thing that makes banks lend.', weak: 'Protect the banking system. Failures cost more than slow growth.' },
    ],
    choices: [
      {
        id: 'open', label: 'License the new lenders, with strict capital rules', pc: 6,
        outcomes: [{
          result: 'Three new lenders open. Within a year, factory loans have doubled, and one of the new lenders has been fined for breaking the capital rules.',
          fx: [['nation.jobs', 3], ['bonus.jobs', 0.02], ['tycoon.ty_bank', -10], ['bloc.establishment', 2]],
          flags: { 'credit.opened': true },
          news: ['THREE NEW LENDERS LICENSED AS FACTORIES SEEK CREDIT', 'NEW BANKS DON COME. FACTORY FIT BORROW NOW'],
          archive: 'Licensed new lenders for growing firms.', sig: 2,
        }],
      },
      {
        id: 'guarantee', label: 'Guarantee loans through the existing banks instead',
        outcomes: [{
          result: 'A state guarantee covers half of every factory loan. The banks lend, carefully, to the firms they already knew.',
          fx: [['nation.jobs', 1], ['bonus.fiscal', -0.008], ['tycoon.ty_bank', 4]],
          flags: { 'credit.opened': true },
          news: ['FG TO GUARANTEE HALF OF FACTORY LOANS', 'GOVERNMENT GO STAND SURETY FOR FACTORY LOAN'],
          archive: 'Guaranteed factory loans through the existing banks.', sig: 2,
        }],
      },
      {
        id: 'wait', label: 'Leave it to the central bank',
        outcomes: [{
          result: 'The applications stay on the desk. The firms that cannot borrow do not grow.',
          fx: [['bloc.establishment', -2]],
          quiet: 'Nothing is announced. The applications stay at the central bank.',
          archive: 'Left new banking licences undecided.', sig: 1,
        }],
      },
    ],
  },
  {
    id: 'con.unions', kind: 'standalone', slot: 'lead', category: 'labour', tone: 'grave', intensity: 3, topic: 'labour', max: 1,
    when: { all: [has('unions'), { not: { flag: 'unions.recognised' } }] }, weight: 16,
    office: 'Federal Ministry of Labour and Employment', stamp: 'URGENT',
    title: 'The workers at the new plants want a union, and the owners want them not to have one',
    body: [
      'Eleven thousand people work in the plants your government built. They have formed an industrial union and want it recognised for bargaining. Two managers have dismissed the organisers.',
      'The owners say a union now will scare away the next investor. The union says the next investor should come knowing the rules.',
    ],
    reads: [
      { role: 'sap', good: 'Recognise it under the law, {SIR}, and make it bargain under the law. Unrecognised unions strike without notice.' },
      { role: 'fin', good: 'Bargaining under the law costs less than a strike without it, {SIR}.', weak: 'The plants are new and fragile. Ask the workers to wait.' },
    ],
    choices: [
      {
        id: 'recognise', label: 'Recognise the union and set up bargaining under the labour law', pc: 4,
        outcomes: [{
          result: 'The union is recognised. The first agreement covers safety and a pay scale. There is no strike.',
          fx: [['bloc.street', 4], ['pressure.wageGrievance', -6], ['bloc.establishment', -3]],
          flags: { 'unions.recognised': true },
          news: ['INDUSTRIAL UNION RECOGNISED AT NEW PLANTS', 'FACTORY WORKERS DON GET UNION'],
          archive: 'Recognised an industrial union at the new plants.', sig: 2,
        }],
      },
      {
        id: 'refuse', label: 'Side with the owners: no union until the plants are established',
        outcomes: [{
          result: 'The organisers stay dismissed. Six months later the plants stop for four days without notice.',
          fx: [['bloc.establishment', 3], ['bloc.street', -3]],
          later: [{ after: [5, 7], fx: [['nation.jobs', -2], ['pressure.wageGrievance', 8]], label: 'The new plants stop for four days in an unrecognised strike.' }],
          news: ['FG BACKS OWNERS ON UNION AT NEW PLANTS', 'NO UNION FOR FACTORY WORKERS — GOVERNMENT'],
          archive: 'Backed the owners against an industrial union at the new plants.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'con.graduates', kind: 'standalone', slot: 'lead', category: 'labour', tone: 'grave', intensity: 3, topic: 'labour', max: 1,
    when: { all: [has('graduates'), { v: ['nation.jobs', '<', 45] }] }, weight: 16,
    office: 'Office of the Senior Special Assistant on Youth', stamp: 'URGENT',
    title: 'The first free-school generation has graduated into no jobs',
    body: [
      'The children who went to school because it became free have finished. There are more young people with certificates than ever, and not more jobs for them.',
      'They are better organised than their parents, and they are online. A march is planned for the anniversary of the policy that educated them.',
    ],
    reads: [
      { role: 'sap', good: 'This is the success, {SIR}. It asks a harder question than the failure did. Give them something that uses what they learned.' },
      { role: 'fin', good: 'A graduate scheme costs money every year. Credit for those who start firms costs less and lasts longer.' },
    ],
    choices: [
      {
        id: 'scheme', label: 'A paid graduate placement scheme in the public service', naira: 0.2,
        outcomes: [{
          result: 'Two hundred thousand graduates are placed for two years. The march is called off. The scheme is now a line in every future budget.',
          fx: [['bloc.street', 5], ['approval', 2], ['bonus.fiscal', -0.012], ['nation.capacity', 1]],
          news: ['200,000 GRADUATES PLACED IN NEW PUBLIC SCHEME', 'GRADUATES DON GET WORK. FOR TWO YEARS'],
          archive: 'Placed two hundred thousand graduates in a public scheme.', sig: 2,
        }],
      },
      {
        id: 'credit', label: 'Start-up credit and a tax holiday for graduate-founded firms', pc: 3,
        outcomes: [{
          result: 'Forty thousand apply; nine thousand get credit. Most firms fail, as most firms do. Some do not.',
          fx: [['nation.jobs', 2], ['bonus.jobs', 0.02], ['bloc.street', 1]],
          news: ['GRADUATE START-UP FUND OPENS', 'IF YOU GET IDEA, GOVERNMENT GO GIVE YOU LOAN'],
          archive: 'Opened start-up credit for graduate-founded firms.', sig: 2,
        }],
      },
      {
        id: 'nothing', label: 'Jobs come from growth. Say so.',
        outcomes: [{
          result: 'The march goes ahead, larger than planned. Its banner reads: "You educated us. Now what?"',
          fx: [['bloc.street', -6], ['approval', -2]],
          news: ['"YOU EDUCATED US. NOW WHAT?" GRADUATES MARCH', 'GRADUATES MARCH: WHERE THE WORK?'],
          archive: 'Told unemployed graduates that jobs come from growth.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'con.agencies', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, topic: 'scandal', max: 1,
    when: { all: [has('agencies'), { turn: [6] }] }, weight: 14,
    office: 'Office of the Head of the Civil Service', stamp: 'CONFIDENTIAL',
    title: 'A director has refused an instruction from the Villa, in writing',
    body: [
      'The procurement director at the Ministry of Works has declined to award a contract to the company your aide recommended, citing the procurement law and attaching the evaluation. The aide wants the director moved.',
      'The civil service you made more capable has started to behave as if the rules apply to the Villa.',
    ],
    reads: [
      { role: 'cos', good: 'Back the director, {SIR}. A service that can say no to us is the same service that can say no to the next man.', weak: 'Move the director. One example and the rest will understand.' },
    ],
    choices: [
      {
        id: 'back', label: 'Back the director, and say so', pc: 3,
        outcomes: [{
          result: 'The contract goes to the company that won the evaluation. Your aide is unhappy. Directors across the service read the memo.',
          fx: [['nation.integrity', 3], ['nation.capacity', 2], ['bloc.villa', -4]],
          news: ['PRESIDENT BACKS OFFICIAL WHO REFUSED VILLA CONTRACT REQUEST', 'OGA SAY: FOLLOW THE RULE, NOT MY BOYS'],
          archive: 'Backed a civil servant who refused an improper instruction from the Villa.', sig: 2,
        }],
      },
      {
        id: 'move', label: 'Move the director',
        outcomes: [{
          result: 'The director is moved to a training institute. The contract goes to the recommended company. The service learns the lesson you taught it.',
          fx: [['nation.capacity', -3], ['nation.integrity', -3], ['bloc.villa', 3]],
          exposure: { kind: 'political', amount: 0, witnesses: [], trail: 1 },
          news: ['OFFICIAL WHO REFUSED VILLA REQUEST REDEPLOYED', 'DEM DON MOVE WHO TALK NO'],
          archive: 'Moved a civil servant who refused an improper instruction from the Villa.', sig: 2,
        }],
      },
    ],
  },
];
