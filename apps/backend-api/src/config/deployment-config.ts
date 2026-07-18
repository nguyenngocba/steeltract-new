import { isAbsolute } from 'node:path';

import type { LogLevel } from '@nestjs/common';

const booleanKeys = [
  'JOB_WORKER_ENABLED',
  'SNAPSHOT_PARITY_CHECK',
  'USE_COMPONENTS_SNAPSHOT',
  'USE_DISPATCH_SNAPSHOT',
  'USE_INVENTORY_SNAPSHOT',
  'USE_PRODUCTION_SNAPSHOT',
  'USE_PROJECT_SNAPSHOT',
  'USE_QC_SNAPSHOT',
  'USE_YARD_SNAPSHOT',
] as const;

const numericKeys = [
  'BACKGROUND_LOCK_STALE_MS',
  'JOB_WORKER_POLL_MS',
  'SNAPSHOT_MAX_AGE_SECONDS',
] as const;

export interface DeploymentConfig {
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  storageRoot: string;
  corsOrigins: true | string[];
  trustProxy: boolean | number;
  logLevels: LogLevel[];
}

export function loadDeploymentConfig(
  env: NodeJS.ProcessEnv = process.env,
): DeploymentConfig {
  const nodeEnv = environment(env.NODE_ENV);
  const production = nodeEnv === 'production';

  if (production) {
    requirePostgresUrl(env.DATABASE_URL);
    requireProductionSecret(env.JWT_SECRET);
  }

  validateBooleanFlags(env);
  validatePositiveNumbers(env);

  const storageRoot = env.STORAGE_ROOT?.trim() || '/data/steeltrack-storage';
  if (!isAbsolute(storageRoot)) {
    throw new Error('STORAGE_ROOT must be an absolute path');
  }

  return {
    nodeEnv,
    host: env.HOST?.trim() || '0.0.0.0',
    port: integer(env.PORT, 3000, 'PORT', 1, 65_535),
    storageRoot,
    corsOrigins: corsOrigins(env.CORS_ORIGINS, production),
    trustProxy: trustProxy(env.TRUST_PROXY),
    logLevels: logLevels(env.LOG_LEVEL, production),
  };
}

function environment(value?: string): DeploymentConfig['nodeEnv'] {
  const normalized = value?.trim().toLowerCase() || 'development';
  if (!['development', 'test', 'production'].includes(normalized)) {
    throw new Error(`NODE_ENV must be development, test or production`);
  }

  return normalized as DeploymentConfig['nodeEnv'];
}

function requirePostgresUrl(value?: string) {
  if (!value?.trim()) {
    throw new Error('DATABASE_URL is required in production');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('DATABASE_URL must use postgres or postgresql protocol');
  }
}

function requireProductionSecret(value?: string) {
  const secret = value?.trim() ?? '';
  const normalized = secret.toLowerCase();
  if (
    secret.length < 32 ||
    secret === 'steeltrack-secret' ||
    normalized.includes('replace-with') ||
    normalized.includes('change-me')
  ) {
    throw new Error(
      'JWT_SECRET must be a non-default secret of at least 32 characters in production',
    );
  }
}

function validateBooleanFlags(env: NodeJS.ProcessEnv) {
  for (const key of booleanKeys) {
    const value = env[key];
    if (value !== undefined && !['true', 'false'].includes(value.toLowerCase())) {
      throw new Error(`${key} must be true or false`);
    }
  }
}

function validatePositiveNumbers(env: NodeJS.ProcessEnv) {
  for (const key of numericKeys) {
    const value = env[key];
    if (value === undefined) continue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`${key} must be a positive number`);
    }
  }
}

function corsOrigins(value: string | undefined, production: boolean) {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (production && origins.length === 0) {
    throw new Error('CORS_ORIGINS is required in production');
  }
  if (production && origins.includes('*')) {
    throw new Error('CORS_ORIGINS cannot contain * in production');
  }

  return origins.length > 0 ? origins : true;
}

function trustProxy(value?: string): boolean | number {
  if (!value?.trim() || value === 'false') return false;
  if (value === 'true') return true;
  return integer(value, 1, 'TRUST_PROXY', 1, 10);
}

function logLevels(value: string | undefined, production: boolean): LogLevel[] {
  const allowed: LogLevel[] = [
    'fatal',
    'error',
    'warn',
    'log',
    'debug',
    'verbose',
  ];
  const defaults: LogLevel[] = production
    ? ['fatal', 'error', 'warn', 'log']
    : allowed;
  if (!value?.trim()) return defaults;

  const levels = value
    .split(',')
    .map((level) => level.trim().toLowerCase())
    .filter(Boolean);
  const invalid = levels.find(
    (level): level is string => !allowed.includes(level as LogLevel),
  );
  if (invalid) {
    throw new Error(`LOG_LEVEL contains unsupported level: ${invalid}`);
  }

  return [...new Set(levels)] as LogLevel[];
}

function integer(
  value: string | undefined,
  fallback: number,
  name: string,
  minimum: number,
  maximum: number,
) {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`);
  }

  return parsed;
}
