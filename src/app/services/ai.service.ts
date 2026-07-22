import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { FinalResponse, GradingResponse } from '../models/ai.models';
import {
  LongTestAnswer,
  LongTestGenerateResponse,
  LongTestGradeResponse,
  LongTestQuestion,
} from '../models/test.models';
import {
  parseAiJson,
  validateFinalResponse,
  validateGradingResponse,
  validateLongTestGenerate,
  validateLongTestGrade,
} from '../utils/json-parse.util';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

const GRADE_SYSTEM_PROMPT = `You are a strict but fair teaching assistant. A user will give you a topic and their own explanation of it, written as if they were teaching a beginner. Your job is to evaluate their understanding, not to teach them yourself first.

Respond ONLY with a valid JSON object, no preamble, no markdown fences, matching exactly this structure:
{
  "score": 0-100,
  "correct_points": ["thing they got right", ...],
  "wrong_points": [{"claim": "what they said", "correction": "what's actually true"}],
  "missed_points": ["important thing they didn't mention", ...],
  "follow_up_question": "one specific question targeting their weakest or most incorrect point"
}

Rules:
- Be specific and accurate — don't be vague or overly harsh.
- The follow_up_question must target the single biggest gap in their understanding.
- Base the score on completeness and accuracy relative to a solid understanding of the topic.
- Never include text outside the JSON object.`;

const FOLLOW_UP_SYSTEM_PROMPT = `You previously identified gaps in a user's understanding of a topic and asked them a follow-up question. Now evaluate their answer.

Respond ONLY with a valid JSON object matching exactly this structure:
{
  "follow_up_correct": true or false,
  "follow_up_feedback": "1-2 sentences on whether their answer was right, and why",
  "complete_explanation_bullets": ["short bullet covering one key idea", ...3-5 bullets total, filling every gap from both rounds],
  "final_score": 0-100,
  "full_explanation": "string",
  "resource_links": [{"title": "Resource name", "url": "https://..."}, ...]
}

Rules for full_explanation and resource_links:
- If final_score is BELOW 80: full_explanation MUST be a thorough, beginner-friendly explanation of the entire topic (4-6 short paragraphs separated by \\n\\n). Teach everything they missed — this is their main learning moment.
- If final_score is 80 or above: set full_explanation to an empty string "".
- If final_score is BELOW 80: resource_links MUST include 2-4 real, working URLs to trusted public resources tailored to the topic. Examples: W3Schools or MDN for web/CSS topics, Khan Academy for math/science, Wikipedia for history/general topics, official docs when they exist. Use real URLs only — no placeholders.
- If final_score is 80 or above: resource_links may be an empty array [].

Never include text outside the JSON object.`;

const LONG_TEST_GENERATE_PROMPT = `You create multiple-choice knowledge tests. Given a topic, generate between 10 and 15 challenging but fair multiple-choice questions for a student.

Respond ONLY with valid JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "clear question text",
      "options": ["option A", "option B", "option C", "option D"]
    }
  ]
}

Rules:
- Generate between 10 and 15 questions (numbered id 1 through N).
- Each question must have exactly 4 options.
- Cover different subtopics of the subject.
- Never include text outside the JSON object.`;

const LONG_TEST_GRADE_PROMPT = `You grade a multiple-choice test. You receive the topic, all questions with options, and the student's selected option index (0-3) for each question.

Respond ONLY with valid JSON:
{
  "score": 0-100,
  "letter_grade": "F" or "D-" through "A+",
  "correct_count": number,
  "total": number,
  "summary": "2-3 sentences on overall performance",
  "weak_areas": ["area they struggled with", ...]
}

Letter grade scale: A+ (97-100), A (93-96), A- (90-92), B+ (87-89), B (83-86), B- (80-82), C+ (77-79), C (73-76), C- (70-72), D+ (67-69), D (63-66), D- (60-62), F (below 60).
Never include text outside the JSON object.`;

@Injectable({ providedIn: 'root' })
export class AiService {
  async gradeExplanation(topic: string, explanation: string): Promise<GradingResponse> {
    const content = await this.callGroq(GRADE_SYSTEM_PROMPT, [
      { role: 'user', content: `Topic: ${topic}\n\nUser's explanation:\n${explanation}` },
    ]);
    const parsed = parseAiJson<GradingResponse>(content);
    validateGradingResponse(parsed);
    return parsed;
  }

  async evaluateFollowUp(
    topic: string,
    originalExplanation: string,
    followUpQuestion: string,
    followUpAnswer: string,
    priorGrading: GradingResponse
  ): Promise<FinalResponse> {
    const userContent = [
      `Topic: ${topic}`,
      `Original explanation: ${originalExplanation}`,
      `Prior score: ${priorGrading.score}`,
      `Correct points: ${priorGrading.correct_points.join('; ')}`,
      `Wrong points: ${priorGrading.wrong_points.map((w) => `${w.claim} → ${w.correction}`).join('; ')}`,
      `Missed points: ${priorGrading.missed_points.join('; ')}`,
      `Follow-up question: ${followUpQuestion}`,
      `User's follow-up answer: ${followUpAnswer}`,
    ].join('\n');

    const content = await this.callGroq(FOLLOW_UP_SYSTEM_PROMPT, [
      { role: 'user', content: userContent },
    ]);
    const parsed = parseAiJson<FinalResponse>(content);
    validateFinalResponse(parsed);
    return parsed;
  }

  async generateLongTest(topic: string): Promise<LongTestQuestion[]> {
    const content = await this.callGroq(LONG_TEST_GENERATE_PROMPT, [
      { role: 'user', content: `Topic: ${topic}` },
    ]);
    const parsed = parseAiJson<LongTestGenerateResponse>(content);
    validateLongTestGenerate(parsed);
    return parsed.questions;
  }

  async gradeLongTest(
    topic: string,
    questions: LongTestQuestion[],
    answers: LongTestAnswer[]
  ): Promise<LongTestGradeResponse> {
    const payload = questions
      .map((q) => {
        const ans = answers.find((a) => a.questionId === q.id);
        const selected = ans !== undefined ? q.options[ans.selectedIndex] ?? 'No answer' : 'No answer';
        return `Q${q.id}: ${q.question}\nOptions: ${q.options.map((o, i) => `[${i}] ${o}`).join(' | ')}\nStudent picked: ${selected}`;
      })
      .join('\n\n');

    const content = await this.callGroq(LONG_TEST_GRADE_PROMPT, [
      { role: 'user', content: `Topic: ${topic}\n\n${payload}` },
    ]);
    const parsed = parseAiJson<LongTestGradeResponse>(content);
    validateLongTestGrade(parsed);
    return parsed;
  }

  private async callGroq(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<string> {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${environment.groqApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`AI request failed (${response.status}). ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('AI returned an empty response.');
    }
    return content;
  }
}
