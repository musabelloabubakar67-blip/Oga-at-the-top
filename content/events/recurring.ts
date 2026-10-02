import type { GameEvent } from '../../engine/types';

// Recurring crises, economic files and the grave events. Grave events follow
// GDD 5.6: no jokes in the body, options or results; the only irony permitted
// is an official statement quoted and left to stand.

export const RECURRING: GameEvent[] = [
  {
    id: 'grid.collapse', kind: 'recurring', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 2,
    when: { all: [{ turn: [3] }, { v: ['nation.power', '<', 50] }, { v: ['agenda.p2', '==', 0] }] }, weight: 10, weightInv: 'nation.power', cooldown: 18, max: 3,
    office: 'Federal Ministry of Power', stamp: 'URGENT',
    title: 'The national grid has collapsed',
    body: [
      'The national grid collapsed at 11:47 this morning. Generation fell from 4,100MW to 42MW in under a minute.',
      { when: { v: ['agenda.p1', '==', 1] }, text: 'Generation was not the cause. The plants you put back on gas were running at full output when a forty-year-old transmission line failed and took the system with it. More power on the same wires makes this more likely, not less.' },
      { when: { v: ['count.grid.collapse', '>=', 2] }, text: 'This is the latest of several collapses under this administration. The Ministry\'s statement is the same statement, with the date changed.' },
      'The transmission company attributes the incident to "a system disturbance". It has attributed the last nine incidents to a system disturbance.',
    ],
    statement: 'Efforts are ongoing to restore supply. The public is assured that the situation is under control.',
    trace: [['nation.power', -1]],
    reads: [
      { role: 'power', good: 'The lines are forty years old and the gas suppliers have not been paid. It will keep collapsing until one of those two things changes, {SIR}.', weak: 'It was sabotage, {SIR}. We are investigating the remote and immediate causes.' },
    ],
    choices: [
      {
        id: 'fix', label: 'Fund emergency reinforcement of the weakest lines', naira: 0.3,
        outcomes: [{
          result: 'Supply is restored in nineteen hours. Work begins on the six worst corridors. It is a patch: only rebuilding the corridors ends this for good.',
          fx: [['nation.power', 2]],
          later: [{ after: [6, 9], fx: [['nation.power', 5], ['approval', 1]], label: 'Reinforced transmission lines come into service.', note: ['GRID STABILITY IMPROVES AS SIX CORRIDORS ARE REINFORCED', 'LIGHT NO DEY TRIP LIKE BEFORE'] }],
          news: ['GRID RESTORED; FG FUNDS EMERGENCY REINFORCEMENT', 'NEPA TAKE LIGHT FOR WHOLE NIGERIA. AGAIN'],
          archive: 'Funded emergency reinforcement of the transmission grid.',
        }],
      },
      {
        id: 'gas', label: 'Clear the debt owed to gas suppliers', naira: 0.5,
        requires: { v: ['agenda.p1', '==', 0] },
        outcomes: [{
          result: 'The suppliers are paid. Generation rises within weeks, because the plants had been idle for want of gas, not for want of plants.',
          fx: [['nation.power', 5], ['bloc.establishment', 3]],
          later: [{ after: [3, 5], fx: [['nation.power', 3], ['approval', 1.5]], label: 'Idle gas plants return to service.' }],
          news: ['FG SETTLES ₦500BN GAS DEBT TO POWER SECTOR', 'GOVERNMENT PAY GAS DEBT. LIGHT DON IMPROVE'],
          archive: 'Cleared the power sector\'s debt to gas suppliers.', sig: 2,
        }],
      },
      {
        id: 'probe', label: 'Direct the Minister to investigate the remote and immediate causes',
        outcomes: [{
          result: 'A panel is constituted. Supply is restored in thirty-one hours. The panel\'s report is awaited.',
          fx: [['approval', -1.5], ['bloc.street', -2], ['nation.power', -1.5], ['counter.committees', 1]],
          news: ['MINISTER ORDERS PROBE OF GRID COLLAPSE', 'GRID COLLAPSE: ANOTHER PANEL. NO LIGHT'],
          archive: 'Ordered an investigation into a grid collapse.',
        }],
      },
    ],
  },
  {
    id: 'petrol.scarcity', kind: 'recurring', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3,
    when: { all: [{ v: ['pressure.fuelSupplyStress', '>', 45] }, { not: { flag: 'policy.subsidy', is: 'removed' } }] }, weight: 14, weightBy: 'pressure.fuelSupplyStress', cooldown: 15, max: 4,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: 'Petrol scarcity returns',
    body: [
      'Queues at filling stations in Abuja and Lagos now run for more than a kilometre. Black-market petrol is selling at three times the official price.',
      'The marketers say they cannot import at the regulated price. The national oil company says there is 30 days\' supply in the country. Neither statement has been verified.',
    ],
    statement: 'There is sufficient product in stock. Nigerians are advised to avoid panic buying.',
    trace: [['pressure.fuelSupplyStress', 1], ['flag:policy.subsidy', 1]],
    reads: [
      { role: 'fin', good: 'The price is fixed below cost, {SIR}. Nobody imports at a loss for long. This is what a cap looks like from the forecourt.', weak: 'It is hoarding by unpatriotic elements, {SIR}.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay the marketers\' outstanding claims', naira: 0.45,
        outcomes: [{
          result: 'The claims are paid. Tankers load within days and the queues clear in a fortnight.',
          fx: [['pressure.fuelSupplyStress', -30], ['approval', 1]],
          news: ['FG PAYS MARKETERS; QUEUES EASE', 'FUEL DON SHOW. QUEUE DON REDUCE'],
          archive: 'Paid fuel marketers\' subsidy claims to end a scarcity.',
        }],
      },
      {
        id: 'reserve', label: 'Release the strategic reserve',
        outcomes: [{
          result: 'The reserve is released. The queues ease for three weeks. The reserve is now empty.',
          fx: [['pressure.fuelSupplyStress', -12], ['bloc.establishment', -2]],
          flags: { 'reserve.empty': true },
          later: [{ after: [3, 5], fx: [['pressure.fuelSupplyStress', 18]], label: 'The strategic petrol reserve is exhausted.' }],
          news: ['FG RELEASES STRATEGIC FUEL RESERVE', 'RESERVE DON FINISH. WETIN NEXT?'],
          archive: 'Released the strategic petrol reserve.',
        }],
      },
      {
        id: 'taskforce', label: 'Deploy a task force against hoarders',
        outcomes: [{
          result: 'Eleven filling stations are sealed on television. The queues at the remaining stations are longer by eleven stations\' worth.',
          fx: [['approval', -2], ['bloc.street', -3], ['pressure.fuelSupplyStress', 5]],
          news: ['TASK FORCE SEALS STATIONS OVER HOARDING', 'TASK FORCE SEAL STATION. QUEUE LONG PASS BEFORE'],
          archive: 'Sent a task force against fuel hoarders.',
        }],
      },
    ],
  },
  {
    id: 'flood', kind: 'recurring', slot: 'lead', category: 'security', tone: 'grave', intensity: 4,
    when: { all: [{ month: [8, 9, 10] }, { turn: [3] }, { not: { flag: 'flood.defences' } }] }, weight: 14, cooldown: 32, max: 3,
    office: 'National Emergency Management Agency', stamp: 'URGENT',
    title: 'Flooding along the Niger and Benue',
    body: [
      'Flood water has displaced 410,000 people across nine states. 68 deaths are confirmed. Farmland along both rivers is under water three weeks before harvest.',
      'The Agency issued a seasonal warning in March naming these states. Relief materials have been pre-positioned in two of the nine.',
      'Governors are requesting federal intervention.',
      { when: { v: ['count.flood', '>=', 2] }, text: 'This is the same flood, in the same places, as the last one. The engineering answer has been known for thirty years: dredge the rivers, build the buffer dam, raise the embankments. It has never been funded.' },
    ],
    statement: 'Government sympathises with the victims and has directed relevant agencies to provide succour.',
    reads: [
      { role: 'cos', good: 'The camps need food and clean water this week, {SIR}. Everything else can be argued about afterwards.' },
      { role: 'fin', good: 'Relief now is cheap. The food price consequences next year will not be.', weak: 'The ecological fund should cover it, {SIR}.' },
    ],
    choices: [
      {
        id: 'full', label: 'Full federal response and a visit to the camps', naira: 0.3,
        outcomes: [{
          result: 'Relief reaches all nine states within the week. You spend a day in two of the camps and are told, plainly, what was not done in March.',
          fx: [['approval', 2], ['bloc.street', 3], ['zone.NC.approval', 3]],
          later: [{ after: [5, 8], fx: [['nation.inflation', 1]], label: 'Lost harvests along the rivers push up food prices.' }],
          news: ['PRESIDENT VISITS FLOOD VICTIMS AS RELIEF ARRIVES', 'FLOOD: PRESIDENT REACH CAMP. PEOPLE TELL AM THEIR MIND'],
          archive: 'Led a full federal response to the river floods.', sig: 2,
        }],
      },
      {
        id: 'defences', label: 'Relief now, and commit to permanent flood defences', naira: 1.6, pc: 5, sign: true,
        outcomes: [{
          result: 'Relief goes out this week. The dredging contract is signed this month. It is the most expensive line in the budget and the first time the flood has been treated as something that can end.',
          fx: [['approval', 3], ['bloc.street', 3], ['zone.NC.approval', 5], ['nation.debt', 1]],
          flags: { 'flood.defences': true },
          later: [{ after: [14, 18], fx: [['bonus.inflation', -1], ['approval', 2], ['zone.NC.approval', 4]], label: 'The rivers rise and the new defences hold.', note: ['RIVERS RISE, DEFENCES HOLD: NO FLOOD DEATHS THIS YEAR', 'RAIN FALL, WATER NO ENTER HOUSE. THANK GOD'] }],
          news: ['PRESIDENT COMMITS ₦1.6TN TO END NIGER–BENUE FLOODING', 'PRESIDENT SAY THIS FLOOD GO BE THE LAST'],
          archive: 'Committed to permanent flood defences on the Niger and Benue.', sig: 3,
        }],
      },
      {
        id: 'partial', label: 'Release relief through the state governments', naira: 0.12,
        outcomes: [{
          result: 'Funds are released to the states. Distribution is uneven. In two states it has not been accounted for.',
          fx: [['approval', -1], ['nation.integrity', -1]],
          later: [{ after: [5, 8], fx: [['nation.inflation', 2]], label: 'Lost harvests along the rivers push up food prices.' }],
          news: ['FG RELEASES FLOOD RELIEF TO STATES', 'FLOOD RELIEF: VICTIMS SAY THEY HAVE SEEN NOTHING'],
          archive: 'Released flood relief through the state governments.',
        }],
      },
      {
        id: 'verify', label: 'Await verification of the figures',
        outcomes: [{
          result: 'An assessment team is dispatched. It reports in three weeks. Cholera is confirmed in two camps before it does.',
          fx: [['approval', -4], ['bloc.street', -5], ['bloc.press', -5], ['zone.NC.approval', -5]],
          later: [{ after: [5, 8], fx: [['nation.inflation', 2.5]], label: 'Lost harvests along the rivers push up food prices.' }],
          news: ['FG ASSESSMENT TEAM TO VERIFY FLOOD DAMAGE', 'CHOLERA IN FLOOD CAMPS AS ABUJA "VERIFIES"'],
          archive: 'Delayed flood relief pending verification.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'attack.farms', kind: 'recurring', slot: 'lead', category: 'security', tone: 'grave', intensity: 4,
    when: { all: [{ turn: [4] }, { v: ['nation.security', '<', 55] }, { v: ['agenda.s2', '==', 0] }] }, weight: 9, weightInv: 'nation.security', cooldown: 22, max: 3,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'Attack on farming communities',
    body: [
      'Armed men attacked four farming communities overnight. 47 people are confirmed dead. Several thousand have fled to the local government headquarters.',
      'The nearest military unit is 90 minutes away by road. Distress calls were logged three hours before it moved.',
      'The state governor says he has "run out of words". Planting in the area will not happen this season.',
    ],
    statement: 'The President condemns the dastardly act and has directed security agencies to fish out the perpetrators.',
    trace: [['nation.security', -1]],
    reads: [
      { role: 'nsa', good: 'I can tell you who did it with moderate confidence. I cannot tell you why the unit took three hours, and that is the question that matters.' },
      { role: 'sap', good: 'They have heard "fish out the perpetrators" before, {SIR}. Go, or send nothing.' },
    ],
    choices: [
      {
        id: 'go', label: 'Go there, and order an inquiry into the delayed response', pc: 6,
        outcomes: [{
          result: 'You stand in the village the next morning. The inquiry finds that the unit had no fuel. Two commanders are relieved.',
          fx: [['nation.security', 2], ['approval', 1.5], ['zone.NC.approval', 4], ['bloc.establishment', -3], ['nation.capacity', 1]],
          news: ['PRESIDENT VISITS ATTACKED COMMUNITIES, ORDERS INQUIRY', 'PRESIDENT REACH THE VILLAGE. TWO COMMANDERS REMOVED'],
          archive: 'Visited attacked communities and ordered an inquiry into the military response.', sig: 2,
        }],
      },
      {
        id: 'deploy', label: 'Approve a new forward operating base', naira: 0.25,
        outcomes: [{
          result: 'The base is approved. It will be operational in five months.',
          later: [{ after: [5, 7], fx: [['nation.security', 5], ['zone.NC.security', 4]], label: 'A new forward operating base becomes operational.' }],
          fx: [['approval', -1]],
          news: ['FG APPROVES NEW MILITARY BASE AFTER ATTACKS', 'NEW ARMY BASE DEY COME. FIVE MONTHS'],
          archive: 'Approved a forward operating base in the farm belt.', sig: 2,
        }],
      },
      {
        id: 'statement', label: 'Issue a statement of condemnation',
        outcomes: [{
          result: 'The statement is issued. It is the same statement as the last time.',
          fx: [['approval', -3], ['zone.NC.approval', -5], ['bloc.press', -3], ['nation.security', -1.5]],
          news: ['PRESIDENT CONDEMNS ATTACK, VOWS JUSTICE', '47 DEAD. ABUJA SENDS A PRESS RELEASE'],
          archive: 'Responded to a mass killing with a statement.',
        }],
      },
    ],
  },
  {
    id: 'abduction', kind: 'standalone', slot: 'lead', category: 'security', tone: 'grave', intensity: 5,
    when: { all: [{ turn: [10] }, { v: ['nation.security', '<', 45] }] }, weight: 7,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'Abduction of schoolchildren',
    body: [
      '112 pupils were taken from a boarding school in the North West in the early hours of the morning.',
      'The abductors have made contact with a parent. They are demanding ₦1bn.',
      'The state government closed its boarding schools last year after a previous incident and reopened them in September.',
    ],
    trace: [['nation.security', -1]],
    reads: [
      { role: 'nsa', good: 'We know roughly where they are. A rescue can be mounted. I put the risk to the children at one in four. Intelligence is incomplete.' },
      { role: 'sap', good: 'The parents do not care about policy, {SIR}. They want their children. Whatever you choose, do not let them hear about it from the radio.' },
    ],
    choices: [
      {
        id: 'negotiate', label: 'Authorise negotiation through intermediaries',
        outcomes: [{
          result: 'After 26 days all but three of the children are released. No ransom is acknowledged. The three are still missing.',
          fx: [['approval', 1], ['zone.NW.approval', 3], ['nation.security', -2], ['nation.integrity', -1]],
          news: ['109 ABDUCTED PUPILS REGAIN FREEDOM', '109 CHILDREN ARE HOME. THREE ARE NOT'],
          archive: 'Authorised negotiation for abducted schoolchildren. 109 of 112 returned.', sig: 3,
        }],
      },
      {
        id: 'rescue', label: 'Authorise a rescue operation', pc: 6,
        outcomes: [
          {
            chance: 0.7,
            result: 'The operation recovers 104 children. Two soldiers are killed. Eight children remain unaccounted for.',
            fx: [['approval', 3], ['zone.NW.approval', 5], ['nation.security', 3], ['bloc.establishment', 3]],
            news: ['TROOPS RESCUE 104 ABDUCTED PUPILS', '104 CHILDREN RESCUED. TWO SOLDIERS DIE'],
            archive: 'Authorised a rescue of abducted schoolchildren. 104 of 112 recovered.', sig: 3,
          },
          {
            result: 'The camp had been moved. Eleven children are killed in the crossfire. The rest are recovered over the following month.',
            fx: [['approval', -6], ['zone.NW.approval', -8], ['bloc.press', -5], ['bloc.street', -4]],
            news: ['ELEVEN PUPILS KILLED IN FAILED RESCUE', 'ELEVEN CHILDREN. ELEVEN'],
            archive: 'Authorised a rescue of abducted schoolchildren. Eleven were killed.', sig: 3,
          },
        ],
      },
      {
        id: 'both', label: 'Negotiate, and fund protection for every boarding school', naira: 0.3,
        outcomes: [{
          result: 'The children are released after 31 days. Perimeter security and a response line are funded for 1,400 schools.',
          fx: [['approval', 2], ['zone.NW.approval', 4]],
          later: [{ after: [6, 9], fx: [['nation.security', 4]], label: 'The safe schools programme is fully deployed.' }],
          news: ['PUPILS FREED; FG FUNDS SAFE SCHOOLS PROGRAMME', 'CHILDREN DON RETURN. SCHOOLS GO GET SECURITY'],
          archive: 'Negotiated the release of abducted schoolchildren and funded school security.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'collapse.building', kind: 'standalone', slot: 'lead', category: 'infrastructure', tone: 'grave', intensity: 3,
    when: { turn: [8] }, weight: 5,
    office: 'Federal Ministry of Works and Housing', stamp: 'URGENT',
    title: 'Collapse of a 21-storey building',
    body: [
      'A 21-storey building under construction has collapsed in a coastal city. 44 bodies have been recovered. Workers are still trapped.',
      'The building had approval for fifteen floors. The site was sealed by regulators eight months ago and unsealed two weeks later.',
      'The developer is a party donor.',
    ],
    reads: [
      { role: 'sap', good: 'Somebody signed the paper that unsealed that site, {SIR}. Everyone in this city knows the name. They are waiting to see whether you do.' },
    ],
    choices: [
      {
        id: 'prosecute', label: 'Order prosecution of the developer and the officials who unsealed the site', pc: 8,
        outcomes: [{
          result: 'Four officials and the developer are charged. It is the first prosecution of its kind to reach trial.',
          fx: [['nation.integrity', 4], ['nation.capacity', 1.5], ['bloc.party', -5], ['approval', 2], ['bloc.press', 4]],
          news: ['DEVELOPER, FOUR OFFICIALS CHARGED OVER COLLAPSE', 'FOR ONCE, SOMEBODY GO ANSWER'],
          archive: 'Prosecuted a party donor and officials over a fatal building collapse.', sig: 3,
        }],
      },
      {
        id: 'panel', label: 'Constitute a panel of inquiry',
        outcomes: [{
          result: 'The panel sits for five months. Its report is submitted and not published.',
          fx: [['nation.integrity', -1.5], ['bloc.press', -3], ['counter.committees', 1]],
          news: ['PANEL TO PROBE BUILDING COLLAPSE', 'ANOTHER PANEL. THE LAST REPORT NEVER COME OUT'],
          archive: 'Set up a panel of inquiry into a fatal building collapse.',
        }],
      },
    ],
  },
  {
    id: 'cabinet.leak', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'farce', intensity: 2,
    when: { all: [{ turn: [6] }, { v: ['bloc.villa', '<', 58] }] }, weight: 7, max: 1,
    office: 'Office of the Chief of Staff', stamp: 'CONFIDENTIAL',
    title: 'A message in the wrong group',
    body: [
      'At 22:40 last night a minister posted the following in the WhatsApp group "CABINET — NO FORWARDS PLS": "The President will never agree to this 😂 just let him talk."',
      'The message was intended for a different group. It was deleted after four minutes.',
      'Forty-one people are in the group. A screenshot is on the front page of {STREET}. The minister has changed his profile picture to a Bible verse.',
    ],
    reads: [
      { role: 'sap', good: 'The message is not the problem, {SIR}. The problem is the other group, and who is in it.' },
      { role: 'cos', good: 'I can find out who leaked the screenshot. I would rather not, {SIR}. It will be someone we need.' },
    ],
    choices: [
      {
        id: 'laugh', label: 'Reply in the group: "I agree with the Honourable Minister."',
        outcomes: [{
          result: 'The reply leaks within the hour, as intended. The country decides you have a sense of humour. The minister decides he has a future.',
          fx: [['bloc.villa', 5], ['approval', 1.5], ['bloc.press', 3]],
          news: ['PRESIDENT LAUGHS OFF LEAKED CABINET MESSAGE', 'PRESIDENT REPLY THE MINISTER. WE DON LAUGH TIRE'],
          archive: 'Laughed off a leaked cabinet WhatsApp message.',
        }],
      },
      {
        id: 'sack', label: 'Relieve the minister of his appointment', pc: 5,
        outcomes: [{
          result: 'The minister is relieved "with immediate effect". The remaining forty stop posting anything but birthday wishes.',
          fx: [['bloc.villa', -4], ['bloc.party', -3]],
          news: ['MINISTER SACKED OVER LEAKED MESSAGE', 'ONE WHATSAPP MESSAGE, ONE MINISTER GONE'],
          archive: 'Dismissed a minister over a leaked WhatsApp message.',
        }],
      },
      {
        id: 'hunt', label: 'Direct the DSS to identify the source of the screenshot',
        outcomes: [{
          result: 'Forty-one phones are examined. The source is not found. A second screenshot, of the directive to find the first, is published on Friday.',
          fx: [['bloc.villa', -7], ['bloc.press', -4], ['approval', -1]],
          later: [{ after: [2, 3], fx: [['nation.capacity', -1.5]], label: 'Ministers stop putting advice in writing.' }],
          news: ['VILLA HUNTS SOURCE OF CABINET LEAK', 'DEM DEY FIND WHO LEAK AM. THE ORDER SEF DON LEAK'],
          archive: 'Ordered a hunt for the source of a cabinet leak.',
        }],
      },
    ],
  },
  {
    id: 'oil.price', kind: 'recurring', slot: 'lead', category: 'fortune', tone: 'dry', intensity: 2,
    when: { turn: [9] }, weight: 7, cooldown: 26,
    office: 'Federal Ministry of Finance', stamp: 'ROUTINE',
    title: 'Oil is above the budget benchmark',
    body: [
      'Crude has traded $19 above the budget benchmark for a full quarter. The excess stands at ₦900bn.',
      'The law requires the excess to be saved. The law has been observed in four of the last twenty years.',
      'The governors have requested an emergency meeting of the allocation committee.',
    ],
    reads: [
      { role: 'fin', good: 'The price will fall again, {SIR}. It always has. What we save now is what we do not borrow then.', weak: 'The governors make a compelling case, {SIR}.' },
    ],
    choices: [
      {
        id: 'save', label: 'Save it, as the law requires',
        outcomes: [{
          result: 'The excess is paid into the stabilisation account. Nobody thanks you. The governors describe the decision as "insensitive".',
          fx: [['nation.debt', -4], ['nation.fiscalSpace', 0.3], ['bloc.establishment', 5], ['bloc.party', -6]],
          news: ['FG SAVES ₦900BN OIL WINDFALL', 'GOVERNMENT DEY SAVE MONEY WHILE WE DEY HUNGRY?'],
          archive: 'Saved an oil windfall.', sig: 2,
        }],
      },
      {
        id: 'invest', label: 'Spend it on power and security capital projects',
        outcomes: [{
          result: 'The funds are appropriated in a supplementary budget. The Assembly adds a few things.',
          fx: [['nation.fiscalSpace', 0.15]],
          later: [{ after: [8, 12], fx: [['nation.power', 5], ['nation.security', 3]], label: 'Windfall-funded capital projects are completed.' }],
          news: ['SUPPLEMENTARY BUDGET TO FUND POWER, SECURITY', 'WINDFALL MONEY GO ENTER PROJECT, DEM TALK'],
          archive: 'Spent an oil windfall on power and security projects.', sig: 2,
        }],
      },
      {
        id: 'share', label: 'Share it',
        outcomes: [{
          result: 'The committee meets and shares. The meeting lasts under an hour.',
          fx: [['bloc.party', 8], ['bloc.street', 2], ['approval', 1], ['bloc.establishment', -4]],
          news: ['FEDERATION ACCOUNT SHARES ₦900BN WINDFALL', 'DEM DON SHARE THE MONEY. E REACH YOU?'],
          archive: 'Shared an oil windfall with the states.',
        }],
      },
    ],
  },
  {
    id: 'court.injunction', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2,
    when: { turn: [10] }, weight: 6, cooldown: 30, max: 2,
    office: 'Office of the Attorney General of the Federation', stamp: 'URGENT',
    title: 'A court has suspended your executive order',
    body: [
      'A Federal High Court has granted an interim injunction suspending your executive order on procurement transparency, on the application of a contractors\' association.',
      'The Attorney General considers the ruling weak and expects to win on appeal in four to six months.',
      'Several ministries have asked whether the order still applies in the meantime.',
    ],
    reads: [
      { role: 'sap', good: 'Half the cabinet hopes you ignore it and the other half hopes you obey it, {SIR}. Both for the wrong reasons.' },
    ],
    choices: [
      {
        id: 'obey', label: 'Comply, and appeal',
        outcomes: [{
          result: 'The order is suspended pending appeal. You win in the Court of Appeal five months later, and the order returns with the court\'s authority behind it.',
          fx: [['nation.integrity', 2], ['bloc.establishment', 2]],
          later: [{ after: [5, 6], fx: [['nation.integrity', 2], ['nation.capacity', 1.5]], label: 'The Court of Appeal restores the procurement order.', note: ['APPEAL COURT UPHOLDS PRESIDENT\'S PROCUREMENT ORDER', 'COURT SAY PRESIDENT DEY RIGHT'] }],
          news: ['FG TO APPEAL INJUNCTION, WILL COMPLY MEANWHILE', 'PRESIDENT OBEY COURT ORDER. YES, YOU READ AM WELL'],
          archive: 'Obeyed a court injunction against an executive order and appealed.', sig: 2,
        }],
      },
      {
        id: 'ignore', label: 'Direct ministries to continue applying the order',
        outcomes: [{
          result: 'The order stays in force. The Bar Association issues a statement. A precedent has been set, and it is yours.',
          fx: [['nation.integrity', -4], ['bloc.press', -4], ['bloc.establishment', -3], ['nation.capacity', 1]],
          flags: { 'court.ignored': true },
          news: ['FG CONTINUES POLICY DESPITE COURT ORDER', 'GOVERNMENT NO SEND COURT'],
          archive: 'Ignored a court order.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'lender.offer', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3,
    when: { all: [{ turn: [12] }, { v: ['nation.debt', '>', 70] }, { not: { flag: 'lender.programme' } }] }, weight: 9,
    office: 'Federal Ministry of Finance', stamp: 'CONFIDENTIAL',
    title: 'A facility is on offer',
    body: [
      'A multilateral lender has offered a $3bn facility at concessional rates.',
      'The conditions: publish the national oil company\'s audited accounts, unify the tax identification system, and end the practice of borrowing from the central bank.',
      'None of the conditions is unreasonable. Each of them has an owner inside your government.',
    ],
    reads: [
      { role: 'fin', good: 'These are things we should do anyway and cannot get done, {SIR}. A condition is sometimes a favour.', weak: 'We do not need to be lectured, {SIR}.' },
      { role: 'sap', good: 'The opposition will say you have sold the country. They said it about the last three Presidents and all three took the money.' },
    ],
    choices: [
      {
        id: 'accept', label: 'Accept the facility and its conditions', pc: 8, sign: true,
        outcomes: [{
          result: 'The facility is signed. The oil company\'s accounts are published for the first time in a decade. They are instructive.',
          fx: [['nation.debt', -6], ['nation.capacity', 3], ['nation.integrity', 3], ['bloc.establishment', 6], ['bloc.party', -4], ['bloc.street', -2]],
          flags: { 'lender.facility': true },
          later: [{ after: [8, 12], fx: [['nation.fiscalSpace', 0.4]], label: 'A unified tax identification system raises collection.', note: ['TAX COLLECTION UP 22% AFTER ID UNIFICATION', 'TAX PEOPLE DON SABI EVERYBODY NOW'] }],
          news: ['FG SIGNS $3BN CONCESSIONAL FACILITY', 'WE DON BORROW AGAIN. THIS ONE GET CONDITION'],
          archive: 'Accepted a concessional facility with governance conditions.', sig: 2,
        }],
      },
      {
        id: 'reject', label: 'Decline: "Nigeria will not be dictated to"',
        outcomes: [{
          result: 'The statement is popular for a week. The alternative financing is found at nearly three times the interest.',
          fx: [['approval', 1.5], ['bloc.street', 2], ['nation.debt', 4], ['bloc.establishment', -5]],
          news: ['FG REJECTS LENDER\'S CONDITIONS', 'PRESIDENT TELL LENDER: CARRY YOUR CONDITION GO'],
          archive: 'Rejected a concessional facility and borrowed commercially instead.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'tariff.power', kind: 'standalone', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 3,
    when: { all: [{ turn: [11] }, { v: ['agenda.p3', '==', 0] }] }, weight: 9,
    office: 'Electricity Regulatory Commission', stamp: 'CONFIDENTIAL',
    title: 'Proposal for a cost-reflective tariff',
    body: [
      'The regulator proposes to raise the tariff for the 15% of customers who receive twenty hours of supply a day. Everyone else is unaffected.',
      'At the present tariff, every unit of electricity is sold for less than it costs to generate. The gap is why the plants are not paid and why they do not run.',
      'The customers affected are the most vocal in the country.',
    ],
    statement: 'The adjustment affects only a negligible proportion of consumers and is in the overall interest of the sector.',
    trace: [['nation.power', -1]],
    reads: [
      { role: 'power', good: 'Without this the sector cannot pay for its own gas, {SIR}. With it, supply improves within a year for everyone, including those not paying more.', weak: 'It is a technical matter for the regulator, {SIR}.' },
      { role: 'sap', good: 'The 15% includes every newspaper editor and every senator. Expect noise out of proportion to the numbers.' },
    ],
    choices: [
      {
        id: 'approve', label: 'Let the regulator proceed', pc: 8,
        outcomes: [{
          result: 'The tariff takes effect. Outrage is immediate, concentrated, and articulate.',
          fx: [['bloc.press', -5], ['approval', -2], ['bloc.establishment', 3], ['nation.fiscalSpace', 0.2]],
          later: [{ after: [9, 12], fx: [['nation.power', 8], ['approval', 2]], label: 'A solvent power sector begins to deliver more electricity.', note: ['POWER GENERATION HITS RECORD 6,200MW', 'LIGHT DON STEADY SMALL. WHO GO BELIEVE?'] }],
          news: ['REGULATOR APPROVES TARIFF RISE FOR BAND A CUSTOMERS', 'LIGHT BILL DON TRIPLE FOR SOME PEOPLE'],
          archive: 'Allowed a cost-reflective electricity tariff.', sig: 3,
        }],
      },
      {
        id: 'subsidise', label: 'Keep the tariff and pay the gap from the budget', naira: 0.4,
        outcomes: [{
          result: 'The tariff holds. The gap is paid for one year. The proposal will be back.',
          fx: [['approval', 1], ['bloc.establishment', -3]],
          news: ['FG TO ABSORB ELECTRICITY SHORTFALL', 'LIGHT BILL NO GO CHANGE — FOR NOW'],
          archive: 'Kept the electricity tariff below cost and paid the difference.',
        }],
      },
      {
        id: 'suspend', label: 'Direct the regulator to suspend the proposal',
        outcomes: [{
          result: 'The regulator, which is independent by law, suspends the proposal "following consultations". The gas suppliers reduce supply the following month.',
          fx: [['approval', 1], ['nation.power', -3], ['nation.integrity', -1.5], ['bloc.establishment', -4]],
          news: ['TARIFF REVIEW SUSPENDED AFTER PRESIDENTIAL INTERVENTION', 'NO NEW TARIFF. NO NEW LIGHT EITHER'],
          archive: 'Directed the independent regulator to suspend a tariff review.',
        }],
      },
    ],
  },
  {
    id: 'downgrade', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 2,
    when: { all: [{ turn: [16] }, { v: ['nation.debt', '>', 78] }] }, weight: 9,
    office: 'Debt Management Office', stamp: 'ROUTINE',
    title: 'Sovereign rating downgraded',
    body: [
      'A ratings agency has downgraded Nigeria by one notch, citing debt service costs and "limited policy credibility".',
      '{INFO} has prepared a statement describing the agency as "ill-informed and possibly mischievous".',
    ],
    trace: [['nation.debt', 1]],
    reads: [{ role: 'fin', good: 'They are not wrong, {SIR}, and attacking them costs us another half point on the next bond.', weak: 'These agencies do not understand Africa, {SIR}.' }],
    choices: [
      {
        id: 'plan', label: 'Respond with a published debt reduction plan', pc: 5,
        outcomes: [{
          result: 'A plan with dates and numbers is published. The agency moves its outlook from negative to stable.',
          fx: [['bloc.establishment', 6], ['nation.debt', -2], ['nation.capacity', 1]],
          news: ['FG PUBLISHES DEBT REDUCTION PLAN AFTER DOWNGRADE', 'GOVERNMENT GET PLAN TO PAY DEBT. WE GO SEE'],
          archive: 'Answered a rating downgrade with a debt reduction plan.',
        }],
      },
      {
        id: 'attack', label: 'Issue the Minister\'s statement',
        outcomes: [{
          result: 'The statement is issued. A second agency downgrades the following week and quotes it.',
          fx: [['bloc.establishment', -6], ['nation.debt', 2], ['approval', 0.5]],
          later: [{ after: [4, 6], fx: [['nation.debt', 2.5]], label: 'Borrowing costs rise after the downgrade.' }],
          news: ['FG FAULTS RATINGS AGENCY OVER DOWNGRADE', 'MINISTER: RATING PEOPLE "MISCHIEVOUS"'],
          archive: 'Attacked a ratings agency after a downgrade.',
        }],
      },
    ],
  },
];
