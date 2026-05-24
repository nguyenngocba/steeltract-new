import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
