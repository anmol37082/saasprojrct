PHASE 9 STEP 1 REMAINING ACTION

Admin frontend has not been generated yet. Backend must not be modified.

Generate Next.js 15 + TS + Tailwind + Shadcn UI + TanStack Query + Axios + React Hook Form + Zod.
Folder structure under apps/admin:
- app/
- components/
- features/
- hooks/
- lib/
- services/
- types/

Create at repo root:
- apps/admin/package.json
- apps/admin/next.config.ts
- apps/admin/tsconfig.json
- apps/admin/tailwind.config.ts
- apps/admin/components.json
- apps/admin/middleware.ts
- apps/admin/.env.example

Generate layouts and routes:
/login, /dashboard, /clients, /leads, /exports, /audit-logs, /settings

Auth foundation:
- auth context + JWT storage
- protected routes
- axios interceptor

API services in apps/admin/services/*:
- api.ts
- authService.ts
- clientService.ts
- leadService.ts
- exportService.ts
- auditService.ts

Next step: implement full Phase 9 Step 1 in codebase.
