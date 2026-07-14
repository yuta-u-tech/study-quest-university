import { z } from 'zod'

/**
 * type = 解答形式（どう答えるか）
 * - term:     一問一答（自己採点 / 4択 / タイピング）
 * - math:     数式（キーボード解答モードで MathLive 入力・自動判定）
 * - spelling: 英字入力（英単語スペルなど・自動判定）
 * - choice:   選択式（choices を手動指定する文法問題など）
 * - image / listening: 予約（将来）
 *
 * 表現（数式・画像・本文）は question/answer 内の $...$ と media / passageId で表す。
 */
export const itemTypeSchema = z.enum(['term', 'choice', 'math', 'spelling', 'image', 'listening'])

export const mediaSchema = z.object({
  image: z.string().optional(),
  audio: z.string().optional(),
  animation: z.enum(['logic-not']).optional(),
})

export const deckItemSchema = z.object({
  id: z.string().min(1),
  type: itemTypeSchema,
  unit: z.string().optional(),
  section: z.string().min(1),
  number: z.number().int().positive(),
  question: z.string().min(1),
  answer: z.string().min(1),
  reading: z.string().optional(),
  acceptedAnswers: z.array(z.string()).optional(),
  choices: z.array(z.string()).optional(),
  media: mediaSchema.optional(),
  passageId: z.string().optional(),
  explanation: z.string().optional(),
  refs: z.array(z.string()).optional(),
})

export const passageSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  text: z.string().min(1),
  media: mediaSchema.optional(),
})

export const deckSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  subject: z.string().min(1),
  area: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  passages: z.array(passageSchema).optional(),
  items: z.array(deckItemSchema).min(1),
})

export const manifestSchema = z.object({
  subjects: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      tagline: z.string().optional(),
      available: z.boolean(),
    }),
  ),
  decks: z.array(
    z.object({
      id: z.string().min(1),
      subject: z.string().min(1),
      area: z.string().optional(),
      title: z.string().min(1),
      file: z.string().min(1),
      itemCount: z.number().int().nonnegative(),
    }),
  ),
})

export type DeckItem = z.infer<typeof deckItemSchema>
export type Passage = z.infer<typeof passageSchema>
export type Deck = z.infer<typeof deckSchema>
export type Manifest = z.infer<typeof manifestSchema>
export type SubjectInfo = Manifest['subjects'][number]
export type DeckInfo = Manifest['decks'][number]
