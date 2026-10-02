import type { GameEvent } from '../../engine/types';

// Farce and the stranger-than-fiction file (GDD 5.11). Each absurd event is an
// archetype from the public record rebuilt under the transformation rule:
// different institution, amount, animal, place and office. The mechanism stays.
// Every agency accused of anything here is fictional.

export const ABSURD: GameEvent[] = [
  {
    id: 'absurd.goat', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'absurd', intensity: 2,
    when: { turn: [5] }, weight: 9, weightInv: 'nation.integrity',
    office: '{PENSIONS}', stamp: 'ROUTINE',
    title: 'Loss of payment vouchers: report of the Board',
    body: [
      'The {PENSIONS} reports that payment vouchers supporting ₦4.3bn of disbursements cannot be produced for audit.',
      'The Board\'s Director of Finance states that the vouchers were kept in the strong room of the Lokoja zonal office, and that a goat gained access to the strong room over a public holiday and consumed them.',
      'The Director wishes it noted that the goat has since been apprehended.',
      'The Board requests that the matter be treated as closed.',
    ],
    statement: 'The Board has put necessary measures in place to forestall a recurrence, including the fumigation of the strong room.',
    trace: [['nation.integrity', -1]],
    reads: [
      { role: 'sap', good: 'If you accept this, {SIR}, every agency in the country will discover it has livestock.' },
      { role: 'cos', good: 'The Director is the Senate Committee Chairman\'s brother-in-law. I mention it for completeness.' },
    ],
    choices: [
      {
        id: 'accept', label: 'Note the report. The matter is closed.',
        outcomes: [{
          result: 'The file is closed. The goat becomes the most famous animal in the federation. Three other agencies report losses to rodents, a monkey and "weather" within the quarter.',
          fx: [['nation.integrity', -4], ['bloc.press', -4], ['approval', -1.5], ['pressure.scandalHeat', 8]],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['pensions'], trail: 1 },
          news: ['PENSIONS BOARD: VOUCHERS FOR ₦4.3BN "CONSUMED BY GOAT"', 'GOAT CHOP ₦4.3BN! WHICH KIND GOAT BE THAT?'],
          archive: 'Accepted that a goat ate ₦4.3bn of payment vouchers.', sig: 2,
        }],
      },
      {
        id: 'audit', label: 'Order a forensic audit of the Board', pc: 6,
        outcomes: [{
          result: 'The auditors reconstruct the payments from bank records in nine days. ₦3.9bn went to eleven accounts. None belongs to a goat.',
          fx: [['nation.integrity', 4], ['bloc.press', 4], ['bloc.party', -4], ['approval', 1.5], ['nation.fiscalSpace', 0.05]],
          news: ['AUDIT TRACES "GOAT" BILLIONS TO ELEVEN ACCOUNTS', 'THE GOAT GET BANK ACCOUNT? ELEVEN SEF'],
          archive: 'Ordered a forensic audit after a goat was blamed for missing vouchers.', sig: 2,
        }],
      },
      {
        id: 'produce', label: 'Direct that the goat be produced',
        outcomes: [{
          result: 'A goat is produced. It is not established that it is the goat. It is photographed in handcuffs it has plainly not been wearing long. The Board asks whether it should be arraigned.',
          fx: [['bloc.press', -2], ['approval', -1], ['nation.integrity', -1.5]],
          news: ['SUSPECT GOAT PRESENTED AT PENSIONS BOARD HQ', 'SEE THE GOAT! EVEN THE GOAT DEY SHOCK'],
          archive: 'Directed that the goat accused of eating ₦4.3bn be produced.',
        }],
      },
      {
        id: 'committee', label: 'Constitute a committee to visit the strong room',
        outcomes: [{
          result: 'The committee visits the strong room. It confirms that there is a strong room. It recommends a door.',
          fx: [['nation.integrity', -2], ['counter.committees', 1], ['bloc.press', -2]],
          news: ['PANEL INSPECTS STRONG ROOM IN GOAT CASE', 'COMMITTEE GO LOOK THE ROOM WEY GOAT ENTER'],
          archive: 'Sent a committee to inspect the strong room the goat entered.',
        }],
      },
    ],
  },
  {
    id: 'absurd.mace', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'absurd', intensity: 2,
    when: { turn: [7] }, weight: 8,
    office: 'Office of the Clerk of the House of Representatives', stamp: 'URGENT',
    title: 'The mace has left the chamber',
    body: [
      'At 11:20 this morning, during plenary, five men in kaftans entered the House of Representatives, lifted the mace from the table, and walked out with it.',
      'They passed four security checkpoints on the way in and the same four on the way out. Nobody stopped them. They left in a vehicle with a government number plate.',
      'Without the mace the House cannot lawfully sit. {SPEAKER} has adjourned plenary and asked whether the Presidency has a spare.',
      'The mace was found at 6pm under a flyover in the city centre, wrapped in a newspaper.',
    ],
    reads: [
      { role: 'sap', good: 'This was one faction of the House sending a message to the other, {SIR}. Everyone inside knows who. It will be described as hoodlums.' },
    ],
    choices: [
      {
        id: 'probe', label: 'Direct the police to arrest whoever arranged it', pc: 5,
        outcomes: [{
          result: 'The police arrest a suspended member of the House. He is charged, bailed the same day, and returns to plenary the following week to a standing ovation from his faction.',
          fx: [['nation.integrity', 1.5], ['bloc.party', -4], ['bloc.press', 2]],
          news: ['LAWMAKER ARRESTED OVER MACE INVASION', 'DEM ARREST HONOURABLE FOR MACE. E REACH HOUSE NEXT WEEK'],
          archive: 'Ordered arrests after the mace was carried out of the House.',
        }],
      },
      {
        id: 'hoodlums', label: 'Condemn the "invasion by hoodlums"',
        outcomes: [{
          result: 'The Presidency condemns the hoodlums. The hoodlums are not identified. The mace is fitted with a chain.',
          fx: [['bloc.party', 2], ['bloc.press', -2], ['nation.integrity', -1]],
          flags: { 'mace.chained': true },
          news: ['PRESIDENCY CONDEMNS INVASION OF HOUSE BY HOODLUMS', 'MACE NOW GET CHAIN. NA SO WE SEE AM'],
          archive: 'Blamed hoodlums after the mace was carried out of the House.',
        }],
      },
    ],
  },
  {
    id: 'absurd.feeding', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'absurd', intensity: 2,
    when: { turn: [9] }, weight: 8, weightInv: 'nation.integrity',
    office: '{FEEDING}', stamp: 'ROUTINE',
    title: 'Quarterly performance report: school meals',
    body: [
      'The {FEEDING} reports that it served 9.4 million hot meals to pupils each school day in the last quarter, at a cost of ₦52bn.',
      'The last quarter was the long vacation. Schools were closed for eleven of its thirteen weeks.',
      'Asked how the meals reached the pupils, the Agency\'s Coordinator states that they were delivered to the children at home, door to door, and that this was verified by a consultant.',
    ],
    statement: 'The programme recorded 104% coverage in the period under review.',
    trace: [['nation.integrity', -1]],
    reads: [
      { role: 'fin', good: 'Door to door, to nine million homes, daily. The post office cannot do that with letters, {SIR}.', weak: 'A most impressive coverage figure, {SIR}.' },
    ],
    choices: [
      {
        id: 'commend', label: 'Commend the Agency on its coverage',
        outcomes: [{
          result: 'The commendation is issued. The Coordinator requests a larger budget to sustain home delivery during term time as well.',
          fx: [['nation.integrity', -3.5], ['bloc.press', -3], ['pressure.scandalHeat', 6], ['nation.fiscalSpace', -0.05]],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['feeding'], trail: 1 },
          news: ['AGENCY: PUPILS FED "DOOR TO DOOR" DURING HOLIDAYS', 'THEY FEED YOUR PIKIN FOR HOUSE? CHECK YOUR DOOR'],
          archive: 'Commended an agency that reported feeding pupils during the holidays.',
        }],
      },
      {
        id: 'names', label: 'Ask for the delivery register, with addresses', pc: 3,
        outcomes: [{
          result: 'The register arrives in four boxes. It lists 9.4 million pupils. 2.1 million share forty surnames and one handwriting.',
          fx: [['nation.integrity', 3], ['bloc.press', 3], ['nation.fiscalSpace', 0.04], ['nation.capacity', 1]],
          news: ['SCHOOL MEALS REGISTER "WRITTEN IN ONE HAND" — PRESIDENCY', 'ONE PERSON WRITE 2 MILLION NAMES. THE HAND STRONG O'],
          archive: 'Demanded the register behind a holiday school-feeding claim.', sig: 2,
        }],
      },
      {
        id: 'suspend', label: 'Suspend the programme pending review',
        outcomes: [{
          result: 'The programme is suspended. In the minority of schools where meals were real, attendance falls by a fifth.',
          fx: [['nation.integrity', 1], ['bloc.street', -3], ['approval', -1]],
          news: ['FG SUSPENDS SCHOOL MEALS PROGRAMME', 'THE REAL PIKIN WEY DEY CHOP DON LOSE'],
          archive: 'Suspended the school meals programme.',
        }],
      },
    ],
  },
  {
    id: 'absurd.airline', kind: 'standalone', slot: 'lead', category: 'infrastructure', tone: 'absurd', intensity: 2,
    when: { turn: [14] }, weight: 8,
    office: 'Federal Ministry of Aviation', stamp: 'ROUTINE',
    title: 'Unveiling of the national carrier',
    body: [
      'The Honourable Minister of Aviation will tomorrow unveil {AIRLINE}, the new national carrier, at the Abuja airport. {MRP} is invited to cut the ribbon.',
      'The airline has no operating licence, no routes and no aircraft.',
      'The aircraft to be unveiled belongs to another country\'s airline. It was chartered for the day and painted in the national colours overnight. It returns on Thursday to be painted back.',
      'The Ministry describes this as "a phased rollout".',
    ],
    reads: [
      { role: 'sap', good: 'The aviation unions already know whose plane it is, {SIR}. There is a flight-tracking website. A teenager will have it by lunchtime.' },
    ],
    choices: [
      {
        id: 'cut', label: 'Attend and cut the ribbon',
        outcomes: [{
          result: 'You cut the ribbon at 10am. By 10:40 the aircraft\'s registration is trending. By Thursday it is back in its own livery and its own country.',
          fx: [['bloc.press', -5], ['approval', -2], ['nation.integrity', -1.5]],
          later: [{ after: [1, 2], fx: [['approval', -1]], label: 'The "national carrier" aircraft is photographed back in its owner\'s livery.', note: ['NATIONAL CARRIER\'S AIRCRAFT RETURNS TO OWNER', 'OUR "NATIONAL CARRIER" DON GO BACK TO IM REAL OWNER'] }],
          news: ['PRESIDENT UNVEILS NATIONAL CARRIER', 'THEY BORROW PLANE, PAINT AM, CALL AM OUR OWN'],
          archive: 'Unveiled a national carrier using a borrowed, repainted aircraft.', sig: 2,
        }],
      },
      {
        id: 'cancel', label: 'Cancel the ceremony and ask for a business plan', pc: 3,
        outcomes: [{
          result: 'The ceremony is cancelled. The charter fee is not refundable. The Minister tells friends he has been "humiliated".',
          fx: [['nation.integrity', 2], ['bloc.villa', -2], ['bloc.press', 2]],
          news: ['NATIONAL CARRIER LAUNCH POSTPONED INDEFINITELY', 'PRESIDENT STOP THE BORROW-BORROW PLANE'],
          archive: 'Cancelled the unveiling of a national carrier that had no aircraft.',
        }],
      },
      {
        id: 'proxy', label: 'Send the Vice President',
        outcomes: [{
          result: 'The Vice President cuts the ribbon. The Vice President has not spoken to you since.',
          fx: [['bloc.press', -2], ['bloc.villa', -4]],
          news: ['VP UNVEILS NATIONAL CARRIER', 'VP CUT RIBBON FOR BORROWED PLANE. E DON ENTER AM'],
          archive: 'Sent the Vice President to unveil a borrowed aircraft.',
        }],
      },
    ],
  },
  {
    id: 'absurd.clone', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'absurd', intensity: 2,
    when: { turn: [18] }, weight: 7,
    office: 'Office of the Special Adviser, Media and Publicity', stamp: 'URGENT',
    title: 'You are alleged not to be yourself',
    body: [
      'Following your eleven-day working visit abroad, a claim is circulating that the President died during the trip and has been replaced by a double.',
      'The evidence offered is that you appear taller, that your handwriting has changed, and that you waved with the other hand at the airport.',
      'The claim has 40 million views. A traditional ruler has asked, respectfully, for clarification. So has a foreign embassy.',
    ],
    reads: [
      { role: 'sap', good: 'If you deny it, {SIR}, the headline is that the President denies being a clone. If you do not, they say you cannot.' },
      { role: 'info', good: 'We should issue a strong statement, {SIR}.', weak: 'We should issue a strong statement, {SIR}, and perhaps a DNA certificate.' },
    ],
    choices: [
      {
        id: 'deny', label: 'State publicly: "I am myself. I have always been myself."',
        outcomes: [{
          result: 'You say it at a town hall. The clip is broadcast worldwide. It is the first time a Nigerian President has led the international news for something that harmed nobody.',
          fx: [['approval', 0.5], ['bloc.press', -1]],
          news: ['"I AM MYSELF" — PRESIDENT DISMISSES CLONE RUMOUR', 'PRESIDENT SAY E NO BE CLONE. NA WHAT CLONE GO SAY'],
          archive: 'Stated publicly that you are yourself and not a double.', sig: 2,
        }],
      },
      {
        id: 'ignore', label: 'Decline to dignify it',
        outcomes: [{
          result: 'The Presidency says nothing. The claim reaches 90 million views and acquires a song.',
          fx: [['approval', -1], ['bloc.street', -1]],
          later: [{ after: [3, 5], fx: [['approval', -1]], label: 'The body-double rumour acquires a sequel.' }],
          news: ['PRESIDENCY SILENT ON VIRAL RUMOUR', 'WHY PRESIDENT NO WAN TALK? THE THING GET SONG NOW'],
          archive: 'Declined to respond to a rumour that you had been replaced by a double.',
        }],
      },
      {
        id: 'chat', label: 'Hold an unscripted media chat and take every question', pc: 4,
        outcomes: [{
          result: 'You take questions for ninety minutes, including one on the names of your primary school teachers. The rumour ends. Several real questions were also asked.',
          fx: [['bloc.press', 4], ['approval', 1.5]],
          news: ['PRESIDENT FACES PRESS FOR 90 MINUTES', 'CLONE NO FIT KNOW PRIMARY SCHOOL TEACHER NAME. CASE CLOSED'],
          archive: 'Ended a body-double rumour with an unscripted media chat.',
        }],
      },
    ],
  },
  {
    id: 'absurd.statue', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'absurd', intensity: 1,
    when: { turn: [13] }, weight: 7,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'ROUTINE',
    title: 'A statue, and a new ministry',
    body: [
      'A governor of your party has unveiled a nine-metre bronze statue of a visiting foreign president, who is under indictment in his own country. It cost ₦520m. The state owes its pensioners fourteen months.',
      'In the same week the governor swore in a Commissioner for Joy and Destiny Actualisation.',
      'He has invited {MRP} to commission the statue\'s fountain.',
    ],
    reads: [
      { role: 'sap', good: 'He controls the party in three states, {SIR}. He would like a photograph. The pensioners would like fourteen months.' },
    ],
    choices: [
      {
        id: 'attend', label: 'Commission the fountain',
        outcomes: [{
          result: 'You commission the fountain. The Commissioner for Joy reads a poem. The photograph follows you for years.',
          fx: [['bloc.party', 5], ['approval', -2], ['bloc.press', -3]],
          later: [{ after: [4, 7], fx: [['bloc.street', -2], ['bloc.press', -1]], label: 'Unpaid pensioners protest at the statue.', note: ['PENSIONERS PROTEST AT FOREIGN LEADER\'S STATUE', 'PENSIONERS CARRY PLACARD GO THE STATUE WEY PRESIDENT COMMISSION'] }],
          news: ['PRESIDENT COMMISSIONS FOUNTAIN AT STATUE SITE', 'PENSIONERS NEVER COLLECT, BUT STATUE GET FOUNTAIN'],
          archive: 'Commissioned the fountain of a ₦520m statue of a foreign president.',
        }],
      },
      {
        id: 'decline', label: 'Decline, citing your schedule',
        outcomes: [{
          result: 'You are unavoidably absent. The governor notes it.',
          fx: [['bloc.party', -3]],
          news: ['PRESIDENT ABSENT AS GOVERNOR UNVEILS STATUE', 'PRESIDENT DODGE THE STATUE'],
          archive: 'Declined to commission a governor\'s statue.',
        }],
      },
      {
        id: 'pensions', label: 'Decline, and ask publicly about the pensions', pc: 5,
        outcomes: [{
          result: 'You ask. The governor replies that joy is also infrastructure. The pensioners are paid three months within the fortnight.',
          fx: [['bloc.party', -7], ['approval', 2], ['bloc.street', 3], ['bloc.press', 3]],
          news: ['PRESIDENT QUERIES GOVERNOR OVER UNPAID PENSIONS', '"JOY IS INFRASTRUCTURE" — GOVERNOR'],
          archive: 'Publicly asked a governor about unpaid pensions instead of commissioning his statue.',
        }],
      },
    ],
  },

  // ---------------------------------------------------------------- farce

  {
    id: 'farce.wrong_account', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'farce', intensity: 2,
    when: { turn: [4] }, weight: 10,
    office: 'Office of the Special Adviser, Media and Publicity', stamp: 'URGENT', channel: 'phone',
    title: 'A post from the official Presidency account',
    body: [
      'At 23:14 last night the official Presidency account posted: "You people should be grateful."',
      'The post was deleted at 23:19. Screenshots exist.',
      'The account is managed by {AIDE}, Senior Special Assistant on New Media, who is not answering his phone.',
    ],
    reads: [
      { role: 'sap', good: 'He meant to post it from his own account, {SIR}, which tells you what he says on his own account. He is also a governor\'s nephew.' },
    ],
    choices: [
      {
        id: 'fire', label: 'Relieve the aide of his appointment',
        outcomes: [{
          result: 'The aide is relieved. His uncle calls to say he understands completely, in a tone that means he does not.',
          fx: [['approval', 1], ['bloc.party', -3], ['bloc.press', 1]],
          later: [{ after: [6, 10], fx: [['bloc.party', -2]], label: 'The dismissed aide joins the opposition\'s media team.', note: ['SACKED PRESIDENTIAL AIDE JOINS OPPOSITION', '"BE GRATEFUL" GUY DON PORT GO OPPOSITION'] }],
          news: ['PRESIDENT SACKS AIDE OVER "BE GRATEFUL" POST', '"BE GRATEFUL" GUY DON LOSE WORK. WE ARE GRATEFUL'],
          archive: 'Dismissed an aide over a post from the Presidency account.',
        }],
      },
      {
        id: 'apologise', label: 'Apologise in your own name',
        outcomes: [{
          result: 'The apology is short and signed. It is so unusual that it is reported as news in its own right.',
          fx: [['approval', 2], ['bloc.street', 2], ['bloc.press', 3]],
          news: ['PRESIDENT APOLOGISES FOR AIDE\'S POST', 'PRESIDENT SAY SORRY. SCREENSHOT AM, E RARE'],
          archive: 'Apologised personally for an aide\'s post.',
        }],
      },
      {
        id: 'hacked', label: 'State that the account was compromised',
        outcomes: [
          {
            when: { v: ['bloc.press', '>=', 55] },
            result: 'The statement is issued and, on a quiet news day, mostly believed.',
            fx: [['nation.integrity', -0.5]],
            news: ['PRESIDENCY SAYS ACCOUNT WAS BRIEFLY COMPROMISED', 'DEM SAY NA HACKER. OK O'],
            archive: 'Claimed the Presidency account had been hacked.',
          },
          {
            result: 'A reporter asks the platform. The platform says there was no unauthorised access and that the post came from the aide\'s usual device, in Maitama.',
            fx: [['approval', -2.5], ['bloc.press', -5], ['nation.integrity', -1]],
            news: ['PLATFORM: NO EVIDENCE PRESIDENCY ACCOUNT WAS HACKED', 'HACKER WEY DEY USE THE AIDE PHONE, FOR THE AIDE HOUSE'],
            archive: 'Claimed the Presidency account had been hacked. The platform said otherwise.',
          },
        ],
      },
      {
        id: 'admin', label: 'Attribute the post to an "unauthorised administrator"',
        outcomes: [{
          result: 'The phrase "unauthorised administrator" enters the language. It is now applied to anyone who says what they think.',
          fx: [['approval', -1.5], ['bloc.press', -3]],
          news: ['PRESIDENCY BLAMES "UNAUTHORISED ADMINISTRATOR"', 'WHO BE UNAUTHORISED ADMINISTRATOR? NA ALL OF US'],
          archive: 'Blamed an "unauthorised administrator" for a post from the Presidency account.',
        }],
      },
    ],
  },
  {
    id: 'farce.interview', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'farce', intensity: 2,
    when: { turn: [6] }, weight: 9,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: 'The Minister\'s interview',
    body: [
      '{INFO} appeared on breakfast television this morning to explain the rise in food prices.',
      'Asked what he would say to families who can no longer afford rice, the Honourable Minister replied that Nigerians should "diversify their palate" and that cassava leaves are "an underexplored protein".',
      'Asked the price of a bag of rice, he said he would have to ask his wife. Asked his wife\'s name, he asked for the question to be repeated.',
    ],
    reads: [
      { role: 'sap', good: 'He is loyal, {SIR}, which is why he is still here. He is not an asset on live television.' },
    ],
    choices: [
      {
        id: 'retire', label: 'Replace him with someone who has been to a market', pc: 4,
        outcomes: [{
          result: 'The Minister is redeployed to a ministry that does not give interviews. His successor\'s first act is to visit Wuse Market with a camera crew and pay for what she picks up.',
          fx: [['bloc.press', 4], ['approval', 1.5], ['bloc.villa', -2]],
          news: ['PRESIDENT NAMES NEW INFORMATION MINISTER', '"CASSAVA LEAF" MINISTER DON COMMOT'],
          archive: 'Replaced the Information Minister after a television interview.',
        }],
      },
      {
        id: 'context', label: 'State that the Minister was quoted out of context',
        outcomes: [{
          result: 'The full interview is re-broadcast to supply the context. The context is worse.',
          fx: [['approval', -2], ['bloc.press', -3], ['bloc.street', -3]],
          news: ['PRESIDENCY: MINISTER WAS QUOTED OUT OF CONTEXT', 'WE WATCH THE FULL VIDEO. E WORSE'],
          archive: 'Said the Information Minister had been quoted out of context.',
        }],
      },
      {
        id: 'nothing', label: 'Say nothing',
        outcomes: [{
          result: 'Cassava leaves trend for nine days. A fast-food chain adds them to the menu as a joke and sells out.',
          fx: [['approval', -1], ['bloc.street', -2]],
          later: [{ after: [2, 4], fx: [['bloc.street', -1]], label: 'The price of cassava leaves doubles.', note: ['PRICE OF CASSAVA LEAVES DOUBLES AFTER MINISTER\'S REMARK', 'EVEN CASSAVA LEAF DON COST. THANK YOU, MINISTER'] }],
          news: ['MINISTER\'S "PALATE" REMARK DRAWS CRITICISM', 'DIVERSIFY YOUR PALATE: CASSAVA LEAF CHALLENGE'],
          archive: 'Let the Information Minister\'s interview pass without comment.',
        }],
      },
    ],
  },
  {
    id: 'farce.website', kind: 'standalone', slot: 'lead', category: 'infrastructure', tone: 'farce', intensity: 1,
    when: { turn: [5] }, weight: 8,
    office: 'Office of the Secretary to the Government of the Federation', stamp: 'ROUTINE',
    title: 'The e-government portal',
    body: [
      'The Federal Government\'s ₦6.2bn citizen services portal, launched with a ribbon in March, has been offline since April.',
      'The domain was not renewed. It has been purchased by a young man in Aba, who is using it to sell phone accessories. He reports brisk trade.',
      'The contractor states that renewal was "outside the scope of work". He has offered to buy the domain back for ₦400m.',
    ],
    reads: [
      { role: 'cos', good: 'The young man is asking for ₦2m and a job, {SIR}. He rebuilt the passport renewal form over a weekend to prove a point. It works.' },
    ],
    choices: [
      {
        id: 'hire', label: 'Pay the young man and hire him',
        outcomes: [{
          result: 'He is appointed to the new digital service on a civil service grade that took three weeks to invent. The portal is back in a month, and works.',
          fx: [['nation.capacity', 3], ['approval', 1.5], ['bloc.street', 3], ['bloc.establishment', -2]],
          later: [{ after: [8, 12], fx: [['nation.capacity', 2.5], ['approval', 1]], label: 'The new digital service puts passport renewal online.', note: ['PASSPORT RENEWAL NOW TAKES 48 HOURS ONLINE', 'PASSPORT FOR TWO DAYS, NO "ANYTHING FOR THE BOYS"'] }],
          news: ['FG HIRES ABA DEVELOPER TO REBUILD PORTAL', 'ABA BOY WEY BUY GOVERNMENT WEBSITE DON GET WORK'],
          archive: 'Hired the developer who bought the government\'s lapsed domain.', sig: 2,
        }],
      },
      {
        id: 'contractor', label: 'Pay the contractor to recover the domain', naira: 0.01,
        outcomes: [{
          result: 'The contractor buys the domain from the young man for ₦2m and invoices the government for ₦400m.',
          fx: [['nation.integrity', -2], ['bloc.press', -2]],
          news: ['FG RECOVERS PORTAL DOMAIN', '₦400M TO BUY BACK WEBSITE WEY THE BOY SELL ₦2M'],
          archive: 'Paid a contractor ₦400m to recover a lapsed domain.',
        }],
      },
      {
        id: 'arrest', label: 'Direct that the young man be arrested for cybercrime',
        outcomes: [{
          result: 'He is arrested for buying a domain that was for sale. He is released after four days and three hashtags. He has since been hired by a bank.',
          fx: [['bloc.street', -5], ['approval', -2], ['bloc.press', -3]],
          news: ['POLICE ARREST MAN OVER GOVERNMENT DOMAIN', '#FREEABADEV: HIS CRIME NA TO PAY FOR WETIN DEM NO PAY'],
          archive: 'Had a man arrested for buying the government\'s lapsed domain.',
        }],
      },
    ],
  },
  {
    id: 'farce.jet', kind: 'standalone', slot: 'lead', category: 'ceremonial', tone: 'farce', intensity: 1,
    when: { turn: [15] }, weight: 7,
    office: 'Presidential Air Fleet', stamp: 'ROUTINE',
    title: 'The presidential aircraft',
    body: [
      'The principal aircraft of the Presidential Air Fleet has been impounded in a European airport over an unpaid judgment debt owed by a state government to a foreign contractor.',
      'You are due at a summit in three days. The Fleet Commander proposes chartering a replacement at $180,000 a day.',
      'The national carrier, as you will recall, does not have an aircraft.',
    ],
    reads: [
      { role: 'sap', good: 'Fly commercial once, {SIR}, and it is the only thing they will remember about the summit, in a good way.' },
    ],
    choices: [
      {
        id: 'commercial', label: 'Fly commercial',
        outcomes: [{
          result: 'You fly commercial, in business class. A passenger in economy films you queuing for the toilet. It is the most popular footage of your presidency.',
          fx: [['approval', 2.5], ['bloc.street', 3], ['bloc.villa', -2]],
          news: ['PRESIDENT FLIES COMMERCIAL TO SUMMIT', 'PRESIDENT QUEUE FOR TOILET LIKE YOU AND ME'],
          archive: 'Flew commercial to a summit after the presidential jet was impounded.',
        }],
      },
      {
        id: 'charter', label: 'Charter a replacement', naira: 0.01,
        outcomes: [{
          result: 'The charter is arranged. The invoice leaks before you land.',
          fx: [['approval', -1.5], ['bloc.press', -2]],
          news: ['FG CHARTERS JET AS PRESIDENTIAL AIRCRAFT IS IMPOUNDED', '$180,000 PER DAY. FOR PLANE. PER DAY'],
          archive: 'Chartered a jet at $180,000 a day.',
        }],
      },
      {
        id: 'skip', label: 'Send the Foreign Minister',
        outcomes: [{
          result: 'The Foreign Minister attends. The summit photograph has a gap where Nigeria usually stands.',
          fx: [['bloc.establishment', -2]],
          flags: { 'jet.impounded': true },
          news: ['PRESIDENT TO MISS SUMMIT', 'OUR PLANE DEY DETENTION FOR ABROAD'],
          archive: 'Missed a summit because the presidential jet was impounded.',
        }],
      },
    ],
  },
];
