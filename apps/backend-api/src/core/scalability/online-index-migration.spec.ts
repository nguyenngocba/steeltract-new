import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('RFC013 online index migration', () => {
  const migration = readFileSync(
    resolve(
      process.cwd(),
      'prisma/migrations/20260717190000_enterprise_data_scalability_indexes/migration.sql',
    ),
    'utf8',
  );

  it('uses only additive concurrent index statements with a bounded lock wait', () => {
    const indexStatements = migration.match(/^CREATE INDEX[^;]+;/gm) ?? [];

    expect(indexStatements).toHaveLength(13);
    expect(indexStatements).toEqual(
      indexStatements.map((statement) =>
        expect.stringMatching(/^CREATE INDEX CONCURRENTLY IF NOT EXISTS/),
      ),
    );
    expect(migration).toContain("SET lock_timeout = '5s'");
    expect(migration).not.toMatch(/\b(DROP|ALTER|DELETE|UPDATE)\b/);
  });
});
