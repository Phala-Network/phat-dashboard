# Receiver Smart Contracts for Phat Contract Oracle

The contracts are copied and revised from <https://github.com/Phala-Network/phat-offchain-rollup/tree/main/evm> (commit: [7dc2f9bc8917f84c2a855a2df2a2373897dd1b1f](https://github.com/Phala-Network/phat-offchain-rollup/commit/7dc2f9bc8917f84c2a855a2df2a2373897dd1b1f)).

Try running some of the following tasks:

```shell
# install dependencies
yarn

export MUMBAI_API=https://polygon-mumbai.g.alchemy.com/v2/<api-key>
export MUMBAI_SK=<evm-account-sk>

# compile contracts
npx hardhat compile

# deploy contracts
npx hardhat run --network mumbai ./scripts/deploy-test.ts
# Deployed { receiver: '0x93891cb936B62806300aC687e12d112813b483C1' }

# Check our example deployment in <https://mumbai.polygonscan.com/address/0x93891cb936B62806300aC687e12d112813b483C1>

# Optional: verify contract
npx hardhat verify --network mumbai --constructor-args arguments.js 0x93891cb936B62806300aC687e12d112813b483C1
```
