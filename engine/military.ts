// THE ARMED FORCES AND CIVILIAN CONTROL (plan 13)
// The military is an institution with its own capability, separate from how
// safe the country is. Readiness comes from pay on time, budget releases,
// spare parts bought in dollars, the maintenance backlog and the people in
// command; intelligence and conduct are tracked beside it. The theatres'
// threat (engine/security.ts) is the outcome; this is the instrument.
//
// The President chooses a mission (objective, resources, the limits on how it
// is fought) and delegates it to the theatre commander, whose doctrine and
// record shape what happens. A month of operations moves the threat down,
// may harm civilians, wins or loses local cooperation and displaces people.
// A tactical gain is held only where cooperation holds; otherwise it fades.
// Officers disagree, leak, investigate and refuse unlawful orders; a coup is
// possible only when several real causes line up.

import { MISSIONS, OFFICERS, OFFICER_BY_ID, type MissionDraft, type Officer, type Post } from '../content/military';
import { STATE_BY_ID } from '../content/states';
import { ASSET_SYSTEMS } from '../content/asset-systems';
import { hooks } from './hooks';
import { assetPerformance, assets } from './places';
import { rand } from './rng';
import { releaseRate } from './treasury';
import type { GameState, ZoneId } from './types';
import { ZONES, ZONE_NAME, applyFx, clamp, shiftThreat, syncSecurity } from './vars';

export type Resources = 'lean' | 'standard' | 'surge';
export const RESOURCES: Record<Resources, { name: string; perMonth: number; weight: number; text: string }> = {
  lean: { name: 'Lean', perMonth: 0.004, weight: 0.7, text: 'What the theatre already has, and fuel.' },
  standard: { name: 'Standard', perMonth: 0.008, weight: 1, text: 'Reinforcements, vehicles and the money to keep them moving.' },
  surge: { name: 'Surge', perMonth: 0.015, weight: 1.3, text: 'Everything that can be moved, with air support. Faster, dearer, rougher.' },
};

/** The doctrine each mission draft calls for; a commander who believes in it does it better. */
const MISSION_DOCTRINE: Record<string, Officer['doctrine']> = {
  'msn.ne.hold': 'hold', 'msn.ne.raid': 'manoeuvre', 'msn.nw.forest': 'manoeuvre', 'msn.nc.planting': 'hold',
  'msn.sw.corridor': 'population', 'msn.se.open': 'population', 'msn.ss.follow': 'intelligence', 'msn.ss.fleet': 'acquisition',
};
/** Doctrines that hurt civilians more when intelligence is poor. */
const ROUGH: Officer['doctrine'][] = ['manoeuvre', 'air', 'acquisition'];

export interface Mission {
  id: string;
  theatre: ZoneId;
  commander: string;
  resources: Resources;
  /** Which of the draft's conduct limits are kept. */
  kept: boolean[];
  started: number;
  months: number;
  /** Threat taken off so far by this mission (a tactical gain, held or not). */
  gained: number;
  harm: number;
  log: { turn: number; text: string }[];
  ended?: number;
}

export interface Military {
  /** Post -> officer id, or '' when filled by the next officer in seniority. */
  posts: Record<string, string>;
  readiness: number;
  backlog: number;
  conduct: number;
  intel: number;
  /** Months the forces' pay has been late. */
  arrears: number;
  /** Per theatre: local cooperation (0–100), people displaced (thousands), and the tactical gain not yet held. */
  local: Record<ZoneId, { cooperation: number; displaced: number; unheld: number }>;
  missions: Mission[];
  /** Harm to civilians on the record, carried across governments until dealt with. */
  abuses: { id: string; zone: ZoneId; text: string; turn: number; officer?: string; resolved?: 'prosecuted' | 'compensated' | 'buried' }[];
  inquiries: { id: string; subject: string; opened: number; status: 'open' | 'closed'; finding?: string }[];
  /** Orders the military refused, and orders it obeyed that it should not have. */
  refused: number;
  misused: number;
  history: { turn: number; text: string }[];
}

const POSTS: Post[] = ['cds', 'army', 'navy', 'air', 'intelligence', 'logistics', 'procurement', ...ZONES.map((z) => `theatre.${z}` as Post)];
export const POST_TITLE: Record<string, string> = Object.fromEntries(OFFICERS.map((o) => [o.post, o.title]));

/** The next officer in seniority: competent enough, tied to nobody, not known to anyone. */
export const SENIOR: Omit<Officer, 'id' | 'post' | 'title' | 'zone'> = {
  name: 'The next officer in seniority', short: 'the deputy', rank: '', service: 'joint', doctrine: 'hold',
  position: 'Does what the last commander did, more carefully.', career: [],
  traits: { competence: 3, integrity: 3, restraint: 3, clout: 1, ambition: 1 }, tie: 'none', tieText: 'None.',
  needs: { naira: 0, dollarShare: 0.3, text: '' },
};

export function ensureMilitary(s: GameState): Military {
  if (s.military) return s.military;
  const local = Object.fromEntries(ZONES.map((z) => [z, { cooperation: 45, displaced: 0, unheld: 0 }])) as Military['local'];
  s.military = {
    posts: Object.fromEntries(POSTS.map((p) => [p, OFFICERS.find((o) => o.post === p)?.id ?? ''])),
    readiness: 45, backlog: 40, conduct: 55, intel: 40, arrears: 0, local, missions: [], abuses: [], inquiries: [],
    refused: 0, misused: 0, history: [],
  };
  // The records the officers bring with them are already on the books.
  for (const o of OFFICERS) if (o.record) s.military.abuses.push({ id: `rec.${o.id}`, zone: o.zone, text: o.record, turn: 0, officer: o.id });
  return s.military;
}

/** Who holds a post: a named officer, or the next one in seniority. */
export function holder(s: GameState, post: string): Officer {
  const id = ensureMilitary(s).posts[post];
  const o = id ? OFFICER_BY_ID[id] : undefined;
  if (o) return o;
  const zone = post.startsWith('theatre.') ? (post.slice(8) as ZoneId) : 'NC';
  return { ...SENIOR, id: '', post: post as Post, title: POST_TITLE[post] ?? post, zone };
}

export interface Line { label: string; value: number }

/** What readiness is heading for, and why: the diagnostics the President reads. */
export function readinessTarget(s: GameState): { v: number; lines: Line[] } {
  const m = ensureMilitary(s);
  const lines: Line[] = [{ label: 'Where the forces stand without help', value: 40 }];
  const alloc = (s.budget.alloc.security ?? 2) - 2;
  const rel = releaseRate(s, 'security').rate;
  if (alloc) lines.push({ label: `Defence budget ${alloc > 0 ? 'above' : 'below'} the usual, ${Math.round(rel * 100)}% released`, value: Math.round(alloc * 5 * (alloc > 0 ? rel : 1)) });
  if (m.arrears) lines.push({ label: `Pay ${m.arrears} month${m.arrears === 1 ? '' : 's'} late`, value: -Math.min(24, m.arrears * 6) });
  const short = dollarShortage(s);
  if (short > 0.05) lines.push({ label: 'Spare parts and fuel bought in dollars are short', value: -Math.round(short * 18) });
  const backlog = -Math.round((m.backlog - 40) * 0.3);
  if (backlog) lines.push({ label: `Maintenance backlog at ${Math.round(m.backlog)}`, value: backlog });
  const cds = holder(s, 'cds'), log = holder(s, 'logistics');
  const lead = (cds.traits.competence - 3) * 3 + (log.traits.competence - 3) * 3;
  if (lead) lines.push({ label: `The command: ${cds.short} and ${log.short}`, value: lead });
  const reforms = Math.round((s.counters['sec.strike'] ?? 0) * 8);
  if (reforms) lines.push({ label: 'Reforms that pay, equip and audit the forces', value: reforms });
  const prof = professional(s);
  if (prof) lines.push({ label: 'Professional reforms and institutions', value: prof * 3 });
  const built = Math.round(builtFor(s, 'readiness'));
  if (built) lines.push({ label: 'Depots and repaired fleets', value: built });
  return { v: clamp(lines.reduce((a, l) => a + l.value, 0), 5, 95), lines };
}

/** The share of what the forces must buy in dollars that cannot be bought this month (0–1). */
export function dollarShortage(s: GameState): number {
  const f = s.fx;
  if (!f) return 0;
  const premium = f.parallel / f.rate - 1;
  return clamp(Math.max(0, premium - 0.2) * 1.2 + Math.max(0, 12 - f.reserves) * 0.04, 0, 0.8) * (1 - Math.min(0.8, builtFor(s, 'spares')));
}

/** How professional the forces are: reforms and institutions that make them answer to law and rules. */
export function professional(s: GameState): number {
  const d = s.agenda.done;
  return ['s3', 's7', 's9'].filter((id) => d.includes(id)).length + (s.flags['constitution.clause'] === 'courts' ? 1 : 0) + Math.round(s.counters['mil.professional'] ?? 0);
}

/** How hard the forces hit, for offensives and missions: readiness 50 is ordinary. */
export const readinessFactor = (s: GameState) => 0.7 + ensureMilitary(s).readiness / 166;

/** The limits a mission keeps, and their names. */
export const draftOf = (id: string): MissionDraft | undefined => MISSIONS.find((x) => x.id === id);

export function canStartMission(s: GameState, id: string, movesLeft: number): { ok: boolean; reason?: string } {
  const d = draftOf(id);
  const m = ensureMilitary(s);
  if (!d) return { ok: false };
  if (m.missions.some((x) => !x.ended && x.theatre === d.theatre)) return { ok: false, reason: `A mission is already running in the ${ZONE_NAME[d.theatre]}.` };
  if (m.missions.filter((x) => !x.ended).length >= 2) return { ok: false, reason: 'The forces can run two campaigns at once.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < 3) return { ok: false, reason: 'Needs 3 political capital.' };
  return { ok: true };
}

/** Order a mission and hand it to the theatre commander. */
export function startMission(s: GameState, id: string, resources: Resources, kept: boolean[]): string {
  const d = draftOf(id)!;
  const m = ensureMilitary(s);
  const c = holder(s, `theatre.${d.theatre}`);
  s.pc = clamp(s.pc - 3, 0, 100);
  s.desk.actionsUsed += 1;
  const mission: Mission = { id, theatre: d.theatre, commander: c.id, resources, kept: d.limits.map((_, i) => kept[i] ?? true), started: s.turn, months: 12, gained: 0, harm: 0, log: [] };
  const dropped = d.limits.filter((_, i) => !mission.kept[i]);
  mission.log.push({ turn: s.turn, text: `Ordered: ${d.objective} ${RESOURCES[resources].name} resources. ${dropped.length ? `Limits dropped: ${dropped.join('; ')}.` : 'Every limit kept.'} Delegated to ${c.name}.` });
  m.missions.push(mission);
  if (dropped.length) m.conduct = clamp(m.conduct - 4 * dropped.length, 0, 100);
  m.history.push({ turn: s.turn, text: `Ordered a mission in the ${ZONE_NAME[d.theatre]}: ${d.objective}` });
  s.news.push({ chronicle: `ARMY LAUNCHES OPERATION IN THE ${ZONE_NAME[d.theatre].toUpperCase()}`, street: `SOLDIERS DON MOVE FOR ${ZONE_NAME[d.theatre].toUpperCase()}`, weight: 4, valence: 0, topic: 'security', body: d.objective });
  return `${c.name} takes command of the operation in the ${ZONE_NAME[d.theatre]}. What would show it worked: ${d.evidence} What has to follow: ${d.lasting}`;
}

/** What a month of the mission costs the treasury. */
export function missionCost(s: GameState): number {
  return ensureMilitary(s).missions.filter((x) => !x.ended).reduce((a, x) => a + RESOURCES[x.resources].perMonth, 0);
}

export function canEndMission(s: GameState, id: string): boolean {
  return ensureMilitary(s).missions.some((x) => x.id === id && !x.ended);
}

export function endMission(s: GameState, id: string, why = 'Ended by the President.'): string {
  const x = ensureMilitary(s).missions.find((y) => y.id === id && !y.ended);
  if (!x) return '';
  x.ended = s.turn;
  x.log.push({ turn: s.turn, text: why });
  return `The operation in the ${ZONE_NAME[x.theatre]} ends. ${Math.round(x.gained)} points of threat were taken off; ${local(s, x.theatre).cooperation >= 55 ? 'local cooperation is strong enough to hold them.' : 'without local cooperation, the gain will fade.'}`;
}

const local = (s: GameState, z: ZoneId) => ensureMilitary(s).local[z];

/** One month of one mission: the developments, in causal order. */
function missionMonth(s: GameState, x: Mission): void {
  const m = ensureMilitary(s);
  const d = draftOf(x.id)!;
  const c = holder(s, `theatre.${x.theatre}`);
  const r = RESOURCES[x.resources];
  const month = s.turn - x.started;
  const loc = m.local[x.theatre];
  const fit = MISSION_DOCTRINE[x.id] === c.doctrine ? 1.15 : 1;
  // The doctrine the President backed when the command disagreed.
  const backed = s.flags['mil.doctrine'];
  const tempo = backed === 'manoeuvre' ? 1.1 : backed === 'hold' ? 0.92 : 1;
  // What it achieves: readiness, the commander, doctrine, resources.
  const power = readinessFactor(s) * (0.7 + c.traits.competence * 0.1) * fit * r.weight * tempo * (1 - dollarShortage(s) * 0.5);
  const gain = Math.round(1.3 * power * 10) / 10;
  shiftThreat(s, x.theatre, -gain);
  x.gained += gain;
  loc.unheld += gain;
  // What it costs civilians: dropped limits, rough doctrine, poor intelligence, a commander who does not refuse.
  const dropped = x.kept.filter((k) => !k).length;
  const harm = r.weight * (backed === 'manoeuvre' ? 1.2 : 1) * (0.25 + dropped * 0.5) * (ROUGH.includes(c.doctrine) ? 1.3 : 1) * (1 - m.intel / 150) * ((6 - c.traits.restraint) / 4);
  x.harm += harm;
  loc.displaced = Math.round((loc.displaced + gain * 2 + harm * 6) * 10) / 10;
  if (harm < 0.45 && m.conduct >= 50) loc.cooperation = clamp(loc.cooperation + 1.2 + (backed === 'hold' ? 0.3 : 0), 0, 100);
  else loc.cooperation = clamp(loc.cooperation - harm * 2.5, 0, 100);
  m.conduct = clamp(m.conduct - Math.max(0, harm - 0.4) * 2, 0, 100);
  applyFx(s, [`zone.${x.theatre}.approval`, harm > 0.6 ? -0.4 : 0.15]);
  // The developments a year of campaign produces, each caused by what came before.
  const routine = professional(s) >= 2;
  const say = (text: string, report = true) => { x.log.push({ turn: s.turn, text }); if (report && !(routine && month === 1)) s.report.push({ kind: 'consequence', title: `The operation in the ${ZONE_NAME[x.theatre]}`, cause: c.name, text, changes: [] }); };
  if (month === 1) say(`${dollarShortage(s) > 0.2 ? 'Half the helicopters are grounded for parts bought in dollars; the ground forces move without them.' : 'The forces deploy on schedule, with the aircraft they were promised.'} ${Math.round(gain * 10) / 10} points off the threat in the first month.`);
  if (harm > 0.8 && rand(s) < 0.5) {
    const id = `ab.${x.id}.${s.turn}`;
    const where = Object.values(STATE_BY_ID).find((st) => st.zone === x.theatre)?.name ?? ZONE_NAME[x.theatre];
    const text = `During the operation in ${where}, a ${c.doctrine === 'air' || x.resources === 'surge' ? 'strike' : 'cordon-and-search'} killed civilians. The unit's report and the villagers' accounts do not agree.`;
    m.abuses.push({ id, zone: x.theatre, text, turn: s.turn, officer: c.id || undefined });
    say(text);
    s.news.push({ chronicle: `CIVILIANS KILLED IN MILITARY OPERATION, VILLAGERS SAY`, street: 'SOLDIERS DON KILL PEOPLE FOR VILLAGE — WITNESSES', weight: 6, valence: -1, topic: 'security', body: text });
    // An officer who disagrees with the conduct leaks the unit's own report.
    if (m.intel > 50 || rand(s) < 0.35) { s.flags['mil.leak'] = id; applyFx(s, ['pressure.scandalHeat', 4]); }
  }
  if (month === 3) say(`Evidence after three months: ${evidenceText(s, x)}`);
  if (month === 6) {
    const tie = c.tie.startsWith('gov_') ? c.tie : '';
    if (loc.cooperation < 40) say(`Six months in, the communities have stopped talking to the troops. ${tie ? 'The governor, who is close to the commander, says the army is doing its best; the local press says otherwise.' : 'The press asks what the operation is for.'}`);
    else say(`Six months in, people are coming back and telling the troops who is coming. ${tie ? 'The governor claims the credit.' : ''}`.trim());
  }
  if (month === 9 && x.resources === 'surge' && holder(s, 'procurement').traits.integrity <= 2) {
    s.flags['mil.procurement.due'] = x.id;
    say('The surge was supplied through emergency contracts. Some of what was paid for has not arrived.');
  }
  if (month >= x.months) {
    say(`After a year: ${evidenceText(s, x)} ${loc.cooperation >= 55 ? 'The gain is held: people are reporting, and the ground stays cleared.' : `Without local cooperation the gain will fade unless ${d.lasting.charAt(0).toLowerCase()}${d.lasting.slice(1)}`}`);
    x.ended = s.turn;
  }
}

/** The mission's evidence, in the terms its draft promised. */
export function evidenceText(s: GameState, x: Mission): string {
  const loc = ensureMilitary(s).local[x.theatre];
  return `threat down ${Math.round(x.gained)} points; local cooperation ${Math.round(loc.cooperation)}; ${Math.round(loc.displaced)} thousand people displaced; civilian harm ${x.harm < 2 ? 'low' : x.harm < 5 ? 'serious' : 'grave'}.`;
}

/** Each month: pay, spares, backlog, readiness, missions, and whether gains are held. */
export function militaryTick(s: GameState): void {
  const m = ensureMilitary(s);
  m.arrears = s.nation.fiscalSpace < 0.05 ? m.arrears + 1 : Math.max(0, m.arrears - 1);
  const log = holder(s, 'logistics');
  m.backlog = clamp(m.backlog + 0.8 + dollarShortage(s) * 2 - (log.traits.competence - 2) * 0.4 - builtFor(s, 'depots'), 0, 100);
  m.intel = clamp(m.intel + ((35 + holder(s, 'intelligence').traits.competence * 5 + professional(s) * 2 + builtFor(s, 'intel')) - m.intel) * 0.1, 0, 100);
  m.conduct = clamp(m.conduct + (55 + professional(s) * 5 - m.conduct) * 0.03, 0, 100);
  m.readiness = Math.round((m.readiness + (readinessTarget(s).v - m.readiness) * 0.15) * 10) / 10;
  for (const x of m.missions) if (!x.ended) missionMonth(s, x);
  inquiryTick(s);
  // A gain is held where people cooperate; elsewhere the fighters return to the ground the army left.
  for (const z of ZONES) {
    const loc = m.local[z];
    if (loc.unheld <= 0.05) { loc.unheld = 0; continue; }
    const active = m.missions.some((x) => !x.ended && x.theatre === z);
    if (loc.cooperation >= 55) loc.unheld *= 0.9;
    else if (!active) { const back = loc.unheld * 0.08; shiftThreat(s, z, back); loc.unheld -= back; }
    loc.displaced = Math.max(0, Math.round((loc.displaced - (loc.cooperation >= 55 ? 1.5 : 0.3)) * 10) / 10);
  }
  // Displacement is felt where people fled.
  for (const z of ZONES) if (m.local[z].displaced > 40) applyFx(s, [`zone.${z}.approval`, -0.1]);
  syncSecurity(s);
}

/** Exceptional and causally grounded: only when several real grievances line up. */
export function coupRisk(s: GameState): { causes: string[]; risk: number } {
  const m = ensureMilitary(s);
  const causes: string[] = [];
  if (m.arrears >= 4) causes.push(`Pay has been late for ${m.arrears} months`);
  if (m.misused >= 2) causes.push('The forces have been used against civilians at the President\'s order');
  const buried = m.abuses.filter((a) => a.resolved === 'buried').length;
  if (buried >= 2) causes.push('Abuses have been buried, and officers know who ordered it');
  const ambitious = OFFICERS.filter((o) => Object.values(m.posts).includes(o.id) && o.traits.ambition >= 3 && o.traits.clout >= 3 && o.tie !== 'president');
  if (ambitious.length) causes.push(`An ambitious commander with a following: ${ambitious.map((o) => o.short).join(', ')}`);
  if (s.blocs.street < 25) causes.push('The street has turned on the government');
  if (professional(s) >= 2) causes.length = Math.max(0, causes.length - 1); // professional forces settle grievances by rule
  return { causes, risk: causes.length >= 3 ? Math.min(0.9, 0.2 * causes.length) : 0 };
}

// ---------------------------------------------------------------- appointments

/** Who could hold a post: named officers of a fitting service, or the next in seniority. */
export function candidatesFor(s: GameState, post: string): Officer[] {
  const m = ensureMilitary(s);
  const service = OFFICERS.find((o) => o.post === post)?.service;
  return OFFICERS.filter((o) => o.id !== m.posts[post] && (post.startsWith('theatre.') ? o.service === 'army' || o.service === 'navy' : service === 'joint' || o.service === service || post === 'cds'));
}

export function canAppoint(s: GameState, post: string, officer: string, movesLeft: number): { ok: boolean; reason?: string } {
  const m = ensureMilitary(s);
  if (m.posts[post] === officer) return { ok: false, reason: 'Already in post.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < 3) return { ok: false, reason: 'Needs 3 political capital.' };
  return { ok: true };
}

/** Move an officer into a post (their old post goes to the next in seniority), or retire the holder ('' appoints the deputy). */
export function appoint(s: GameState, post: string, officer: string): string {
  const m = ensureMilitary(s);
  const out = holder(s, post);
  for (const [p, id] of Object.entries(m.posts)) if (officer && id === officer) m.posts[p] = '';
  m.posts[post] = officer;
  s.pc = clamp(s.pc - 3, 0, 100);
  s.desk.actionsUsed += 1;
  const inn = holder(s, post);
  // A commander with a following is not removed for free.
  if (out.id && out.traits.clout >= 3) applyFx(s, ['bloc.establishment', -3]);
  if (out.tie.startsWith('gov_') && s.people[out.tie]) s.people[out.tie].rel = clamp(s.people[out.tie].rel - 6, 0, 100);
  for (const x of m.missions) if (!x.ended && `theatre.${x.theatre}` === post) { x.commander = inn.id; x.log.push({ turn: s.turn, text: `${inn.name} takes over from ${out.name}.` }); }
  m.history.push({ turn: s.turn, text: `${inn.name} appointed ${POST_TITLE[post] ?? post}, replacing ${out.name}.` });
  return `${inn.name} is now ${POST_TITLE[post] ?? post}. ${out.id ? `${out.name} ${officer ? 'moves aside' : 'retires'}.` : ''}`.trim();
}

/** What the military's operating assets (depots, repaired fleets, the fusion centre) add, at their actual output. */
export function builtFor(s: GameState, key: 'readiness' | 'depots' | 'spares' | 'intel'): number {
  return assets(s).reduce((a, x) => a + (ASSET_SYSTEMS[x.id]?.military?.[key] ?? 0) * assetPerformance(s, x.id).k, 0);
}

hooks.missionCost = missionCost;
hooks.military = (s, p) => {
  const m = ensureMilitary(s);
  switch (p[0]) {
    case 'readiness': return m.readiness;
    case 'intel': return m.intel;
    case 'conduct': return m.conduct;
    case 'arrears': return m.arrears;
    case 'cooperation': return m.local[p[1] as ZoneId]?.cooperation ?? 0;
    case 'competence': return holder(s, p.slice(1).join('.')).traits.competence;
    case 'integrity': return holder(s, p.slice(1).join('.')).traits.integrity;
    case 'coup': return coupRisk(s).causes.length;
    case 'abuses': return m.abuses.filter((a) => !a.resolved).length;
    case 'professional': return professional(s);
    case 'missions': return m.missions.filter((x) => !x.ended).length;
    case 'refuse': return wouldRefuse(s) ? 1 : 0;
    default: return 0;
  }
};

/** For the theatres panel: what a theatre's forces are doing and what holds. */
export function theatreMilitary(s: GameState, z: ZoneId) {
  const m = ensureMilitary(s);
  return { commander: holder(s, `theatre.${z}`), local: m.local[z], mission: m.missions.find((x) => !x.ended && x.theatre === z) };
}

// ---------------------------------------------------------------- the institution's politics (files call these through engine/ops.ts)

/** Open an inquiry. It reports in four months, on what it actually finds. */
export function openInquiry(s: GameState, subject: string): string {
  const m = ensureMilitary(s);
  if (m.inquiries.some((q) => q.subject === subject && q.status === 'open')) return '';
  m.inquiries.push({ id: `inq.${subject}.${s.turn}`, subject, opened: s.turn, status: 'open' });
  m.history.push({ turn: s.turn, text: `Opened an inquiry: ${subject}.` });
  return 'A board of inquiry is convened, with civilian members and four months to report.';
}

function inquiryTick(s: GameState): void {
  const m = ensureMilitary(s);
  for (const q of m.inquiries) {
    if (q.status !== 'open' || s.turn - q.opened < 4) continue;
    q.status = 'closed';
    if (q.subject === 'procurement') {
      const p = holder(s, 'procurement');
      if (p.traits.integrity <= 2) {
        q.finding = `The agent's fee was a kickback. ${p.name} is retired; part of the money is recovered.`;
        m.posts.procurement = '';
        applyFx(s, ['nation.fiscalSpace', 0.1]); applyFx(s, ['bloc.establishment', -3]); applyFx(s, ['nation.integrity', 2]);
        if (s.people[p.tie]) s.people[p.tie].rel = clamp(s.people[p.tie].rel - 8, 0, 100);
      } else q.finding = 'Poor paperwork, no theft. The procedures are tightened.';
    } else q.finding = 'The board reports. Its recommendations are published.';
    s.report.push({ kind: 'consequence', title: `The board of inquiry reports: ${q.subject}`, text: q.finding, changes: [] });
    m.history.push({ turn: s.turn, text: `Inquiry into ${q.subject}: ${q.finding}` });
  }
}

/** What becomes of a harm to civilians on the record: the latest one leaked, or the oldest still open. */
export function resolveAbuse(s: GameState, how: 'prosecuted' | 'compensated' | 'buried'): string {
  const m = ensureMilitary(s);
  const leaked = String(s.flags['mil.leak'] ?? '');
  const a = m.abuses.find((x) => x.id === leaked && !x.resolved) ?? m.abuses.find((x) => !x.resolved);
  delete s.flags['mil.leak'];
  if (!a) return '';
  a.resolved = how;
  const loc = m.local[a.zone];
  if (how === 'prosecuted') { m.conduct = clamp(m.conduct + 6, 0, 100); loc.cooperation = clamp(loc.cooperation + 6, 0, 100); }
  if (how === 'compensated') { loc.cooperation = clamp(loc.cooperation + 3, 0, 100); applyFx(s, ['nation.fiscalSpace', -0.02]); }
  if (how === 'buried') { m.conduct = clamp(m.conduct - 5, 0, 100); loc.cooperation = clamp(loc.cooperation - 4, 0, 100); }
  m.history.push({ turn: s.turn, text: `${how === 'prosecuted' ? 'Prosecuted' : how === 'compensated' ? 'Compensated the victims of' : 'Buried'}: ${a.text}` });
  return '';
}

/** An order to use the forces against civilians at home: obeyed, or refused by a commander who will not. */
export function misuse(s: GameState, complied: boolean): string {
  const m = ensureMilitary(s);
  if (complied) {
    m.misused += 1;
    m.conduct = clamp(m.conduct - 8, 0, 100);
    m.abuses.push({ id: `misuse.${s.turn}`, zone: 'SW', text: 'Soldiers were deployed against a protest at the President\'s order. People died.', turn: s.turn, officer: m.posts.cds || undefined });
  } else {
    m.refused += 1;
    m.conduct = clamp(m.conduct + 3, 0, 100);
  }
  m.history.push({ turn: s.turn, text: complied ? 'The forces were used against a protest at the President\'s order.' : 'The Chief of Defence Staff refused, in writing, to deploy soldiers against a protest.' });
  return '';
}

/** Would the command refuse an unlawful domestic order? Restraint, professionalisation and the record decide. */
export function wouldRefuse(s: GameState): boolean {
  return holder(s, 'cds').traits.restraint + professional(s) >= 5;
}

/** Retire whoever holds a post; the next in seniority takes it. */
export function retirePost(s: GameState, post: string): string {
  const m = ensureMilitary(s);
  // 'ambitious': the commander with a following whom intelligence named.
  if (post === 'ambitious') post = Object.entries(m.posts).find(([, id]) => { const o = OFFICER_BY_ID[id]; return o && o.traits.ambition >= 3 && o.traits.clout >= 3; })?.[0] ?? '';
  if (!post) return '';
  const out = holder(s, post);
  m.posts[post] = '';
  m.history.push({ turn: s.turn, text: `${out.name} retired from ${POST_TITLE[post] ?? post}.` });
  return `${out.name} retires. The next officer in seniority takes over.`;
}

/** Settling a dispute in the command: garrisons and cooperation, or raids and speed. */
export function setDoctrine(s: GameState, d: 'hold' | 'manoeuvre' | 'settled'): string {
  s.flags['mil.doctrine'] = d;
  ensureMilitary(s).history.push({ turn: s.turn, text: d === 'settled' ? 'Left the command to settle its own dispute by its procedures.' : `Backed ${d === 'hold' ? 'garrisons that hold ground' : 'mobile raids'} in the command's dispute.` });
  return '';
}
