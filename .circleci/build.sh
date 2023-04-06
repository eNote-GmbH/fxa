#!/bin/bash -e

MODULE=$1
TAG=$2

if [[ -z "${TAG}" ]]; then
  echo "No tag specified! Exiting..."
  exit 1
fi

DIR=$(dirname "$0")

if grep -e "$MODULE" -e 'all' "$DIR/../packages/test.list" > /dev/null; then

  cd "$DIR/../packages/$MODULE"

  echo -e "\n################################"
  echo "# building $MODULE"
  echo -e "################################\n"

  if [[ -r Dockerfile ]]; then
    # send Dockerfile over stdin to exclude local context
    # https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#pipe-dockerfile-through-stdin
    time (< Dockerfile docker build --progress=plain -t "${MODULE}:${TAG}" - &> "../../artifacts/${MODULE}.log")

    # push temporary tag to docker hub
    echo "${!DOCKER_PASS}" | docker login -u "${!DOCKER_USER}" --password-stdin
    echo "Pushing temporary ${MODULE}:${TAG} to docker hub..."
    docker push "${MODULE}:${TAG}"
  fi

  # for debugging:
  # docker run --rm -it ${MODULE}:build npm ls --production
  # docker save -o "../${MODULE}.tar" ${MODULE}:build
else
  exit 0;
fi
