/**
 * Payload Validators
 * Zod schemas for validating socket payloads
 */

import { z } from 'zod';
import { MIN_CHOICE, MAX_CHOICE, VALID_CHOICES } from '@hit-wicket/shared';

/**
 * Choice validator (1-6)
 */
export const choiceSchema = z
    .number()
    .int()
    .min(MIN_CHOICE)
    .max(MAX_CHOICE)
    .refine((val): val is (typeof VALID_CHOICES)[number] =>
        VALID_CHOICES.includes(val as (typeof VALID_CHOICES)[number])
    );

/**
 * join_queue payload schema
 */
export const joinQueueSchema = z.object({
    name: z.string().max(50).optional(),
});

/**
 * submit_choice payload schema
 */
export const submitChoiceSchema = z.object({
    gameId: z.string().min(1),
    choice: choiceSchema,
    ballNumber: z.number().int().positive(),
});

/**
 * leave_game payload schema
 */
export const leaveGameSchema = z.object({
    gameId: z.string().min(1),
});

/**
 * ping_state payload schema
 */
export const pingStateSchema = z.object({
    gameId: z.string().min(1),
});

// Export types inferred from schemas
export type JoinQueuePayload = z.infer<typeof joinQueueSchema>;
export type SubmitChoicePayload = z.infer<typeof submitChoiceSchema>;
export type LeaveGamePayload = z.infer<typeof leaveGameSchema>;
export type PingStatePayload = z.infer<typeof pingStateSchema>;
