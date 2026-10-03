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
  'r2-p1': ['EVEN'],
  'r2-p2': ['4'],
  'r2-p3': ['1 2 4 5 8']
};

export const round3AnswerKeys: Record<string, {
  blanks: Array<{ id: string; prompt: string; accepted: readonly string[] }>;
}> = {
  'r3-p1': {
    blanks: [
      {
        id: 'complement',
        prompt: 'Calculate the value needed to complete the target sum.',
        accepted: ['target - value']
      },
      {
        id: 'store-index',
        prompt: 'Store the current value and index for a later match.',
        accepted: ['seen[value] = index']
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
          'counts[char] = 1 if char not in counts else counts[char] + 1'
        ]
      }
    ]
  }
};

export const round4AnswerKeys: Record<string, readonly string[]> = {
  'r4-p1': ['9'],
  'r4-p2': ['4'],
  'r4-p3': ['40']
};

export const round4CodeAnswerKeys: Record<string, {
  prompts: Array<{ id: string; prompt: string; accepted: readonly string[] }>;
}> = {
  'r4-p1': {
    prompts: [
      {
        id: 'slide-window',
        prompt: 'Update the running sum when the window moves one position right.',
        accepted: ['window_sum += nums[i] - nums[i - k]']
      },
      {
        id: 'update-best',
        prompt: 'Keep the maximum window sum seen so far.',
        accepted: ['best = max(best, window_sum)']
      }
    ]
  },
  'r4-p2': {
    prompts: [
      {
        id: 'count-character',
        prompt: 'Count each character before searching for the first unique one.',
        accepted: ['counts[char] = counts.get(char, 0) + 1']
      }
    ]
  },
  'r4-p3': {
    prompts: [
      {
        id: 'build-prefix',
        prompt: 'Extend the prefix sum through the current value.',
        accepted: ['prefix[i] = prefix[i - 1] + nums[i - 1]']
      },
      {
        id: 'range-query',
        prompt: 'Compute the inclusive range sum from left through right.',
        accepted: ['prefix[right + 1] - prefix[left]']
      }
    ]
  }
};
