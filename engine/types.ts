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
export type OutletId = 'chronicle' | 'street';

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
  /** Ends the presidency: resignation or removal. */
  ends?: 'resigned' | 'removed';
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
}

export interface FrontPage {
  outlet: OutletId;
  turn: number;
  lead: string;
  standfirst: string;
  others: string[];
  number: { label: string; value: string };
  sidebar: { kicker: string; text: string };
  special?: string;
  body?: string;
  quotes?: { who: string; role: string; line: string }[];
  figures?: { label: string; value: string; dir: 1 | 0 | -1; good: boolean }[];
  editorial?: string;
}

export interface Change { label: string; delta: number; good: boolean; text: string }

export interface DeskItem {
  eventId: string;
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
  /** Political cost paid when the reform is launched. */
  start?: Fx[];
  /** What it delivers when it is finished. */
  done: Fx[];
  /** Facts about the world that become true when it is delivered. */
  flags?: Record<string, FlagValue>;
  news: [string, string];
  archive: string;
}

export interface Track {
  id: string;
  name: string;
  goal: string;
  metric: string;
  milestones: Milestone[];
}

export interface ReportItem { title: string; cause?: string; text?: string; changes: Change[]; kind: 'consequence' | 'reform' | 'failure' }

export type ZoneState = { approval: number; security: number; lean: number };

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
}

export type EndingKind = 'term_limit' | 'defeated' | 'ticket_denied' | 'removed' | 'resigned';

export interface GameState {
  version: 2;
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
  paper: FrontPage | null;
  election: ElectionResult | null;
  succession: ElectionResult | null;
  ending: EndingKind | null;
  counters: Record<string, number>;
  agenda: { tracks: string[]; done: string[]; active: { id: string; progress: number; greased?: boolean }[]; failed: { id: string; turn: number }[] };
  ventures: { active: { id: string; progress: number }[]; won: string[]; lost: string[] };
  report: ReportItem[];
  prev: Record<string, number>;
  /** Powers of the moment currently on offer. */
  offers: { id: string; since: number; until: number }[];
  people: Record<string, { rel: number; granted: boolean; compliantUntil?: number; courted: number[]; name?: string; short?: string; competence?: number; clout?: number; bio?: string }>;
  opposition: Record<string, number>;
  lastAction: { text: string; changes: Change[] } | null;
}

export interface Setup {
  seed: number;
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
  | { type: 'CHOOSE'; eventId: string; choiceId: string }
  | { type: 'ACT'; action: ActionId; zone?: ZoneId }
  | { type: 'DRAWER'; op: DrawerOp }
  | { type: 'LAUNCH'; id: string; grease?: boolean }
  | { type: 'VENTURE'; id: string }
  | { type: 'PERSON'; id: string; op: 'court' | 'grant' | 'pressure' }
  | { type: 'REPLACE_MINISTER'; id: string; kind: 'technocrat' | 'party' }
  | { type: 'ORDER'; id: string }
  | { type: 'REPLACE_FIN'; name: string }
  | { type: 'END_MONTH' }
  | { type: 'ELECTION_DONE' };
