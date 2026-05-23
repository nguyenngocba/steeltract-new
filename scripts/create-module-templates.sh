#!/bin/bash

echo "======================================="
echo " STEELTRACK MODULE TEMPLATE GENERATOR "
echo "======================================="

BASE_DIR="/opt/projects/steeltrack"

# =========================
# FRONTEND TEMPLATE
# =========================

FRONTEND_TEMPLATE="$BASE_DIR/apps/frontend/src/modules/_template"

mkdir -p $FRONTEND_TEMPLATE/{api,components,hooks,pages,services,store,types,utils}

touch $FRONTEND_TEMPLATE/index.ts

touch $FRONTEND_TEMPLATE/api/index.ts
touch $FRONTEND_TEMPLATE/components/.gitkeep
touch $FRONTEND_TEMPLATE/hooks/index.ts
touch $FRONTEND_TEMPLATE/pages/index.ts
touch $FRONTEND_TEMPLATE/services/index.ts
touch $FRONTEND_TEMPLATE/store/index.ts
touch $FRONTEND_TEMPLATE/types/index.ts
touch $FRONTEND_TEMPLATE/utils/index.ts

# =========================
# BACKEND TEMPLATE
# =========================

BACKEND_TEMPLATE="$BASE_DIR/apps/backend-api/src/modules/_template"

mkdir -p $BACKEND_TEMPLATE/{controllers,services,repositories,dto,events,entities,types,validators}

touch $BACKEND_TEMPLATE/index.ts

touch $BACKEND_TEMPLATE/controllers/index.ts
touch $BACKEND_TEMPLATE/services/index.ts
touch $BACKEND_TEMPLATE/repositories/index.ts
touch $BACKEND_TEMPLATE/dto/index.ts
touch $BACKEND_TEMPLATE/events/index.ts
touch $BACKEND_TEMPLATE/entities/index.ts
touch $BACKEND_TEMPLATE/types/index.ts
touch $BACKEND_TEMPLATE/validators/index.ts

echo ""
echo "✅ Module templates created successfully!"
echo ""
echo "Frontend Template:"
echo "$FRONTEND_TEMPLATE"
echo ""
echo "Backend Template:"
echo "$BACKEND_TEMPLATE"
echo ""