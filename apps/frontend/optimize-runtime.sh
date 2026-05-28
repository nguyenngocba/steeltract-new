#!/bin/bash

echo ""
echo "======================================="
echo "STEELTRACK ENTERPRISE OPTIMIZATION"
echo "======================================="
echo ""

# FRONTEND
cd /opt/projects/steeltrack/apps/frontend

pnpm install

pnpm build

# BACKEND
cd /opt/projects/steeltrack/backend-api

pnpm install

pnpm prisma generate

pnpm build

echo ""
echo "======================================="
echo "OPTIMIZATION COMPLETE"
echo "======================================="
echo ""
