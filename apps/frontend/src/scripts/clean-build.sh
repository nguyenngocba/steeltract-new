#!/bin/bash

rm -rf dist
rm -rf .vite
rm -rf node_modules/.vite

pnpm install
pnpm build
