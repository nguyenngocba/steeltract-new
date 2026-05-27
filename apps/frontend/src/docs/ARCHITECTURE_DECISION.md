# ARCHITECTURE DECISION

FINAL BACKEND:
apps/backend-api

EXPERIMENTAL:
apps/backend-experimental

FRONTEND:
apps/frontend

ARCHITECTURE:
Modular Monolith

BACKEND STACK:
NestJS + Prisma + Websocket + Event Bus

FRONTEND STACK:
React + Vite + Modular Workspace

PRIORITY:
Finish business runtime first.

DO NOT:
- create duplicate runtime layers
- create excessive engine folders
- split microservices too early
- duplicate workspaces
