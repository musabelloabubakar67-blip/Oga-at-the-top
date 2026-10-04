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

const phone = { slot: 'minor', channel: 'phone', office: 'Phone', intensity: 1 } as const;

// ON THEIR OWN INITIATIVE
// Someone in the cast has decided this is the month to ask.

export const CAST_FILES: GameEvent[] = [
  {
    ...phone, id: 'cast.call', kind: 'chain', category: 'politics', tone: 'dry',
    cast: { A: 'caller' },
    from: '{A}',
    title: 'About the thing we discussed',
    body: [
      'Your Excellency, I will not take your time. You know what I have been asking for: {A_WANT} I am not asking today. I am asking when.',
    ],
    reads: [{ role: 'sap', good: 'A promise costs nothing today, {SIR}. It costs a great deal later if it is not kept, and {A_SHORT} keeps count.' }],
    choices: [
      { id: 'promise', label: 'Promise it, within nine months', outcomes: [{ result: '{A_SHORT} thanks you and writes the date down while you are still speaking.', ops: [['pledgewant', '$A']], archive: 'Promised a politician what they asked for, within nine months.' }] },
      { id: 'grant', label: 'Give it now', outcomes: [{ result: '{A_SHORT} had expected to be asked to wait, and is briefly lost for words.', ops: [['grant', '$A']], archive: 'Gave a politician what they asked for, on the phone.' }] },
      { id: 'no', label: '"Not this year."', outcomes: [{ result: 'There is a pause. {A_SHORT} says they understand. They do not.', fx: [['person.$A', -4]], archive: 'Told a politician their request would wait.' }] },
    ],
    ignored: { result: 'You did not call back. {A_SHORT} tells two colleagues you did not call back.', fx: [['person.$A', -3]], archive: 'Did not return a politician\'s call about what they wanted.' },
  },
];
