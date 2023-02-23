#!/bin/bash

cat ./evm/artifacts/contracts/PhatRollupReceiver.sol/PhatRollupReceiver.json | jq -r '.abi | tostring' > ./phat/res/receiver.abi.json
