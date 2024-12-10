#! /bin/bash

set -e

# Create required env files
cp .env.example .env

mkdir -p docker/env

localStackEnvFilePath="./docker/env/localstack.env"
touch $localStackEnvFilePath

if [ ! -f "$localStackEnvFilePath" ]; then
	LINES="PERSISTENCE=1\nLOCALSTACK_AUTH_TOKEN="
	echo -e "$LINES" >"$localStackEnvFilePath"
	echo "File created and lines added to $localStackEnvFilePath"
fi

cd docker || exit

docker compose -f docker.compose.yaml up -d

cd ../

cd client || exit

npm install

clear

npm run dev
