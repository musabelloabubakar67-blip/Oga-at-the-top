import type { GameEvent } from '../../engine/types';

// PROMISES THAT MEET
// Two people were told the same post was theirs. They have compared notes.

export const PROMISE_FILES: GameEvent[] = [
  {
    id: 'promise.clash', kind: 'chain', slot: 'lead', category: 'politics', tone: 'dry', intensity: 4,
    when: { flag: 'clash.live' },
    cast: { A: 'clashA', B: 'clashB' },
    office: 'Office of the Chief of Staff', stamp: 'SECRET',
    title: '{A_SHORT} and {B_SHORT} have compared notes',
    body: [
      '{A} and {B} met at a wedding in Abuja on Saturday. By the end of the reception each had learned that the other had been promised the same post, by you, in nearly the same words.',
      'Both have asked for an appointment this week. Both have told their senators to wait for a signal before voting on anything. One of them has a journalist who owes them a favour.',
    ],
    reads: [{ role: 'cos', good: 'Whatever you choose, {SIR}, choose it before Friday. After Friday it will be chosen for you, in print.' }],
    choices: [
      {
        id: 'a', label: 'Keep your word to {A_SHORT}', outcomes: [{
          result: '{A_SHORT} gets what was promised and says so loudly. {B_SHORT} does not come to the next meeting, or the one after.',
          fx: [['person.$B', -10], ['bloc.party', -2]], ops: [['honour', 'clash.pa'], ['breakp', 'clash.pb']],
          news: ['PRESIDENT SETTLES DISPUTED APPOINTMENT', 'ONE PERSON HAPPY, ONE PERSON DON VEX'], archive: 'Kept a promise of a post to one of two people promised it.', sig: 2,
        }],
      },
      {
        id: 'b', label: 'Keep your word to {B_SHORT}', outcomes: [{
          result: '{B_SHORT} gets what was promised. {A_SHORT} is photographed the next day having lunch with your strongest rival.',
          fx: [['person.$A', -10], ['bloc.party', -2]], ops: [['honour', 'clash.pb'], ['breakp', 'clash.pa']],
          news: ['PRESIDENT SETTLES DISPUTED APPOINTMENT', 'ONE PERSON HAPPY, ONE PERSON DON VEX'], archive: 'Kept a promise of a post to one of two people promised it.', sig: 2,
        }],
      },
      {
        id: 'both', label: 'Make it right with both: something else for each, and the post to neither', pc: 10, naira: 0.3, outcomes: [{
          result: 'Each gets a consolation that costs more than the original promise. Each believes the other got the better one.',
          fx: [['person.$A', -4], ['person.$B', -4], ['nation.integrity', -1]], ops: [['settlep', 'clash.pa'], ['settlep', 'clash.pb']],
          archive: 'Bought off two people promised the same post.', sig: 2,
        }],
      },
      {
        id: 'deny', label: 'Deny that either promise was ever made', outcomes: [{
          result: 'The Presidency says no promises were made to anyone about anything. Both of them have the dates written down.',
          fx: [['nation.integrity', -2], ['pressure.scandalHeat', 6]], ops: [['breakp', 'clash.pa'], ['breakp', 'clash.pb']],
          later: [{ after: [1, 2], fx: [['bloc.press', -4], ['approval', -1]], label: 'Both of them tell the story, separately, to different newspapers.', note: ['TWO POLITICIANS, ONE PROMISE: THE VILLA\'S DOUBLE BOOKING', 'PRESIDENT PROMISE TWO PEOPLE THE SAME THING'] }],
          archive: 'Denied promising the same post to two people.', sig: 3,
        }],
      },
    ],
  },
];
