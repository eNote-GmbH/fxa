#!/bin/bash -ex

# This startup routine is seperate from the test command. This way it can be run in a
# separate step in the CI, which results in more meaningful timing metrics.

DIR=$(dirname "$0")

cd "$DIR/../../../"

mkdir -p ~/.pm2/logs
mkdir -p artifacts/tests

# Make sure we have built the latest
CI=false NODE_ENV=test npx nx run-many \
    -t start \
    --parallel=1 \
    -p \
    123done \
    browserid-verifier \
    fxa-auth-server \
    fxa-content-server \
    fxa-graphql-api \
    fxa-payments-server \
    fxa-profile-server \
    fxa-settings;

npx pm2 ls
