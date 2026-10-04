// SET PIECES
// Nights played by the clock. Each names who is in it from the state of the game,
// draws what is really happening from the state of the world, and lets the cast
// move on their own beats. Offices are generic; no real organisation is named.

import { PEOPLE } from './people';
import { NAMES } from './names';
import { BENCH } from './courts';
import { strongestRival, personView } from '../engine/people';
import { rivalOf } from '../engine/rivals';
import { ZONES, approval, hardship, standing } from '../engine/vars';
import type { Fx, GameState, Night, Topic } from '../engine/types';

export interface NightBeat { id: string; at: number; text: string | ((s: GameState, n: Night) => string); when?: (s: GameState, n: Night) => boolean; closes?: string[]; fx?: Fx[] }
export interface NightOption {
  id: string; label: string; minutes: number; text: string;
  from?: number; until?: number; needs?: string[]; not?: string[]; closes?: string[]; ends?: boolean;
  fx?: Fx[];
  /** What it turns out to mean at dawn, by what was really happening. */
  dawn?: Partial<Record<string, Fx[]>>;
  after?: Partial<Record<string, string>>;
}
export interface SetPiece {
  id: string; title: string; topic: Topic; start: number; dawn: number; chance: number;
  when: (s: GameState) => boolean;
  cast: Record<string, (s: GameState) => string | null>;
  opening: string;
  truths: { id: string; weight: (s: GameState) => number; title: string; reveal: string; fx?: Fx[]; news?: [string, string] }[];
  beats: NightBeat[];
  options: NightOption[];
  morning?: (s: GameState, n: Night) => void;
}

// Who is in it, by role.
const coldGovernor = (s: GameState) => PEOPLE.filter((p) => p.group === 'governor' && s.people[p.id] && !s.people[p.id].gone).sort((a, b) => standing(s, a.id) - standing(s, b.id))[0];
const govName = (s: GameState) => { const g = coldGovernor(s); return g ? personView(s, g.id).name : null; };
const vpName = (s: GameState) => s.vp?.name ?? null;
const quietAdviser = (s: GameState) => {
  const c = Object.values(s.chars).filter((x) => x.id !== 'cos' && x.id !== 'fin').sort((a, b) => a.loyalty - b.loyalty || a.rel - b.rel)[0];
  return c ? c.name : null;
};
const chiefJustice = (s: GameState) => s.bench?.seats.find((j) => j?.chief)?.name ?? BENCH.find((j) => j.chief)?.name ?? null;
const rivalName = (s: GameState) => rivalOf(s, strongestRival(s).id).name;
const cos = (s: GameState) => s.chars.cos?.name ?? null;
const shakyMinister = (s: GameState) => {
  const m = PEOPLE.filter((p) => p.group === 'minister' && s.people[p.id] && !s.people[p.id].gone).sort((a, b) => (personView(s, a.id).integrity ?? 3) - (personView(s, b.id).integrity ?? 3))[0];
  return m ? personView(s, m.id).name : null;
};
const cold = (s: GameState) => { const g = coldGovernor(s); return !!g && standing(s, g.id) < 50; };
const vpRestless = (s: GameState) => !!s.vp && ((s.vp.rel ?? 50) < 55 || (s.vp.ambition ?? 0) >= 2);
const chiefsFresh = (s: GameState) => s.turn - (s.counters['order.chiefs'] ?? -99) < 18;
const t = (truth: string) => (_s: GameState, n: Night) => n.truth === truth;
const not = (truth: string) => (_s: GameState, n: Night) => n.truth !== truth;

export const NIGHTS: SetPiece[] = [
  // ------------------------------------------------------------------ coup rumours
  {
    id: 'coup', title: 'The night of the rumour', topic: 'security', start: 40, dawn: 360, chance: 0.08,
    when: (s) => s.nation.security < 35 || approval(s) < 38 || ZONES.some((z) => s.theatres[z] >= 75) || (s.counters['order.chiefs'] !== undefined && s.turn - (s.counters['order.chiefs'] ?? 0) < 4),
    cast: { GOV: govName, VP: vpName, QUIET: quietAdviser, CJ: chiefJustice, COS: cos },
    opening: 'A text from a retired general you have not heard from in a year: "Troops moving near the barracks. Are you aware?" Nobody else has said anything. {COS} is awake and waiting for you to decide whether this is anything.',
    truths: [
      { id: 'nothing', weight: () => 2, title: 'It was a rumour', reveal: 'There was no coup. A battalion was moved for a training exercise nobody had told the Villa about.', news: ['VILLA SPENDS NIGHT ON ALERT OVER TRAINING EXERCISE', 'NA EXERCISE O! NO BE COUP'] },
      { id: 'probe', weight: (s) => 1 + (s.nation.security < 30 ? 0.5 : 0), title: 'A few officers were testing the water', reveal: 'Three officers had sounded out others about "the situation". Nobody followed them. They are in custody by breakfast.', news: ['OFFICERS DETAINED AFTER "SUSPICIOUS MOVEMENTS"', 'SOJA THREE DON ENTER CELL'] },
      { id: 'real', weight: (s) => 0.3 + (approval(s) < 35 ? 0.5 : 0) + (chiefsFresh(s) ? -0.2 : 0.3), title: 'It was an attempt, and it failed', reveal: 'It was real. A group of middle-ranking officers tried to seize the broadcasting house and lost their nerve when nobody senior joined them.', fx: [['nation.security', -3]], news: ['COUP ATTEMPT FOILED IN ABUJA', 'DEM TRY COUP. E NO WORK'] },
    ],
    beats: [
      { id: 'tv', at: 75, text: 'A television station reports "unusual troop movement" in Abuja, citing residents. It runs the clip every ten minutes.' },
      { id: 'gov', at: 100, when: cold, text: '{GOV} posts: "We are monitoring the situation in Abuja closely and call for calm." Nobody had asked for calm.' },
      { id: 'army', at: 115, when: (s, n) => n.truth !== 'nothing' && !chiefsFresh(s), text: 'The Chief of Army Staff is not answering. An aide says the Chief is "resting". It is not clear whose side resting is on.' },
      { id: 'quiet', at: 130, text: '{QUIET} has stopped answering. The phone rings out, then goes straight to voicemail.' },
      { id: 'vp', at: 145, when: vpRestless, text: '{VP} has been calling party leaders. Two of them call you to ask whether you know why.' },
      { id: 'cj', at: 170, text: 'The Chief Justice\'s office asks for extra security at {CJ}\'s residence. The request is in writing, which means it will be read later.' },
      { id: 'tv2', at: 220, text: 'A second channel says the first channel\'s report was "unfounded". A third reports both, and asks viewers to vote on which is true.' },
      { id: 'hint_real', at: 290, when: t('real'), text: 'Gunfire near the broadcasting house for eleven minutes. Then nothing.' },
      { id: 'hint_probe', at: 290, when: t('probe'), text: 'A colonel at the barracks has been relieved of command by their own officers. Nobody will say why on the telephone.' },
      { id: 'hint_none', at: 290, when: t('nothing'), text: 'The retired general texts again: "Sorry. Exercise. Should have checked." He does not say who told him.' },
    ],
    options: [
      { id: 'chiefs', label: 'Summon the service chiefs to the Villa, with cameras', minutes: 40, text: 'The service chiefs are summoned. The cameras are told to come too.', closes: ['quiet'],
        dawn: { nothing: [['approval', -1], ['bloc.establishment', -4]], probe: [['bloc.establishment', 3], ['nation.security', 2]], real: [['nation.security', 4], ['bloc.establishment', 6], ['approval', 3]] },
        after: { nothing: 'Summoning the chiefs on camera turned a rumour into a story.', real: 'The pictures of the chiefs arriving were on every channel before the officers reached the broadcasting house.' } },
      { id: 'quiet', label: 'Call the service chiefs one by one, quietly', minutes: 45, text: 'You call each service chief in turn. Two answer.', closes: ['chiefs'],
        dawn: { nothing: [['bloc.establishment', 2]], probe: [['bloc.establishment', 2]], real: [['bloc.establishment', -3], ['nation.security', -2]] },
        after: { real: 'The quiet calls took too long; the officers heard about them before the chiefs acted.', nothing: 'Nobody outside the Villa knew there had been a night at all.' } },
      { id: 'tv', label: 'Go on television before 2am', minutes: 30, until: 120, text: 'You go on television in a suit, with the flag, and say the government is in place and working.',
        dawn: { nothing: [['approval', -2], ['bloc.press', -3]], probe: [['approval', 2]], real: [['approval', 5], ['bloc.street', 5]] },
        after: { nothing: 'A President addressing a rumour at 1am was the story of the week.', real: 'Your face on the screen in the small hours was the reason most soldiers stayed in barracks.' } },
      { id: 'guard', label: 'Move the Guards to the broadcasting house', minutes: 20, text: 'The Brigade of Guards takes up positions around the broadcasting house.',
        dawn: { nothing: [['bloc.press', -4], ['nation.integrity', -1]], probe: [['nation.security', 2]], real: [['nation.security', 4], ['bloc.establishment', 3]] },
        after: { real: 'The Guards were already there when the officers arrived.' } },
      { id: 'vpcall', label: 'Call the Vice President, now', minutes: 15, needs: ['vp'], text: 'You call {VP}. The Vice President answers on the first ring and has a lot to say about loyalty.',
        dawn: { all: [['vp.rel', 6], ['bloc.party', 2]] }, after: { all: 'The Vice President\'s calls to party leaders stopped after yours.' } },
      { id: 'cj', label: 'Send the Guards to the Chief Justice as well', minutes: 10, needs: ['cj'], text: 'A detachment goes to {CJ}\'s house.',
        dawn: { all: [['bloc.establishment', 2]], real: [['bloc.establishment', 4]] } },
      { id: 'leave', label: 'Leave the Villa for a safe house', minutes: 60, text: 'You leave the Villa by the back gate in an unmarked car.', closes: ['tv', 'chiefs'],
        dawn: { nothing: [['approval', -5], ['bloc.press', -6], ['bloc.villa', -5]], probe: [['approval', -2]], real: [['approval', 1]] },
        after: { nothing: '"The President fled a rumour" is the headline in every paper that does not like you, and two that do.' } },
      { id: 'sleep', label: 'Go to bed. It is a rumour.', minutes: 0, ends: true, text: 'You go to bed and tell {COS} to wake you if anything is actually happening.',
        dawn: { nothing: [['approval', 1], ['bloc.establishment', 3]], probe: [['nation.security', -3], ['bloc.establishment', -4]], real: [['approval', -8], ['nation.security', -6], ['bloc.establishment', -10], ['pressure.scandalHeat', 10]] },
        after: { nothing: 'Sleeping through it was the calmest thing anyone in government did all year.', real: 'You slept through a coup attempt. The officers who stopped it did not.' } },
    ],
  },

  // ------------------------------------------------------------------ the count
  {
    id: 'collation', title: 'The night of the count', topic: 'politics', start: 1290, dawn: 1800, chance: 0,
    when: () => false,
    cast: { RIVAL: rivalName, GOV: govName, COS: cos },
    opening: 'The polls closed five hours ago. Thirty-four states have reported. Three have not: their returning officers are "still collating". On the figures in, it is close enough that nobody in the Villa is saying anything out loud.',
    truths: [
      { id: 'won', weight: (s) => (s.election?.won ? 1 : 0), title: 'You had won', reveal: 'When the last three states were declared, you had won.' },
      { id: 'lost', weight: (s) => (s.election?.won ? 0 : 1), title: 'You had lost', reveal: 'When the last three states were declared, you had lost.' },
    ],
    beats: [
      { id: 'gov', at: 1350, when: cold, text: '{GOV} says the figures from their state "will be released when they are ready". They have been ready since six.' },
      { id: 'paper', at: 1410, text: 'A newspaper calls the election on its website, for whoever its proprietor prefers. It deletes the call at 23:41.' },
      { id: 'rival', at: 1440, text: '{RIVAL} declares victory at a press conference, "on the basis of our own agents\' results".', closes: ['call'] },
      { id: 'chair', at: 1500, text: 'The chairman of the electoral commission stops answering the telephone.' },
      { id: 'crowd', at: 1560, text: 'Crowds outside two collation centres. Some are holding result sheets. Some are holding sticks.' },
      { id: 'hint_won', at: 1680, when: t('won'), text: 'Your agents in the delayed states say the sheets they saw at the polling units favour you, narrowly.' },
      { id: 'hint_lost', at: 1680, when: t('lost'), text: 'Your agents in the delayed states have gone quiet. One says, carefully, that "it is not looking as we hoped".' },
    ],
    options: [
      { id: 'call', label: 'Call {RIVAL} before anyone declares anything', minutes: 20, until: 1430, text: 'You call {RIVAL}. The conversation is courteous and says nothing, which is the point.',
        dawn: { all: [['bloc.establishment', 3], ['bloc.press', 2]] }, after: { all: 'The call before midnight was why the night stayed calm in the end.' } },
      { id: 'declare', label: 'Declare victory now', minutes: 30, text: 'You declare victory on national television, "pending the formalities".', closes: ['concede', 'wait'],
        dawn: { won: [['approval', 1]], lost: [['approval', -6], ['bloc.establishment', -10], ['pressure.scandalHeat', 15], ['bloc.street', -6]] },
        after: { lost: 'You declared a victory the count did not give you. The tape will be played at every election for twenty years.', won: 'Declaring early cost nothing, this time.' } },
      { id: 'police', label: 'Send police to the collation centres in the delayed states', minutes: 40, text: 'Police units are sent to the three collation centres "to protect the process".',
        dawn: { won: [['nation.integrity', -2], ['bloc.press', -3]], lost: [['nation.integrity', -6], ['pressure.scandalHeat', 20], ['bloc.establishment', -6]] },
        after: { lost: 'With police at the doors, the figures in two delayed states were revised before dawn. You are declared the winner. Everyone who matters knows how.', won: 'The police were not needed, and everyone will say they were.' } },
      { id: 'court', label: 'Have your lawyers file at the court before dawn', minutes: 30, text: 'Your lawyers file tonight, asking the court to order the collation "conducted in the open".',
        dawn: { won: [['bloc.establishment', -2]], lost: [['bloc.establishment', 2], ['nation.integrity', 1]] },
        after: { lost: 'The filing gave you a lawful road to contest the result.', won: 'The filing looked nervous, for a winner.' } },
      { id: 'concede', label: 'Concede, tonight, before the last states are in', minutes: 20, ends: true, text: 'You call {RIVAL} and concede.', closes: ['declare', 'police'],
        dawn: { lost: [['approval', 4], ['bloc.establishment', 8], ['nation.integrity', 3]], won: [['bloc.party', -15]] },
        after: { lost: 'Conceding before dawn kept the crowds at home. Abroad, they call it statesmanship.', won: 'You conceded an election you had won. The party will not discuss it in front of you.' } },
      { id: 'wait', label: 'Say nothing and wait for the commission', minutes: 60, text: 'The Villa says the commission will announce the result and that is all it will say.' },
    ],
    morning: (s, n) => {
      const e = s.election;
      if (!e) return;
      // Police at the doors turn a narrow loss into a win; a concession turns a narrow win into a loss.
      // The figures move by just enough everywhere, and each state's result follows.
      const flip = (want: boolean) => {
        const voters = e.states.reduce((a, r) => a + r.voters, 0);
        const total = e.votesFor + e.votesAgainst;
        const d = ((e.votesAgainst - e.votesFor) + (want ? 1 : -1) * 0.006 * total) / (2 * voters);
        for (const x of e.states) { x.share += d; x.opp -= d; x.won = x.share > x.opp; }
        e.votesFor = e.states.reduce((a, r) => a + r.voters * r.share, 0);
        e.votesAgainst = e.states.reduce((a, r) => a + r.voters * r.opp, 0);
        e.spread = e.states.filter((r) => r.share >= 25).length;
        e.margin = ((e.votesFor - e.votesAgainst) / (e.votesFor + e.votesAgainst)) * 100;
        e.won = want ? e.votesFor > e.votesAgainst && e.spread >= 25 : false;
      };
      if (n.truth === 'lost' && n.chosen.includes('police')) { flip(true); s.flags['election.stolen'] = true; }
      if (n.truth === 'won' && n.chosen.includes('concede')) { flip(false); s.flags['election.conceded'] = true; }
    },
  },

  // ------------------------------------------------------------------ the strike deadline
  {
    id: 'strike', title: 'The night of the deadline', topic: 'labour', start: 1260, dawn: 1800, chance: 0.12,
    when: (s) => s.pressures.wageGrievance >= 70,
    cast: { COS: cos, GOV: govName },
    opening: 'The {UNION}\'s ultimatum expires at midnight. {LABOUR} has said the strike starts at 00:01 "with or without a meeting". The Minister of Labour is on the way to the Villa with a folder.',
    truths: [
      { id: 'bluff', weight: (s) => 1.5 - (s.pressures.wageGrievance - 70) / 30, title: 'The union could not have held a strike', reveal: 'The union was bluffing: its branches had told the leadership privately they would not hold out more than two days.' },
      { id: 'solid', weight: (s) => 1 + (hardship(s) - 50) / 30, title: 'The union meant it', reveal: 'The union meant it: every branch had voted, and the transport workers had already parked.' },
    ],
    beats: [
      { id: 'meet', at: 1320, text: '{LABOUR} agrees to come to the Villa, "for the last time", and arrives with forty members of the executive.' },
      { id: 'gov', at: 1380, when: cold, text: '{GOV} announces that their state will pay the new wage "whatever Abuja decides". They cannot afford it and everyone knows they cannot.', closes: ['governors'] },
      { id: 'midnight', at: 1441, text: 'The deadline passes. The union\'s spokesman says the strike "has begun in principle".' },
      { id: 'fuel', at: 1500, when: t('solid'), text: 'Tanker drivers in two states have parked at the depots. The queues will be there by six.' },
      { id: 'split', at: 1500, when: t('bluff'), text: 'Two branch chairmen tell a radio station they have "not yet received instructions".' },
      { id: 'court', at: 1560, text: 'The Attorney General says an injunction can be obtained before dawn, from a judge who answers the phone at night.' },
    ],
    options: [
      { id: 'deal', label: 'Offer most of what they ask, tonight', minutes: 60, text: 'You offer most of the demand, phased over two years, in writing.', closes: ['injunction'],
        dawn: { bluff: [['nation.fiscalSpace', -0.4], ['pressure.wageGrievance', -25], ['bloc.establishment', -2]], solid: [['nation.fiscalSpace', -0.4], ['pressure.wageGrievance', -35], ['approval', 2]] },
        after: { bluff: 'You paid for a strike that was never going to last. The union knows it now, and so will the next union.', solid: 'The deal kept the country moving on a morning it would otherwise have stopped.' } },
      { id: 'personal', label: 'Take {LABOUR} into another room, alone', minutes: 45, needs: ['meet'], text: 'You and {LABOUR} talk alone for forty minutes. Nobody else knows what is said.',
        dawn: { bluff: [['pressure.wageGrievance', -15]], solid: [['pressure.wageGrievance', -10], ['bloc.street', 2]] },
        after: { all: 'Whatever was said in that room, {LABOUR} came out of it with something to sell to the executive.' } },
      { id: 'injunction', label: 'Get the injunction', minutes: 30, needs: ['court'], text: 'The injunction is signed at 3:10am and served by text message.', closes: ['deal'],
        dawn: { bluff: [['pressure.wageGrievance', -10], ['bloc.establishment', 3], ['nation.integrity', -1]], solid: [['pressure.wageGrievance', 15], ['bloc.street', -6], ['pressure.fuelSupplyStress', 15]] },
        after: { solid: 'A union that meant it does not stop for a text message. Now it is striking against a court as well.', bluff: 'The injunction gave the branch chairmen the excuse they wanted.' } },
      { id: 'nowork', label: 'Announce "no work, no pay"', minutes: 15, text: 'The Villa announces that anyone who strikes will not be paid for the days they strike.',
        dawn: { bluff: [['pressure.wageGrievance', -5], ['bloc.establishment', 4]], solid: [['pressure.wageGrievance', 20], ['bloc.street', -8], ['approval', -3]] } },
      { id: 'governors', label: 'Get the governors to say they cannot pay', minutes: 40, text: 'Six governors agree to say, on the record, that the demand would bankrupt their states.',
        dawn: { all: [['bloc.party', 2], ['pressure.wageGrievance', -5]] } },
      { id: 'wait', label: 'Let the deadline pass and see who blinks', minutes: 90, text: 'You let the deadline pass without a word.',
        dawn: { bluff: [['bloc.establishment', 3], ['pressure.wageGrievance', -8]], solid: [['pressure.fuelSupplyStress', 20], ['approval', -3], ['bloc.street', -5]] } },
    ],
  },

  // ------------------------------------------------------------------ the run on the naira
  {
    id: 'naira', title: 'The Friday night of the naira', topic: 'money', start: 1200, dawn: 1800, chance: 0.1,
    when: (s) => !!s.fx && (s.fx.parallel / s.fx.rate - 1 > 0.3 || s.fx.reserves < 10),
    cast: { COS: cos },
    opening: 'Friday. The street rate has moved four times since lunch. {CBN} calls: the banks report people queuing at cash machines to buy dollars on their cards before the limits change on Monday. Nobody has said the limits will change on Monday.',
    truths: [
      { id: 'speculators', weight: () => 1.3, title: 'It was a handful of traders', reveal: 'It was a handful of large traders pushing the rate to sell on Monday. The queues were real; the panic was manufactured.' },
      { id: 'flight', weight: (s) => 0.6 + ((s.fx?.reserves ?? 20) < 8 ? 0.8 : 0), title: 'Money was really leaving', reveal: 'Money was really leaving: companies had been moving dollars out all week, and the queues were the end of it, not the start.' },
    ],
    beats: [
      { id: 'video', at: 1260, text: 'A video of a queue at a cash machine in Lagos has a million views. The caption says "It has started".' },
      { id: 'banks', at: 1350, text: 'Two banks quietly lower their card limits for foreign transactions. The video of the queue now has a sequel.' },
      { id: 'rumour', at: 1440, text: 'A rumour that the naira will be "redenominated" over the weekend is on every group chat. Nobody knows where it started.' },
      { id: 'rate', at: 1560, when: t('flight'), text: 'The street rate has moved another twelve percent. Dealers have stopped quoting.' },
      { id: 'calm', at: 1560, when: t('speculators'), text: 'The street rate steadies. Two dealers say "big buyers" have gone quiet.' },
    ],
    options: [
      { id: 'statement', label: 'Have the central bank issue a statement tonight', minutes: 30, text: '{CBN} issues a statement at 21:40: there will be no change to limits, no redenomination and no cause for concern.',
        dawn: { speculators: [['fx.reserves', 0.2], ['bloc.establishment', 3]], flight: [['bloc.establishment', -2]] },
        after: { flight: 'A statement does not stop money that has already decided to leave.', speculators: 'The statement took the air out of a panic that needed air.' } },
      { id: 'sell', label: 'Order the central bank to sell dollars on Monday, and say so now', minutes: 20, text: 'You tell {CBN} to sell whatever it takes on Monday morning, and to say so tonight.',
        dawn: { speculators: [['fx.reserves', -1], ['bloc.establishment', 2]], flight: [['fx.reserves', -3], ['bloc.establishment', -3]] },
        after: { speculators: 'The traders who pushed the rate sold back to the central bank at a loss.', flight: 'The dollars were sold to the people leaving, at a good price, for them.' } },
      { id: 'close', label: 'Close the street dealers by order, from midnight', minutes: 30, from: 1380, text: 'An order closes the street dealers from midnight "until further notice".',
        dawn: { all: [['nation.integrity', -1], ['bloc.street', -3]], flight: [['fx.reserves', -1]] },
        after: { all: 'The dealers moved into hotel lobbies by Saturday afternoon, at a better rate.' } },
      { id: 'tv', label: 'Say on television that the naira is safe', minutes: 30, text: 'You say, on television, that the naira is safe and the government will defend it.',
        dawn: { speculators: [['approval', 1]], flight: [['approval', -3], ['bloc.press', -2]] },
        after: { flight: 'Saying the naira was safe on the night it fell is the clip the papers used for a year.' } },
      { id: 'quiet', label: 'Say nothing. It is a Friday; the markets are shut.', minutes: 0, ends: true, text: 'You say nothing and go to bed. The markets are shut until Monday.',
        dawn: { speculators: [['bloc.establishment', 2]], flight: [['fx.reserves', -2], ['approval', -2]] } },
    ],
  },

  // ------------------------------------------------------------------ the dam
  {
    id: 'dam', title: 'The night of the water', topic: 'security', start: 1380, dawn: 1800, chance: 0.08,
    when: (s) => { const m = ((s.turn + 4) % 12) + 1; return m >= 8 && m <= 10; },
    cast: { GOV: govName, COS: cos },
    opening: 'A fax, of all things, from across the border: the dam upstream will release water from 03:00 "for reasons of structural safety". It does not say how much. The emergency agency has three boats in the area and one of them works.',
    truths: [
      { id: 'small', weight: () => 1.4, title: 'The release was small', reveal: 'The release was small. The river rose a metre and went down again by evening.' },
      { id: 'large', weight: () => 1, title: 'The release was large', reveal: 'The release was large. The river rose four metres in six hours and took two towns with it.', fx: [['nation.security', -2], ['approval', -2]] },
    ],
    beats: [
      { id: 'radio', at: 1440, text: 'Local radio in two states is reading out the fax. Some listeners are leaving; most are waiting to see if anyone official says anything.' },
      { id: 'gov', at: 1500, when: cold, text: '{GOV} says the federal government "was informed weeks ago and did nothing". It was informed two hours ago.' },
      { id: 'release', at: 1620, text: 'The release begins. Nobody downstream can see how much water there is in the dark.' },
      { id: 'rising', at: 1710, when: t('large'), text: 'A village head calls the radio station from a roof.' },
      { id: 'steady', at: 1710, when: t('small'), text: 'The river is high but holding below the embankments. The radio station plays music again.' },
    ],
    options: [
      { id: 'evacuate', label: 'Order an evacuation of the riverside towns, now', minutes: 40, until: 1600, text: 'You order the riverside towns evacuated. Soldiers and police go door to door with megaphones.',
        dawn: { small: [['approval', -1], ['bloc.street', -2], ['nation.fiscalSpace', -0.05]], large: [['approval', 5], ['bloc.street', 5], ['nation.fiscalSpace', -0.05]] },
        after: { small: 'Thousands slept in schools for a flood that did not come, and said so.', large: 'The evacuation before the release is why the towns were empty when the water came.' } },
      { id: 'call', label: 'Call the neighbouring President and ask them to stagger it', minutes: 30, text: 'You call across the border. The President there is "unavailable"; an aide promises to "relay the concern".',
        dawn: { large: [['nation.security', 1]] }, after: { large: 'The release was staggered over two days after your call, which halved the peak.' } },
      { id: 'boats', label: 'Send the military\'s boats and helicopters to stand by', minutes: 20, text: 'The military\'s boats and two helicopters are ordered to stand by at the river.',
        dawn: { small: [['nation.fiscalSpace', -0.03]], large: [['approval', 3], ['nation.security', 2]] } },
      { id: 'governor', label: 'Put {GOV} in charge on the ground, publicly', minutes: 15, needs: ['gov'], text: 'You announce that {GOV} will lead the response on the ground "as the person closest to it".',
        dawn: { small: [['bloc.party', 2]], large: [['bloc.party', -2], ['approval', -1]] },
        after: { large: '{GOV} spent the morning on television blaming Abuja, which was now also blaming {GOV}.' } },
      { id: 'wait', label: 'Wait for the morning and the agency\'s assessment', minutes: 120, text: 'You ask for an assessment by morning.',
        dawn: { large: [['approval', -5], ['bloc.street', -6], ['pressure.scandalHeat', 6]] },
        after: { large: 'Waiting for an assessment, while a fax said exactly what was coming, is the line in the inquiry\'s report everyone will quote.' } },
    ],
  },

  // ------------------------------------------------------------------ the video
  {
    id: 'video', title: 'The night of the video', topic: 'scandal', start: 1320, dawn: 1800, chance: 0.08,
    when: (s) => s.pressures.scandalHeat >= 50,
    cast: { MIN: shakyMinister, COS: cos },
    opening: 'A video is going round of {MIN} at a party in a mansion, counting money into a bag while someone off camera laughs. It is forty seconds long. It has been online for nine minutes.',
    truths: [
      { id: 'real', weight: (s) => 1 + (s.nation.integrity < 30 ? 0.5 : 0), title: 'The video was real and recent', reveal: 'The video was real, and recent: the party was last month, and the money was a contractor\'s.' },
      { id: 'old', weight: () => 0.8, title: 'The video was real, and six years old', reveal: 'The video was real, but six years old, from before {MIN} was in government: a wedding, and the money was gifts being sprayed and collected.' },
      { id: 'fake', weight: () => 0.7, title: 'The video was doctored', reveal: 'The video was doctored. The face was {MIN}\'s; the hands, the bag and the money were someone else\'s.' },
    ],
    beats: [
      { id: 'views', at: 1380, text: 'Half a million views. A senator from your own party has shared it "for awareness".' },
      { id: 'min', at: 1440, text: '{MIN} calls you: "It is not what it looks like. Please do not do anything before morning."' },
      { id: 'press', at: 1500, text: 'Every newspaper has asked the Villa for comment. One has already written the headline and needs only a quote.' },
      { id: 'expert', at: 1620, when: t('fake'), text: 'A man who analyses videos online says the hands in the clip do not match the arms. He has eleven thousand followers.' },
      { id: 'date', at: 1620, when: t('old'), text: 'Someone recognises the house: it was sold four years ago. The caterer in the background says it was a wedding.' },
      { id: 'second', at: 1620, when: t('real'), text: 'A second clip appears, from another angle. The contractor\'s logo is on the bag.' },
    ],
    options: [
      { id: 'suspend', label: 'Suspend {MIN} tonight, pending investigation', minutes: 20, text: '{MIN} is suspended at 23:30 "pending a full investigation".', closes: ['defend'],
        dawn: { real: [['nation.integrity', 3], ['bloc.press', 4]], old: [['bloc.press', -2], ['bloc.party', -3]], fake: [['bloc.party', -4], ['bloc.press', -3]] },
        after: { real: 'Suspending the minister before the second clip appeared was the only thing the papers praised.', old: 'You suspended a minister for a wedding.', fake: 'You suspended a minister for a forgery, which will make the next forgery easier.' } },
      { id: 'defend', label: 'Defend {MIN} publicly, tonight', minutes: 15, text: 'The Villa says {MIN} has its full confidence and the video is "a desperate attempt at distraction".', closes: ['suspend'],
        dawn: { real: [['nation.integrity', -4], ['pressure.scandalHeat', 15], ['approval', -3]], old: [['bloc.party', 2]], fake: [['bloc.party', 3], ['bloc.press', 2]] },
        after: { real: 'You defended the minister an hour before the second clip.', fake: 'You stood by someone who was being framed, and were right.' } },
      { id: 'verify', label: 'Have the security service verify the video before anyone speaks', minutes: 90, text: 'You ask the security service to verify the clip and say nothing until they have.',
        dawn: { fake: [['bloc.establishment', 3]], old: [['bloc.establishment', 2]], real: [['bloc.press', -2]] } },
      { id: 'pull', label: 'Ask the platforms to take it down', minutes: 30, text: 'The Villa asks the platforms to remove the video as "false and dangerous".',
        dawn: { all: [['bloc.press', -4], ['nation.integrity', -1]], real: [['pressure.scandalHeat', 8]] },
        after: { all: 'Asking for it to be taken down made sure everyone saw it.' } },
      { id: 'sleep', label: 'Say nothing tonight', minutes: 0, ends: true, text: 'The Villa says nothing tonight.',
        dawn: { real: [['pressure.scandalHeat', 6]], old: [['bloc.press', 1]], fake: [['bloc.press', 1]] } },
    ],
  },
];

export const NIGHT_BY_ID: Record<string, SetPiece> = Object.fromEntries(NIGHTS.map((n) => [n.id, n]));
export { NAMES };
