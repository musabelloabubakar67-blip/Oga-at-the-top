// THE MILITARY CAST AND MISSION DRAFTS (plan 13; content input for contract R9)
// The people who command the armed forces, in every theatre, with what they
// believe about the job, who they are close to, what their command needs and
// what is still unresolved on their record. They disagree with one another on
// substance, so the President hears more than one professional view.
//
// Names: ordinary Nigerian names, each searched on the web on 6 October 2026 and
// kept only if no public figure shares it (rule in content/names.ts). Rejected
// in that pass: Abdulkadir Jalingo (a journalist's surname), Bitrus Gwamna (a
// politician shares the surname), Kehinde Oladosu (recording artists), Lawan
// Gubio (a 2027 governorship candidate's surname), Adewale Fagbohun (a published
// author), Folarin Oyebamiji (a governorship candidate's surname). Ranks and
// posts are generic; no officer stands for a real one. No text uses a gendered
// pronoun for an officer.
//
// Status: authored content. Missions, readiness, conduct and command state wait
// on contract R9; nothing in the engine reads this file yet. Amounts are a year's
// running cost in ₦bn at the game's prices; `dollarShare` is the part that must be
// bought in foreign currency (spares, fuel, ammunition), so a weaker naira or thin
// reserves hit readiness directly (plan 13.A4).

import type { ZoneId } from '../engine/types';

export type Service = 'army' | 'navy' | 'air' | 'joint';

/** How an officer thinks the job is done. Each is right somewhere and wrong somewhere else. */
export type Doctrine =
  | 'hold'          // take ground and garrison it; slow, expensive, durable
  | 'manoeuvre'     // mobile forces, raids, pressure; fast, cheaper, does not hold
  | 'air'           // precision and air power; few soldiers at risk, civilian harm when intelligence is poor
  | 'population'    // protect people first, win local cooperation; slow results, lasting ones
  | 'intelligence'  // know before acting; few headlines, fewer mistakes
  | 'sustainment'   // maintain and supply what exists before buying more
  | 'acquisition';  // new equipment closes the gap; quick to announce, slow to arrive

export type Post =
  | 'cds' | 'army' | 'navy' | 'air' | 'intelligence' | 'logistics' | 'procurement'
  | `theatre.${ZoneId}`;

export interface CareerStep { years: string; post: string }

export interface Officer {
  id: string;
  name: string;
  short: string;
  rank: string;
  service: Service;
  post: Post;
  /** The post as the reader sees it. */
  title: string;
  zone: ZoneId;
  doctrine: Doctrine;
  /** Their professional position, in their own words: this shapes their advice. */
  position: string;
  career: CareerStep[];
  /** 1–5. `restraint`: how firmly they refuse an unlawful or political order. */
  traits: { competence: number; integrity: number; restraint: number; clout: number; ambition: number };
  /** Who they are close to: 'none', 'president', or a person or businessman id. */
  tie: string;
  /** What the tie is, plainly. */
  tieText: string;
  /** What the command needs each year to be ready, and how much of it is in dollars. */
  needs: { naira: number; dollarShare: number; text: string };
  /** Something still unresolved on their record, carried across governments (13.A8). */
  record?: string;
  /** Where they disagree with a colleague, on substance. */
  disputes?: { with: string; over: string }[];
}

export const OFFICERS: Officer[] = [
  // ---------------------------------------------------------------- the leadership
  {
    id: 'mil.gajiram', name: 'Gen. Modu Gajiram', short: 'Gajiram', rank: 'General', service: 'army', post: 'cds',
    title: 'Chief of Defence Staff', zone: 'NE', doctrine: 'hold',
    position: 'Ground you do not hold is ground you will take twice. I would rather have fewer towns and keep every one of them.',
    career: [{ years: '1994–2008', post: 'Infantry, North East and peacekeeping' }, { years: '2008–2016', post: 'Brigade and division command' }, { years: '2016–', post: 'Chief of Defence Staff (appointed by the previous government)' }],
    traits: { competence: 4, integrity: 3, restraint: 4, clout: 4, ambition: 1 },
    tie: 'gov_ne', tieText: 'From Governor Kwaya\'s state, and consulted by the governor on every deployment there.',
    needs: { naira: 40, dollarShare: 0.2, text: 'Joint headquarters, the defence college and the reserve. Most of what it needs is people, paid on time.' },
    disputes: [{ with: 'mil.dangora', over: 'Whether to garrison the towns already retaken or keep the strike brigades moving.' }],
  },
  {
    id: 'mil.dangora', name: 'Lt. Gen. Ishaya Dangora', short: 'Dangora', rank: 'Lieutenant General', service: 'army', post: 'army',
    title: 'Chief of Army Staff', zone: 'NC', doctrine: 'manoeuvre',
    position: 'A garrison is a target with a flag on it. Keep them guessing, keep moving, and let the police hold the towns.',
    career: [{ years: '1996–2009', post: 'Armour and reconnaissance' }, { years: '2009–2018', post: 'Commander, a mobile strike brigade' }, { years: '2018–', post: 'Chief of Army Staff' }],
    traits: { competence: 4, integrity: 3, restraint: 3, clout: 3, ambition: 3 },
    tie: 'none', tieText: 'Owes the post to merit and to nobody, and says so more often than is wise.',
    needs: { naira: 210, dollarShare: 0.35, text: 'Pay and allowances for the largest service, vehicles, and ammunition bought abroad.' },
    record: 'A cordon-and-search in a farming district under the general\'s brigade, years ago, after which eleven men were not seen again. A board of inquiry sat. Its report has never been released.',
    disputes: [{ with: 'mil.gajiram', over: 'Garrisons against mobile brigades.' }, { with: 'mil.obiorah', over: 'Whether to act on partial intelligence or wait for confirmation.' }],
  },
  {
    id: 'mil.ibiene', name: 'Vice Adm. Tamunotonye Ibiene', short: 'Ibiene', rank: 'Vice Admiral', service: 'navy', post: 'navy',
    title: 'Chief of Naval Staff', zone: 'SS', doctrine: 'acquisition',
    position: 'Give me twelve patrol boats that work and the creeks are ours. With the four I have, I am guarding a coast the size of a country with a rowing club.',
    career: [{ years: '1995–2010', post: 'Fleet, Western and Eastern commands' }, { years: '2010–2019', post: 'Naval attaché abroad, then flag officer' }, { years: '2019–', post: 'Chief of Naval Staff' }],
    traits: { competence: 3, integrity: 2, restraint: 3, clout: 3, ambition: 2 },
    tie: 'ty_fuel', tieText: 'A relative by marriage holds a marine-services contract with companies in Chief Amangala\'s group.',
    needs: { naira: 95, dollarShare: 0.55, text: 'Boats, engines and fuel. Most of it is bought abroad; a weak naira beaches the fleet.' },
    disputes: [{ with: 'mil.opuama', over: 'Buying new boats against paying the men who know the creeks.' }],
  },
  {
    id: 'mil.oyedokun', name: 'Air Marshal Gbolahan Oyedokun', short: 'Oyedokun', rank: 'Air Marshal', service: 'air', post: 'air',
    title: 'Chief of Air Staff', zone: 'SW', doctrine: 'air',
    position: 'An aircraft overhead is worth a battalion on the ground and risks two crew instead of six hundred soldiers. The limit is not the aircraft. It is knowing what is under it.',
    career: [{ years: '1997–2011', post: 'Pilot, ground attack and transport' }, { years: '2011–2020', post: 'Air component commander, North East' }, { years: '2020–', post: 'Chief of Air Staff' }],
    traits: { competence: 4, integrity: 4, restraint: 3, clout: 2, ambition: 2 },
    tie: 'none', tieText: 'No political patron. The aircraft manufacturers know the Air Marshal well.',
    needs: { naira: 180, dollarShare: 0.7, text: 'Aircraft hours, fuel and spare parts, nearly all in dollars. Half the fleet is waiting for parts.' },
    record: 'A strike under the Air Marshal\'s former component hit a fishing camp on the lake. The Air Force accepted responsibility. Half the compensation promised has been paid.',
    disputes: [{ with: 'mil.ezeagu', over: 'Air strikes in populated areas.' }, { with: 'mil.dankama', over: 'Strikes on forest camps where hostages may be held.' }],
  },
  {
    id: 'mil.obiorah', name: 'Maj. Gen. Nkemdirim Obiorah', short: 'Obiorah', rank: 'Major General', service: 'joint', post: 'intelligence',
    title: 'Chief of Defence Intelligence', zone: 'SE', doctrine: 'intelligence',
    position: 'Every mistake this war has made, it made because someone acted on what they hoped was true. Tell me what you want to know and give me time.',
    career: [{ years: '1998–2012', post: 'Intelligence corps, three theatres' }, { years: '2012–2021', post: 'Defence attaché, then director of analysis' }, { years: '2021–', post: 'Chief of Defence Intelligence' }],
    traits: { competence: 5, integrity: 4, restraint: 5, clout: 2, ambition: 1 },
    tie: 'min_defence', tieText: 'A protégé of the National Security Adviser, who brought the general into the joint staff.',
    needs: { naira: 25, dollarShare: 0.4, text: 'Analysts, interpreters, informant networks and signals equipment.' },
    disputes: [{ with: 'mil.dangora', over: 'Acting on partial intelligence.' }],
  },
  {
    id: 'mil.ubom', name: 'Rear Adm. Ekaette Ubom', short: 'Ubom', rank: 'Rear Admiral', service: 'joint', post: 'logistics',
    title: 'Chief of Defence Logistics', zone: 'SS', doctrine: 'sustainment',
    position: 'We do not need more equipment. We need the equipment we have to work. Half our helicopters are waiting for a part that costs less than the ceremony for the new ones.',
    career: [{ years: '1999–2012', post: 'Naval engineering and supply' }, { years: '2012–2020', post: 'Director of maintenance, the dockyard' }, { years: '2020–', post: 'Chief of Defence Logistics' }],
    traits: { competence: 5, integrity: 5, restraint: 4, clout: 1, ambition: 0 },
    tie: 'none', tieText: 'Nobody\'s. Has the respect of the engineers and no friends in the procurement directorate.',
    needs: { naira: 60, dollarShare: 0.5, text: 'A maintenance backlog the size of a small air force, and the depots to clear it.' },
    disputes: [{ with: 'mil.mallumbe', over: 'Spending on maintenance against spending on new purchases.' }],
  },
  {
    id: 'mil.mallumbe', name: 'AVM Zanna Mallumbe', short: 'Mallumbe', rank: 'Air Vice Marshal', service: 'joint', post: 'procurement',
    title: 'Director of Defence Procurement', zone: 'NE', doctrine: 'acquisition',
    position: 'The enemy has drones. We have speeches. Sign the contracts and stop asking me why the last government did not.',
    career: [{ years: '1998–2013', post: 'Air Force supply and contracts' }, { years: '2013–2021', post: 'Defence attaché in a supplier country' }, { years: '2021–', post: 'Director of Defence Procurement' }],
    traits: { competence: 3, integrity: 2, restraint: 2, clout: 3, ambition: 2 },
    tie: 'sen_approp', tieText: 'Close to Senator Zango, whose committee approves every defence purchase and whose constituents build the barracks.',
    needs: { naira: 0, dollarShare: 0, text: 'Spends other commands\' money. The open contracts run to ₦640bn, mostly in dollars.' },
    record: 'Two helicopters bought through an agent in a third country arrived without their spare-parts packages. The agent\'s fee was paid in full. Nobody has asked where the packages went.',
    disputes: [{ with: 'mil.ubom', over: 'New purchases against maintenance.' }],
  },

  // ---------------------------------------------------------------- the theatres
  {
    id: 'mil.dakwak', name: 'Maj. Gen. Yakubu Dakwak', short: 'Dakwak', rank: 'Major General', service: 'army', post: 'theatre.NE',
    title: 'Theatre Commander, North East', zone: 'NC', doctrine: 'population',
    position: 'We have retaken every town in this theatre at least twice. The towns that stayed ours are the ones where the people trusted us enough to tell us who was coming.',
    career: [{ years: '1997–2010', post: 'Infantry, then civil-military affairs' }, { years: '2010–2019', post: 'Brigade commander, North East' }, { years: '2019–', post: 'Theatre Commander, North East' }],
    traits: { competence: 4, integrity: 4, restraint: 4, clout: 2, ambition: 1 },
    tie: 'none', tieText: 'None in politics. Respected by the civilian vigilantes, which some in Abuja hold against the general.',
    needs: { naira: 160, dollarShare: 0.3, text: 'Pay on time, ammunition, armoured transport, and money for the towns the troops protect.' },
    disputes: [{ with: 'mil.oyedokun', over: 'Air strikes near returned communities.' }],
  },
  {
    id: 'mil.dankama', name: 'Maj. Gen. Nura Dankama', short: 'Dankama', rank: 'Major General', service: 'army', post: 'theatre.NW',
    title: 'Theatre Commander, North West', zone: 'NW', doctrine: 'manoeuvre',
    position: 'The gangs move faster than we do because they own motorcycles and we own paperwork. Give the battalions the vehicles and the authority, and the forests stop being theirs.',
    career: [{ years: '1999–2012', post: 'Special forces' }, { years: '2012–2020', post: 'Battalion and brigade command, North West' }, { years: '2020–', post: 'Theatre Commander, North West' }],
    traits: { competence: 4, integrity: 3, restraint: 3, clout: 3, ambition: 2 },
    tie: 'gov_nw', tieText: 'Grew up with Governor Batagarawa. The governor\'s amnesty talks with some gang leaders go through the general\'s headquarters.',
    needs: { naira: 120, dollarShare: 0.3, text: 'Vehicles, fuel, radios, and pay for the forward bases.' },
    disputes: [{ with: 'mil.oyedokun', over: 'Strikes on camps where hostages may be held.' }],
  },
  {
    id: 'mil.agera', name: 'Brig. Gen. Iorwuese Agera', short: 'Agera', rank: 'Brigadier General', service: 'army', post: 'theatre.NC',
    title: 'Commander, Farm Belt Task Force', zone: 'NC', doctrine: 'hold',
    position: 'The attacks come at planting time, at night, on the same roads. Put troops on those roads for those four months and the farmers plant.',
    career: [{ years: '2001–2014', post: 'Infantry and military police' }, { years: '2014–2022', post: 'Operations officer, then brigade commander' }, { years: '2022–', post: 'Commander, Farm Belt Task Force' }],
    traits: { competence: 3, integrity: 4, restraint: 3, clout: 2, ambition: 2 },
    tie: 'gov_nc', tieText: 'From Governor Nyitse\'s state and community. Herder associations say this makes the general a party to the conflict; the general says it makes the general informed.',
    needs: { naira: 70, dollarShare: 0.2, text: 'Seasonal deployment, patrol vehicles and pay for the planting months.' },
  },
  {
    id: 'mil.ajiboye', name: 'Brig. Gen. Olukayode Ajiboye', short: 'Ajiboye', rank: 'Brigadier General', service: 'army', post: 'theatre.SW',
    title: 'Commander, Joint Task Force, South West Corridors', zone: 'SW', doctrine: 'population',
    position: 'This is a policing problem the police cannot afford. My soldiers should hold the corridors while the police and the states build what replaces us.',
    career: [{ years: '2000–2013', post: 'Signals, then infantry' }, { years: '2013–2021', post: 'Liaison to the police and state security outfits' }, { years: '2021–', post: 'Commander, Joint Task Force, South West' }],
    traits: { competence: 4, integrity: 4, restraint: 4, clout: 2, ambition: 1 },
    tie: 'gov_sw', tieText: 'Works daily with Governor Aderibigbe\'s regional security outfit, and is trusted by it more than Abuja would like.',
    needs: { naira: 35, dollarShare: 0.2, text: 'Vehicles and radios for the corridor patrols, shared with the police.' },
  },
  {
    id: 'mil.ezeagu', name: 'Brig. Gen. Chinonso Ezeagu', short: 'Ezeagu', rank: 'Brigadier General', service: 'army', post: 'theatre.SE',
    title: 'Commander, South East Operations', zone: 'SE', doctrine: 'population',
    position: 'Every checkpoint that takes a bribe recruits ten agitators. I can keep the roads open. I cannot make people want what Abuja is offering.',
    career: [{ years: '2002–2014', post: 'Infantry and peacekeeping' }, { years: '2014–2022', post: 'Instructor, then brigade staff' }, { years: '2022–', post: 'Commander, South East Operations' }],
    traits: { competence: 3, integrity: 5, restraint: 5, clout: 1, ambition: 1 },
    tie: 'none', tieText: 'None. Some in Abuja think a commander from the zone is too sympathetic to it.',
    needs: { naira: 30, dollarShare: 0.15, text: 'Fewer checkpoints and better-paid soldiers at the ones that remain.' },
    disputes: [{ with: 'mil.oyedokun', over: 'Air power in populated areas.' }],
  },
  {
    id: 'mil.opuama', name: 'Rear Adm. Diepreye Opuama', short: 'Opuama', rank: 'Rear Admiral', service: 'navy', post: 'theatre.SS',
    title: 'Commander, Joint Task Force, Niger Delta', zone: 'SS', doctrine: 'intelligence',
    position: 'Every barge that leaves the creeks with stolen crude passes a jetty somebody owns. Meter the terminals and follow the money; the boats are the last thing you need.',
    career: [{ years: '1998–2011', post: 'Special boat service' }, { years: '2011–2019', post: 'Naval intelligence, Eastern Command' }, { years: '2019–', post: 'Commander, Joint Task Force, Niger Delta' }],
    traits: { competence: 4, integrity: 4, restraint: 4, clout: 2, ambition: 2 },
    tie: 'gov_ss', tieText: 'Governor Koroye\'s preferred commander. The governor\'s critics say the admiral looks away from the governor\'s friends; the admiral\'s record does not show it.',
    needs: { naira: 45, dollarShare: 0.45, text: 'Fuel and maintenance for the boats that work, and investigators for the jetties.' },
    disputes: [{ with: 'mil.ibiene', over: 'Buying boats against following the money.' }],
  },
];

export const OFFICER_BY_ID: Record<string, Officer> = Object.fromEntries(OFFICERS.map((o) => [o.id, o]));

/**
 * Mission drafts by theatre (13.A3, 13.A5): what an operation can aim for, the
 * limits on how it is conducted, and the evidence that would show it worked.
 * Tactical success is not lasting security: `lasting` says what has to follow.
 * Proposed definitions for R9; the commander is the theatre's officer above.
 */
export interface MissionDraft {
  id: string;
  theatre: ZoneId;
  objective: string;
  /** Limits the President can set; each has a cost if dropped. */
  limits: string[];
  /** What would show success, verifiable in the game (plan 08). */
  evidence: string;
  /** What has to follow or the gain fades. */
  lasting: string;
  /** Who argues for it and who against, from the cast. */
  for: string[];
  against: string[];
}

export const MISSIONS: MissionDraft[] = [
  { id: 'msn.ne.hold', theatre: 'NE', objective: 'Retake and garrison the three towns on the main supply road.', limits: ['No strikes within a kilometre of a returned community', 'Detainees handed to the police within 48 hours'], evidence: 'Returned households in the three towns, counted by the relief agencies, not the army.', lasting: 'Police posts, a paid local guard and reconstruction money, or the towns fall again within the year.', for: ['mil.gajiram', 'mil.dakwak'], against: ['mil.dangora'] },
  { id: 'msn.ne.raid', theatre: 'NE', objective: 'Strike brigades raid the camps on the lake islands.', limits: ['Strikes only on confirmed camps', 'Fishermen\'s camps marked and avoided'], evidence: 'Camps destroyed, confirmed by later ground patrols, and attacks on the road down for three months.', lasting: 'Raids do not hold ground. Without garrisons the camps return within the year.', for: ['mil.dangora', 'mil.oyedokun'], against: ['mil.obiorah', 'mil.dakwak'] },
  { id: 'msn.nw.forest', theatre: 'NW', objective: 'Clear the gangs from the two forests nearest the state capitals.', limits: ['No strikes where hostages are reported', 'No dealing with gang leaders outside the governor\'s amnesty process'], evidence: 'Market days resumed and farm levies stopped in the districts beside the forests.', lasting: 'Forward bases and local courts, or the gangs move to the next forest.', for: ['mil.dankama'], against: ['mil.oyedokun'] },
  { id: 'msn.nc.planting', theatre: 'NC', objective: 'Secure the farm belt for the four planting months.', limits: ['Patrols include both farming and herding community liaisons', 'Arrests handed to the courts, not to community vigilantes'], evidence: 'Hectares planted in the belt against last year, from the agriculture ministry\'s survey.', lasting: 'Grazing reserves and local courts that both communities trust, or the attacks resume after the harvest.', for: ['mil.agera'], against: [] },
  { id: 'msn.sw.corridor', theatre: 'SW', objective: 'Hold the expressway and two trunk roads with joint patrols.', limits: ['Joint patrols with the police and the state outfit, under one radio net', 'No extortion at checkpoints: a hotline and dismissals'], evidence: 'Kidnappings reported on the corridors, from the police and the transport unions.', lasting: 'A funded police replacement, or the soldiers become the permanent police.', for: ['mil.ajiboye'], against: ['mil.dangora'] },
  { id: 'msn.se.open', theatre: 'SE', objective: 'Keep the markets and highways open on Mondays without force.', limits: ['Half the checkpoints removed', 'No mass arrests'], evidence: 'Markets open on Mondays, counted by the traders\' associations.', lasting: 'A political settlement; the army cannot provide one.', for: ['mil.ezeagu', 'mil.obiorah'], against: ['mil.gajiram'] },
  { id: 'msn.ss.follow', theatre: 'SS', objective: 'Follow stolen crude from the creeks to the jetties and the buyers.', limits: ['Prosecutions go to the courts, whoever the owner is', 'No burning of refineries near villages'], evidence: 'Metered terminal volumes against wellhead output, published monthly.', lasting: 'Metered terminals and convictions, or the theft moves to another creek.', for: ['mil.opuama', 'mil.obiorah'], against: ['mil.ibiene'] },
  { id: 'msn.ss.fleet', theatre: 'SS', objective: 'Buy twelve patrol boats and blockade the creeks.', limits: ['Boats bought by open tender', 'Crew trained before delivery'], evidence: 'Barges intercepted and theft estimates from the terminals, quarter on quarter.', lasting: 'Fuel and maintenance every year in dollars, or the boats are beached by the second year.', for: ['mil.ibiene', 'mil.mallumbe'], against: ['mil.ubom', 'mil.opuama'] },
];
