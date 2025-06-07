#!/bin/bash
# Instala dependências do backend e frontend para execução de testes
set -e

# Backend dependencies
pushd "$(dirname "$0")/../backend/com.tessera" > /dev/null
./mvnw -q -DskipTests dependency:go-offline
popd > /dev/null

# Frontend dependencies
pushd "$(dirname "$0")/../frontend" > /dev/null
npm ci --prefer-offline --no-audit --progress=false
popd > /dev/null

