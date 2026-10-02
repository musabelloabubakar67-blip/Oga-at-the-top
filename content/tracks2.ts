import type { Track } from '../engine/types';

// Four more reform tracks: building the economy and the things people use.

export const MORE_TRACKS: Track[] = [
  {
    id: 'industry', name: 'Made in Nigeria', goal: 'Factories, exports and jobs', metric: 'nation.jobs',
    milestones: [
      {
        id: 'i1', name: 'Forty-eight-hour ports', pc: 6, naira: 0.3, months: 6,
        blurb: 'A container takes three weeks to clear and passes fourteen agencies. Cut it to two days and five.',
        start: [['bloc.establishment', -3]],
        done: [['nation.jobs', 6], ['bonus.fiscal', 0.015], ['bonus.jobs', 0.03]],
        news: ['PORT CLEARANCE FALLS FROM 21 DAYS TO TWO', 'CONTAINER WEY DEY TAKE THREE WEEKS NOW NA TWO DAYS'],
        archive: 'Cut port clearance from three weeks to two days.',
      },
      {
        id: 'i2', name: 'Cheap credit tied to export targets', pc: 0, naira: 0.6, months: 8,
        blurb: 'Single-digit loans for manufacturers. Miss the export target and the rate goes back up.',
        done: [['nation.jobs', 9], ['bonus.jobs', 0.04]],
        news: ['FACTORY OUTPUT AT 12-YEAR HIGH', 'FACTORIES DON OPEN AGAIN. DEM DEY EMPLOY'],
        archive: 'Launched export-linked credit for manufacturers.',
      },
      {
        id: 'i3', name: 'Buy Nigerian: the procurement mandate', pc: 8, naira: 0, months: 3,
        blurb: 'Government buys local first: uniforms, vehicles, cement, software. Costs a little more. Importers will fight it.',
        start: [['bloc.establishment', -3]],
        done: [['nation.jobs', 6], ['bonus.inflation', 0.5], ['bloc.party', 3], ['bonus.jobs', 0.03]],
        news: ['FG TO BUY LOCAL FIRST UNDER NEW PROCUREMENT RULE', 'GOVERNMENT GO DEY BUY NAIJA FIRST'],
        archive: 'Mandated local-first government procurement.',
      },
      {
        id: 'i4', name: 'Industrial corridors', pc: 12, naira: 1.0, months: 14,
        needs: { v: ['senate', '>=', 50] }, needsText: 'You do not have the Senate. Win over your senators first.',
        blurb: 'Six zones with their own power, rail and land title. One in each geopolitical zone, which is how it gets through the Senate.',
        done: [['nation.jobs', 14], ['bonus.jobs', 0.06], ['approval', 3], ['bonus.fiscal', 0.02]],
        news: ['FIRST FACTORIES OPEN IN SIX INDUSTRIAL CORRIDORS', 'INDUSTRIAL ZONE DON START. WORK DEY'],
        archive: 'Built six industrial corridors, one in each zone.',
      },
    ],
  },
  {
    id: 'digital', name: 'A Digital Economy', goal: 'Technology, talent and new industries', metric: 'nation.jobs',
    milestones: [
      {
        id: 'd1', name: 'Broadband to every local government', pc: 0, naira: 0.5, months: 10,
        blurb: 'Fibre to all 774 headquarters. Right-of-way fees are the obstacle, and they belong to the governors.',
        done: [['nation.jobs', 6], ['nation.capacity', 2], ['bonus.jobs', 0.03]],
        news: ['FIBRE REACHES ALL 774 LOCAL GOVERNMENTS', 'NETWORK DON REACH VILLAGE'],
        archive: 'Laid fibre to all 774 local government headquarters.',
      },
      {
        id: 'd2', name: 'Startup Act', pc: 8, naira: 0, months: 5,
        needs: { v: ['senate', '>=', 50] }, needsText: 'You do not have the Senate. Win over your senators first.',
        blurb: 'A regulatory sandbox, a tax holiday and founder visas. Stops the regulators banning things by press release.',
        done: [['nation.jobs', 7], ['bloc.street', 5], ['bonus.jobs', 0.04]],
        news: ['STARTUP ACT SIGNED; THREE UNICORNS RELOCATE HOME', 'TECH BROS DON RETURN FROM ABROAD'],
        archive: 'Signed the Startup Act.',
      },
      {
        id: 'd3', name: 'Three million technical talent', pc: 0, naira: 0.4, months: 12,
        blurb: 'Train and certify three million young people. Half will work for foreign firms, in naira-earning dollars.',
        done: [['nation.jobs', 8], ['bloc.street', 4], ['bonus.jobs', 0.04], ['bonus.fiscal', 0.01]],
        news: ['ONE MILLION YOUNG NIGERIANS NOW EARN IN DOLLARS REMOTELY', 'YOUTHS DEY EARN DOLLAR FROM HOUSE'],
        archive: 'Trained three million young people in technical skills.',
      },
      {
        id: 'd4', name: 'Payments and identity as public rails', pc: 6, naira: 0.3, months: 10,
        blurb: 'One identity, instant payments, open to every bank and app. The tax office will be able to see everything.',
        done: [['nation.jobs', 7], ['nation.capacity', 4], ['bonus.fiscal', 0.02]],
        news: ['INFORMAL ECONOMY GOES DIGITAL AS PUBLIC PAYMENT RAIL LAUNCHES', 'EVEN MAMA PUT DEY COLLECT TRANSFER NOW'],
        archive: 'Built public digital infrastructure for identity and payments.',
      },
    ],
  },
  {
    id: 'people', name: 'Health and Schools', goal: 'Clinics that work, schools that stay open', metric: 'bloc.street',
    milestones: [
      {
        id: 'e1', name: 'A working clinic in every ward', pc: 0, naira: 0.5, months: 10,
        blurb: '8,800 primary health centres with staff, drugs and power. Most exist already, as buildings.',
        done: [['approval', 3], ['bloc.street', 6], ['zone.NE.approval', 3], ['zone.NW.approval', 3]],
        news: ['MATERNAL DEATHS FALL AS 8,800 CLINICS REOPEN', 'CLINIC DON GET DOCTOR AND MEDICINE. WONDERFUL'],
        archive: 'Put a working primary health centre in every ward.',
      },
      {
        id: 'e2', name: 'Fund the universities and doctors by law', pc: 8, naira: 0.6, months: 6,
        blurb: 'A first-line charge on revenue, so the agreement cannot be "inadvertently omitted" again. Ends the annual strike.',
        flags: { 'uni.agreement': 'implemented', 'doctors.paid': true },
        done: [['bloc.street', 6], ['approval', 2], ['pressure.wageGrievance', -20], ['nation.capacity', 1]],
        news: ['UNIVERSITY, HEALTH FUNDING NOW A FIRST-LINE CHARGE', 'NO MORE STRIKE? LECTURERS AND DOCTORS DON COLLECT'],
        archive: 'Made university and health funding a first-line charge on revenue.',
      },
      {
        id: 'e3', name: 'School meals that are real', pc: 4, naira: 0.3, months: 6,
        blurb: 'Audited, cooked locally, bought from local farmers. Attendance rises wherever the food is real.',
        done: [['bloc.street', 4], ['nation.integrity', 2], ['bonus.inflation', -0.5], ['approval', 1.5]],
        news: ['ENROLMENT UP 18% AS AUDITED SCHOOL MEALS BEGIN', 'PIKIN DEM DEY CHOP FOR SCHOOL. FOR REAL THIS TIME'],
        archive: 'Rebuilt school feeding on an audited, local basis.',
      },
      {
        id: 'e4', name: 'Health insurance for fifty million', pc: 10, naira: 0.8, months: 14,
        needs: { v: ['senate', '>=', 50] }, needsText: 'You do not have the Senate. Win over your senators first.',
        blurb: 'The poorest fifty million covered from general revenue. The most expensive thing on this list and the most popular.',
        done: [['approval', 5], ['bloc.street', 9], ['bonus.fiscal', -0.02]],
        news: ['50 MILLION NIGERIANS NOW HAVE HEALTH COVER', 'HOSPITAL NO DEY ASK FOR DEPOSIT AGAIN'],
        archive: 'Extended health insurance to fifty million people.',
      },
    ],
  },
  {
    id: 'works', name: 'Roads, Rail and Ports', goal: 'Things that are finished', metric: 'nation.jobs',
    milestones: [
      {
        id: 'w1', name: 'Finish what was started', pc: 0, naira: 0.6, months: 8,
        blurb: 'Complete the twenty federal roads nearest completion. No new ribbon to cut; your predecessors get half the credit.',
        done: [['nation.jobs', 4], ['approval', 3], ['zone.SE.approval', 3], ['zone.NC.approval', 3], ['zone.SS.approval', 3]],
        news: ['TWENTY ABANDONED ROADS COMPLETED', 'ROAD WEY DEM ABANDON SINCE DON FINISH'],
        archive: 'Completed twenty abandoned federal roads.',
      },
      {
        id: 'w2', name: 'A road fund that cannot be raided', pc: 10, naira: 0, months: 4,
        blurb: 'Tolls and a fuel levy, ring-fenced for maintenance. Nobody likes a toll gate.',
        start: [['approval', -1.5]],
        done: [['bonus.jobs', 0.03], ['nation.capacity', 2], ['bonus.fiscal', 0.01]],
        news: ['ROAD FUND BEGINS MAINTENANCE OF 9,000KM', 'TOLL GATE DON RETURN. AT LEAST POTHOLE DON REDUCE'],
        archive: 'Created a ring-fenced road maintenance fund.',
      },
      {
        id: 'w3', name: 'Deep sea port and rail link', pc: 4, naira: 1.0, months: 16,
        blurb: 'A second deep-water port with a rail line inland, so that half the country\'s cargo stops queuing in one city.',
        done: [['nation.jobs', 10], ['bonus.fiscal', 0.03], ['bonus.jobs', 0.04]],
        news: ['SECOND DEEP SEA PORT OPENS WITH RAIL LINK', 'NEW PORT DON OPEN. TRAILER NO DEY BLOCK ROAD AGAIN'],
        archive: 'Opened a second deep sea port with a rail link inland.',
      },
      {
        id: 'w4', name: 'Flood defences on the Niger and Benue', pc: 4, naira: 1.2, months: 14,
        blurb: 'Dredging, a buffer dam and embankments. Ends the annual disaster. The cost is why nobody has done it.',
        flags: { 'flood.defences': true },
        done: [['zone.NC.approval', 5], ['bonus.inflation', -1], ['approval', 2]],
        news: ['RIVERS RISE, DEFENCES HOLD: NO FLOOD DEATHS FOR FIRST TIME IN A DECADE', 'RAIN FALL, WATER NO ENTER HOUSE. THANK GOD'],
        archive: 'Built permanent flood defences on the Niger and Benue.',
      },
    ],
  },
];
