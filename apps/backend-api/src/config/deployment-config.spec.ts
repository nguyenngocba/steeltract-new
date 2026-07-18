import { loadDeploymentConfig } from './deployment-config';

describe('loadDeploymentConfig', () => {
  const production = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://steeltrack:secret@db:5432/steeltrack',
    JWT_SECRET: 'a-production-secret-with-more-than-32-characters',
    CORS_ORIGINS: 'https://erp.example.com,https://ops.example.com',
  };

  it('loads a strict production configuration', () => {
    expect(
      loadDeploymentConfig({
        ...production,
        PORT: '3100',
        TRUST_PROXY: '1',
        JOB_WORKER_ENABLED: 'false',
      }),
    ).toEqual(
      expect.objectContaining({
        nodeEnv: 'production',
        port: 3100,
        corsOrigins: [
          'https://erp.example.com',
          'https://ops.example.com',
        ],
        trustProxy: 1,
      }),
    );
  });

  it.each([
    [{ ...production, DATABASE_URL: '' }, 'DATABASE_URL'],
    [{ ...production, JWT_SECRET: 'steeltrack-secret' }, 'JWT_SECRET'],
    [
      {
        ...production,
        JWT_SECRET: 'replace-with-at-least-32-random-characters',
      },
      'JWT_SECRET',
    ],
    [{ ...production, CORS_ORIGINS: '*' }, 'CORS_ORIGINS'],
    [{ ...production, PORT: '70000' }, 'PORT'],
    [{ ...production, USE_QC_SNAPSHOT: 'yes' }, 'USE_QC_SNAPSHOT'],
  ])('rejects unsafe production configuration', (env, expected) => {
    expect(() => loadDeploymentConfig(env)).toThrow(expected);
  });

  it('keeps local development defaults backward compatible', () => {
    expect(loadDeploymentConfig({})).toEqual(
      expect.objectContaining({
        nodeEnv: 'development',
        port: 3000,
        corsOrigins: true,
      }),
    );
  });
});
