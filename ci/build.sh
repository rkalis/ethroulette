#!/usr/bin/env sh
set -x
set -e
ganache-cli -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" > /dev/null &
GANACHE_PID=$!
trap "kill $GANACHE_PID" EXIT INT TERM

npm run deploy-bridge > /dev/null &
BRIDGE_PID=$!
trap "kill $BRIDGE_PID" EXIT INT TERM

truffle compile
truffle migrate

npm test
ng lint
