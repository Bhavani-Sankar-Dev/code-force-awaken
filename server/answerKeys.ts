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
        id: 'low-boundary',
        prompt: 'Replace low = mid with the correct binary-search boundary update.',
        accepted: ['low = mid + 1']
      },
      {
        id: 'high-boundary',
        prompt: 'Replace high = mid with the correct binary-search boundary update.',
        accepted: ['high = mid - 1']
      }
    ]
  },
  'r3-p2': {
    blanks: [
      {
        id: 'max-initial',
        prompt: 'Initialize max_so_far from the first value so all-negative arrays work.',
        accepted: ['nums[0]', 'max(nums)']
      },
      {
        id: 'current-initial',
        prompt: 'Initialize current_max from the first value before processing the remaining values.',
        accepted: ['nums[0]']
      },
      {
        id: 'current-update',
        prompt: 'Write the Kadane update expression for each value nums[i].',
        accepted: ['max(nums[i], current_max + nums[i])', 'max(current_max + nums[i], nums[i])']
      }
    ]
  }
};

export const round4AnswerKeys: Record<string, readonly string[]> = {
  'r4-p1': ['3'],
  'r4-p2': ['4'],
  'r4-p3': ['100']
};
