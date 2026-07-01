# HOTFIX – Restore NestJS Runtime (PermissionsGuard / RbacService DI) Report

## 1. Problem Description

Following recent additions or changes in Sprint 40PROJ.7/40PROJ.8, the NestJS backend application crashed upon launch due to a dependency injection error:

```
UnknownDependenciesException:
Nest can't resolve dependencies of the PermissionsGuard (Reflector, ?). Please make sure that the argument RbacService at index [1] is available in the AuthModule context.
```

The error occurred because `ProjectsController` in `ProjectsModule` is annotated with `@UseGuards(PermissionsGuard)`. However, `ProjectsModule` did not import `RbacModule` (which exports the required `RbacService` and `PermissionsGuard` providers). Consequently, NestJS was unable to resolve `RbacService` when instantiating `PermissionsGuard` in the `ProjectsModule` context.

---

## 2. Solution Implemented

We updated [`ProjectsModule`](file:///opt/projects/steeltrack/apps/backend-api/src/modules/projects/projects.module.ts) to correctly import and expose `RbacModule` dependency wireframe:

```diff
  import { ComponentsModule }
    from '../components/components.module'
+ import { RbacModule }
+   from '../rbac/rbac.module'
  
  @Module({
    imports: [
      PrismaModule,
      ComponentsModule,
+     RbacModule,
    ],
```

This successfully resolved the dependency resolution chain, allowing the `PermissionsGuard` and its required `RbacService` to be instantiated without conflicts or duplicates.

---

## 3. Verification Results

*   **Compilation (`pnpm -C apps/backend-api build`)**: **PASS**
*   **NestJS Startup Boot (`pnpm -C apps/backend-api start:prod` / `node dist/src/main.js`)**: **PASS**
    *   Logs confirmed that the application successfully loaded all routers and controllers:
    ```
    [Nest] LOG [NestApplication] Nest application successfully started
    ```
*   **Dependency Injection Chain Checked**: Verified that `RbacModule` exports `RbacService` and `PermissionsGuard` cleanly, meaning no duplicate provider definitions were needed.
