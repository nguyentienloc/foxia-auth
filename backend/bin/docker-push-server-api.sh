#!/usr/bin/env bash

cd "$(dirname "$0")"
cd ..

echo "push api"
docker build -t registry.gitlab.com/fms-web/kids-backend/$1:$DOCKER_TAG --build-arg CI_REGISTRY_IMAGE=$CI_REGISTRY_IMAGE -f apps/"$1"/Dockerfile .
docker tag registry.gitlab.com/fms-web/kids-backend/$1:$DOCKER_TAG registry.gitlab.com/fms-web/kids-backend/$1:latest
docker push registry.gitlab.com/fms-web/kids-backend/$1:latest
sleep 10
docker rm $(docker ps -a --filter "status=exited" -q) || true