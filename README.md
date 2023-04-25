# Phat Bricks Version of Oracle

## Steps

1. Deploy the client smart contract following the [EVM tutorial](./evm/README.md) and record its address;
2. Run the Phat Bricks backend following the [Phat tutorial](./phat/README.md). Make sure the `ANCHOR` is set to the address above;
   1. The backend will keep running and listen to the requests from your smart contract;
3. Check the backend logs in your console to find the identity of ActionOffchainRollup;
4. Setup your smart contract by replacing the arguments in the `./scripts/testnet-set-attestor.ts` and then run `npx hardhat run --network mumbai ./scripts/testnet-set-attestor.ts` under `evm` folder;
5. Append new request by running `npx hardhat run --network mumbai ./scripts/testnet-push-request.ts`, still replace the argument.
