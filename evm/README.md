# Receiver Smart Contracts for Phat Contract Oracle

The contracts are copied and revised from <https://github.com/Phala-Network/phat-offchain-rollup/tree/main/evm>.

Try running some of the following tasks:

```shell
# install dependencies
yarn

export GOERLI_API=https://eth-goerli.g.alchemy.com/v2/<goerli-api-key>
export GOERLI_SK=<evm-account-sk-without-0x>

# compile contracts
npx hardhat compile

# deploy contracts
npx hardhat run --network goerli ./scripts/deploy-test.ts
# Deployed { receiver: '0xF8CE0975502A96e897505fd626234A9A0126C072' }

```
