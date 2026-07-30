import { UserStatus } from '@prisma/client';
import { z } from 'zod';

const normalizedOptionalEmail = z
  .string()
  .trim()
  .email()
  .optional()
  .or(z.literal('').transform(() => undefined));

const roleIdsSchema = z
  .array(z.string().trim().min(1))
  .transform((roleIds) => [...new Set(roleIds)]);

export const createSystemUserSchema = z.object({
  username: z.string().trim().min(3).max(64),
  email: normalizedOptionalEmail,
  fullName: z.string().trim().min(1).max(160).optional(),
  password: z.string().min(8).max(160),
  roleIds: z
    .array(z.string().trim().min(1))
    .min(1)
    .transform((roleIds) => [...new Set(roleIds)]),
});

export const updateSystemUserSchema = z
  .object({
    username: z.string().trim().min(3).max(64).optional(),
    email: normalizedOptionalEmail,
    fullName: z.string().trim().min(1).max(160).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one user field is required',
  });

export const replaceSystemUserRolesSchema = z.object({
  roleIds: roleIdsSchema,
});

export const updateSystemUserStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
});

export const resetSystemUserPasswordSchema = z.object({
  password: z.string().min(8).max(160),
});

export type CreateSystemUserDto = z.infer<typeof createSystemUserSchema>;
export type UpdateSystemUserDto = z.infer<typeof updateSystemUserSchema>;
export type ReplaceSystemUserRolesDto = z.infer<
  typeof replaceSystemUserRolesSchema
>;
export type UpdateSystemUserStatusDto = z.infer<
  typeof updateSystemUserStatusSchema
>;
export type ResetSystemUserPasswordDto = z.infer<
  typeof resetSystemUserPasswordSchema
>;
