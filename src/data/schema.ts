import { z } from 'zod'

export const itemTypeSchema = z.enum(['term', 'choice', 'math', 'image', 'listening'])

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
  refs: z.array(z.string()).optional(),
})

export const deckSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  subject: z.string().min(1),
  area: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
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
export type Deck = z.infer<typeof deckSchema>
export type Manifest = z.infer<typeof manifestSchema>
export type SubjectInfo = Manifest['subjects'][number]
export type DeckInfo = Manifest['decks'][number]
