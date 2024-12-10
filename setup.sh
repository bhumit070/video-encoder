#! /bin/bash

set -e

# Create required env files
cp .env.example .env

mkdir -p docker/env
touch ./docker/env/localstack.env

cd docker || exit

docker compose -f docker.compose.yaml up -d

cd ../

cd client || exit

npm install
