-- Restore base RBAC data required by guarded runtime endpoints.
-- Idempotent data migration; does not change passwords or business data.

INSERT INTO "roles" ("id", "name", "description", "createdAt", "updatedAt")
VALUES ('role_admin', 'admin', 'System administrator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET
  "description" = EXCLUDED."description",
  "updatedAt" = CURRENT_TIMESTAMP;

WITH permission_names(name) AS (
  VALUES
    ('master-data.read'),
    ('master-data.write'),
    ('inventory.read'),
    ('inventory.write'),
    ('projects.read'),
    ('projects.write'),
    ('project.approve'),
    ('components.read'),
    ('components.write'),
    ('tasks.read'),
    ('tasks.write'),
    ('rbac.read'),
    ('rbac.write'),
    ('workflow.read'),
    ('workflow.write'),
    ('attachments.read'),
    ('attachments.write'),
    ('jobs.read'),
    ('jobs.write'),
    ('analytics.read'),
    ('analytics.write'),
    ('production.read'),
    ('production.write'),
    ('qc.read'),
    ('qc.write'),
    ('yard.read'),
    ('yard.write')
), upserted_permissions AS (
  INSERT INTO "permissions" ("id", "name", "description", "createdAt", "updatedAt")
  SELECT 'perm_' || md5(name), name, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM permission_names
  ON CONFLICT ("name") DO UPDATE SET
    "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id", "name"
), admin_role AS (
  SELECT "id" FROM "roles" WHERE "name" = 'admin'
)
INSERT INTO "role_permissions" ("id", "roleId", "permissionId", "createdAt", "updatedAt")
SELECT 'rp_' || md5(admin_role."id" || ':' || upserted_permissions."id"), admin_role."id", upserted_permissions."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM admin_role
CROSS JOIN upserted_permissions
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET
  "updatedAt" = CURRENT_TIMESTAMP;

WITH admin_user AS (
  SELECT "id" FROM "users" WHERE "username" = 'admin'
), admin_role AS (
  SELECT "id" FROM "roles" WHERE "name" = 'admin'
)
INSERT INTO "user_roles" ("id", "userId", "roleId", "createdAt", "updatedAt")
SELECT 'ur_' || md5(admin_user."id" || ':' || admin_role."id"), admin_user."id", admin_role."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM admin_user
CROSS JOIN admin_role
ON CONFLICT ("userId", "roleId") DO UPDATE SET
  "updatedAt" = CURRENT_TIMESTAMP;
