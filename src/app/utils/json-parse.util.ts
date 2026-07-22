import { MASTERY_SCORE_THRESHOLD } from '../constants/mastery.constants';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return cleaned;
}

function extractJsonObject(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new ParseError('No JSON object found in AI response.');
  }
  return text.slice(start, end + 1);
}

export function parseAiJson<T>(raw: string): T {
  if (!raw?.trim()) {
    throw new ParseError('Empty response from AI.');
  }

  let candidate = stripMarkdownFences(raw);
  if (!candidate.startsWith('{')) {
    candidate = extractJsonObject(candidate);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    try {
      parsed = JSON.parse(extractJsonObject(raw));
    } catch {
      throw new ParseError('Could not parse AI response as JSON.');
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ParseError('AI response was not a JSON object.');
  }

  return parsed as T;
}

export function validateGradingResponse(data: unknown): asserts data is import('../models/ai.models').GradingResponse {
  const obj = data as Record<string, unknown>;
  if (typeof obj['score'] !== 'number') throw new ParseError('Missing or invalid score.');
  if (!Array.isArray(obj['correct_points'])) throw new ParseError('Missing correct_points.');
  if (!Array.isArray(obj['wrong_points'])) throw new ParseError('Missing wrong_points.');
  if (!Array.isArray(obj['missed_points'])) throw new ParseError('Missing missed_points.');
  if (typeof obj['follow_up_question'] !== 'string') throw new ParseError('Missing follow_up_question.');
}

export function validateFinalResponse(data: unknown): asserts data is import('../models/ai.models').FinalResponse {
  const obj = data as Record<string, unknown>;
  if (typeof obj['follow_up_correct'] !== 'boolean') throw new ParseError('Missing follow_up_correct.');
  if (typeof obj['follow_up_feedback'] !== 'string') throw new ParseError('Missing follow_up_feedback.');
  if (!Array.isArray(obj['complete_explanation_bullets'])) {
    throw new ParseError('Missing complete_explanation_bullets.');
  }
  if (typeof obj['final_score'] !== 'number') throw new ParseError('Missing final_score.');
  if (typeof obj['full_explanation'] !== 'string') throw new ParseError('Missing full_explanation.');
  if (!Array.isArray(obj['resource_links'])) throw new ParseError('Missing resource_links.');

  const score = obj['final_score'] as number;
  if (score < MASTERY_SCORE_THRESHOLD) {
    if (!(obj['full_explanation'] as string).trim()) {
      throw new ParseError(`full_explanation required when score is below ${MASTERY_SCORE_THRESHOLD}.`);
    }
    const links = obj['resource_links'] as unknown[];
    if (links.length < 2) {
      throw new ParseError(`At least 2 resource_links required when score is below ${MASTERY_SCORE_THRESHOLD}.`);
    }
    for (const link of links) {
      const l = link as Record<string, unknown>;
      if (typeof l['title'] !== 'string' || typeof l['url'] !== 'string') {
        throw new ParseError('Each resource_link needs title and url.');
      }
    }
  }
}

export function validateLongTestGenerate(data: unknown): asserts data is import('../models/test.models').LongTestGenerateResponse {
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj['questions'])) throw new ParseError('Missing questions.');
  const questions = obj['questions'] as unknown[];
  if (questions.length < 10 || questions.length > 15) {
    throw new ParseError('Expected 10-15 questions.');
  }
  for (const q of questions) {
    const item = q as Record<string, unknown>;
    if (typeof item['id'] !== 'number') throw new ParseError('Each question needs id.');
    if (typeof item['question'] !== 'string') throw new ParseError('Each question needs question text.');
    if (!Array.isArray(item['options']) || (item['options'] as unknown[]).length < 4) {
      throw new ParseError('Each question needs at least 4 options.');
    }
  }
}

export function validateLongTestGrade(data: unknown): asserts data is import('../models/test.models').LongTestGradeResponse {
  const obj = data as Record<string, unknown>;
  if (typeof obj['score'] !== 'number') throw new ParseError('Missing score.');
  if (typeof obj['letter_grade'] !== 'string') throw new ParseError('Missing letter_grade.');
  if (typeof obj['correct_count'] !== 'number') throw new ParseError('Missing correct_count.');
  if (typeof obj['total'] !== 'number') throw new ParseError('Missing total.');
  if (typeof obj['summary'] !== 'string') throw new ParseError('Missing summary.');
  if (!Array.isArray(obj['weak_areas'])) throw new ParseError('Missing weak_areas.');
}
