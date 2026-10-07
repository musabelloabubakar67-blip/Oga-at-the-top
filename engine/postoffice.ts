// THE YEAR AFTER (plan 16.A13, 16.A14)
// Losing office, or leaving it, opens a bounded chapter: four decisions in the
// first year out, each drawn from what this presidency left behind. A former
// President can defend a reform the successor wants to undo, face or flee an
// investigation, use or refuse old networks, and choose what to build next.
// The choices change what happens to them, and what survives of the legacy;
// a clean former President can still undermine a successor, and a compromised
// one can still defend an institution worth defending.

import { MILESTONE_BY_ID } from '../content/agenda';
import { TYCOON_BY_ID } from '../content/tycoons';
import { afterOffice } from './afterlife';
import { benchVars } from './courts';
import { reformName } from './reforms';
import type { GameState } from './types';
import { approval, clamp } from './vars';

export interface PostChoice { id: string; label: string; text: string }
export interface PostStep { id: string; title: string; text: string; choices: PostChoice[] }
export interface Post { step: number; influence: number; log: { title: string; choice: string; text: string }[]; done?: boolean }

export const POST_STEPS = 4;

export function ensurePost(s: GameState): Post {
  s.post ??= { step: 0, influence: Math.round(clamp(approval(s) / 2 + s.favours.filter((f) => f.dir === 'owed').length * 3 + (s.flags['succession.won'] ? 20 : 0), 5, 90)), log: [] };
  return s.post;
}

/** The decision in front of the former President now, drawn from the record. */
export function postStep(s: GameState): PostStep | null {
  const p = ensurePost(s);
  if (p.done || p.step >= POST_STEPS) return null;
  const signature = [...s.agenda.done].reverse().find((id) => MILESTONE_BY_ID[id]?.m.reversal);
  const risky = afterOffice(s).risk.length > 0;
  const patron = Object.entries(s.tycoons).filter(([, t]) => t.rel >= 60).sort((a, b) => b[1].rel - a[1].rel)[0]?.[0];
  switch (p.step) {
    case 0:
      if (signature) return { id: 'defend', title: 'Your successor moves against your reform', text: `The new government's first budget proposes to undo "${reformName(s, signature)}". The people it helped are looking to see whether you will say anything.`, choices: [
        { id: 'speak', label: 'Defend it in public', text: 'A speech, an article, interviews: you spend influence, and the reform has a defender.' },
        { id: 'deal', label: 'Trade: support the new government elsewhere if it keeps this', text: 'Quietly, through old allies. It may work. It ties you to them.' },
        { id: 'quiet', label: 'Say nothing', text: 'It is their government now.' },
      ] };
      return { id: 'defend', title: 'Nothing of yours is under attack, yet', text: 'The new government is too busy with its own first year to undo yours. Former colleagues ask whether you will comment on it anyway.', choices: [
        { id: 'quiet', label: 'Stay out of it', text: 'Former Presidents who comment become opposition leaders.' },
        { id: 'speak', label: 'Comment on their first year', text: 'You spend influence, and the papers have a story.' },
      ] };
    case 1:
      if (risky) return { id: 'inquiry', title: 'The anti-corruption agency would like a word', text: 'An invitation, polite and written, to answer questions about payments made during your presidency.', choices: [
        { id: 'cooperate', label: 'Go, with your lawyers, and answer', text: 'It is long and humiliating. It is also how investigations end.' },
        { id: 'fight', label: 'Challenge the invitation in court', text: benchVars(s).loyal >= 2 ? 'There are justices on the bench who owe you their seats.' : 'The bench owes you nothing.' },
        { id: 'abroad', label: 'Leave for a medical check-up abroad', text: 'And do not come back.' },
      ] };
      return { id: 'broker', title: 'A governor asks you to broker a deal', text: 'Two governors are at war over a boundary and an oil well. Both trust you more than they trust the new government.', choices: [
        { id: 'broker', label: 'Broker it', text: 'Influence, and gratitude, and the new government\'s irritation.' },
        { id: 'decline', label: 'Decline', text: 'It is not your job any more.' },
      ] };
    case 2:
      if (patron) return { id: 'patron', title: `${TYCOON_BY_ID[patron]?.name ?? 'A businessman'} asks for an introduction`, text: 'A businessman who did well under your government would like to meet the new one. An introduction from you would open the door.', choices: [
        { id: 'introduce', label: 'Make the introduction', text: 'Your network carries on. So does what people say about it.' },
        { id: 'refuse', label: 'Refuse', text: 'Old friends become former friends.' },
      ] };
      return { id: 'patron', title: 'Nobody asks you for anything', text: 'The telephone is quiet. It can be a relief.', choices: [{ id: 'rest', label: 'Rest', text: 'For a while.' }] };
    default:
      return { id: 'build', title: 'What to build next', text: 'A year out, the question is what kind of former President to be.', choices: [
        { id: 'party', label: 'Run for the party chairmanship', text: 'Influence over the next government\'s party, and the next government\'s suspicion.' },
        { id: 'foundation', label: 'Found an institute to defend the institutions you built', text: 'A legacy that does not depend on any one successor.' },
        { id: 'memoir', label: 'Write the memoir', text: 'Your account, in your words. Others will write theirs.' },
      ] };
  }
}

/** The former President's decision, and what it does. */
export function choosePost(s: GameState, choice: string): string {
  const p = ensurePost(s);
  const step = postStep(s);
  if (!step) return '';
  const c = step.choices.find((x) => x.id === choice);
  if (!c) return '';
  let text = '';
  switch (choice) {
    case 'speak': p.influence -= 10; s.flags['post.defended'] = true; text = p.influence >= 30 ? 'Your defence lands. The reform has a constituency again, and the new government postpones the change.' : 'Your defence is reported and ignored. A former President has less weight than they remember.'; if (p.influence >= 30) s.flags['post.saved'] = true; break;
    case 'deal': p.influence -= 5; s.flags['post.saved'] = p.influence >= 25; text = s.flags['post.saved'] ? 'The reform survives the budget. Your allies vote with the new government twice, as agreed.' : 'The new government takes your support and undoes the reform anyway.'; break;
    case 'quiet': text = 'You say nothing. It is noticed, and respected, and forgotten.'; break;
    case 'cooperate': s.flags['post.cooperated'] = true; p.influence -= 5; text = 'Nine hours of questions, and then three more sessions. The file stays open, but it stops growing.'; break;
    case 'fight': s.flags['post.fought'] = true; text = benchVars(s).loyal >= 2 ? 'The court quashes the invitation, three to two. The papers report who wrote the majority.' : 'The court refuses the challenge, and the agency adds contempt to its list.'; break;
    case 'abroad': s.flags['exit.abroad'] = true; p.influence = 0; text = 'You leave on a Tuesday. The house in Abuja is let, through an agent.'; break;
    case 'broker': p.influence += 8; s.exposures.push({ kind: 'political', amount: 0, witnesses: [], trail: 1, turn: s.turn, causeId: 'post.broker', label: 'Brokered a deal between governors after leaving office.' }); text = 'The governors sign. Both thank you, and the new President does not.'; break;
    case 'decline': text = 'The war between the governors goes on without you.'; break;
    case 'introduce': p.influence += 5; s.flags['post.network'] = true; text = 'The meeting happens. Your network survives the change of government, and so does the story of what it is for.'; break;
    case 'refuse': p.influence -= 3; text = 'The businessman finds another way in. You find out who your friends were.'; break;
    case 'rest': text = 'You read, and visit your home town, and are left alone.'; break;
    case 'party': s.flags['post.chair'] = p.influence >= 40; text = p.influence >= 40 ? 'You are elected party chairman. The next government has a former President in its party\'s chair.' : 'You lose the chairmanship to a younger rival. The party has moved on.'; break;
    case 'foundation': s.flags['post.foundation'] = true; text = 'The institute opens with a board of retired judges and a statement on judicial independence. Whatever else is said about you, it will defend what you built.'; break;
    case 'memoir': s.flags['post.memoir'] = true; text = 'The memoir sells well and is disputed in every chapter by somebody who was in the room.'; break;
  }
  p.influence = clamp(p.influence, 0, 100);
  p.log.push({ title: step.title, choice: c.label, text });
  p.step += 1;
  if (p.step >= POST_STEPS) p.done = true;
  return text;
}
