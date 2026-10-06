import type { GameEvent } from '../../engine/types';

// THE ARMED FORCES AS AN INSTITUTION (plan 13)
// Files that arise from what the forces actually did: a leaked report of harm
// to civilians, a procurement scandal the surge exposed, a dispute in the
// command over how to fight, an order to use soldiers at home, an inherited
// board of inquiry, and (only when several grievances line up) officers
// meeting where they should not. Officers are named in content/military.ts.

const mil = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number) => ({ v: [`mil.${path}`, op, n] as [string, typeof op, number] });

export const MILITARY_FILES: GameEvent[] = [
  {
    id: 'mil.leak', kind: 'recurring', slot: 'lead', category: 'security', tone: 'grave', intensity: 4, topic: 'security',
    when: { flag: 'mil.leak' }, cooldown: 2, weight: 45,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'The unit\'s own report has reached the Chronicle',
    body: [
      'The newspaper has the after-action report of the operation in which civilians were killed. It does not match the statement Defence Headquarters issued.',
      'An officer gave it to them. The officer has not been identified, and the Chief of Defence Staff has asked whether you want them to be.',
      { when: mil('conduct', '<', 45), text: 'Conduct across the forces has slipped, and the human-rights groups have started counting.' },
      { when: { v: ['count.mil.leak', '>=', 1] }, text: 'It is not the first report an officer has leaked under this government. What happened to the last leaker, and to the soldiers in the last report, is what the officers are watching.' },
    ],
    reads: [
      { role: 'nsa', good: 'Try the people responsible in open court, {SIR}. The communities are watching what happens to soldiers who kill them.', weak: 'Find the officer who leaked it. Discipline first.' },
      { role: 'cos', good: 'The report is already public. The only decision left is what you do next.' },
    ],
    choices: [
      {
        id: 'prosecute', label: 'Courts-martial for those responsible, in public', pc: 5,
        outcomes: [{
          result: 'Three soldiers and a lieutenant colonel are charged. The hearings are open. In the villages near the operation, people begin talking to the troops again.',
          fx: [['nation.integrity', 3], ['bloc.establishment', -3], ['bloc.press', 4]],
          ops: [['milabuse', 'prosecuted']],
          news: ['SOLDIERS CHARGED OVER CIVILIAN DEATHS', 'SOLDIERS GO FACE COURT FOR THE KILLING'],
          archive: 'Ordered courts-martial over civilian deaths in a military operation.', sig: 3,
        }],
      },
      {
        id: 'compensate', label: 'Pay compensation and promise a review',
        outcomes: [{
          result: 'The families are paid. The review is announced. Nobody is charged, and the families notice.',
          fx: [['approval', 1]],
          ops: [['milabuse', 'compensated']],
          news: ['FG COMPENSATES VICTIMS OF MILITARY OPERATION', 'DEM PAY THE FAMILIES. NOBODY GO JAIL'],
          archive: 'Paid compensation for civilian deaths in a military operation.', sig: 2,
        }],
      },
      {
        id: 'deny', label: 'Stand by the Defence Headquarters statement and find the leaker',
        outcomes: [{
          result: 'The statement stands. The officer who leaked is found and posted to a depot. Every officer who might have reported the next one has seen what happens.',
          fx: [['bloc.press', -5], ['pressure.scandalHeat', 6], ['bloc.establishment', 2]],
          ops: [['milabuse', 'buried']],
          news: ['DEFENCE HQ STANDS BY ACCOUNT; LEAKER DISCIPLINED', 'DEM PUNISH WHO TALK, NOT WHO KILL'],
          archive: 'Stood by the official account of civilian deaths and disciplined the officer who leaked.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'mil.procurement', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3, topic: 'security', max: 1,
    when: { any: [{ flag: 'mil.procurement.due' }, { all: [{ turn: [9] }, mil('integrity.procurement', '<=', 2), { v: ['pressure.scandalHeat', '>=', 40] }] }] }, weight: 22,
    office: 'Office of the Auditor-General for the Federation', stamp: 'CONFIDENTIAL',
    title: 'Two helicopters, no spare parts, and an agent\'s fee paid in full',
    body: [
      'The Auditor-General has traced a helicopter purchase made through an agent in a third country. The aircraft arrived. Their spare-parts packages did not. The agent\'s fee was paid on delivery of the aircraft.',
      'The Director of Defence Procurement says the packages are "in transit". They have been in transit for two years.',
      { when: { flag: 'mil.procurement.due' }, text: 'The emergency contracts for the current surge went through the same directorate, and some of what was paid for has not arrived either.' },
    ],
    reads: [
      { role: 'nsa', good: 'A board of inquiry with civilians on it, {SIR}. If the director is clean, it will say so.', weak: 'The forces need the directorate working. An inquiry now stops every contract.' },
      { role: 'fin', good: 'We paid for parts we do not have, {SIR}. Someone has the money.' },
    ],
    choices: [
      {
        id: 'inquiry', label: 'Convene a board of inquiry with civilian members', pc: 4,
        outcomes: [{
          result: 'The board is convened with four months to report. The directorate\'s files are sealed the same afternoon.',
          fx: [['bloc.establishment', -2], ['nation.integrity', 2]],
          flags: { 'mil.procurement.due': false },
          ops: [['milinquiry', 'procurement']],
          news: ['BOARD OF INQUIRY TO PROBE DEFENCE PROCUREMENT', 'DEM DON OPEN THE ARMS MONEY FILE'],
          archive: 'Convened a board of inquiry into defence procurement.', sig: 2,
        }],
      },
      {
        id: 'retire', label: 'Retire the director quietly and move on', pc: 2,
        outcomes: [{
          result: 'The director retires with full honours. The packages remain in transit. The senator whose committee approved the purchase sends a note of thanks.',
          fx: [['pressure.scandalHeat', 3]],
          flags: { 'mil.procurement.due': false },
          ops: [['milretire', 'procurement']],
          archive: 'Retired the Director of Defence Procurement without an inquiry.', sig: 2,
        }],
      },
      {
        id: 'leave', label: 'Leave it: the forces need the directorate working',
        outcomes: [{
          result: 'The directorate carries on. So does the agent.',
          fx: [['nation.integrity', -2], ['pressure.scandalHeat', 4]],
          flags: { 'mil.procurement.due': false },
          quiet: 'Nothing is announced. The report of the Auditor-General goes into the annual volume, on page four hundred.',
          archive: 'Left a defence procurement scandal uninvestigated.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'mil.dispute', kind: 'standalone', slot: 'lead', category: 'security', tone: 'dry', intensity: 3, topic: 'security', max: 1,
    when: { all: [mil('missions', '>=', 1), { not: { flag: 'mil.doctrine' } }, { turn: [4] }] }, weight: 18,
    office: 'Defence Headquarters', stamp: 'CONFIDENTIAL',
    title: 'The Chief of Defence Staff and the Chief of Army Staff disagree, in writing',
    body: [
      'The Chief of Defence Staff wants every town retaken to be garrisoned before the brigades move on. The Chief of Army Staff calls garrisons "targets with flags on them" and wants the strike brigades kept moving.',
      'Both have sent you memos. Both are copied to the National Security Adviser, and one of them, by accident, to a senator.',
    ],
    reads: [
      { role: 'nsa', good: 'Garrisons win cooperation and lose speed, {SIR}; raids win speed and lose the towns. Choose for the war you want, or let the joint staff settle it by its own procedure.' },
    ],
    choices: [
      {
        id: 'hold', label: 'Back the Chief of Defence Staff: hold what is taken',
        outcomes: [{
          result: 'Garrisons stay in the retaken towns. Operations are slower; people come back to the towns that are held.',
          ops: [['mildoctrine', 'hold']],
          archive: 'Backed garrisons over mobile raids in a dispute between the service chiefs.', sig: 2,
        }],
      },
      {
        id: 'manoeuvre', label: 'Back the Chief of Army Staff: keep the brigades moving',
        outcomes: [{
          result: 'The brigades keep moving. The threat falls faster. So does the patience of the towns they pass through.',
          ops: [['mildoctrine', 'manoeuvre']],
          archive: 'Backed mobile raids over garrisons in a dispute between the service chiefs.', sig: 2,
        }],
      },
      {
        id: 'settle', label: 'Tell the joint staff to settle it by its own procedure',
        requires: mil('professional', '>=', 1), locked: 'The joint staff has no procedure that both chiefs accept. Professional reforms (the procurement audit, the policing inspectorate, prosecution reform) would give it one.',
        outcomes: [{
          result: 'The joint staff settles it: garrisons where people are returning, raids where they are not. Nobody comes to the Villa about it again.',
          ops: [['mildoctrine', 'settled']],
          archive: 'Left a dispute between the service chiefs to the joint staff\'s procedure.', sig: 1,
        }],
      },
    ],
  },
  {
    id: 'mil.misuse', kind: 'recurring', slot: 'lead', category: 'security', tone: 'grave', intensity: 5, topic: 'labour',
    when: { all: [{ turn: [6] }, { any: [{ v: ['pressure.wageGrievance', '>=', 75] }, { v: ['bloc.street', '<', 28] }] }] }, cooldown: 18, max: 2, weight: 20,
    office: 'Ministry of Interior', stamp: 'URGENT',
    title: 'The police cannot hold the march, and the Interior Minister wants soldiers',
    body: [
      'A hundred thousand people are marching on the Secretariat. The police say they cannot hold the line. The Interior Minister asks you to order the army in.',
      'Soldiers are trained to defeat an enemy, not to manage a crowd. The Chief of Defence Staff has asked for the order in writing.',
      { when: { v: ['count.mil.misuse', '>=', 1] }, text: 'You have been asked this before. The marchers remember what you decided then, and so does the Chief of Defence Staff.' },
    ],
    reads: [
      { role: 'nsa', good: 'Soldiers in a crowd kill people, {SIR}. Give the police what they need and meet the leaders.', weak: 'Show strength once, and there will not be a second march.' },
      { role: 'cos', good: 'Whatever happens today will be on video by tonight.' },
    ],
    choices: [
      {
        id: 'troops', label: 'Order the army in',
        outcomes: [
          {
            when: mil('refuse', '==', 1),
            result: 'The Chief of Defence Staff replies in writing: deploying soldiers against an unarmed march would be unlawful, and the order will not be passed on. The police hold the line, badly. The letter is in the papers by evening.',
            fx: [['pc', -4], ['bloc.establishment', 3], ['bloc.street', 2], ['bloc.villa', -3]],
            ops: [['milmisuse', 'refused']],
            news: ['DEFENCE CHIEF REFUSES ORDER TO DEPLOY TROOPS AGAINST MARCH', 'OGA SAY MAKE SOLDIERS COME. DEM SAY NO'],
            archive: 'Ordered soldiers against a march; the Chief of Defence Staff refused it as unlawful.', sig: 3,
          },
          {
            result: 'The soldiers go in. By nightfall the march is dispersed and nine people are dead. The video is on every phone in the country.',
            fx: [['bloc.street', -8], ['approval', -4], ['bloc.press', -6], ['pressure.wageGrievance', -10], ['nation.integrity', -4]],
            ops: [['milmisuse', 'complied']],
            news: ['NINE KILLED AS SOLDIERS DISPERSE MARCH', 'SOLDIERS SHOOT PROTESTERS. NINE DEAD'],
            archive: 'Ordered soldiers against a march. Nine people died.', sig: 3,
          },
        ],
      },
      {
        id: 'police', label: 'Give the police the equipment and the orders to hold it without guns', naira: 0.05,
        outcomes: [{
          result: 'Riot police with shields and no live ammunition hold the line through the afternoon. Nobody dies. The march ends at dusk with speeches.',
          fx: [['bloc.street', 1], ['pressure.wageGrievance', -3]],
          news: ['MARCH ENDS PEACEFULLY AS POLICE HOLD LINE WITHOUT GUNS', 'NOBODY DIE. THE MARCH DON END'],
          archive: 'Policed a mass march without soldiers or live ammunition.', sig: 2,
        }],
      },
      {
        id: 'meet', label: 'Meet the march leaders at the Secretariat gate', pc: 4,
        outcomes: [{
          result: 'You meet them at the gate. Nothing is agreed except a second meeting, which is enough for the march to go home.',
          fx: [['bloc.street', 4], ['pressure.wageGrievance', -6], ['bloc.establishment', -2]],
          news: ['PRESIDENT MEETS MARCH LEADERS AT SECRETARIAT GATE', 'OGA COMOT MEET THE MARCHERS'],
          archive: 'Met the leaders of a mass march at the Secretariat gate.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'mil.record', kind: 'standalone', slot: 'lead', category: 'security', tone: 'grave', intensity: 3, topic: 'security', max: 1,
    when: { all: [{ turn: [3] }, mil('abuses', '>=', 1)] }, weight: 10,
    office: 'Office of the Attorney-General of the Federation', stamp: 'CONFIDENTIAL',
    title: 'The board of inquiry report your predecessors never released',
    body: [
      'Years ago, after a cordon-and-search in a farming district, eleven men were not seen again. A board of inquiry sat. Its report has been in a safe at Defence Headquarters through two governments.',
      'The general who commanded the brigade now commands the army. Human-rights groups have asked every new President to publish it. You are the new President.',
    ],
    reads: [
      { role: 'nsa', good: 'Publish it, {SIR}. An army that hides its records cannot be trusted with anyone else\'s.', weak: 'Publishing it now will cost you the Chief of Army Staff in the middle of a war.' },
    ],
    choices: [
      {
        id: 'publish', label: 'Publish the report and refer it to the prosecutors', pc: 6,
        outcomes: [{
          result: 'The report is published. It names units, not people, and recommends prosecutions nobody acted on. The prosecutors open a file. The Chief of Army Staff offers a resignation you have not yet accepted.',
          fx: [['nation.integrity', 4], ['bloc.establishment', -4], ['bloc.press', 4]],
          ops: [['milabuse', 'prosecuted']],
          news: ['PRESIDENT PUBLISHES SUPPRESSED MILITARY INQUIRY REPORT', 'THE REPORT WEY DEM HIDE DON COMOT'],
          archive: 'Published a suppressed military board of inquiry report and referred it to prosecutors.', sig: 3,
        }],
      },
      {
        id: 'families', label: 'Keep it sealed, and compensate the families privately',
        outcomes: [{
          result: 'The families are paid. The report stays in the safe, for the next President.',
          ops: [['milabuse', 'compensated']],
          archive: 'Compensated the families in an old military case and kept the inquiry report sealed.', sig: 2,
        }],
      },
      {
        id: 'seal', label: 'Leave it sealed',
        outcomes: [{
          result: 'The report stays in the safe. The human-rights groups add your name to the list of Presidents who were asked.',
          ops: [['milabuse', 'buried']],
          archive: 'Kept a suppressed military inquiry report sealed.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'mil.coup', kind: 'standalone', slot: 'lead', category: 'security', tone: 'grave', intensity: 5, topic: 'security', max: 1,
    when: mil('coup', '>=', 3), weight: 50,
    office: 'Defence Intelligence', stamp: 'SECRET',
    title: 'Officers have been meeting where they should not',
    body: [
      'The Chief of Defence Intelligence reports that a group of officers has met three times in a private house in the capital. The intelligence names grievances, not a plan: pay months late, soldiers sent against civilians, abuses buried on orders from above.',
      'It names one commander with a following. It does not say the commander attended.',
    ],
    reads: [
      { role: 'nsa', good: 'Take away the grievances, {SIR}, and the meetings have nothing to talk about. Then deal with the commander.', weak: 'Arrest them all tonight.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay every arrear this month and announce it', pc: 3,
        outcomes: [{
          result: 'The arrears are paid in a week. The intelligence on the meetings goes quiet.',
          ops: [['milpay']],
          archive: 'Cleared the armed forces\' pay arrears after intelligence of disaffected officers.', sig: 2,
        }],
      },
      {
        id: 'retire', label: 'Retire the commander with the following, with honours', pc: 6,
        outcomes: [{
          result: 'The commander retires with honours and a farewell parade. The following does not follow anyone else.',
          fx: [['bloc.establishment', -3]],
          ops: [['milretire', 'ambitious']],
          archive: 'Retired a commander named in intelligence about disaffected officers.', sig: 2,
        }],
      },
      {
        id: 'ignore', label: 'It is talk. Officers always talk.',
        outcomes: [{
          result: 'Nothing is done. The meetings continue.',
          follow: [{ event: 'mil.coup.attempt', after: [2, 4], when: mil('coup', '>=', 3) }],
          quiet: 'The report is filed. Nobody outside the Villa knows it was written.',
          archive: 'Ignored intelligence of disaffected officers meeting in private.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'mil.coup.attempt', kind: 'chain', slot: 'lead', category: 'security', tone: 'grave', intensity: 5, topic: 'security', max: 1,
    office: 'State House', stamp: 'URGENT',
    title: 'Armoured vehicles at the gates of the broadcasting house',
    body: [
      'At four in the morning, armoured vehicles from one brigade surround the national broadcaster. A statement has been recorded and not yet played. The Chief of Defence Staff is on the telephone.',
    ],
    reads: [
      { role: 'nsa', good: 'Everything now depends on whether the Chief of Defence Staff obeys the constitution or the brigade, {SIR}. Call now, and say it on the record.' },
    ],
    choices: [
      {
        id: 'command', label: 'Order the Chief of Defence Staff to restore control',
        outcomes: [
          {
            when: mil('refuse', '==', 1),
            result: 'The Chief of Defence Staff orders every other unit to stay in barracks and surrounds the brigade. By noon its officers are under arrest. The statement is never played. The law held because the people who command the army believed in it.',
            fx: [['approval', 4], ['bloc.establishment', 4], ['pc', 6]],
            ops: [['milretire', 'ambitious']],
            news: ['COUP ATTEMPT FAILS AS ARMY STAYS LOYAL TO CONSTITUTION', 'COUP NO WORK. SOLDIERS SAY NO'],
            archive: 'Survived a coup attempt: the armed forces stayed loyal to the constitution.', sig: 3,
          },
          {
            result: 'The Chief of Defence Staff says the situation is "being assessed". By noon the statement has been played. By evening you are on a plane.',
            ends: 'removed',
            news: ['MILITARY TAKES OVER; PRESIDENT FLOWN OUT', 'SOLDIERS DON TAKE OVER'],
            archive: 'Was removed from office by the armed forces.', sig: 3,
          },
        ],
      },
    ],
  },
];
