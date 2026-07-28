-- Component DOMAIN.5B additive physical lifecycle state.
-- Adds IN_PRODUCTION to ComponentInstanceState without backfill or data rewrite.

ALTER TYPE "ComponentInstanceState" ADD VALUE IF NOT EXISTS 'IN_PRODUCTION';
