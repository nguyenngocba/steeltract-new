import { z } from 'zod';

export const requestDispatchReturnSchema = z.object({
  reason: z.string().trim().min(1),
  createdBy: z.string().optional(),
});

export const departDispatchReturnSchema = z.object({
  reason: z.string().trim().min(1),
  createdBy: z.string().optional(),
});

export const receiveDispatchReturnSchema = z.object({
  reason: z.string().trim().min(1),
  placements: z
    .array(
      z.object({
        componentInstanceId: z.string().min(1),
        slotId: z.string().min(1),
      }),
    )
    .min(1),
  createdBy: z.string().optional(),
});

export type RequestDispatchReturnDto = z.infer<
  typeof requestDispatchReturnSchema
>;
export type DepartDispatchReturnDto = z.infer<
  typeof departDispatchReturnSchema
>;
export type ReceiveDispatchReturnDto = z.infer<
  typeof receiveDispatchReturnSchema
>;
