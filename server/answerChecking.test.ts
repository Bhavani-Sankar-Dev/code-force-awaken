import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAcceptedAnswer } from './answerChecking.ts';
import { round2AnswerKeys, round3AnswerKeys } from './answerKeys.ts';

test('Round 2 accepts equivalent numeric output formatting without accepting wrong values', () => {
  assert.equal(isAcceptedAnswer(' 7\n', round2AnswerKeys['r2-p1'], 'output'), true);
  assert.equal(isAcceptedAnswer('7.0', round2AnswerKeys['r2-p1'], 'output'), true);
  assert.equal(isAcceptedAnswer('[3, 2]', round2AnswerKeys['r2-p3'], 'output'), true);
  assert.equal(isAcceptedAnswer('3,\n2', round2AnswerKeys['r2-p3'], 'output'), true);
  assert.equal(isAcceptedAnswer('3 3', round2AnswerKeys['r2-p3'], 'output'), false);
});

test('Round 3 accepts formatting, comments, and supported equivalent fragments', () => {
  const complement = round3AnswerKeys['r3-p1'].blanks[0].accepted;
  const storeIndex = round3AnswerKeys['r3-p1'].blanks[1].accepted;
  const countCharacter = round3AnswerKeys['r3-p2'].blanks[0].accepted;

  assert.equal(isAcceptedAnswer(' ( target-value ) # remaining amount', complement, 'code-fragment'), true);
  assert.equal(isAcceptedAnswer('seen.setdefault( value , index )', storeIndex, 'code-fragment'), true);
  assert.equal(isAcceptedAnswer('counts [ char ] = counts.get(char, 0)+1 # increment', countCharacter, 'code-fragment'), true);
  assert.equal(isAcceptedAnswer('counts[char] = counts.get(char, 0) - 1', countCharacter, 'code-fragment'), false);
});
