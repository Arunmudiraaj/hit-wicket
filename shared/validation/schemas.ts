/**
 * Validation Schemas using Zod
 * Used for runtime validation of socket payloads
 */

import { z } from 'zod';
import { VALID_CHOICES } from '../constants/game.js';

// ============================================
// Choice Validation
// ============================================

const ValidChoice = z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(4),
    z.literal(6),
]);

// ============================================
// Client → Server Payload Schemas
// ============================================

export const SubmitChoiceSchema = z.object({
    gameId: z.string().min(1, 'Game ID is required'),
    choice: ValidChoice,
    ballNumber: z.number().int().min(1, 'Ball number must be positive'),
});

export const LeaveGameSchema = z.object({
    gameId: z.string().min(1, 'Game ID is required'),
});

export const RequestStateSchema = z.object({
    gameId: z.string().min(1, 'Game ID is required'),
});

// ============================================
// Type Inference Helpers
// ============================================

export type SubmitChoiceInput = z.infer<typeof SubmitChoiceSchema>;
export type LeaveGameInput = z.infer<typeof LeaveGameSchema>;
export type RequestStateInput = z.infer<typeof RequestStateSchema>;

// ============================================
// Validation Helper
// ============================================

export function validateChoice(choice: unknown): choice is number {
    return VALID_CHOICES.includes(choice as typeof VALID_CHOICES[number]);
}
