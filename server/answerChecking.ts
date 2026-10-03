export type AnswerMode = 'option' | 'sequence' | 'text' | 'output' | 'code-fragment';
export type SubmittedAnswer = string | string[];

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeCodeFragment(value: string): string {
  const tokens = value.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\r\n]*|[A-Za-z_]\w*|\d+(?:\.\d+)?|[^\s]/g);
  return tokens?.filter(token => !token.startsWith('#')).join('\u0000') ?? '';
}

function normalizeOutput(value: string): string {
  const withoutContainerPunctuation = value.trim().replace(/[\[\]()]/g, ' ');
  const tokens = withoutContainerPunctuation.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) return '';
  if (tokens.every(token => /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(token))) {
    return tokens.map(token => {
      const number = Number(token);
      return Object.is(number, -0) ? '0' : String(number);
    }).join(' ');
  }
  return normalizeWhitespace(value).toLocaleLowerCase('en-US');
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
    : mode === 'output'
      ? normalizeOutput
    : mode === 'text'
      ? (value: string) => normalizeWhitespace(value).toLocaleLowerCase('en-US')
      : normalizeWhitespace;
  const normalizedSubmitted = normalize(submitted);
  return accepted.some(answer =>
    typeof answer === 'string' && normalize(answer) === normalizedSubmitted,
  );
}

export function matchesAnswerRubric(
  submitted: unknown,
  requiredConcepts: readonly (readonly string[])[],
): boolean {
  if (typeof submitted !== "string" || submitted.length > 2000) return false;
  const normalized = submitted
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9+*()[\]]+/g, " ")
    .trim();
  if (!normalized || requiredConcepts.length === 0) return false;
  return requiredConcepts.every((alternatives) =>
    alternatives.some((concept) =>
      normalized.includes(
        concept
          .normalize("NFKC")
          .toLocaleLowerCase("en-US")
          .replace(/[^a-z0-9+*()[\]]+/g, " ")
          .trim(),
      ),
    ),
  );
}
