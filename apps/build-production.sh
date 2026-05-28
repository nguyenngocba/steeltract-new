#!/bin/bash

echo ""
echo "==============================================="
echo "STEELTRACK ENTERPRISE PRODUCTION BUILD"
echo "==============================================="
echo ""

cd deployment/docker

docker compose down

docker compose build --no-cache

docker compose up -d

echo ""
echo "==============================================="
echo "STEELTRACK ENTERPRISE ONLINE"
echo "==============================================="
echo ""
echo "Frontend:"
echo "http://172.168.53.116"
echo ""
echo "Backend:"
echo "http://172.168.53.116:3000"
echo ""
echo "==============================================="
