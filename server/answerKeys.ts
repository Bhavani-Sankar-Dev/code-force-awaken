import type { AnswerMode, SubmittedAnswer } from './answerChecking.ts';

export const round1AnswerKeys: Record<string, { mode: AnswerMode; accepted: readonly SubmittedAnswer[] }> = {
  q1: { mode: 'option', accepted: ['B'] },
  q2: { mode: 'option', accepted: ['A'] },
  q3: { mode: 'option', accepted: ['A'] },
  q4: { mode: 'sequence', accepted: [['line-C', 'line-B', 'line-A']] },
  q5: { mode: 'sequence', accepted: [['line-B', 'line-C', 'line-D', 'line-A']] },
  q6: { mode: 'sequence', accepted: [['line-B', 'line-C', 'line-D', 'line-A']] },
  q7: { mode: 'option', accepted: ['B'] },
  q8: { mode: 'option', accepted: ['B'] },
  q9: { mode: 'option', accepted: ['B'] }
};

export const round2AnswerKeys: Record<string, readonly string[]> = {
  'r2-p1': ['7'],
  'r2-p2': ['7'],
  'r2-p3': ['3 2']
};

export const round3AnswerKeys: Record<string, {
  blanks: Array<{ id: string; prompt: string; accepted: readonly string[] }>;
}> = {
  'r3-p1': {
    blanks: [
      {
        id: 'complement',
        prompt: 'Calculate the value needed to complete the target sum.',
        accepted: ['target - value', 'target - nums[index]', '(target - value)']
      },
      {
        id: 'store-index',
        prompt: 'Store the current value and index for a later match.',
        accepted: [
          'seen[value] = index',
          'seen[nums[index]] = index',
          'seen.setdefault(value, index)',
          'seen.update({value: index})'
        ]
      }
    ]
  },
  'r3-p2': {
    blanks: [
      {
        id: 'count-character',
        prompt: 'Increase the frequency count for this character.',
        accepted: [
          'counts[char] = counts.get(char, 0) + 1',
          'counts[char] = 1 if char not in counts else counts[char] + 1',
          'counts[char] = counts[char] + 1 if char in counts else 1'
        ]
      }
    ]
  }
};

export const round4AnswerRubrics: Record<
  string,
  readonly (readonly string[])[]
> = {
  "r4-longest-unique-window": [
    ["sliding window", "two pointer", "two-pointer"],
    ["set", "last seen", "last-seen", "last occurrence", "index map", "dictionary"],
    ["left pointer", "left boundary", "left edge", "start boundary"],
    ["duplicate", "repeated character", "same character", "seen before"],
    ["maximum length", "longest length", "best length", "max length"],
    ["o(n)", "linear time", "linear"],
  ],
};
