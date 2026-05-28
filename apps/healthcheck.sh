#!/bin/bash

echo ""
echo "================================="
echo "STEELTRACK HEALTHCHECK"
echo "================================="
echo ""

docker ps

echo ""
echo "================================="
echo "BACKEND"
echo "================================="
echo ""

curl http://localhost:3000/system/health

echo ""
echo ""
echo "================================="
echo "FRONTEND"
echo "================================="
echo ""

curl -I http://localhost

echo ""
