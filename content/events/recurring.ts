import type { GameEvent } from '../../engine/types';

// Recurring crises, economic files and the grave events. Grave events follow
// GDD 5.6: no jokes in the body, options or results; the only irony permitted
// is an official statement quoted and left to stand.

export const RECURRING: GameEvent[] = [
  {
    id: 'grid.collapse', kind: 'recurring', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 2,
    // Not while the great blackout (the shock) is under way: that is the same grid, already down.
    when: { all: [{ turn: [3] }, { v: ['nation.power', '<', 50] }, { v: ['agenda.p2', '==', 0] }, { v: ['shock.blackout', '!=', 1] }] }, weight: 10, weightInv: 'nation.power', cooldown: 18, max: 3,
    office: 'Federal Ministry of Power', stamp: 'URGENT',
    title: 'The national grid has collapsed',
    body: [
      'The national grid collapsed at 11:47 this morning. Generation fell from 4,100MW to 42MW in under a minute.',
      { when: { v: ['debt.gas', '>', 0.6] }, text: 'Half the gas plants were already idle: the suppliers are owed again and have cut deliveries. The grid was running with nothing in reserve.' },
      { when: { v: ['agenda.p1', '==', 1] }, text: 'Generation was not the cause. The plants put back on gas were running at full output when a forty-year-old transmission line failed and took the system with it. More power on the same wires makes this more likely, not less.' },
      { when: { v: ['count.grid.collapse', '>=', 2] }, text: 'This is the latest of several collapses under this administration. The Ministry\'s statement is the same statement, with the date changed.' },
      'The transmission company attributes the incident to "a system disturbance". It has attributed the last nine incidents to a system disturbance.',
      { when: { v: ['comp.min_power', '>=', 4] }, text: '{POWERMIN} had the six worst corridors identified before the frequency recovered, and has costed their replacement.' },
      { when: { v: ['fund.infra', '>=', 0.25] }, text: 'The Infrastructure Fund could pay for reinforcement today, without a supplementary budget.' },
      { when: { v: ['venture.nuclear', '==', 1] }, text: 'The nuclear station rode through on its own protection and was first back on the grid. The lines it feeds were not built to carry what it makes.' },
      { when: { v: ['venture.export_power', '==', 1] }, text: 'The interconnectors tripped with the grid. Three neighbouring countries went dark with this one, and their utilities have written to ask what the contracts say about it.' },
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
        id: 'gas', label: 'Pay the gas suppliers everything they are owed',
        requires: { v: ['debt.gas', '>', 0.2] },
        outcomes: [{
          result: 'The suppliers are paid. Generation rises within weeks, because the plants had been idle for want of gas, not for want of plants.',
          fx: [['bloc.establishment', 3]],
          ops: [['paydebt', 'gas', 1]],
          later: [{ after: [3, 5], fx: [['nation.power', 2], ['approval', 1.5]], label: 'Idle gas plants return to service.' }],
          news: ['FG SETTLES ₦500BN GAS DEBT TO POWER SECTOR', 'GOVERNMENT PAY GAS DEBT. LIGHT DON IMPROVE'],
          archive: 'Cleared the power sector\'s debt to gas suppliers.', sig: 2,
        }],
      },
      {
        id: 'probe', label: 'Direct the Minister to investigate the remote and immediate causes',
        outcomes: [{
          result: 'A panel is constituted. Supply is restored in thirty-one hours. The panel\'s report is awaited.',
          fx: [['approval', -1.5], ['bloc.street', -2], ['nation.power', -1.5], ['counter.committees', 1]],
          ops: [['mark', 'min_power', -1, 'Answered a grid collapse with a panel']],
          news: ['MINISTER ORDERS PROBE OF GRID COLLAPSE', 'GRID COLLAPSE: ANOTHER PANEL. NO LIGHT'],
          archive: 'Ordered an investigation into a grid collapse.',
        }],
      },
      {
        id: 'fund', label: 'Reinforce the weakest lines from the Infrastructure Fund',
        requires: { v: ['fund.infra', '>=', 0.25] },
        outcomes: [{
          result: 'Supply is restored in nineteen hours. The contractors are mobilised within the week, because for once the money is already there and already theirs. It is still a patch: only rebuilding the corridors ends this.',
          fx: [['fund.infra', -0.23], ['nation.power', 3]],
          later: [{ after: [5, 7], fx: [['nation.power', 5], ['approval', 1]], label: 'Reinforced transmission lines come into service.', note: ['GRID STABILITY IMPROVES AS SIX CORRIDORS ARE REINFORCED', 'LIGHT NO DEY TRIP LIKE BEFORE'] }],
          news: ['GRID RESTORED; INFRASTRUCTURE FUND PAYS FOR REINFORCEMENT', 'NEPA TAKE LIGHT FOR WHOLE NIGERIA. AGAIN'],
          archive: 'Paid for emergency grid reinforcement from the Infrastructure Fund.',
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
      { when: { v: ['tycoon.ty_fuel', '<', 40] }, text: 'Chief Tonye Amangala\'s depots, which hold a third of the country\'s petrol, are among those reporting no stock.' },
      { when: { v: ['tycoon.ty_fuel', '>=', 60] }, text: 'Chief Tonye Amangala has kept his own depots supplied at a loss, and has mentioned it.' },
      { when: { flag: 'reserve.empty' }, text: 'The strategic reserve is empty. It was released in an earlier scarcity and has not been refilled, so it cannot cushion this one.' },
      { when: { v: ['count.petrol.scarcity', '>=', 2] }, text: 'This is not the first scarcity under this government. Whatever ended the last one did not change the regulated price, and the regulated price is what empties the depots.' },
      { when: { v: ['refineries', '>=', 1] }, text: 'The revived refineries are producing. Imports are a third lower than they were, so this scarcity is about the regulated price, not about supply.' },
      { when: { v: ['venture.cng', '==', 1] }, text: 'On the gas routes, buses and tricycles are running as usual. The queues are for cars.' },
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
          fx: [['pressure.fuelSupplyStress', -30], ['approval', 1], ['tycoon.ty_fuel', 8]],
          news: ['FG PAYS MARKETERS; QUEUES EASE', 'FUEL DON SHOW. QUEUE DON REDUCE'],
          archive: 'Paid fuel marketers\' subsidy claims to end a scarcity.',
        }],
      },
      {
        id: 'reserve', label: 'Release the strategic reserve',
        requires: { not: { flag: 'reserve.empty' } }, locked: 'The reserve is empty. It was released in an earlier scarcity and has not been refilled.',
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
        id: 'refill', label: 'Pay the marketers, and refill the strategic reserve in the same contract', naira: 0.7,
        requires: { flag: 'reserve.empty' },
        outcomes: [{
          result: 'The claims are paid on condition that the first cargoes go into the state depots. The queues clear in a fortnight, and for the first time since it was emptied the reserve holds thirty days of petrol.',
          fx: [['pressure.fuelSupplyStress', -34], ['approval', 1], ['tycoon.ty_fuel', 6], ['bloc.establishment', 2]],
          flags: { 'reserve.empty': false },
          news: ['FG PAYS MARKETERS, REFILLS STRATEGIC FUEL RESERVE', 'QUEUE DON CLEAR, AND RESERVE DON FULL AGAIN'],
          archive: 'Paid the fuel marketers and refilled the strategic reserve.',
        }],
      },
      {
        id: 'taskforce', label: 'Deploy a task force against hoarders',
        outcomes: [{
          result: 'Eleven filling stations are sealed on television. The queues at the remaining stations are longer by eleven stations\' worth.',
          fx: [['approval', -2], ['bloc.street', -3], ['pressure.fuelSupplyStress', 5], ['tycoon.ty_fuel', -6]],
          news: ['TASK FORCE SEALS STATIONS OVER HOARDING', 'TASK FORCE SEAL STATION. QUEUE LONG PASS BEFORE'],
          archive: 'Sent a task force against fuel hoarders.',
        }],
      },
      {
        id: 'favour', label: 'Tell Chief Amangala it is time he paid what he owes',
        requires: { v: ['favour.ty_fuel', '>', 0] },
        outcomes: [{
          result: 'One telephone call. His tankers load that night at the regulated price, and the queues are gone in a week. He considers the two of you even.',
          fx: [['pressure.fuelSupplyStress', -32], ['approval', 1.5], ['tycoon.ty_fuel', -5]],
          ops: [['void', 'ty_fuel']],
          news: ['MARKETERS FLOOD DEPOTS; QUEUES VANISH', 'FUEL DON SHOW OVERNIGHT. WHO CALL WHO?'],
          archive: 'Called in a favour from Chief Amangala to end a fuel scarcity.',
        }],
      },
    ],
  },
  {
    id: 'flood', kind: 'recurring', slot: 'lead', category: 'security', tone: 'grave', intensity: 4,
    // One flood story with one defence state: not once the defences reform (w4) is delivered or committed to
    // here, and not after the great flood (the shock `flood`), which takes this family over.
    when: { all: [{ month: [8, 9, 10] }, { turn: [3] }, { not: { flag: 'flood.defences' } }, { v: ['agenda.w4', '==', 0] }, { never: 'shock.flood' }] }, weight: 14, cooldown: 32, max: 3,
    office: 'National Emergency Management Agency', stamp: 'URGENT',
    title: 'Flooding along the Niger and Benue',
    body: [
      'Flood water has displaced 410,000 people across nine states. 68 deaths are confirmed. Farmland along both rivers is under water three weeks before harvest.',
      'The Agency issued a seasonal warning in March naming these states. Relief materials have been pre-positioned in two of the nine.',
      'Governors are requesting federal intervention.',
      { when: { v: ['count.flood', '>=', 2] }, text: 'This is the same flood, in the same places, as the last one. The engineering answer has been known for thirty years: dredge the rivers, build the buffer dam, raise the embankments. It has never been funded.' },
      { when: { v: ['fund.infra', '>=', 1.2] }, text: 'The Infrastructure Fund holds enough to pay for permanent defences without borrowing.' },
      { when: { v: ['person.gov_nc', '<', 42] }, text: 'Governor Terver Nyitse, whose state is worst hit, has told reporters that he has stopped expecting anything from Abuja.' },
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
          fx: [['approval', 2], ['bloc.street', 3], ['zone.NC.approval', 3], ['person.gov_nc', 4]],
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
          fx: [['approval', -1], ['nation.integrity', -1], ['person.gov_nc', 6]],
          ops: [['governors', 1]],
          later: [{ after: [5, 8], fx: [['nation.inflation', 2]], label: 'Lost harvests along the rivers push up food prices.' }],
          news: ['FG RELEASES FLOOD RELIEF TO STATES', 'FLOOD RELIEF: VICTIMS SAY THEY HAVE SEEN NOTHING'],
          archive: 'Released flood relief through the state governments.',
        }],
      },
      {
        id: 'verify', label: 'Await verification of the figures',
        outcomes: [{
          result: 'An assessment team is dispatched. It reports in three weeks. Cholera is confirmed in two camps before it does.',
          fx: [['approval', -4], ['bloc.street', -5], ['bloc.press', -5], ['zone.NC.approval', -5], ['person.gov_nc', -8], ['theatre.NC', 2]],
          later: [{ after: [5, 8], fx: [['nation.inflation', 2.5]], label: 'Lost harvests along the rivers push up food prices.' }],
          news: ['FG ASSESSMENT TEAM TO VERIFY FLOOD DAMAGE', 'CHOLERA IN FLOOD CAMPS AS ABUJA "VERIFIES"'],
          archive: 'Delayed flood relief pending verification.', sig: 2,
        }],
      },
      {
        id: 'defences_fund', label: 'Relief now, and permanent defences paid for from the Infrastructure Fund', pc: 5, sign: true,
        requires: { v: ['fund.infra', '>=', 1.2] },
        outcomes: [{
          result: 'Relief goes out this week. The dredging contract is signed this month and paid from money already set aside. Nothing is borrowed.',
          fx: [['fund.infra', -1.2], ['approval', 3], ['bloc.street', 3], ['zone.NC.approval', 5], ['person.gov_nc', 8]],
          flags: { 'flood.defences': true },
          later: [{ after: [14, 18], fx: [['bonus.inflation', -1], ['approval', 2], ['zone.NC.approval', 4]], label: 'The rivers rise and the new defences hold.', note: ['RIVERS RISE, DEFENCES HOLD: NO FLOOD DEATHS THIS YEAR', 'RAIN FALL, WATER NO ENTER HOUSE. THANK GOD'] }],
          news: ['INFRASTRUCTURE FUND TO PAY FOR NIGER–BENUE FLOOD DEFENCES', 'PRESIDENT SAY THIS FLOOD GO BE THE LAST'],
          archive: 'Committed to permanent flood defences, paid for from the Infrastructure Fund.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'attack.farms', kind: 'recurring', slot: 'lead', category: 'security', tone: 'grave', intensity: 4,
    when: { all: [{ turn: [4] }, { v: ['theatre.NC', '>=', 56] }] }, weight: 9, weightBy: 'theatre.NC', cooldown: 22, max: 3,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'Attack on farming communities',
    body: [
      { when: { v: ['agenda.s2', '==', 0] }, text: 'Armed men attacked four farming communities overnight. 47 people are confirmed dead. Several thousand have fled to the local government headquarters.' },
      { when: { v: ['agenda.s2', '==', 0] }, text: 'The nearest military unit is 90 minutes away by road. Distress calls were logged three hours before it moved.' },
      { when: { v: ['agenda.s2', '==', 1] }, text: 'Armed men attacked two farming communities overnight. Nine people are confirmed dead. Troops from the nearest forward base were on the scene in twenty minutes and drove the attackers off before they reached a third village.' },
      { when: { v: ['agenda.s2', '==', 1] }, text: 'The base held. It cannot be everywhere, and the men who did this know where it is.' },
      { when: { v: ['focus.NC', '==', 1] }, text: 'This happened in the theatre where you have concentrated the security effort.' },
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
          fx: [['theatre.NC', -4], ['approval', 1.5], ['zone.NC.approval', 4], ['bloc.establishment', -3], ['nation.capacity', 1], ['person.gov_nc', 5]],
          later: [{ after: [3, 4], fx: [['theatre.NC', -2]], label: 'The fuel supply the inquiry found broken is restored to the forward units in the North Central.' }],
          news: ['PRESIDENT VISITS ATTACKED COMMUNITIES, ORDERS INQUIRY', 'PRESIDENT REACH THE VILLAGE. TWO COMMANDERS REMOVED'],
          archive: 'Visited attacked communities and ordered an inquiry into the military response.', sig: 2,
        }],
      },
      {
        id: 'deploy', label: 'Approve a new forward operating base', naira: 0.25,
        requires: { v: ['agenda.s2', '==', 0] },
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
          fx: [['approval', -3], ['zone.NC.approval', -5], ['bloc.press', -3], ['theatre.NC', 4], ['person.gov_nc', -6]],
          news: ['PRESIDENT CONDEMNS ATTACK, VOWS JUSTICE', '47 DEAD. ABUJA SENDS A PRESS RELEASE'],
          archive: 'Responded to a mass killing with a statement.',
        }],
      },
      {
        id: 'focus', label: 'Move the weight of the security effort to the farm belt',
        requires: { v: ['focus.NC', '==', 0] },
        outcomes: [{
          result: 'Battalions and aircraft are redeployed to the farm belt within the month. Whatever theatre they left will feel it.',
          fx: [['theatre.NC', -3], ['zone.NC.approval', 3], ['person.gov_nc', 4]],
          ops: [['focus', 'NC']],
          news: ['FORCES REDEPLOYED TO FARM BELT AFTER ATTACKS', 'ARMY DON MOVE GO PROTECT FARMERS'],
          archive: 'Concentrated the security effort on the farm belt after a mass killing.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'abduction', kind: 'standalone', slot: 'lead', category: 'security', tone: 'grave', intensity: 5,
    when: { all: [{ turn: [10] }, { v: ['theatre.NW', '>=', 62] }] }, weight: 7,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'Abduction of schoolchildren',
    body: [
      '112 pupils were taken from a boarding school in the North West in the early hours of the morning.',
      'The abductors have made contact with a parent. They are demanding ₦1bn.',
      'The state government closed its boarding schools last year after a previous incident and reopened them in September.',
      { when: { v: ['focus.NW', '==', 1] }, text: 'The forces you concentrated in the North West are close. A rescue would start from forty minutes away, not four hours.' },
      { when: { v: ['person.gov_nw', '<', 42] }, text: 'Governor Sani Batagarawa says he was not told the school had been reopened. His own commissioner reopened it.' },
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
          result: 'After 26 days all but three of the children are released. No ransom is acknowledged. The three are still missing, and the intermediaries are still talking.',
          fx: [['approval', 1], ['zone.NW.approval', 3], ['nation.security', -2], ['nation.integrity', -1]],
          later: [{ after: [4, 6], fx: [['zone.NW.approval', 1], ['theatre.NW', 1]], label: 'Two of the three missing children are returned through the same intermediaries. The third has not been found, and the gang has learned what children are worth.' }],
          news: ['109 ABDUCTED PUPILS REGAIN FREEDOM', '109 CHILDREN ARE HOME. THREE ARE NOT'],
          archive: 'Authorised negotiation for abducted schoolchildren. 109 of 112 returned.', sig: 3,
        }],
      },
      {
        id: 'rescue', label: 'Authorise a rescue operation', pc: 6,
        outcomes: [
          {
            when: { v: ['focus.NW', '==', 1] }, chance: 0.92,
            result: 'The operation is mounted from close by, before the camp can be moved. 110 children are recovered. Two soldiers are killed.',
            fx: [['approval', 4], ['zone.NW.approval', 6], ['theatre.NW', -5], ['bloc.establishment', 3], ['person.gov_nw', 5]],
            news: ['TROOPS RESCUE 110 ABDUCTED PUPILS', '110 CHILDREN RESCUED. TWO SOLDIERS DIE'],
            archive: 'Authorised a rescue of abducted schoolchildren from forces already in the theatre. 110 of 112 recovered.', sig: 3,
          },
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
          fx: [['nation.integrity', 4], ['nation.capacity', 1.5], ['bloc.party', -5], ['approval', 2], ['bloc.press', 4], ['person.gov_sw', -6]],
          ops: [['charge', 'The developer of the collapsed building and four officials', 'unsealing and building on a condemned site', 0]],
          news: ['DEVELOPER, FOUR OFFICIALS CHARGED OVER COLLAPSE', 'FOR ONCE, SOMEBODY GO ANSWER'],
          archive: 'Prosecuted a party donor and officials over a fatal building collapse.', sig: 3,
        }],
      },
      {
        id: 'panel', label: 'Constitute a panel of inquiry: it reports in five months',
        outcomes: [{
          result: 'The panel sits for five months. It buys time, and the anger has somewhere to go while it sits; nobody is charged meanwhile.',
          fx: [['nation.integrity', -1.5], ['bloc.press', -3], ['counter.committees', 1]],
          later: [{ after: [5, 5], fx: [['nation.capacity', 0.5]], label: 'The building-collapse panel reports: the permit office is reorganised. Nobody is charged.' }],
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
      { when: { v: ['tycoon.ty_media', '<', 38] }, text: 'The Daily Stakeholder has the screenshot too, with the minister\'s name and the names of everyone who reacted with a laughing face.' },
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
    id: 'court.injunction', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2,
    // Only when there is something of yours to suspend: the open contracting rules (c1) are in force.
    when: { all: [{ turn: [10] }, { v: ['agenda.c1', '==', 1] }] }, weight: 6, max: 1,
    office: 'Office of the Attorney General of the Federation', stamp: 'URGENT',
    title: 'A court has suspended the open contracting rules',
    body: [
      'A Federal High Court has granted an interim injunction suspending the open contracting rules your government put in force, on the application of a contractors\' association.',
      'The Attorney General considers the ruling weak and expects to win on appeal in four to six months.',
      'Several ministries have asked whether the order still applies in the meantime.',
      { when: { v: ['debt.contractors', '>', 1] }, text: 'The same association is owed more than a trillion naira by the government. It says so in the second paragraph of its affidavit.' },
      { when: { v: ['rival.alt', '>', 42] }, text: 'Its lawyers were briefed by Dr Malumfashi\'s party.' },
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
          later: [{ after: [5, 6], fx: [['nation.integrity', 2], ['nation.capacity', 1.5]], label: 'The Court of Appeal restores the open contracting rules.', note: ['APPEAL COURT RESTORES OPEN CONTRACTING RULES', 'COURT SAY PRESIDENT DEY RIGHT'] }],
          news: ['FG TO APPEAL INJUNCTION, WILL COMPLY MEANWHILE', 'PRESIDENT OBEY COURT ORDER. YES, YOU READ AM WELL'],
          archive: 'Obeyed a court injunction against the open contracting rules and appealed.', sig: 2,
        }],
      },
      {
        id: 'ignore', label: 'Direct ministries to continue applying the order',
        outcomes: [{
          result: 'The order stays in force. The Bar Association issues a statement. A precedent has been set, and it is yours.',
          fx: [['nation.integrity', -4], ['bloc.press', -4], ['bloc.establishment', -3], ['nation.capacity', 1], ['rival.alt', 4]],
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
      { when: { all: [{ v: ['agenda.t1', '==', 1] }, { v: ['agenda.t2', '==', 1] }] }, text: 'Two of the three conditions are already met. What remains is the central bank.' },
      { when: { v: ['debt.ways', '>', 5] }, text: 'The overdraft at the central bank stands above ₦5tn. The third condition is the one that would bite.' },
    ],
    reads: [
      { role: 'fin', good: 'These are things we should do anyway and cannot get done, {SIR}. A condition is sometimes a favour.', weak: 'We do not need to be lectured, {SIR}.' },
      { role: 'sap', good: 'The opposition will say you have sold the country. They said it about the last three Presidents and all three took the money.' },
    ],
    choices: [
      {
        id: 'accept', label: 'Accept the facility and its conditions', pc: 8, sign: true,
        outcomes: [{
          result: 'The facility is signed: ₦1.5tn in cash, cheap money to replace dear, and an undertaking never again to borrow from the central bank. The oil company\'s accounts are published for the first time in a decade. They are instructive.',
          fx: [['nation.fiscalSpace', 1.5], ['debt.bonds', -1.5], ['debt.lender', 3], ['nation.capacity', 3], ['nation.integrity', 3], ['bloc.establishment', 6], ['bloc.party', -4], ['bloc.street', -2], ['tycoon.ty_bank', 6], ['tycoon.ty_fuel', -6]],
          flags: { 'lender.facility': true, 'print.renounced': true },
          later: [{ after: [8, 12], fx: [['nation.fiscalSpace', 0.4]], label: 'A unified tax identification system raises collection.', note: ['TAX COLLECTION UP 22% AFTER ID UNIFICATION', 'TAX PEOPLE DON SABI EVERYBODY NOW'] }],
          news: ['FG SIGNS $3BN CONCESSIONAL FACILITY', 'WE DON BORROW AGAIN. THIS ONE GET CONDITION'],
          archive: 'Accepted a concessional facility with governance conditions.', sig: 2,
        }],
      },
      {
        id: 'reject', label: 'Decline: "Nigeria will not be dictated to"',
        outcomes: [{
          result: 'The statement is popular for a week. The alternative financing is found at nearly three times the interest.',
          fx: [['approval', 1.5], ['bloc.street', 2], ['debt.eurobond', 1], ['nation.fiscalSpace', 1], ['bloc.establishment', -5], ['tycoon.ty_bank', -5]],
          news: ['FG REJECTS LENDER\'S CONDITIONS', 'PRESIDENT TELL LENDER: CARRY YOUR CONDITION GO'],
          archive: 'Rejected a concessional facility and borrowed commercially instead.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'tariff.power', kind: 'standalone', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 3,
    when: { all: [{ turn: [11] }, { v: ['agenda.p3', '==', 0] }, { v: ['active.p3', '==', 0] }] }, weight: 9,
    office: 'Electricity Regulatory Commission', stamp: 'CONFIDENTIAL',
    title: 'Proposal for a cost-reflective tariff',
    body: [
      'The regulator proposes to raise the tariff for the 15% of customers who receive twenty hours of supply a day. Everyone else is unaffected.',
      'At the present tariff, every unit of electricity is sold for less than it costs to generate. The gap is why the plants are not paid and why they do not run.',
      'The customers affected are the most vocal in the country.',
      'This is the tariff reform on the power agenda, arriving by another door. Until it is done, the debt to the gas suppliers builds every month however often it is paid.',
      { when: { v: ['debt.gas', '>', 0.5] }, text: 'The gas suppliers are owed again. They have been told that the tariff will settle it. They have been told that before.' },
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
          fx: [['bloc.press', -5], ['approval', -2], ['bloc.establishment', 3], ['nation.fiscalSpace', 0.2], ['tycoon.ty_maker', -6], ['bonus.power', 0.05]],
          ops: [['deliver', 'p3']],
          later: [{ after: [9, 12], fx: [['nation.power', 8], ['approval', 2]], label: 'A solvent power sector begins to deliver more electricity.', note: ['POWER GENERATION HITS RECORD 6,200MW', 'LIGHT DON STEADY SMALL. WHO GO BELIEVE?'] }],
          news: ['REGULATOR APPROVES TARIFF RISE FOR BAND A CUSTOMERS', 'LIGHT BILL DON TRIPLE FOR SOME PEOPLE'],
          archive: 'Allowed a cost-reflective electricity tariff.', sig: 3,
        }],
      },
      {
        id: 'subsidise', label: 'Keep the tariff and pay the gap from the budget', naira: 0.4,
        outcomes: [{
          result: 'The tariff holds. The gap is paid for one year. The proposal will be back.',
          fx: [['approval', 1], ['bloc.establishment', -3], ['debt.gas', -0.4]],
          news: ['FG TO ABSORB ELECTRICITY SHORTFALL', 'LIGHT BILL NO GO CHANGE — FOR NOW'],
          archive: 'Kept the electricity tariff below cost and paid the difference.',
        }],
      },
      {
        id: 'suspend', label: 'Direct the regulator to suspend the proposal',
        outcomes: [{
          result: 'The regulator, which is independent by law, suspends the proposal "following consultations". The gas suppliers reduce supply the following month.',
          fx: [['approval', 1], ['nation.power', -3], ['nation.integrity', -1.5], ['bloc.establishment', -4], ['debt.gas', 0.3]],
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
      { when: { v: ['debt.eurobond', '>', 6] }, text: 'The agency singles out the foreign bonds: dollar debt, on a currency that buys fewer dollars each year.' },
    ],
    trace: [['nation.debt', 1]],
    reads: [{ role: 'fin', good: 'They are not wrong, {SIR}, and attacking them costs us another half point on the next bond.', weak: 'These agencies do not understand Africa, {SIR}.' }],
    choices: [
      {
        id: 'plan', label: 'Respond with a published debt reduction plan', pc: 5,
        outcomes: [{
          result: 'A plan with dates and numbers is published. The agency moves its outlook from negative to stable.',
          fx: [['bloc.establishment', 6], ['nation.debt', -2], ['nation.capacity', 1], ['tycoon.ty_bank', 6]],
          news: ['FG PUBLISHES DEBT REDUCTION PLAN AFTER DOWNGRADE', 'GOVERNMENT GET PLAN TO PAY DEBT. WE GO SEE'],
          archive: 'Answered a rating downgrade with a debt reduction plan.',
        }],
      },
      {
        id: 'attack', label: 'Issue the Minister\'s statement',
        outcomes: [{
          result: 'The statement is issued. A second agency downgrades the following week and quotes it.',
          fx: [['bloc.establishment', -6], ['debt.rates', 2], ['approval', 0.5], ['tycoon.ty_bank', -5]],
          later: [{ after: [4, 6], fx: [['debt.rates', 2.5]], label: 'Borrowing costs rise after the downgrade.' }],
          news: ['FG FAULTS RATINGS AGENCY OVER DOWNGRADE', 'MINISTER: RATING PEOPLE "MISCHIEVOUS"'],
          archive: 'Attacked a ratings agency after a downgrade.',
        }],
      },
    ],
  },
];
