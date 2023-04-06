#!/bin/bash -e

TAG=$1

if [[ -z "${TAG}" ]]; then
 echo "No tag specified! Exiting..."
  exit 1
fi

DIR=$(dirname "$0")
cd "$DIR"

mkdir -p ../artifacts

echo "Building fxa-mono image..."
time (< ../_dev/docker/mono/Dockerfile docker build -t "fxa-mono:${TAG}" - &> "../artifacts/fxa-mono.log")

# push temporary tag to docker hub
echo "Pushing temporary fxa-mono:${TAG} to docker hub..."
echo "${!DOCKER_PASS}" | docker login -u "${!DOCKER_USER}" --password-stdin
docker push "fxa-mono:${TAG}"
