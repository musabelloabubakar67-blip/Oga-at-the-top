// Core types for the slice. See docs/gdd for the full model; the slice
// simulates blocs at bloc level and a reduced set of nation variables.

export type BlocId = 'villa' | 'party' | 'street' | 'establishment' | 'press';
export type ZoneId = 'NW' | 'NE' | 'NC' | 'SW' | 'SE' | 'SS';
export type Tone = 'grave' | 'dry' | 'farce' | 'absurd';
export type Kind = 'standalone' | 'recurring' | 'chain' | 'threshold' | 'calendar';
export type Category =
  | 'economy' | 'labour' | 'security' | 'infrastructure' | 'politics'
  | 'scandal' | 'ceremonial' | 'fortune' | 'temptation';
export type FlagValue = string | number | boolean;
export type Op = '<' | '<=' | '>' | '>=' | '==' | '!=';
export type OutletId = 'chronicle' | 'street' | 'stakeholder' | 'rejoinder';
export type DebtId = 'eurobond' | 'bonds' | 'ways' | 'gas' | 'contractors' | 'pensions';
export type FundId = 'abroad' | 'buffer' | 'infra' | 'growth';
export type SectorId = 'security' | 'power' | 'people' | 'agric' | 'debt' | 'padding';
/** What a story is about, so the paper can comment on the right thing. */
export type Topic =
  | 'prices' | 'money' | 'power' | 'security' | 'politics' | 'scandal'
  | 'labour' | 'reform' | 'bet' | 'oil' | 'people' | 'general';
export type Stance = 'record' | 'street' | 'loyal' | 'hostile';

export type Cond =
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond }
  | { v: [string, Op, number] }
  | { flag: string; is?: FlagValue }
  | { turn: [number, number?] }
  | { termTurn: [number, number?] }
  | { term: 1 | 2 }
  | { month: number[] }
  | { chose: [string, string] }
  | { fired: string }
  | { never: string };

/** [target, delta, spread?] — e.g. ['bloc.street', -8, 2] */
export type Fx = [string, number, number?];
/** [operation, ...arguments] */
export type Op2 = [string, ...(string | number)[]];

export interface Later {
  after: number | [number, number];
  fx: Fx[];
  label: string;
  when?: Cond;
  /** If set, lands on the front page when the effect arrives. */
  note?: [string, string];
}

export interface Follow {
  event: string;
  after: number | [number, number];
  chance?: number;
  when?: Cond;
}

export interface ExposureSpec {
  kind: 'tolerated' | 'political' | 'personal';
  amount: number; // ₦bn
  witnesses: string[];
  trail: 0 | 1 | 2 | 3;
}

export interface Outcome {
  when?: Cond;
  chance?: number;
  result: string;
  fx?: Fx[];
  later?: Later[];
  flags?: Record<string, FlagValue>;
  follow?: Follow[];
  /** [broadsheet headline, youth outlet headline] */
  news?: [string, string];
  newsWeight?: number;
  archive: string;
  sig?: 1 | 2 | 3;
  exposure?: ExposureSpec;
  /** [characterId, relationship delta, note] */
  memory?: [string, number, string][];
  /** Operations that need more than a number: ['paydebt', 'gas', 1], ['grant', '$WHO'] and so on. See engine/ops.ts. */
  ops?: Op2[];
  /** Something owed: [who, 'owed' (to you) | 'owing' (by you), size]. `who` may be a cast key such as $WHO. */
  favour?: [string, 'owed' | 'owing', number];
  /** Ends the presidency: resignation or removal. */
  ends?: 'resigned' | 'removed' | 'annulled';
}

export interface Choice {
  id: string;
  label: string;
  detail?: string;
  requires?: Cond;
  /** Shown instead of hiding the option when `requires` fails. */
  locked?: string;
  pc?: number;
  /** ₦tn from fiscal space */
  naira?: number;
  /** ₦bn from the purse */
  purse?: number;
  sign?: boolean;
  outcomes: Outcome[];
}

export interface Read {
  role: string;
  on?: string;
  good: string;
  weak?: string;
}

export type Block = string | { when: Cond; text: string };

/** [path, direction] — archive entries that pushed `path` in `direction` are shown in the trace. */
export type TraceRef = [string, 1 | -1];

export interface GameEvent {
  id: string;
  kind: Kind;
  slot: 'lead' | 'minor';
  category: Category;
  tone: Tone;
  intensity: 1 | 2 | 3 | 4 | 5;
  when?: Cond;
  weight?: number;
  /** Multiply weight by value/50 of this path. */
  weightBy?: string;
  /** Multiply weight by (100 - value)/50 of this path. */
  weightInv?: string;
  cooldown?: number;
  max?: number;
  office: string;
  stamp?: 'ROUTINE' | 'URGENT' | 'CONFIDENTIAL' | 'SECRET';
  channel?: 'file' | 'phone';
  from?: string;
  title: string;
  body: Block[];
  statement?: string;
  trace?: TraceRef[];
  reads?: Read[];
  choices: Choice[];
  /** People and things this file is about, chosen from the state when it is drawn: token -> selector. */
  cast?: Record<string, string>;
  topic?: Topic;
  /** Arises from something the President did. Weighted well above generic events. */
  reactive?: boolean;
  /** Minor matters only: applied if left unanswered at month end. */
  ignored?: Outcome;
}

export interface Nation {
  inflation: number; // % y/y
  petrolPrice: number; // ₦/litre
  fiscalSpace: number; // ₦tn
  debt: number; // debt service as % of revenue
  security: number; // 0-100
  power: number; // 0-100
  capacity: number; // 0-100
  integrity: number; // 0-100
  jobs: number; // 0-100: industry and employment
}

export interface Pressures {
  fuelSupplyStress: number;
  wageGrievance: number;
  scandalHeat: number;
}

export interface Character {
  id: string;
  role: string;
  name: string;
  short: string;
  competence: number;
  clout: number;
  loyalty: number;
  integrity: number;
  /** Who they really serve: 'president', 'self', or a businessman's, governor's or senator's id. Hidden; it shows in their record. */
  patron?: string;
  /** What the files say about them, which is not always the truth. */
  rep?: { competence: number; loyalty: number };
  rel: number; // -100..100
  zone?: ZoneId;
  blurb?: string;
  notes: { turn: number; delta: number; note: string }[];
}

export interface Scheduled {
  due: number;
  fx: Fx[];
  label: string;
  when?: Cond;
  note?: [string, string];
  causeId: string;
}

export interface ArchiveEntry {
  id: string;
  turn: number; // <= 0 means a previous administration
  eventId: string;
  choiceId: string;
  category: Category | 'inherited' | 'action';
  headline: string;
  sig: 1 | 2 | 3;
  sealed?: boolean;
  /** net delta per target touched, including scheduled effects and flags (as 'flag:name') */
  touches: Record<string, number>;
}

export interface Exposure extends ExposureSpec {
  turn: number;
  causeId: string;
  label: string;
}

export interface NewsSeed {
  chronicle: string;
  street: string;
  weight: number;
  /** The story under the headline. */
  body?: string;
  /** Good or bad for the government, for choosing who is quoted. */
  valence?: number;
  topic?: Topic;
  /** The person, tycoon or rival the story concerns. */
  about?: string;
  /** Headlines written for the partisan papers. Without them they reframe the broadsheet's. */
  loyal?: string;
  hostile?: string;
  /** "Part two of three". */
  series?: string;
  /** A grave story: every paper prints it straight. */
  grave?: boolean;
}

export interface FrontPage {
  outlet: OutletId;
  stance: Stance;
  turn: number;
  /** "June 2027". */
  date?: string;
  /** The line above the headline: how this paper frames it. */
  strap?: string;
  lead: string;
  /** What actually happened, when the headline is somebody's reaction to it. */
  fact?: string;
  standfirst: string;
  others: string[];
  sidebar?: { kicker: string; text: string };
  special?: string;
  series?: string;
  body?: string;
  quotes?: { who: string; role: string; line: string }[];
  figures?: { label: string; value: string; dir: 1 | 0 | -1; good: boolean }[];
  editorial?: string;
  /** Who owns the paper, when that explains the coverage. */
  owner?: string;
}

export interface Favour { id: number; who: string; dir: 'owed' | 'owing'; size: number; why: string; turn: number }

export interface Mark { turn: number; d: number; text: string }

export interface PersonState {
  rel: number;
  granted: boolean;
  compliantUntil?: number;
  courted: number[];
  /** Set when a minister has been replaced. */
  name?: string;
  short?: string;
  competence?: number;
  clout?: number;
  integrity?: number;
  ambition?: number;
  bio?: string;
  /** What they have been given and refused: each grant makes the next ask bigger; two refusals make a grudge. */
  grants?: number;
  grantedAt?: number;
  refusals?: number;
  refusedAt?: number;
  grudge?: boolean;
  /** Ministers: what the files say their competence is, when it differs from the truth. The truth shows after ten months, or with published scorecards. */
  repCompetence?: number;
  /** Ministers: when they took the brief, and what their numbers were then. */
  since?: number;
  base?: number;
  marks?: Mark[];
  /** Has crossed to the opposition. */
  gone?: boolean;
}

export interface TycoonState { rel: number; granted: boolean; squeezed?: number; reasons: string[]; /** Granted by a predecessor: it stands, but the gratitude went with them. */ inherited?: boolean; /** When the President last made time for them, and how often. */ courted?: number; courtN?: number }

export interface Budget {
  /** The fiscal year this budget covers. */
  year: number;
  /** The oil price it assumes, in dollars. */
  benchmark: number;
  alloc: Record<SectorId, number>;
  /** A new bill is on the desk and must be signed. */
  due: boolean;
  late?: boolean;
  /** Last year's allocation: what people now expect. */
  prevAlloc?: Record<SectorId, number>;
  /** Where the works money is spent, in points by zone. */
  sites?: Partial<Record<ZoneId, number>>;
  /** Points the budget held when signed, after inflation. */
  points?: number;
  /** Your instruction on releasing each sector's increase. */
  release?: Partial<Record<SectorId, 'normal' | 'full' | 'hold'>>;
  /** The Assembly's version, waiting for your answer. */
  pending?: { benchmark: number; alloc: Record<SectorId, number>; amended: Record<SectorId, number>; insert: number; sites?: Partial<Record<ZoneId, number>>; points: number };
  /** The year a supplementary budget was passed. */
  supplementary?: number;
  /** This bill reopens the current year's budget. */
  reopened?: boolean;
}

export interface Story { id: string; about?: string; /** Who held the job when the series began. */ name?: string; stage: number; next: number }

export interface RivalMove { turn: number; rival: string; text: string }

/** Help the President can attach to a decision. */
export interface Aid { favour?: number; minister?: boolean }

export interface Change { label: string; delta: number; good: boolean; text: string }

export interface DeskItem {
  eventId: string;
  /** Who and what this file is about: token -> id. */
  cast?: Record<string, string>;
  /** A second adviser asked for their forecast, at the cost of a move. */
  second?: string;
  resolved?: { choiceId: string; label: string; result: string; signed?: boolean; changes?: Change[] };
}

export interface Milestone {
  id: string;
  name: string;
  blurb: string;
  pc: number;
  naira: number;
  months: number;
  needs?: Cond;
  needsText?: string;
  /** What the crowd, the party or a businessman wants, whatever it costs. The scripted reformers skip these. */
  popular?: boolean;
  /** Political cost paid when the reform is launched. */
  start?: Fx[];
  /** What people feel every month while it is under way, before it pays. Shown before launching. */
  during?: Fx[];
  /** Why it hurts while under way, in a line. */
  duringText?: string;
  /** What it delivers when it is finished. */
  done: Fx[];
  /** Facts about the world that become true when it is delivered. */
  flags?: Record<string, FlagValue>;
  /** What it changes in how the country works, for as long as it stands. Shown before signing. */
  lasting?: string;
  news: [string, string];
  archive: string;
}

export interface Track {
  id: string;
  name: string;
  goal: string;
  metric: string;
  /** The items can be taken in any order. */
  loose?: boolean;
  milestones: Milestone[];
}

export interface ReportItem { title: string; cause?: string; text?: string; changes: Change[]; kind: 'consequence' | 'reform' | 'failure' }

export type ZoneState = { approval: number; lean: number };

export type Background = 'governor' | 'technocrat' | 'legislator' | 'outsider';

export interface President {
  name: string;
  party: string;
  partyShort: string;
  home: string;
  homeZone: ZoneId;
  background: Background;
  address: 'sir' | 'ma';
}

export interface StateResult {
  id: string;
  name: string;
  zone: ZoneId;
  voters: number;
  share: number; // incumbent side %
  opp: number;
  won: boolean;
  line?: string;
}

export interface ElectionResult {
  turn: number;
  kind: 'reelection' | 'succession';
  states: StateResult[];
  votesFor: number;
  votesAgainst: number;
  spread: number; // units with >= 25%
  approval: number;
  margin: number; // percentage points, two-party
  won: boolean;
  /** How far the national mood on the day moved the vote, in points of share; positive is towards the President's side. */
  swing?: number;
}

export type EndingKind = 'term_limit' | 'defeated' | 'ticket_denied' | 'removed' | 'resigned' | 'annulled';

export interface GameState {
  version: 3;
  setup: Setup;
  /** How many presidencies this world has had before this one. */
  era: number;
  /** The year this presidency was sworn in. */
  startYear: number;
  /** Who held the office before, if the player did. */
  predecessor: Predecessor | null;
  seed: number;
  rng: number;
  phase: 'papers' | 'desk' | 'election' | 'verdict';
  turn: number;
  term: 1 | 2;
  president: President;
  nation: Nation;
  petrolRef: number;
  hist: Nation[];
  baseline: Nation & { approval: number; hardship: number };
  pressures: Pressures;
  blocs: Record<BlocId, number>;
  blocsPrev: Record<BlocId, number>;
  zones: Record<ZoneId, ZoneState>;
  approvalPrev: number;
  stateLean: Record<string, number>;
  pc: number;
  purse: number;
  purseTaken: { political: number; personal: number };
  campaign: { chest: number; rallies: Partial<Record<ZoneId, number>> };
  chars: Record<string, Character>;
  flags: Record<string, FlagValue>;
  ledger: Scheduled[];
  queue: { event: string; due: number; when?: Cond }[];
  fired: Record<string, number[]>;
  choices: Record<string, string>; // eventId -> last choiceId
  recent: { tone: Tone; category: Category; intensity: number }[];
  archive: ArchiveEntry[];
  exposures: Exposure[];
  desk: { lead: DeskItem | null; minors: DeskItem[]; actionsUsed: number; drawerUsed: boolean; note: string };
  news: NewsSeed[];
  papers: FrontPage[];
  election: ElectionResult | null;
  succession: ElectionResult | null;
  ending: EndingKind | null;
  counters: Record<string, number>;
  agenda: { tracks: string[]; done: string[]; active: { id: string; progress: number; greased?: boolean }[]; failed: { id: string; turn: number }[] };
  ventures: { active: { id: string; progress: number }[]; won: string[]; lost: string[]; causes: Record<string, string> };
  /** Everyone who could be appointed to anything. Created on first use. */
  talent?: { pool: { id: string; name: string; short: string; spec: 'economics' | 'security' | 'law' | 'administration' | 'engineering' | 'politics' | 'media'; zone: ZoneId; competence: number; loyalty: number; integrity: number; clout: number; ambition: number; patron: string; rep: { competence: number; loyalty: number; integrity: number }; blurb: string; until: number; checked?: boolean }[]; taken: string[]; seq: number };
  /** Where each big bet is being built: venture id to state id. */
  sites?: Record<string, string>;
  /** Big bets that worked and now run every month. */
  assets?: { id: string; state: string; head: { name: string; competence: number; loyalty: number; integrity: number; patron: string; rep: { competence: number; loyalty: number }; blurb?: string }; since: number; seen?: boolean; /** Expansions finished, and the month the one under way finishes. */ level?: number; expanding?: number; /** What it has done, in its own units. */ record?: Record<string, number> }[];
  /** Other things put in a state: abandoned sites, monuments. */
  placed?: { state: string; kind: 'abandoned' | 'monument'; label: string; turn: number }[];
  /** The naira: official and street rates, reserves ($bn), the central bank's stance, the last year of rates. */
  fx?: { rate: number; fair: number; parallel: number; reserves: number; stance: 'peg' | 'managed' | 'float'; hist: number[]; base: number };
  /** Each budget's oil forecast, checked against what oil did over the year. */
  oilForecasts?: { turn: number; said: number; by: string; sum: number; n: number }[];
  /** The Supreme Court. Seeded on first use. */
  bench?: { seats: ({ name: string; short: string; lean: 'you' | 'free' | 'them'; integrity: number; retires: number; chief?: boolean; mine?: boolean; blurb: string } | null)[]; packed: number; spent: string[]; /** Court of Appeal justices put forward as the named nominees run out. */ extra?: { name: string; short: string; lean: 'you' | 'free' | 'them'; integrity: number; blurb: string; senate: number; fx: [string, number][] }[]; seq?: number };
  /** Every order given, for wear-out. */
  orderLog?: { id: string; turn: number; target?: string }[];
  /** Who has been hit by a hostile order, and until when they will not forget. */
  wronged?: { who: string; kind: string; turn: number; what: string; until: number }[];
  /** What orders have built that keeps running, and who heads each. */
  /** Where appointees from the talent pool come from, by name. */
  origins?: Record<string, ZoneId>;
  /** Prosecutions under way and decided: who, for what, and where it stands. */
  cases?: { id: string; who: string; name: string; what: string; opened: number; stage: 'charged' | 'trial'; months: number; trialFrom?: number; recover: number; by: 'agency' | 'prosecutors'; backed?: boolean; leaned?: boolean; outcome?: 'convicted' | 'acquitted' | 'dropped' | 'fled'; closed?: number }[];
  institutions?: { id: string; head: { name: string; competence: number; loyalty: number; integrity: number; patron: string; rep: { competence: number; loyalty: number }; blurb?: string; spec?: string; fit?: boolean }; since: number; seen?: boolean; /** When it was set up, for ramp-up; `since` is when the head took over. */ founded?: number; funding?: 'lean' | 'standard' | 'generous'; /** What it has done since it was set up, in its own units. */ record?: Record<string, number> }[];
  /** Every adviser's forecasts, checked against what happened. */
  advice?: { role: string; turn: number; event: string; choice: string; followed: boolean; miss: number; served?: string }[];
  /** What is happening to the country from outside, and what already has. */
  shocks: { active: { id: string; since: number; until: number; felt?: Record<string, number> }[]; seen: string[]; last: number };
  report: ReportItem[];
  prev: Record<string, number>;
  /** Powers of the moment currently on offer. */
  offers: { id: string; since: number; until: number }[];
  people: Record<string, PersonState>;
  opposition: Record<string, number>;
  /** What the rivals have done lately, newest last. */
  oppLog: RivalMove[];
  /** Named debts, in ₦tn owed. nation.debt is derived from the three that bear interest. */
  debts: Record<DebtId, number>;
  funds: Record<FundId, number>;
  oil: { price: number; output: number; prev: number; /** Where the price is heading: [until turn, level]. */ path?: [number, number][] };
  budget: Budget;
  favours: Favour[];
  tycoons: Record<string, TycoonState>;
  /** Threat in each zone's theatre, 0-100. nation.security is derived from these. */
  theatres: Record<ZoneId, number>;
  /** Where the security effort is concentrated. */
  focus: ZoneId | null;
  /** Lines the papers have already printed: key -> turn. */
  used: Record<string, number>;
  stories: Story[];
  /** Big bets: which named risks have been warned about, and any rescue or delay. */
  bets: Record<string, { warned: string[]; rescued?: boolean; delayed?: number; partner?: boolean; revived?: boolean }>;
  lastAction: { text: string; changes: Change[] } | null;
}

export interface Predecessor {
  name: string;
  party: string;
  epithet: string;
  /** The new President is of the same party. */
  sameParty: boolean;
  /** ₦bn the predecessor kept, and how findable it is. */
  kept: number;
  trail: number;
  ending: EndingKind;
}

export interface Setup {
  seed: number;
  /** The inheritance a new world starts from. */
  scenario?: string;
  name: string;
  party: string;
  partyShort: string;
  home: string;
  background: Background;
  address: 'sir' | 'ma';
  finance: string;
  priorities: string[];
}

export type ActionId =
  | 'address' | 'tour' | 'audit' | 'convene' | 'rally';

export type DrawerOp =
  | 'security_vote' | 'assembly' | 'campaign' | 'villa';

export type Action =
  | { type: 'DISMISS_PAPER' }
  | { type: 'CHOOSE'; eventId: string; choiceId: string; aid?: Aid }
  | { type: 'ACT'; action: ActionId; zone?: ZoneId }
  | { type: 'DRAWER'; op: DrawerOp }
  | { type: 'LAUNCH'; id: string; grease?: boolean }
  | { type: 'VENTURE'; id: string; site?: string }
  | { type: 'SET_MANAGER'; id: string; name: string }
  | { type: 'VENTURE_DELAY'; id: string }
  | { type: 'VENTURE_RESCUE'; id: string }
  | { type: 'VENTURE_REVIVE'; id: string }
  | { type: 'CASE'; id: string; op: 'back' | 'drop' }
  | { type: 'EXPAND_ASSET'; id: string }
  | { type: 'PERSON'; id: string; op: 'court' | 'grant' | 'pressure' | 'refuse' }
  | { type: 'PAY_DEBT'; id: DebtId; amount: number }
  | { type: 'SECURITISE' }
  | { type: 'FUND'; id: FundId; amount: number }
  | { type: 'BUDGET'; benchmark: number; alloc: Record<SectorId, number>; sites?: Partial<Record<ZoneId, number>> }
  | { type: 'BUDGET_RESOLVE'; choice: 'accept' | 'veto' | 'split' }
  | { type: 'BUDGET_RELEASE'; sector: SectorId; mode: 'normal' | 'full' | 'hold' }
  | { type: 'SUPPLEMENTARY' }
  | { type: 'FAVOUR'; id: number; use: string }
  | { type: 'TYCOON'; id: string; op: 'grant' | 'squeeze' | 'take' | 'court' }
  | { type: 'RIVAL'; id: string; op: 'coopt' | 'debate' | 'agencies' | 'spoiler' }
  | { type: 'FOCUS'; zone: ZoneId | null }
  | { type: 'REPLACE_MINISTER'; id: string; kind: 'technocrat' | 'party'; name?: string }
  | { type: 'ORDER'; id: string; target?: string; level?: number }
  | { type: 'REPEAL'; id: string }
  | { type: 'SECOND_OPINION'; eventId: string }
  | { type: 'REPLACE_ADVISER'; role: string; name: string }
  | { type: 'NOMINATE'; seat: number; name: string }
  | { type: 'GROOM'; id: string }
  | { type: 'GROOM_CREDIT'; id: string; reform: string }
  | { type: 'CHECK_CANDIDATE'; id: string }
  | { type: 'HEADHUNT'; role: string }
  | { type: 'ESTABLISH'; id: string; head: string }
  | { type: 'REPLACE_HEAD'; id: string; head: string }
  | { type: 'ABOLISH'; id: string }
  | { type: 'FUND_INSTITUTION'; id: string; level: 'lean' | 'standard' | 'generous' }
  | { type: 'REPLACE_FIN'; name: string }
  | { type: 'END_MONTH' }
  | { type: 'ELECTION_DONE' };
