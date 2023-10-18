#!/bin/bash -e

PORT=${1:-3306}
HOST=${2:-localhost}
RETRY=60
for i in $(eval echo "{1..$RETRY}"); do
  if nc -vz localhost 3306 2>&1 | grep -e 'mysql.*succeeded!'; then
    echo "SUCCESS"
    exit 0
  else
    echo "RETRY"
    if [ "$i" -lt $RETRY ]; then
      sleep 1
    fi
  fi
done

echo "FAIL"
exit 1
