import { z } from 'zod';

const permissionIdsSchema = z
  .array(z.string().trim().min(1))
  .transform((permissionIds) => [...new Set(permissionIds)]);

export const createSystemRoleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
  permissionIds: z
    .array(z.string().trim().min(1))
    .min(1)
    .transform((permissionIds) => [...new Set(permissionIds)]),
});

export const updateSystemRoleSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(240).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one role field is required',
  });

export const replaceSystemRolePermissionsSchema = z.object({
  permissionIds: permissionIdsSchema,
});

export type CreateSystemRoleDto = z.infer<typeof createSystemRoleSchema>;
export type UpdateSystemRoleDto = z.infer<typeof updateSystemRoleSchema>;
export type ReplaceSystemRolePermissionsDto = z.infer<
  typeof replaceSystemRolePermissionsSchema
>;
