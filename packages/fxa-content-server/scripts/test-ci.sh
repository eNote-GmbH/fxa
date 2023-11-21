#!/bin/bash -ex

DIR=$(dirname "$0")

function test_suite() {
  local suite=$1
  local numGroups=$2

  for i in $(seq "$numGroups")
  do
    node tests/intern.js --suites="${suite}" --output="../../artifacts/tests/${suite}-${numGroups}-${i}-results.xml" --groupsCount="${numGroups}" --groupNum="${i}" || \
    node tests/intern.js --suites="${suite}" --output="../../artifacts/tests/${suite}-${numGroups}-${i}-results.xml" --groupsCount="${numGroups}" --groupNum="${i}" --grep="$(<rerun.txt)"
  done
}

cd "$DIR/.."

test_suite circle 3
