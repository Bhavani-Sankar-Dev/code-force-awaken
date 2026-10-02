export type AnswerMode = 'option' | 'sequence' | 'text' | 'output' | 'code-fragment';
export type SubmittedAnswer = string | string[];

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeCodeFragment(value: string): string {
  const tokens = value.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_]\w*|\d+(?:\.\d+)?|[^\s]/g);
  return tokens?.join('\u0000') ?? '';
}

export function isAcceptedAnswer(
  submitted: unknown,
  accepted: readonly SubmittedAnswer[],
  mode: AnswerMode,
): boolean {
  if (mode === 'sequence') {
    if (!Array.isArray(submitted) || submitted.some(value => typeof value !== 'string')) return false;
    const sequence = submitted as string[];
    return accepted.some(answer =>
      Array.isArray(answer) &&
      sequence.length === answer.length &&
      sequence.every((value, index) => value.trim() === answer[index].trim()),
    );
  }

  if (typeof submitted !== 'string' || submitted.length > 2000) return false;
  const normalize = mode === 'code-fragment'
    ? normalizeCodeFragment
    : mode === 'text'
      ? (value: string) => normalizeWhitespace(value).toLocaleLowerCase('en-US')
      : normalizeWhitespace;
  const normalizedSubmitted = normalize(submitted);
  return accepted.some(answer =>
    typeof answer === 'string' && normalize(answer) === normalizedSubmitted,
  );
}
